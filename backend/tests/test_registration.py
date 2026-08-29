"""Tests for registration service."""

import uuid
import pytest

from app.models.event import Event
from app.models.user import User
from app.schemas.registration import RegistrationCreate
from app.services.registration_service import register_participant, get_event_registrations


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def test_event(db) -> Event:
    event = Event(
        name="Test Hackathon",
        venue="Online",
        status="active",
    )
    db.add(event)
    db.flush()
    return event


@pytest.fixture
def test_user(db) -> User:
    user = User(
        name="Alice Tester",
        email=f"alice.{uuid.uuid4().hex[:6]}@test.com",
        role="participant",
    )
    db.add(user)
    db.flush()
    return user


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_register_participant_success(db, test_event, test_user):
    """Participant can register for an event and receives a QR token."""
    data = RegistrationCreate(event_id=test_event.id, user_id=test_user.id)
    reg = register_participant(db, data)

    assert reg.id is not None
    assert reg.event_id == test_event.id
    assert reg.user_id == test_user.id
    assert reg.qr_token.startswith("QR-")
    assert reg.registration_status == "confirmed"
    assert reg.registration_number.startswith("REG-")


def test_register_duplicate_prevention(db, test_event, test_user):
    """Attempting to register the same user twice for the same event raises 409."""
    from fastapi import HTTPException

    data = RegistrationCreate(event_id=test_event.id, user_id=test_user.id)
    register_participant(db, data)

    with pytest.raises(HTTPException) as exc_info:
        register_participant(db, data)

    assert exc_info.value.status_code == 409
    assert "already registered" in exc_info.value.detail


def test_register_nonexistent_event(db, test_user):
    """Registering for a non-existent event raises 404."""
    from fastapi import HTTPException

    data = RegistrationCreate(event_id=uuid.uuid4(), user_id=test_user.id)
    with pytest.raises(HTTPException) as exc_info:
        register_participant(db, data)

    assert exc_info.value.status_code == 404


def test_register_nonexistent_user(db, test_event):
    """Registering a non-existent user raises 404."""
    from fastapi import HTTPException

    data = RegistrationCreate(event_id=test_event.id, user_id=uuid.uuid4())
    with pytest.raises(HTTPException) as exc_info:
        register_participant(db, data)

    assert exc_info.value.status_code == 404


def test_get_event_registrations(db, test_event):
    """Get all registrations for an event."""
    for i in range(3):
        user = User(name=f"User {i}", email=f"user{i}.{uuid.uuid4().hex[:4]}@test.com", role="participant")
        db.add(user)
        db.flush()
        data = RegistrationCreate(event_id=test_event.id, user_id=user.id)
        register_participant(db, data)

    registrations = get_event_registrations(db, test_event.id)
    assert len(registrations) == 3


def test_qr_tokens_are_unique(db, test_event):
    """Each registration gets a unique QR token."""
    tokens = []
    for i in range(5):
        user = User(name=f"User {i}", email=f"tok{i}.{uuid.uuid4().hex[:4]}@test.com", role="participant")
        db.add(user)
        db.flush()
        data = RegistrationCreate(event_id=test_event.id, user_id=user.id)
        reg = register_participant(db, data)
        tokens.append(reg.qr_token)

    assert len(set(tokens)) == 5  # all unique
