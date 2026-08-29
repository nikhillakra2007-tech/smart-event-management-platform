"""Leaderboard API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry
from app.services import leaderboard_service
from app.api.dependencies import require_any_authenticated

router = APIRouter(tags=["Leaderboard"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/leaderboard",
    response_model=list[LeaderboardEntry],
    summary="Get live leaderboard for an event",
)
def get_leaderboard(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """
    Return the live leaderboard calculated from submitted evaluations.

    Rankings are computed in real-time from the PostgreSQL VIEW.
    No caching — always reflects the latest submitted evaluations.
    """
    return leaderboard_service.get_leaderboard(db, event_id)
