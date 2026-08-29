"""Check-ins API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.registration import QRVerifyRequest, CheckInWithParticipantResponse
from app.services import checkin_service

router = APIRouter(tags=["Check-ins"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post(
    "/checkins/verify",
    response_model=CheckInWithParticipantResponse,
    summary="Verify QR token and create check-in",
)
def verify_checkin(request: QRVerifyRequest, db: DbDep):
    """
    Verify a participant's QR token and record attendance.

    Returns participant details on success.
    Returns 404 for invalid token, 400 for wrong event / cancelled registration,
    409 for duplicate check-in.
    """
    return checkin_service.verify_and_checkin(db, request)


@router.get(
    "/events/{event_id}/checkins",
    summary="List all check-ins for an event",
)
def list_checkins(event_id: uuid.UUID, db: DbDep):
    """Return check-in status for all registered participants (organizer view)."""
    return checkin_service.get_event_checkins(db, event_id)
