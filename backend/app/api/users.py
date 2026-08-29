"""Users API router."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User, ParticipantProfile
from app.schemas.user import UserResponse, ParticipantProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[UserResponse], summary="List users")
def list_users(
    db: DbDep,
    role: Literal["participant", "judge", "organizer"] | None = None,
):
    """Return users, optionally filtered by role."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.name.asc()).all()


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user(user_id: uuid.UUID, db: DbDep):
    """Return a single user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/{user_id}/profile", response_model=ParticipantProfileResponse, summary="Get participant profile")
def get_user_profile(user_id: uuid.UUID, db: DbDep):
    """Return participant profile for user."""
    profile = db.query(ParticipantProfile).filter(ParticipantProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile
