"""Team and TeamMember Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TeamCreate(BaseModel):
    name: str
    project_interest: str | None = None


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    name: str
    project_interest: str | None
    status: Literal["forming", "active", "submitted"]
    created_at: datetime
    updated_at: datetime
    member_count: int = 0


class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    team_id: uuid.UUID
    user_id: uuid.UUID
    role: str | None
    joined_at: datetime


class JoinTeamRequest(BaseModel):
    user_id: uuid.UUID
    role: str | None = None


class TeamDiscoveryResult(BaseModel):
    """Result from rule-based teammate discovery."""
    user_id: uuid.UUID
    name: str
    email: str
    skills: list[str]
    preferred_roles: list[str]
    project_interests: list[str]
    bio: str | None
    matching_skills: list[str]
    matching_interests: list[str]
    compatible_roles: list[str]
    match_score: float   # 0-100
