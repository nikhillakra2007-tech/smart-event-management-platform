"""User and ParticipantProfile Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserBase(BaseModel):
    name: str
    email: str
    role: Literal["participant", "judge", "organizer"]
    avatar_url: str | None = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ParticipantProfileBase(BaseModel):
    skills: list[str] = []
    preferred_roles: list[str] = []
    project_interests: list[str] = []
    bio: str | None = None


class ParticipantProfileCreate(ParticipantProfileBase):
    user_id: uuid.UUID


class ParticipantProfileResponse(ParticipantProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
