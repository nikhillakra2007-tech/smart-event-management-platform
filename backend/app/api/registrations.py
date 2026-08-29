"""Registrations API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.registration import RegistrationCreate, RegistrationResponse
from app.services import registration_service

router = APIRouter(tags=["Registrations"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post(
    "/registrations",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a participant for an event",
)
def register(data: RegistrationCreate, db: DbDep):
    """Register a participant. Returns QR token for check-in."""
    reg = registration_service.register_participant(db, data)
    return reg


@router.get(
    "/events/{event_id}/registrations",
    response_model=list[RegistrationResponse],
    summary="List all registrations for an event",
)
def list_registrations(event_id: uuid.UUID, db: DbDep):
    """Return all registrations for an event (organizer view)."""
    return registration_service.get_event_registrations(db, event_id)
