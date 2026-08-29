"""Events API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_authenticated, require_organizer
from app.core.database import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse

router = APIRouter(prefix="/events", tags=["Events"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=list[EventResponse],
    summary="List all events",
)
def list_events(
    db: DbDep,
    current_user: Annotated[User, Depends(require_any_authenticated)],
):
    """Return all events."""
    return db.query(Event).all()


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Get event by ID",
)
def get_event(
    event_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_any_authenticated)],
):
    """Return a single event."""
    event = db.get(Event, event_id)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return event


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create event",
)
def create_event(
    data: EventCreate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Create a new event (organizer only)."""
    event = Event(**data.model_dump())

    db.add(event)
    db.commit()
    db.refresh(event)

    return event