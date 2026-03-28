# =============================================================================
# ZenNode Backend — FastAPI Application
#
# The cognitive engine that receives behavioral snapshots from the VS Code
# extension and returns cognitive load scores + state classifications.
#
# Run with:  uvicorn main:app --reload --port 8420
# =============================================================================

from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from database import init_db
from models import BehavioralSnapshot, CognitiveReport, HealthResponse
from scorer import CognitiveScorer
from session import SessionTracker, TimelineResponse, SessionSummary, HistoryResponse
from llm_interpreter import LLMInterpreter
from cloud_sync import CloudSyncService
from thresholds import THRESHOLD_LLM_TRIGGER

# ── Load environment variables from .env ─────────────────────────────────────
load_dotenv()


# ── Application State ────────────────────────────────────────────────────────
scorer = CognitiveScorer()
session_tracker = SessionTracker()
llm_interpreter = LLMInterpreter()
cloud_sync = CloudSyncService()

# Ensure every developer has an anonymous_id from first run
cloud_sync.ensure_anonymous_id()

# Restore scorer EMA from persisted session (Feature #13)
if session_tracker.saved_ema_score is not None:
    scorer._ema_score = session_tracker.saved_ema_score
    print(f"   📈 Restored scorer EMA: {session_tracker.saved_ema_score}")


# ── Lifespan (startup/shutdown) ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown logic."""
    init_db()
    print("🧠 ZenNode Cognitive Engine starting on port 8420...")
    print("   Waiting for behavioral snapshots from VS Code extension.")
    print("   Dashboard: http://127.0.0.1:8420/docs")
    yield
    print("🧠 ZenNode Cognitive Engine shutting down.")


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="ZenNode Cognitive Engine",
    description=(
        "The backend brain of ZenNode. Receives behavioral snapshots from the "
        "VS Code extension, computes cognitive load scores, classifies mental "
        "state, and optionally triggers LLM-powered interventions."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS — allow the VS Code extension to reach us ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # VS Code extension runs locally
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Routes
# =============================================================================

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint. Returns service status."""
    return HealthResponse()


@app.post("/api/v1/snapshot", response_model=CognitiveReport, tags=["Cognitive"])
async def process_snapshot(snapshot: BehavioralSnapshot):
    """
    Receive a behavioral snapshot from the VS Code extension and return
    a cognitive load report.

    This is the main endpoint — called every 30 seconds by the extension.

    The flow:
    1. Receive raw behavioral counts (keystrokes, tabs, undos, etc.)
    2. Layer A (Scorer): Normalize metrics → compute weighted score → classify state
    3. Layer B (LLM): If score > 80, optionally generate a supportive intervention
    4. Return the full CognitiveReport to the extension
    """
    # ── Layer A: Deterministic scoring ──
    report = scorer.score(snapshot)

    # ── Record in session timeline (with EMA for persistence) ──
    session_tracker.record(report, ema_score=scorer.last_score)

    # ── Layer B: LLM intervention (Red Zone only) ──
    if report.score >= THRESHOLD_LLM_TRIGGER and llm_interpreter.is_available:
        intervention = await llm_interpreter.interpret(snapshot, report)
        if intervention:
            report.intervention = intervention

    return report


@app.post("/api/v1/reset", tags=["Session"])
async def reset_session():
    """
    Reset the cognitive scorer state.
    Called when the user triggers "ZenNode: Reset Session" from VS Code.
    """
    scorer.reset()
    session_tracker.reset()
    llm_interpreter.reset()

    # Auto-sync completed sessions to cloud if configured
    if cloud_sync.is_configured:
        cloud_sync.push_unsynced()

    return {"status": "ok", "message": "Session reset. Score history cleared."}


@app.get("/api/v1/status", tags=["Session"])
async def get_status():
    """
    Get the current scorer status without sending a new snapshot.
    Useful for dashboard polling.
    """
    last_score = scorer.last_score
    return {
        "active": last_score is not None,
        "lastScore": last_score or 0,
        "snapshotCount": session_tracker.snapshot_count,
    }


@app.get("/api/v1/session/timeline", response_model=TimelineResponse, tags=["Session"])
async def get_session_timeline(last_n: int | None = None):
    """
    Get the session timeline — a list of (timestamp, score, state) entries.
    Optionally limited to the last N entries with ?last_n=N query param.
    Used by the Dashboard webview to render the score chart.
    """
    return session_tracker.get_timeline(last_n=last_n)


@app.get("/api/v1/session/summary", response_model=SessionSummary, tags=["Session"])
async def get_session_summary():
    """
    Get an aggregated summary of the current session.
    Includes: avg/min/max score, state durations, overload count, theme shifts.
    Used by the Dashboard webview for the summary panel.
    """
    return session_tracker.get_summary()


# =============================================================================
# Cloud Sync Routes
# =============================================================================

class CloudConnectRequest(BaseModel):
    cloud_url: str
    auth_token: str


@app.post("/api/v1/cloud/connect", tags=["Cloud"])
async def cloud_connect(body: CloudConnectRequest):
    """
    Save cloud API credentials to local settings and enable sync.
    Call this once after the developer signs up / logs in to ZenNode Cloud.
    """
    cloud_sync.configure(body.cloud_url, body.auth_token)
    anon_id = cloud_sync.anonymous_id
    return {
        "status": "ok",
        "message": "Cloud sync configured",
        "anonymous_id": anon_id,
    }


@app.post("/api/v1/cloud/sync", tags=["Cloud"])
async def cloud_sync_now():
    """
    Manually trigger a sync of all unsynced completed sessions to the cloud.
    Only anonymized summaries are sent — no raw behavioral data.
    """
    if not cloud_sync.is_configured:
        return {
            "status": "skipped",
            "reason": "Cloud sync not configured. Call /api/v1/cloud/connect first.",
        }
    result = cloud_sync.push_unsynced()
    return result


@app.get("/api/v1/cloud/status", tags=["Cloud"])
async def cloud_status():
    """Return current cloud sync configuration status."""
    return {
        "configured": cloud_sync.is_configured,
        "anonymous_id": cloud_sync.anonymous_id,
        "cloud_url": cloud_sync.get_setting("cloud_api_url"),
        "sync_enabled": cloud_sync.get_setting("sync_enabled") == "true",
    }


@app.get("/api/v1/session/history", response_model=HistoryResponse, tags=["Session"])
async def get_session_history():
    """
    List all past (archived) sessions, newest first.
    Each reset archives the current session to disk.
    Used by the Dashboard to show session history.
    """
    return session_tracker.get_history()





