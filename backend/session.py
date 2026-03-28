# =============================================================================
# ZenNode Backend — Session Tracker (SQLite-backed)
#
# Replaces the previous JSON file-based persistence with SQLite.
# All session data is stored in zennode.db via the database module.
#
# Public API is identical to the previous version — main.py needs no changes.
#
# Two tables used:
#   sessions         — one row per coding session, aggregated stats
#   timeline_entries — one row per 30s snapshot within a session
# =============================================================================

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

from database import get_connection
from models import CognitiveReport, CognitiveState


# =============================================================================
# Response Models
# (Identical to previous version — used as FastAPI response_model types)
# =============================================================================

class TimelineEntry(BaseModel):
    """A single point on the session timeline."""
    timestamp: str = Field(description="ISO 8601 timestamp")
    score: float = Field(ge=0, le=100)
    state: CognitiveState
    theme_shift: bool = Field(alias="themeShift", default=False)

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class StateDuration(BaseModel):
    """How long the developer spent in each cognitive state."""
    flow_seconds: float = Field(alias="flowSeconds", default=0.0)
    friction_seconds: float = Field(alias="frictionSeconds", default=0.0)
    fatigue_seconds: float = Field(alias="fatigueSeconds", default=0.0)
    overload_seconds: float = Field(alias="overloadSeconds", default=0.0)

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class SessionSummary(BaseModel):
    """Aggregated summary of the current coding session."""
    session_id: str = Field(alias="sessionId")
    started_at: str = Field(alias="startedAt")
    duration_seconds: float = Field(alias="durationSeconds")
    snapshot_count: int = Field(alias="snapshotCount")
    avg_score: float = Field(alias="avgScore")
    min_score: float = Field(alias="minScore")
    max_score: float = Field(alias="maxScore")
    current_score: float = Field(alias="currentScore")
    current_state: CognitiveState = Field(alias="currentState")
    state_durations: StateDuration = Field(alias="stateDurations")
    overload_count: int = Field(alias="overloadCount")
    theme_shifts: int = Field(alias="themeShifts")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class TimelineResponse(BaseModel):
    """Response for the timeline endpoint."""
    session_id: str = Field(alias="sessionId")
    entries: list[TimelineEntry]
    count: int

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class PastSession(BaseModel):
    """Lightweight summary of a completed session (for history listing)."""
    session_id: str = Field(alias="sessionId")
    started_at: str = Field(alias="startedAt")
    ended_at: str = Field(alias="endedAt")
    duration_seconds: float = Field(alias="durationSeconds")
    snapshot_count: int = Field(alias="snapshotCount")
    avg_score: float = Field(alias="avgScore")
    max_score: float = Field(alias="maxScore")
    overload_count: int = Field(alias="overloadCount")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class HistoryResponse(BaseModel):
    """Response for the session history endpoint."""
    sessions: list[PastSession]
    count: int

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


# ── State column mapping ──────────────────────────────────────────────────────
_STATE_COL: dict[str, str] = {
    CognitiveState.FLOW.value:      "flow_seconds",
    CognitiveState.FRICTION.value:  "friction_seconds",
    CognitiveState.FATIGUE.value:   "fatigue_seconds",
    CognitiveState.OVERLOAD.value:  "overload_seconds",
}


# =============================================================================
# Session Tracker
# =============================================================================

