"""Tests for check-in service."""

import uuid
import pytest

from app.models.event import Event
from app.models.user import User
from app.models.registration import Registration
from app.schemas.registration import QRVerifyRequest
from app.services.checkin_service import verify_and_checkin


@pytest.fixture
def setup_registration(db):
    """Create a confirmed registration for check-in tests."""
    event = Event(name="CheckIn Test Event", status="active")
    db.add(event)
    db.flush()

    user = User(name="Bob Checker", email=f"bob.{uuid.uuid4().hex[:6]}@test.com", role="participant")
    db.add(user)
    db.flush()

    reg = Registration(
        event_id=event.id,
        user_id=user.id,
        registration_number="REG-TEST-0001",
        qr_token=f"QR-TESTTOKEN{uuid.uuid4().hex.upper()[:10]}",
        registration_status="confirmed",
    )
    db.add(reg)
    db.flush()
    return event, user, reg


def test_qr_checkin_success(db, setup_registration):
    """Valid QR token creates check-in and returns participant info."""
    event, user, reg = setup_registration

    result = verify_and_checkin(db, QRVerifyRequest(event_id=event.id, qr_token=reg.qr_token))

    assert result.check_in.status == "active"
    assert result.participant_name == user.name
    assert result.participant_email == user.email
    assert result.registration_number == reg.registration_number


def test_duplicate_checkin_prevented(db, setup_registration):
    """A second check-in attempt with the same token returns 409."""
    from fastapi import HTTPException

    event, user, reg = setup_registration
    request = QRVerifyRequest(event_id=event.id, qr_token=reg.qr_token)

    verify_and_checkin(db, request)

    with pytest.raises(HTTPException) as exc_info:
        verify_and_checkin(db, request)

    assert exc_info.value.status_code == 409
    assert "already checked in" in exc_info.value.detail


def test_invalid_qr_token_returns_404(db, setup_registration):
    """An unknown QR token returns 404."""
    from fastapi import HTTPException

    event, _, _ = setup_registration
    with pytest.raises(HTTPException) as exc_info:
        verify_and_checkin(db, QRVerifyRequest(event_id=event.id, qr_token="QR-FAKEFAKEFAKE"))

    assert exc_info.value.status_code == 404


def test_wrong_event_qr_token_returns_400(db, setup_registration):
    """Using a valid token but wrong event_id returns 400."""
    from fastapi import HTTPException

    event, user, reg = setup_registration
    wrong_event_id = uuid.uuid4()

    with pytest.raises(HTTPException) as exc_info:
        verify_and_checkin(db, QRVerifyRequest(event_id=wrong_event_id, qr_token=reg.qr_token))

    assert exc_info.value.status_code == 400
    assert "not valid for this event" in exc_info.value.detail


def test_cancelled_registration_cannot_checkin(db, setup_registration):
    """A cancelled registration cannot be checked in."""
    from fastapi import HTTPException

    event, user, reg = setup_registration
    reg.registration_status = "cancelled"
    db.flush()

    with pytest.raises(HTTPException) as exc_info:
        verify_and_checkin(db, QRVerifyRequest(event_id=event.id, qr_token=reg.qr_token))

    assert exc_info.value.status_code == 400
