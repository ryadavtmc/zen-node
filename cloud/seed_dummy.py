"""
ZenNode — Dummy Data Seeder
Run from the cloud/ directory:  python seed_dummy.py

Creates:
  • Team  : "ZenNode Engineering"
  • Manager login : manager@zennode.dev / password123
  • 5 developers with 14 days of session history

Idempotent — skips records that already exist.
"""

import sys
import random
from datetime import date, timedelta, datetime, timezone
from uuid import uuid4

# ── Bootstrap path so we can import app modules ───────────────────────────────
sys.path.insert(0, ".")

from database import SessionLocal, init_db
from models import Team, User, SessionSummary
from auth import hash_password

# ── Constants ─────────────────────────────────────────────────────────────────
TEAM_NAME       = "ZenNode Engineering"
INVITE_CODE     = "ZEN-DEMO01"
MANAGER_EMAIL   = "manager@zennode.dev"
MANAGER_PASS    = "password123"
DAYS            = 14
TODAY           = date.today()
SESSION_SECONDS = 8 * 3600  # 8-hour day

# ── Developer profiles: (name, email, baseline_avg, baseline_trend) ───────────
# baseline_trend: daily delta added over 14 days to simulate worsening/improving
DEVELOPERS = [
    ("Sarah Chen",    "sarah@zennode.dev",   22, +0.8),   # flow — steady, slight drift up
    ("Alex Kumar",    "alex@zennode.dev",    48, +1.2),   # friction — rising gradually
    ("Jordan Lee",    "jordan@zennode.dev",  68, +2.0),   # fatigue → overload risk by end
    ("Priya Patel",   "priya@zennode.dev",   18, -0.3),   # flow — actually improving
    ("Marcus Webb",   "marcus@zennode.dev",  58, +1.5),   # friction/fatigue zone
]

random.seed(42)  # reproducible


def score_to_state(s: float) -> str:
    if s <= 30:  return "flow"
    if s <= 60:  return "friction"
    if s <= 80:  return "fatigue"
    return "overload"


def state_seconds(avg: float) -> dict:
    """
    Given a day's average score, distribute 8 hours into state buckets.
    Higher average → more time in worse states.
    """
    t = SESSION_SECONDS
    if avg <= 30:
        return dict(flow=t*0.78, friction=t*0.15, fatigue=t*0.06, overload=t*0.01)
    elif avg <= 45:
        return dict(flow=t*0.45, friction=t*0.40, fatigue=t*0.12, overload=t*0.03)
    elif avg <= 60:
        return dict(flow=t*0.25, friction=t*0.42, fatigue=t*0.25, overload=t*0.08)
    elif avg <= 75:
        return dict(flow=t*0.12, friction=t*0.28, fatigue=t*0.42, overload=t*0.18)
    else:
        return dict(flow=t*0.05, friction=t*0.18, fatigue=t*0.32, overload=t*0.45)


def daily_score(baseline: float, trend: float, day_index: int) -> float:
    """baseline + trend drift + realistic daily noise."""
    trend_component = trend * day_index
    # Add day-of-week pattern: Tuesdays/Wednesdays spike, Fridays ease
    cal_date = TODAY - timedelta(days=DAYS - day_index - 1)
    dow = cal_date.weekday()  # 0=Mon … 6=Sun
    dow_bump = {0: 2, 1: 5, 2: 6, 3: 3, 4: -3, 5: -8, 6: -10}.get(dow, 0)
    noise = random.gauss(0, 4)
    return max(5, min(98, baseline + trend_component + dow_bump + noise))


def main():
    init_db()
    db = SessionLocal()

    try:
        # ── Team ──────────────────────────────────────────────────────────────
        team = db.query(Team).filter(Team.invite_code == INVITE_CODE).first()
        if not team:
            team = Team(id=str(uuid4()), name=TEAM_NAME, invite_code=INVITE_CODE)
            db.add(team)
            db.flush()
            print(f"  Created team: {TEAM_NAME}  (invite: {INVITE_CODE})")
        else:
            print(f"  Team already exists, skipping.")

        # ── Manager ───────────────────────────────────────────────────────────
        mgr = db.query(User).filter(User.email == MANAGER_EMAIL).first()
        if not mgr:
            mgr = User(
                id=str(uuid4()),
                email=MANAGER_EMAIL,
                hashed_password=hash_password(MANAGER_PASS),
                anonymous_id=str(uuid4()),
                display_name="Team Manager",
                role="manager",
                team_id=team.id,
                show_name_to_team=True,
            )
            db.add(mgr)
            print(f"  Created manager: {MANAGER_EMAIL}  (pw: {MANAGER_PASS})")
        else:
            print(f"  Manager already exists, ensuring team membership.")
            mgr.team_id = team.id
            mgr.role = "manager"

        # ── Developers ────────────────────────────────────────────────────────
        dev_users = []
        for (name, email, baseline, trend) in DEVELOPERS:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    id=str(uuid4()),
                    email=email,
                    hashed_password=hash_password("password123"),
                    anonymous_id=str(uuid4()),
                    display_name=name,
                    role="developer",
                    team_id=team.id,
                    show_name_to_team=False,
                )
                db.add(user)
                print(f"  Created developer: {name} ({email})")
            else:
                user.team_id = team.id
                user.show_name_to_team = False
                print(f"  Developer exists, updating: {name}")
            dev_users.append((user, baseline, trend))

        db.flush()

        # ── Session summaries ─────────────────────────────────────────────────
        sessions_created = 0
        for (user, baseline, trend) in dev_users:
            for day_idx in range(DAYS):
                session_date = TODAY - timedelta(days=DAYS - day_idx - 1)

                # Skip weekends (less activity)
                if session_date.weekday() >= 5:
                    continue

                avg = daily_score(baseline, trend, day_idx)
                max_s = min(100, avg + random.uniform(8, 22))
                overloads = 0 if avg < 55 else int((avg - 55) / 8 + random.uniform(0, 2))
                buckets = state_seconds(avg)
                snapshots = int(SESSION_SECONDS / 5)  # one per 5s interval

                session_id = f"seed-{user.anonymous_id[:8]}-{session_date.isoformat()}"

                existing = db.query(SessionSummary).filter(
                    SessionSummary.session_id == session_id
                ).first()

                if not existing:
                    db.add(SessionSummary(
                        id=str(uuid4()),
                        anonymous_user_id=user.anonymous_id,
                        team_id=team.id,
                        session_id=session_id,
                        session_date=session_date,
                        avg_score=round(avg, 1),
                        max_score=round(max_s, 1),
                        overload_count=overloads,
                        flow_seconds=round(buckets["flow"], 0),
                        friction_seconds=round(buckets["friction"], 0),
                        fatigue_seconds=round(buckets["fatigue"], 0),
                        overload_seconds=round(buckets["overload"], 0),
                        snapshot_count=snapshots,
                        synced_at=datetime.combine(
                            session_date,
                            datetime.min.time().replace(hour=17, minute=30)
                        ),
                    ))
                    sessions_created += 1

        db.commit()
        print(f"\n  {sessions_created} session records inserted.")
        print(f"\n  Dashboard login:")
        print(f"    URL      : http://127.0.0.1:8421/")
        print(f"    Email    : {MANAGER_EMAIL}")
        print(f"    Password : {MANAGER_PASS}")
        print(f"\n  Team members: {', '.join(n for n, *_ in DEVELOPERS)}")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    print("\nZenNode — Seeding dummy data...\n")
    main()
    print("\nDone.\n")
