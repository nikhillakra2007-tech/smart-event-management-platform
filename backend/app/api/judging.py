"""Judging API router."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.user import User
from app.schemas.judging import (
    EvaluationSubmit,
    EvaluationResponse,
    JudgeAssignmentResponse,
    RubricResponse,
)
from app.services import judging_service
from app.models.judging import Evaluation
from app.api.dependencies import require_any_authenticated, require_judge, require_organizer

router = APIRouter(tags=["Judging"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "/judges/{judge_id}/assignments",
    response_model=list[JudgeAssignmentResponse],
    summary="Get all submissions assigned to a judge",
)
def get_assignments(judge_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_judge)]):
    """Return all submissions assigned to this judge (judge only, own assignments)."""
    if str(current_user.id) != str(judge_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view your own assignments")
    return judging_service.get_judge_assignments(db, judge_id)


@router.get(
    "/submissions/{submission_id}/rubric",
    response_model=RubricResponse,
    summary="Get the rubric for a submission's event",
)
def get_rubric(submission_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_any_authenticated)]):
    """Return the judging rubric for the event this submission belongs to."""
    # Judges can view rubric for their assigned submissions, organizers can view all
    if current_user.role == "judge":
        # Verify judge is assigned to this submission
        from app.models.judging import JudgeAssignment
        assignment = db.query(JudgeAssignment).filter(
            JudgeAssignment.judge_id == current_user.id,
            JudgeAssignment.submission_id == submission_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this submission")
    return judging_service.get_submission_rubric(db, submission_id)


@router.post(
    "/evaluations",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a judge evaluation",
)
def submit_evaluation(data: EvaluationSubmit, db: DbDep, current_user: Annotated[User, Depends(require_judge)]):
    """
    Submit evaluation scores and feedback for a submission (judge only).

    Validates judge assignment, score ranges, and prevents duplicate evaluations.
    Leaderboard automatically reflects this evaluation.
    """
    if str(current_user.id) != str(data.judge_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only submit as yourself")
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
def get_judge_evaluations(judge_id: uuid.UUID, db: DbDep, current_user: Annotated[User, Depends(require_judge)]):
    """Return all evaluations submitted by this judge (judge only, own history)."""
    if str(current_user.id) != str(judge_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only view your own evaluations")
    return judging_service.get_judge_evaluations(db, judge_id)
