# =============================================================================
# ZenNode Cloud — Dashboard Routes
# GET /dashboard/team        — team overview (manager only)
# GET /dashboard/team/trend  — daily trend for last N days (manager only)
# =============================================================================

from datetime import datetime, timedelta, timezone, date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth import require_manager
from database import get_db
from models import User, SessionSummary
from schemas import TeamDashboardResponse, TeamTrendResponse, DailyTrend

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/team", response_model=TeamDashboardResponse)
def team_dashboard(
    manager: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Team overview for today and the past 7 days.
    Aggregated across all members — manager cannot see individual scores
    unless the developer opted in to name visibility.
    """
    team_id = manager.team_id
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)

    # Total members
    member_count = (
        db.query(func.count(User.id))
        .filter(User.team_id == team_id)
        .scalar() or 0
    )

    # Today's summaries
    today_summaries = (
        db.query(SessionSummary)
        .join(User, User.anonymous_id == SessionSummary.anonymous_user_id)
        .filter(User.team_id == team_id, SessionSummary.session_date == today)
        .all()
    )

    # Week summaries
    week_summaries = (
        db.query(SessionSummary)
        .join(User, User.anonymous_id == SessionSummary.anonymous_user_id)
        .filter(
            User.team_id == team_id,
            SessionSummary.session_date >= week_ago,
        )
        .all()
    )

    avg_today = (
        sum(s.avg_score for s in today_summaries) / len(today_summaries)
        if today_summaries else 0.0
    )
    avg_week = (
        sum(s.avg_score for s in week_summaries) / len(week_summaries)
        if week_summaries else 0.0
    )
    overloads_today = sum(s.overload_count for s in today_summaries)
    overloads_week = sum(s.overload_count for s in week_summaries)

    # State distribution today (total seconds across all members)
    state_dist = {
        "flow":     sum(s.flow_seconds for s in today_summaries),
        "friction": sum(s.friction_seconds for s in today_summaries),
        "fatigue":  sum(s.fatigue_seconds for s in today_summaries),
        "overload": sum(s.overload_seconds for s in today_summaries),
    }

    # Burnout risk — members whose today avg score > 70
    burnout_risk = sum(1 for s in today_summaries if s.avg_score > 70)

    return TeamDashboardResponse(
        team_id=team_id,
        team_name=manager.team.name if manager.team else "",
        member_count=member_count,
        avg_team_score_today=round(avg_today, 1),
        avg_team_score_week=round(avg_week, 1),
        total_overloads_today=overloads_today,
        total_overloads_week=overloads_week,
        state_distribution_today=state_dist,
        burnout_risk_members=burnout_risk,
    )


@router.get("/team/trend", response_model=TeamTrendResponse)
def team_trend(
    days: int = Query(default=14, ge=1, le=90),
    manager: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    """
    Daily aggregated trend for the team over the last N days.
    Useful for spotting patterns (e.g. Wednesday afternoons are always high).
    """
    team_id = manager.team_id
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days)

    summaries = (
        db.query(SessionSummary)
        .join(User, User.anonymous_id == SessionSummary.anonymous_user_id)
        .filter(
            User.team_id == team_id,
            SessionSummary.session_date >= start,
        )
        .all()
    )

    # Group by date
    by_date: dict[date, list[SessionSummary]] = {}
    for s in summaries:
        by_date.setdefault(s.session_date, []).append(s)

    trend = []
    for d in sorted(by_date.keys()):
        day_summaries = by_date[d]
        trend.append(DailyTrend(
            date=d.isoformat(),
            avg_score=round(
                sum(s.avg_score for s in day_summaries) / len(day_summaries), 1
            ),
            overload_count=sum(s.overload_count for s in day_summaries),
            member_count=len(day_summaries),
        ))

    return TeamTrendResponse(team_id=team_id, days=trend)
