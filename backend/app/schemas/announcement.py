"""Announcement Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class AnnouncementCreate(BaseModel):
    title: str
    message: str
    type: Literal["general", "schedule", "venue", "critical"] = "general"
    created_by: uuid.UUID


class AnnouncementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    title: str
    message: str
    type: Literal["general", "schedule", "venue", "critical"]
    created_by: uuid.UUID | None
    is_published: bool
    created_at: datetime
    updated_at: datetime
    view_count: int = 0


class AnnouncementViewRequest(BaseModel):
    user_id: uuid.UUID
