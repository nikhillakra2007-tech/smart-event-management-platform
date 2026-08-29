"""Judging API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.schemas.judging import (
    EvaluationSubmit,
    EvaluationResponse,
    JudgeAssignmentResponse,
    RubricResponse,
)
from app.services import judging_service
from app.models.judging import Evaluation

router = APIRouter(tags=["Judging"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/judges/{judge_id}/assignments",
    response_model=list[JudgeAssignmentResponse],
    summary="Get all submissions assigned to a judge",
)
def get_assignments(judge_id: uuid.UUID, db: DbDep):
    """Return all submissions assigned to this judge."""
    return judging_service.get_judge_assignments(db, judge_id)


@router.get(
    "/submissions/{submission_id}/rubric",
    response_model=RubricResponse,
    summary="Get the rubric for a submission's event",
)
def get_rubric(submission_id: uuid.UUID, db: DbDep):
    """Return the judging rubric for the event this submission belongs to."""
    return judging_service.get_submission_rubric(db, submission_id)


@router.post(
    "/evaluations",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a judge evaluation",
)
def submit_evaluation(data: EvaluationSubmit, db: DbDep):
    """
    Submit evaluation scores and feedback for a submission.

    Validates judge assignment, score ranges, and prevents duplicate evaluations.
    Leaderboard automatically reflects this evaluation.
    """
    evaluation = judging_service.submit_evaluation(db, data)
    # Reload with scores
    ev = (
        db.query(Evaluation)
        .options(joinedload(Evaluation.scores))
        .filter(Evaluation.id == evaluation.id)
        .first()
    )
    return ev


@router.get(
    "/judges/{judge_id}/evaluations",
    response_model=list[EvaluationResponse],
    summary="Get evaluation history for a judge",
)
def get_judge_evaluations(judge_id: uuid.UUID, db: DbDep):
    """Return all evaluations submitted by this judge."""
    return judging_service.get_judge_evaluations(db, judge_id)
