"""Submission Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class SubmissionCreate(BaseModel):
    team_id: uuid.UUID
    title: str
    description: str | None = None
    repository_url: str | None = None
    demo_url: str | None = None


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    team_id: uuid.UUID
    title: str
    description: str | None
    repository_url: str | None
    demo_url: str | None
    status: Literal["draft", "submitted", "withdrawn"]
    submitted_at: datetime | None
    updated_at: datetime