class SessionTracker:
    """
    Records cognitive reports into SQLite for timeline, summary, and history.

    Usage:
        tracker = SessionTracker()           # auto-resumes active session
        tracker.record(report)               # persists each snapshot
        tracker.record(report, ema_score=X)  # also persists scorer EMA
        tracker.get_timeline()
        tracker.get_summary()
        tracker.reset()                      # ends session, starts fresh
    """

    def __init__(self) -> None:
        # In-memory state for the active session
        self._session_id: str = ""
        self._started_at: datetime = datetime.now(timezone.utc)
        self._current_state: str = CognitiveState.FLOW.value
        self._last_entry_time: Optional[datetime] = None
        self._overload_active: bool = False
        self._theme_shift_active: bool = False
        self._saved_ema_score: Optional[float] = None

        active = self._load_active_session()
        if active:
            self._session_id = active["session_id"]
            self._started_at = datetime.fromisoformat(active["started_at"])
            self._saved_ema_score = active["ema_score"]

            # Restore transition state from the most recent timeline entry
            last = self._load_last_entry(self._session_id)
            if last:
                self._current_state = last["state"]
                self._last_entry_time = datetime.fromisoformat(last["timestamp"])
                self._overload_active = last["state"] == CognitiveState.OVERLOAD.value
                self._theme_shift_active = bool(last["theme_shift"])

            print(
                f"   📂 Resumed session {self._session_id} "
                f"({active['snapshot_count']} snapshots)"
            )
        else:
            self._session_id, self._started_at = self._create_session()

    # ── Public API ────────────────────────────────────────────────────────────

    def record(self, report: CognitiveReport, ema_score: Optional[float] = None) -> None:
        """
        Persist a cognitive report to the database.
        Updates the session's aggregate stats (avg/min/max, state durations, counts).
        """
        now = datetime.now(timezone.utc)
        timestamp_str = now.isoformat()

        # Elapsed time since last entry — attributed to the previous state
        elapsed = (
            (now - self._last_entry_time).total_seconds()
            if self._last_entry_time else 0.0
        )
        prev_state_col = _STATE_COL.get(self._current_state, "flow_seconds")

        # Detect state/theme transitions (count entries not sustained presence)
        entering_overload = (
            report.state == CognitiveState.OVERLOAD and not self._overload_active
        )
        entering_theme_shift = report.theme_shift and not self._theme_shift_active

        # Update in-memory state
        self._current_state = report.state.value
        self._overload_active = report.state == CognitiveState.OVERLOAD
        self._theme_shift_active = report.theme_shift
        self._last_entry_time = now

        m = report.metrics

        with get_connection() as conn:
            # 1. Insert timeline entry
            conn.execute(
                """
                INSERT INTO timeline_entries
                    (session_id, timestamp, score, state, theme_shift,
                     switch_rate, error_rate, undo_rate, idle_ratio, paste_ratio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    self._session_id,
                    timestamp_str,
                    round(report.score, 1),
                    report.state.value,
                    int(report.theme_shift),
                    round(m.switch_rate, 1),
                    round(m.error_rate, 1),
                    round(m.undo_rate, 1),
                    round(m.idle_ratio, 1),
                    round(m.paste_ratio, 1),
                ),
            )

            # 2. Update session aggregate stats
            # prev_state_col is always one of four known values — safe to interpolate
            conn.execute(
                f"""
                UPDATE sessions SET
                    snapshot_count   = snapshot_count + 1,
                    overload_count   = overload_count + ?,
                    theme_shifts     = theme_shifts + ?,
                    {prev_state_col} = {prev_state_col} + ?,
                    ema_score        = ?,
                    avg_score        = (
                        SELECT ROUND(AVG(score), 1)
                        FROM timeline_entries WHERE session_id = ?
                    ),
                    max_score        = (
                        SELECT ROUND(MAX(score), 1)
                        FROM timeline_entries WHERE session_id = ?
                    ),
                    min_score        = (
                        SELECT ROUND(MIN(score), 1)
                        FROM timeline_entries WHERE session_id = ?
                    )
                WHERE session_id = ?
                """,
                (
                    int(entering_overload),
                    int(entering_theme_shift),
                    round(elapsed, 1),
                    ema_score,
                    self._session_id,
                    self._session_id,
                    self._session_id,
                    self._session_id,
                ),
            )

    def get_timeline(self, last_n: Optional[int] = None) -> TimelineResponse:
        """Return timeline entries for the active session."""
        with get_connection() as conn:
            if last_n:
                rows = conn.execute(
                    """
                    SELECT timestamp, score, state, theme_shift
                    FROM timeline_entries
                    WHERE session_id = ?
                    ORDER BY timestamp DESC LIMIT ?
                    """,
                    (self._session_id, last_n),
                ).fetchall()
                rows = list(reversed(rows))
            else:
                rows = conn.execute(
                    """
                    SELECT timestamp, score, state, theme_shift
                    FROM timeline_entries
                    WHERE session_id = ?
                    ORDER BY timestamp
                    """,
                    (self._session_id,),
                ).fetchall()

        entries = [
            TimelineEntry(
                timestamp=r["timestamp"],
                score=r["score"],
                state=CognitiveState(r["state"]),
                theme_shift=bool(r["theme_shift"]),
            )
            for r in rows
        ]
        return TimelineResponse(
            session_id=self._session_id,
            entries=entries,
            count=len(entries),
        )

    def get_summary(self) -> SessionSummary:
        """Return aggregated stats for the active session."""
        now = datetime.now(timezone.utc)

        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE session_id = ?",
                (self._session_id,),
            ).fetchone()

            last_entry = conn.execute(
                """
                SELECT score, state FROM timeline_entries
                WHERE session_id = ?
                ORDER BY timestamp DESC LIMIT 1
                """,
                (self._session_id,),
            ).fetchone()

        if not row:
            return self._empty_summary(now)

        current_score = last_entry["score"] if last_entry else 0.0
        current_state = (
            CognitiveState(last_entry["state"]) if last_entry else CognitiveState.FLOW
        )

        # Add elapsed time in current state (since last entry) to stored durations
        elapsed_now = (
            (now - self._last_entry_time).total_seconds()
            if self._last_entry_time else 0.0
        )
        state_durations = {
            "flow_seconds":     row["flow_seconds"],
            "friction_seconds": row["friction_seconds"],
            "fatigue_seconds":  row["fatigue_seconds"],
            "overload_seconds": row["overload_seconds"],
        }
        col = _STATE_COL.get(self._current_state, "flow_seconds")
        state_durations[col] = round(state_durations[col] + elapsed_now, 1)

        return SessionSummary(
            session_id=self._session_id,
            started_at=self._started_at.isoformat(),
            duration_seconds=round((now - self._started_at).total_seconds(), 1),
            snapshot_count=row["snapshot_count"],
            avg_score=row["avg_score"] or 0.0,
            min_score=row["min_score"] if row["snapshot_count"] > 0 else 0.0,
            max_score=row["max_score"] or 0.0,
            current_score=current_score,
            current_state=current_state,
            state_durations=StateDuration(
                flow_seconds=state_durations["flow_seconds"],
                friction_seconds=state_durations["friction_seconds"],
                fatigue_seconds=state_durations["fatigue_seconds"],
                overload_seconds=state_durations["overload_seconds"],
            ),
            overload_count=row["overload_count"],
            theme_shifts=row["theme_shifts"],
        )

    def get_history(self) -> HistoryResponse:
        """Return all completed sessions, newest first."""
        with get_connection() as conn:
            rows = conn.execute(
                """
                SELECT session_id, started_at, ended_at,
                       snapshot_count, avg_score, max_score, overload_count
                FROM sessions
                WHERE ended_at IS NOT NULL
                ORDER BY started_at DESC
                """,
            ).fetchall()

        sessions = []
        for r in rows:
            dur = 0.0
            if r["started_at"] and r["ended_at"]:
                try:
                    dur = (
                        datetime.fromisoformat(r["ended_at"])
                        - datetime.fromisoformat(r["started_at"])
                    ).total_seconds()
                except ValueError:
                    dur = 0.0

            sessions.append(
                PastSession(
                    session_id=r["session_id"],
                    started_at=r["started_at"],
                    ended_at=r["ended_at"],
                    duration_seconds=round(dur, 1),
                    snapshot_count=r["snapshot_count"],
                    avg_score=r["avg_score"] or 0.0,
                    max_score=r["max_score"] or 0.0,
                    overload_count=r["overload_count"],
                )
            )

        return HistoryResponse(sessions=sessions, count=len(sessions))

    def reset(self) -> None:
        """End the active session and start a fresh one."""
        now = datetime.now(timezone.utc)
        with get_connection() as conn:
            conn.execute(
                "UPDATE sessions SET ended_at = ? WHERE session_id = ?",
                (now.isoformat(), self._session_id),
            )
        print(f"   📁 Session {self._session_id} archived to database.")

        # Reset all in-memory state
        self._current_state = CognitiveState.FLOW.value
        self._last_entry_time = None
        self._overload_active = False
        self._theme_shift_active = False
        self._saved_ema_score = None

        self._session_id, self._started_at = self._create_session()

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def snapshot_count(self) -> int:
        """Number of snapshots in the active session."""
        with get_connection() as conn:
            row = conn.execute(
                "SELECT snapshot_count FROM sessions WHERE session_id = ?",
                (self._session_id,),
            ).fetchone()
        return row["snapshot_count"] if row else 0

    @property
    def saved_ema_score(self) -> Optional[float]:
        """EMA score loaded from the database on startup (for scorer resume)."""
        return self._saved_ema_score

    # ── Private helpers ───────────────────────────────────────────────────────

    def _create_session(self) -> tuple[str, datetime]:
        """Insert a new session row and return (session_id, started_at)."""
        session_id = f"zen-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')[:23]}"
        started_at = datetime.now(timezone.utc)
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO sessions (session_id, started_at) VALUES (?, ?)",
                (session_id, started_at.isoformat()),
            )
        print(f"   ✨ New session: {session_id}")
        return session_id, started_at

    def _load_active_session(self) -> Optional[dict]:
        """Load the most recent session that has no ended_at timestamp."""
        with get_connection() as conn:
            row = conn.execute(
                """
                SELECT * FROM sessions
                WHERE ended_at IS NULL
                ORDER BY started_at DESC LIMIT 1
                """,
            ).fetchone()
        return dict(row) if row else None

    def _load_last_entry(self, session_id: str) -> Optional[dict]:
        """Load the most recent timeline entry for a given session."""
        with get_connection() as conn:
            row = conn.execute(
                """
                SELECT state, theme_shift, timestamp FROM timeline_entries
                WHERE session_id = ?
                ORDER BY timestamp DESC LIMIT 1
                """,
                (session_id,),
            ).fetchone()
        return dict(row) if row else None

    def _empty_summary(self, now: datetime) -> SessionSummary:
        """Return a zeroed summary (fallback when session row is missing)."""
        return SessionSummary(
            session_id=self._session_id,
            started_at=self._started_at.isoformat(),
            duration_seconds=round((now - self._started_at).total_seconds(), 1),
            snapshot_count=0,
            avg_score=0.0,
            min_score=0.0,
            max_score=0.0,
            current_score=0.0,
            current_state=CognitiveState.FLOW,
            state_durations=StateDuration(),
            overload_count=0,
            theme_shifts=0,
        )
    
