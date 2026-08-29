"""Analytics API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import EventAnalytics
from app.services import analytics_service
from app.api.dependencies import require_organizer

router = APIRouter(tags=["Analytics"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/analytics",
    response_model=EventAnalytics,
    summary="Get event analytics",
)
def get_analytics(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_organizer)]):
    """
    Return comprehensive event analytics derived from existing data (organizer only).

    Includes registration, attendance, team, submission, judging,
    score distribution, and engagement metrics.
    """
    return analytics_service.get_event_analytics(db, event_id)
