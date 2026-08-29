"""Announcement service — CRUD, publish, and view tracking."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementView
from app.schemas.announcement import AnnouncementCreate


def list_announcements(
    db: Session, event_id: uuid.UUID, published_only: bool = True
) -> list[Announcement]:
    """Return announcements for an event, optionally filtering to published only."""
    q = db.query(Announcement).filter(Announcement.event_id == event_id)
    if published_only:
        q = q.filter(Announcement.is_published == True)
    return q.order_by(Announcement.created_at.desc()).all()


def get_announcement(db: Session, announcement_id: uuid.UUID) -> Announcement:
    """Get a single announcement by ID."""
    ann = db.get(Announcement, announcement_id)
    if not ann:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )
    return ann


def create_announcement(
    db: Session, event_id: uuid.UUID, data: AnnouncementCreate
) -> Announcement:
    """Create a new announcement (draft by default)."""
    ann = Announcement(
        event_id=event_id,
        title=data.title,
        message=data.message,
        type=data.type,
        created_by=data.created_by,
        is_published=False,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


def publish_announcement(db: Session, announcement_id: uuid.UUID) -> Announcement:
    """Publish an announcement, making it visible to participants and judges."""
    ann = get_announcement(db, announcement_id)
    ann.is_published = True
    db.commit()
    db.refresh(ann)
    return ann


def record_view(
    db: Session, announcement_id: uuid.UUID, user_id: uuid.UUID
) -> AnnouncementView:
    """
    Record that a user viewed an announcement.
    Idempotent: if view already recorded, return existing record.
    """
    ann = get_announcement(db, announcement_id)
    if not ann.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Announcement is not published",
        )

    existing = (
        db.query(AnnouncementView)
        .filter(
            AnnouncementView.announcement_id == announcement_id,
            AnnouncementView.user_id == user_id,
        )
        .first()
    )
    if existing:
        return existing

    view = AnnouncementView(announcement_id=announcement_id, user_id=user_id)
    db.add(view)
    db.commit()
    db.refresh(view)
    return view
