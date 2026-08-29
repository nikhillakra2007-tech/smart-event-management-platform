"""Submissions API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.submission import Submission
from app.schemas.submission import SubmissionCreate, SubmissionResponse

router = APIRouter(tags=["Submissions"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/events/{event_id}/submissions",
    response_model=list[SubmissionResponse],
    summary="List all submissions for an event",
)
def list_submissions(event_id: uuid.UUID, db: DbDep):
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
def get_submission(submission_id: uuid.UUID, db: DbDep):
    """Return a single submission."""
    sub = db.get(Submission, submission_id)
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return sub
