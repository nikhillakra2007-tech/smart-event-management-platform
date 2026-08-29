"""Registrations API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.registration import RegistrationCreate, RegistrationResponse
from app.services import registration_service
from app.api.dependencies import require_organizer, require_participant, require_any_authenticated

router = APIRouter(tags=["Registrations"])

DbDep = Annotated[Session, Depends(get_db)]


@router.post(
    "/registrations",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a participant for an event",
)
def register(data: RegistrationCreate, db: DbDep, current_user: Annotated[User, Depends(require_participant)]):
    """Register a participant. Returns QR token for check-in."""
    # Ensure user can only register themselves
    if str(current_user.id) != str(data.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only register yourself")
    reg = registration_service.register_participant(db, data)
    return reg


@router.get(
    "/events/{event_id}/registrations",
    response_model=list[RegistrationResponse],
    summary="List all registrations for an event",
)
def list_registrations(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_organizer)]):
    """Return all registrations for an event (organizer view)."""
    return registration_service.get_event_registrations(db, event_id)


@router.get(
    "/events/{event_id}/my-registration",
    response_model=RegistrationResponse,
    summary="Get own registration for an event",
)
def get_my_registration(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """Return current user's registration for event, 404 if not registered."""
    reg = registration_service.get_my_registration(db, event_id, current_user.id)
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No registration found for this event")
    return reg
