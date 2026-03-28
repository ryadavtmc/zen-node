# =============================================================================
# ZenNode Cloud — Team Routes
# POST /teams/create  — create a team, become manager
# POST /teams/join    — join a team via invite code
# GET  /teams/me      — get your current team info
# GET  /teams/members — list team members (manager only)
# =============================================================================

import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date

from auth import get_current_user, require_manager
from database import get_db
from models import User, Team, SessionSummary
from schemas import (
    CreateTeamRequest, JoinTeamRequest,
    TeamResponse, TeamMember, TeamMembersResponse,
)

router = APIRouter(prefix="/teams", tags=["Teams"])


def _generate_invite_code(length: int = 8) -> str:
    """Generate a short alphanumeric invite code like 'ZEN-A3F9K2'."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=length))
    return f"ZEN-{suffix}"


@router.post("/create", response_model=TeamResponse, status_code=201)
def create_team(
    body: CreateTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new team. The creator becomes the manager.
    Returns an invite code to share with teammates.
    """
    if current_user.team_id:
        raise HTTPException(status_code=400, detail="Already in a team. Leave it first.")

    # Generate a unique invite code
    for _ in range(10):
        code = _generate_invite_code()
        if not db.query(Team).filter(Team.invite_code == code).first():
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate unique invite code")

    team = Team(name=body.name, invite_code=code)
    db.add(team)
    db.flush()  # get team.id before committing

    current_user.team_id = team.id
    current_user.role = "manager"
    db.commit()
    db.refresh(team)

    return TeamResponse(
        team_id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        member_count=1,
    )


@router.post("/join", response_model=TeamResponse)
def join_team(
    body: JoinTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Join a team using an invite code shared by a manager."""
    team = db.query(Team).filter(Team.invite_code == body.invite_code).first()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    if current_user.team_id == team.id:
        raise HTTPException(status_code=400, detail="Already a member of this team")

    current_user.team_id = team.id
    db.commit()

    member_count = db.query(func.count(User.id)).filter(User.team_id == team.id).scalar()

    return TeamResponse(
        team_id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        member_count=member_count or 1,
    )


@router.get("/me", response_model=TeamResponse)
def get_my_team(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's team info."""
    if not current_user.team_id:
        raise HTTPException(status_code=404, detail="Not a member of any team")

    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    member_count = db.query(func.count(User.id)).filter(User.team_id == team.id).scalar()

    return TeamResponse(
        team_id=team.id,
        name=team.name,
        invite_code=team.invite_code,
        member_count=member_count or 0,
    )


@router.get("/members", response_model=TeamMembersResponse)
def get_team_members(
    manager: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    List team members with their latest cognitive stats.
    Manager only. Names shown only if member opted in (show_name_to_team=True).
    """
    team = db.query(Team).filter(Team.id == manager.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    members = db.query(User).filter(User.team_id == team.id).all()

    result: list[TeamMember] = []
    for m in members:
        # Get today's latest summary for this member
        latest = (
            db.query(SessionSummary)
            .filter(SessionSummary.anonymous_user_id == m.anonymous_id)
            .order_by(SessionSummary.synced_at.desc())
            .first()
        )

        result.append(TeamMember(
            anonymous_id=m.anonymous_id,
            display_name=m.display_name if m.show_name_to_team else None,
            role=m.role,
            avg_score_today=latest.avg_score if latest else None,
            current_state=_score_to_state(latest.avg_score) if latest else None,
        ))

    return TeamMembersResponse(
        team_id=team.id,
        team_name=team.name,
        members=result,
    )


def _score_to_state(score: float) -> str:
    if score <= 30:
        return "flow"
    elif score <= 60:
        return "friction"
    elif score <= 80:
        return "fatigue"
    return "overload"
