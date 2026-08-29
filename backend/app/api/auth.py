"""Authentication API router."""

import uuid
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse, UserResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post("/login", response_model=TokenResponse, summary="User login")
def login(data: LoginRequest, db: DbDep):
    """Authenticate user and return access + refresh tokens."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(
        token_data, expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
def refresh(data: RefreshRequest, db: DbDep):
    """Validate refresh token and issue new access token."""
    try:
        payload = decode_token(data.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, uuid.UUID(payload.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new tokens
    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(
        token_data, expires_delta=timedelta(minutes=settings.jwt_access_token_expire_minutes)
    )
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post("/logout", summary="User logout")
def logout():
    """Logout endpoint (client should discard tokens)."""
    # With stateless JWT, logout is client-side (discard tokens)
    # For server-side invalidation, would need token blacklist (Redis)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse, summary="Get current user")
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return current authenticated user."""
    return current_user