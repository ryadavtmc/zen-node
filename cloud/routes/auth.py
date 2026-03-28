# =============================================================================
# ZenNode Cloud — Auth Routes
# POST /auth/signup  — create account, link anonymous_id
# POST /auth/login   — authenticate, return JWT
# GET  /auth/me      — return current user info
# PATCH /auth/me     — update display_name, show_name_to_team
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, TokenResponse, MeResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new developer account.
    The anonymous_id links this account to local session data without
    exposing identity in team dashboards.
    """
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    if db.query(User).filter(User.anonymous_id == body.anonymous_id).first():
        raise HTTPException(status_code=409, detail="Anonymous ID already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        anonymous_id=body.anonymous_id,
        display_name=body.display_name,
        role="developer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        anonymous_id=user.anonymous_id,
        team_id=user.team_id,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        anonymous_id=user.anonymous_id,
        team_id=user.team_id,
        role=user.role,
    )


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return MeResponse(
        user_id=current_user.id,
        email=current_user.email,
        anonymous_id=current_user.anonymous_id,
        display_name=current_user.display_name,
        role=current_user.role,
        team_id=current_user.team_id,
        show_name_to_team=current_user.show_name_to_team,
    )


@router.patch("/me")
def update_me(
    display_name: str | None = None,
    show_name_to_team: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update display name or name visibility preference."""
    if display_name is not None:
        current_user.display_name = display_name
    if show_name_to_team is not None:
        current_user.show_name_to_team = show_name_to_team
    db.commit()
    return {"status": "ok"}
