"""Authentication Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    """Login request payload."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response payload."""

    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    """JWT token payload (decoded)."""

    sub: str  # user_id as string
    role: Literal["participant", "judge", "organizer"]
    exp: int
    iat: int
    type: Literal["access", "refresh"]


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class UserResponse(BaseModel):
    """User response (extends existing schema)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: Literal["participant", "judge", "organizer"]
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime