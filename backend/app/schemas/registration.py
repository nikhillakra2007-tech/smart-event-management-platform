"""Registration and CheckIn Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class RegistrationCreate(BaseModel):
    event_id: uuid.UUID
    user_id: uuid.UUID


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    registration_number: str
    qr_token: str
    registration_status: Literal["pending", "confirmed", "cancelled"]
    registered_at: datetime


class QRVerifyRequest(BaseModel):
    event_id: uuid.UUID
    qr_token: str


class CheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    registration_id: uuid.UUID
    checked_in_by: uuid.UUID | None
    checked_in_at: datetime
    status: Literal["active", "cancelled"]


class CheckInWithParticipantResponse(BaseModel):
    """Check-in result with participant details."""
    check_in: CheckInResponse
    participant_name: str
    participant_email: str
    registration_number: str
    event_id: uuid.UUID
