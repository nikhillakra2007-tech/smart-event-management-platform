"""Tests for announcement service."""

import uuid
import pytest

from app.models.event import Event
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate
from app.services.announcement_service import (
    create_announcement,
    publish_announcement,
    list_announcements,
    record_view,
)


@pytest.fixture
def ann_setup(db):
    event = Event(name="Announcement Test Event", status="active")
    db.add(event)
    db.flush()

    organizer = User(name="Test Organizer", email=f"org.{uuid.uuid4().hex[:6]}@test.com", role="organizer")
    db.add(organizer)
    db.flush()

    participant = User(name="Test Participant", email=f"part.{uuid.uuid4().hex[:6]}@test.com", role="participant")
    db.add(participant)
    db.flush()

    return event, organizer, participant


def test_create_announcement(db, ann_setup):
    """Creating an announcement produces a draft."""
    event, organizer, _ = ann_setup
    data = AnnouncementCreate(
        title="Test Announcement",
        message="Hello world",
        type="general",
        created_by=organizer.id,
    )
    ann = create_announcement(db, event.id, data)

    assert ann.id is not None
    assert ann.is_published is False
    assert ann.title == "Test Announcement"


def test_draft_not_in_published_feed(db, ann_setup):
    """Draft announcements don't appear in the participant feed."""
    event, organizer, _ = ann_setup
    data = AnnouncementCreate(
        title="Draft", message="Not visible yet", type="general", created_by=organizer.id
    )
    create_announcement(db, event.id, data)

    published = list_announcements(db, event.id, published_only=True)
    assert len(published) == 0


def test_publish_announcement(db, ann_setup):
    """Publishing makes announcement visible."""
    event, organizer, _ = ann_setup
    data = AnnouncementCreate(
        title="Now Public", message="Visible!", type="critical", created_by=organizer.id
    )
    ann = create_announcement(db, event.id, data)
    published = publish_announcement(db, ann.id)

    assert published.is_published is True

    feed = list_announcements(db, event.id, published_only=True)
    assert len(feed) == 1
    assert feed[0].id == ann.id


def test_announcement_view_recorded(db, ann_setup):
    """Viewing a published announcement is recorded."""
    event, organizer, participant = ann_setup
    data = AnnouncementCreate(
        title="Viewable", message="Check this out", type="general", created_by=organizer.id
    )
    ann = create_announcement(db, event.id, data)
    publish_announcement(db, ann.id)

    view = record_view(db, ann.id, participant.id)
    assert view.announcement_id == ann.id
    assert view.user_id == participant.id


def test_announcement_view_idempotent(db, ann_setup):
    """Recording the same view twice doesn't duplicate the record."""
    event, organizer, participant = ann_setup
    data = AnnouncementCreate(
        title="Idempotent", message="View twice", type="general", created_by=organizer.id
    )
    ann = create_announcement(db, event.id, data)
    publish_announcement(db, ann.id)

    view1 = record_view(db, ann.id, participant.id)
    view2 = record_view(db, ann.id, participant.id)

    assert view1.id == view2.id  # Same record returned


def test_view_unpublished_announcement_forbidden(db, ann_setup):
    """Viewing an unpublished announcement raises 403."""
    from fastapi import HTTPException

    event, organizer, participant = ann_setup
    data = AnnouncementCreate(
        title="Draft", message="Not published", type="general", created_by=organizer.id
    )
    ann = create_announcement(db, event.id, data)

    with pytest.raises(HTTPException) as exc_info:
        record_view(db, ann.id, participant.id)

    assert exc_info.value.status_code == 403
