# =============================================================================
# ZenNode Cloud API
#
# The central server that receives anonymized session summaries from
# developers' local backends and provides team health dashboards to managers.
#
# Run with:  uvicorn main:app --reload --port 8421
#
# Endpoints:
#   POST /auth/signup        — create developer account
#   POST /auth/login         — authenticate, get JWT
#   GET  /auth/me            — current user info
#   POST /teams/create       — create team, become manager
#   POST /teams/join         — join team via invite code
#   GET  /teams/me           — your team info
#   GET  /teams/members      — list members (manager only)
#   POST /sync/session       — push anonymized session summary
#   GET  /dashboard/team     — team overview (manager only)
#   GET  /dashboard/team/trend — daily trend (manager only)
# =============================================================================

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS
from database import init_db
from routes.auth import router as auth_router
from routes.teams import router as teams_router
from routes.sync import router as sync_router
from routes.dashboard import router as dashboard_router
from routes.intervention import router as intervention_router

_STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("☁️  ZenNode Cloud API starting...")
    print("   Docs: http://127.0.0.1:8421/docs")
    yield
    print("☁️  ZenNode Cloud API shutting down.")


app = FastAPI(
    title="ZenNode Cloud API",
    description=(
        "Central server for ZenNode — receives anonymized cognitive load "
        "summaries from developers' local backends and serves team health "
        "dashboards to engineering managers."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(sync_router)
app.include_router(dashboard_router)
app.include_router(intervention_router)

app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "service": "zennode-cloud-api", "version": "0.1.0"}


@app.get("/", include_in_schema=False)
def landing_page():
    """Serve the ZenNode landing/features SPA."""
    return FileResponse(_STATIC_DIR / "index.html")


@app.get("/dashboard", include_in_schema=False)
def manager_ui():
    """Serve the manager dashboard web UI."""
    return FileResponse(_STATIC_DIR / "dashboard.html")
