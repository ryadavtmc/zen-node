# =============================================================================
# ZenNode Cloud — SQLAlchemy ORM Models
# Three tables: teams, users, session_summaries
# =============================================================================

from datetime import datetime, date
from uuid import uuid4

from sqlalchemy import String, Float, Integer, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _uuid() -> str:
    return str(uuid4())


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    invite_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members: Mapped[list["User"]] = relationship("User", back_populates="team")
    summaries: Mapped[list["SessionSummary"]] = relationship(
        "SessionSummary", back_populates="team"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    anonymous_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="developer")  # developer | manager
    team_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("teams.id"), nullable=True
    )
    show_name_to_team: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team | None"] = relationship("Team", back_populates="members")


class SessionSummary(Base):
    __tablename__ = "session_summaries"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    anonymous_user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    team_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("teams.id"), nullable=True, index=True
    )
    session_id: Mapped[str] = mapped_column(String, nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    avg_score: Mapped[float] = mapped_column(Float, default=0.0)
    max_score: Mapped[float] = mapped_column(Float, default=0.0)
    overload_count: Mapped[int] = mapped_column(Integer, default=0)
    flow_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    friction_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    fatigue_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    overload_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    snapshot_count: Mapped[int] = mapped_column(Integer, default=0)
    synced_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team | None"] = relationship("Team", back_populates="summaries")
