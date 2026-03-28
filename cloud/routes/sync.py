# =============================================================================
# ZenNode Cloud — Sync Routes
# POST /sync/session  — local backend pushes anonymized session summary
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, SessionSummary
from schemas import SyncSessionRequest, SyncResponse

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/session", response_model=SyncResponse)
def sync_session(
    body: SyncSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Receive an anonymized session summary from the developer's local backend.

    Privacy contract:
      - Only summary statistics are accepted (avg/max score, state durations, overload count)
      - NO raw timeline entries, NO keystroke counts, NO behavioral metadata
      - The anonymous_user_id must match the authenticated user's anonymous_id
    """
    # Verify the anonymous_id matches the authenticated user
    if body.anonymous_user_id != current_user.anonymous_id:
        raise HTTPException(
            status_code=403,
            detail="anonymous_user_id does not match your account",
        )

    # Prevent duplicate syncs for the same session_id
    existing = (
        db.query(SessionSummary)
        .filter(SessionSummary.session_id == body.session_id)
        .first()
    )
    if existing:
        return SyncResponse(accepted=0, message="Session already synced")

    summary = SessionSummary(
        anonymous_user_id=body.anonymous_user_id,
        team_id=current_user.team_id,
        session_id=body.session_id,
        session_date=body.session_date,
        avg_score=body.avg_score,
        max_score=body.max_score,
        overload_count=body.overload_count,
        flow_seconds=body.flow_seconds,
        friction_seconds=body.friction_seconds,
        fatigue_seconds=body.fatigue_seconds,
        overload_seconds=body.overload_seconds,
        snapshot_count=body.snapshot_count,
    )
    db.add(summary)
    db.commit()

    return SyncResponse(accepted=1, message="Session summary accepted")
