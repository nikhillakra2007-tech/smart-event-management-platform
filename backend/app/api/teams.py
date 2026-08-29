"""Teams API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.team import TeamCreate, TeamResponse, JoinTeamRequest, TeamDiscoveryResult
from app.services import team_service
from app.api.dependencies import require_any_authenticated, require_participant

router = APIRouter(tags=["Teams"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/teams",
    response_model=list[TeamResponse],
    summary="List all teams for an event",
)
def list_teams(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """Return all teams for an event with member counts."""
    teams_data = team_service.get_event_teams(db, event_id)
    return [TeamResponse(**t) for t in teams_data]


@router.post(
    "/events/{event_id}/teams",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new team",
)
def create_team(event_id: uuid.UUID, data: TeamCreate, db: DbDep, current_user: Annotated[User, Depends(require_participant)]):
    """Create a new team within an event (participant only)."""
    team = team_service.create_team(db, event_id, data)
    return TeamResponse(
        id=team.id,
        event_id=team.event_id,
        name=team.name,
        project_interest=team.project_interest,
        status=team.status,
        created_at=team.created_at,
        updated_at=team.updated_at,
        member_count=len(team.members),
    )


@router.post(
    "/events/{event_id}/teams/{team_id}/join",
    summary="Join a team",
    status_code=status.HTTP_201_CREATED,
)
def join_team(event_id: uuid.UUID, team_id: uuid.UUID, data: JoinTeamRequest, db: DbDep, current_user: Annotated[User, Depends(require_participant)]):
    """Add a participant to a team (participant only, must be self)."""
    if str(current_user.id) != str(data.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only join yourself")
    member = team_service.join_team(db, event_id, team_id, data.user_id, data.role)
    return {"message": "Joined team successfully", "team_member_id": str(member.id)}


@router.get(
    "/events/{event_id}/team-discovery/{user_id}",
    response_model=list[TeamDiscoveryResult],
    summary="Discover potential teammates",
)
def discover_teammates(event_id: uuid.UUID, user_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_participant)]):
    """
    Rule-based teammate discovery.

    Returns participants scored by skill overlap, interest match,
    and role compatibility. Excludes users already in a team.
    """
    if str(current_user.id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only discover for yourself")
    return team_service.discover_teammates(db, event_id, user_id)
