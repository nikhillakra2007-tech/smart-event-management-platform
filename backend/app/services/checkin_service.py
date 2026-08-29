"""Check-in service — QR token verification and check-in creation."""

import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.registration import Registration, CheckIn
from app.schemas.registration import QRVerifyRequest, CheckInWithParticipantResponse, CheckInResponse


def verify_and_checkin(
    db: Session,
    request: QRVerifyRequest,
    checked_in_by: uuid.UUID | None = None,
) -> CheckInWithParticipantResponse:
    """
    Verify a QR token and create a check-in record.

    Process:
    1. Find registration by qr_token
    2. Verify it belongs to the correct event
    3. Verify registration status is 'confirmed'
    4. Check for existing active check-in
    5. Create check-in if valid

    Raises HTTPException for invalid, wrong-event, cancelled, or duplicate cases.
    """
    # 1. Find registration by token
    registration = (
        db.query(Registration)
        .filter(Registration.qr_token == request.qr_token)
        .first()
    )
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="QR token not found — invalid token",
        )

    # 2. Verify event match
    if str(registration.event_id) != str(request.event_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR token is not valid for this event",
        )

    # 3. Verify registration status
    if registration.registration_status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is '{registration.registration_status}' — cannot check in",
        )

    # 4. Check for existing active check-in
    existing_checkin = (
        db.query(CheckIn)
        .filter(
            CheckIn.registration_id == registration.id,
            CheckIn.status == "active",
        )
        .first()
    )
    if existing_checkin:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Participant is already checked in",
        )

    # 5. Create check-in
    checkin = CheckIn(
        registration_id=registration.id,
        checked_in_by=checked_in_by,
        status="active",
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    # Eagerly load participant info
    user = registration.user
    return CheckInWithParticipantResponse(
        check_in=CheckInResponse.model_validate(checkin),
        participant_name=user.name,
        participant_email=user.email,
        registration_number=registration.registration_number,
        event_id=registration.event_id,
    )


def get_event_checkins(db: Session, event_id: uuid.UUID) -> list[dict]:
    """Return all check-ins for an event with participant details."""
    registrations = (
        db.query(Registration)
        .filter(Registration.event_id == event_id)
        .all()
    )

    results = []
    for reg in registrations:
        active_checkin = next(
            (c for c in reg.checkins if c.status == "active"), None
        )
        results.append({
            "registration_id": str(reg.id),
            "registration_number": reg.registration_number,
            "user_id": str(reg.user_id),
            "participant_name": reg.user.name if reg.user else "Unknown",
            "checked_in": active_checkin is not None,
            "checked_in_at": active_checkin.checked_in_at.isoformat() if active_checkin else None,
        })
    return results


def get_my_checkin(db: Session, event_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    """Return current user's check-in status for event."""
    reg = db.query(Registration).filter(Registration.event_id == event_id, Registration.user_id == user_id).first()
    if not reg:
        return {"checked_in": False, "checked_in_at": None, "registration_id": None}
    active = next((c for c in reg.checkins if c.status == "active"), None)
    return {
        "checked_in": active is not None,
        "checked_in_at": active.checked_in_at.isoformat() if active else None,
        "registration_id": str(reg.id),
    }
