"""Submissions API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.submission import Submission
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.api.dependencies import require_any_authenticated, require_participant

router = APIRouter(tags=["Submissions"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/submissions",
    response_model=list[SubmissionResponse],
    summary="List all submissions for an event",
)
def list_submissions(event_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """Return all submissions for an event."""
    return (
        db.query(Submission)
        .filter(Submission.event_id == event_id)
        .all()
    )


@router.get(
    "/submissions/{submission_id}",
    response_model=SubmissionResponse,
    summary="Get a submission by ID",
)
def get_submission(submission_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """Return a single submission."""
    sub = db.get(Submission, submission_id)
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return sub


@router.post(
    "/events/{event_id}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update a submission for a team",
)
def create_or_update_submission(
    event_id: uuid.UUID,
    data: SubmissionCreate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_participant)],
):
    """Create or update a team submission (participant only, must be team member)."""
    from datetime import datetime, timezone

    # Verify user is a member of the team
    from app.models.team import TeamMember
    member = db.query(TeamMember).filter(
        TeamMember.team_id == data.team_id,
        TeamMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this team")

    existing = (
        db.query(Submission)
        .filter(Submission.event_id == event_id, Submission.team_id == data.team_id)
        .first()
    )
    if existing:
        existing.title = data.title
        existing.description = data.description
        existing.repository_url = data.repository_url
        existing.demo_url = data.demo_url
        existing.status = "submitted"
        existing.submitted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return existing

    sub = Submission(
        event_id=event_id,
        team_id=data.team_id,
        title=data.title,
        description=data.description,
        repository_url=data.repository_url,
        demo_url=data.demo_url,
        status="submitted",
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

