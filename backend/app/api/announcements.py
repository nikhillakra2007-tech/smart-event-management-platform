"""Announcements API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.announcement import AnnouncementCreate, AnnouncementResponse, AnnouncementViewRequest
from app.services import announcement_service

router = APIRouter(tags=["Announcements"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/announcements",
    response_model=list[AnnouncementResponse],
    summary="List published announcements for an event",
)
def list_announcements(event_id: uuid.UUID, db: DbDep, all: bool = False):
    """
    Return announcements for an event.

    By default returns only published announcements.
    Pass ?all=true to include drafts (organizer use).
    """
    announcements = announcement_service.list_announcements(
        db, event_id, published_only=not all
    )
    result = []
    for ann in announcements:
        result.append(AnnouncementResponse(
            id=ann.id,
            event_id=ann.event_id,
            title=ann.title,
            message=ann.message,
            type=ann.type,
            created_by=ann.created_by,
            is_published=ann.is_published,
            created_at=ann.created_at,
            updated_at=ann.updated_at,
            view_count=len(ann.views),
        ))
    return result


@router.get(
    "/announcements/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Get a single announcement",
)
def get_announcement(announcement_id: uuid.UUID, db: DbDep):
    """Return a single announcement."""
    ann = announcement_service.get_announcement(db, announcement_id)
    return AnnouncementResponse(
        id=ann.id,
        event_id=ann.event_id,
        title=ann.title,
        message=ann.message,
        type=ann.type,
        created_by=ann.created_by,
        is_published=ann.is_published,
        created_at=ann.created_at,
        updated_at=ann.updated_at,
        view_count=len(ann.views),
    )


@router.post(
    "/events/{event_id}/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an announcement",
)
def create_announcement(event_id: uuid.UUID, data: AnnouncementCreate, db: DbDep):
    """Create a new announcement (draft status). Organizer must publish separately."""
    ann = announcement_service.create_announcement(db, event_id, data)
    return AnnouncementResponse(
        id=ann.id,
        event_id=ann.event_id,
        title=ann.title,
        message=ann.message,
        type=ann.type,
        created_by=ann.created_by,
        is_published=ann.is_published,
        created_at=ann.created_at,
        updated_at=ann.updated_at,
        view_count=0,
    )


@router.post(
    "/announcements/{announcement_id}/publish",
    response_model=AnnouncementResponse,
    summary="Publish an announcement",
)
def publish_announcement(announcement_id: uuid.UUID, db: DbDep):
    """Publish an announcement so it appears in participant/judge feeds."""
    ann = announcement_service.publish_announcement(db, announcement_id)
    return AnnouncementResponse(
        id=ann.id,
        event_id=ann.event_id,
        title=ann.title,
        message=ann.message,
        type=ann.type,
        created_by=ann.created_by,
        is_published=ann.is_published,
        created_at=ann.created_at,
        updated_at=ann.updated_at,
        view_count=len(ann.views),
    )


@router.post(
    "/announcements/{announcement_id}/view",
    summary="Record a user viewing an announcement",
    status_code=status.HTTP_201_CREATED,
)
def record_view(announcement_id: uuid.UUID, data: AnnouncementViewRequest, db: DbDep):
    """Record that a user viewed an announcement (for engagement analytics)."""
    view = announcement_service.record_view(db, announcement_id, data.user_id)
    return {"message": "View recorded", "viewed_at": view.viewed_at.isoformat()}
