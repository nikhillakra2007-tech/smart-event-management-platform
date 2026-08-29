"""Registration service — handles participant registration and QR token generation."""

import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.registration import Registration
from app.models.user import User
from app.models.event import Event
from app.schemas.registration import RegistrationCreate, RegistrationResponse


def _generate_qr_token() -> str:
    """Generate a unique QR token (UUID-based string, URL-safe)."""
    return f"QR-{uuid.uuid4().hex.upper()}"


def _generate_registration_number(event_id: uuid.UUID, sequence: int) -> str:
    """Generate a registration number: REG-<short_event_id>-<seq>."""
    short_id = str(event_id).split("-")[0].upper()
    return f"REG-{short_id}-{sequence:04d}"


def register_participant(
    db: Session, data: RegistrationCreate
) -> Registration:
    """
    Register a participant for an event.

    Raises HTTPException if:
    - Event does not exist
    - User does not exist
    - User is already registered for this event
    """
    # Validate event
    event = db.get(Event, data.event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event {data.event_id} not found",
        )

    # Validate user
    user = db.get(User, data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {data.user_id} not found",
        )

    # Check for duplicate registration
    existing = (
        db.query(Registration)
        .filter(
            Registration.event_id == data.event_id,
            Registration.user_id == data.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already registered for this event",
        )

    # Determine sequence number for registration_number
    count = (
        db.query(Registration)
        .filter(Registration.event_id == data.event_id)
        .count()
    )
    sequence = count + 1

    registration = Registration(
        event_id=data.event_id,
        user_id=data.user_id,
        registration_number=_generate_registration_number(data.event_id, sequence),
        qr_token=_generate_qr_token(),
        registration_status="confirmed",
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


def get_event_registrations(db: Session, event_id: uuid.UUID) -> list[Registration]:
    """Return all registrations for an event."""
    return (
        db.query(Registration)
        .filter(Registration.event_id == event_id)
        .all()
    )


def get_my_registration(db: Session, event_id: uuid.UUID, user_id: uuid.UUID) -> Registration | None:
    """Return current user's registration for event, or None."""
    return (
        db.query(Registration)
        .filter(Registration.event_id == event_id, Registration.user_id == user_id)
        .first()
    )
