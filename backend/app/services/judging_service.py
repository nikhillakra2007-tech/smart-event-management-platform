"""Judging service — assignment retrieval, evaluation submission with full validation."""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.judging import (
    JudgeAssignment,
    Rubric,
    RubricCriteria,
    Evaluation,
    EvaluationScore,
)
from app.models.submission import Submission
from app.models.user import User
from app.schemas.judging import EvaluationSubmit, EvaluationResponse


def get_judge_assignments(db: Session, judge_id: uuid.UUID) -> list[JudgeAssignment]:
    """Return all assignments for a judge with submission details."""
    return (
        db.query(JudgeAssignment)
        .options(joinedload(JudgeAssignment.submission))
        .filter(JudgeAssignment.judge_id == judge_id)
        .all()
    )


def get_submission_rubric(db: Session, submission_id: uuid.UUID) -> Rubric | None:
    """Return the rubric for the event the submission belongs to."""
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    rubric = (
        db.query(Rubric)
        .options(joinedload(Rubric.criteria))
        .filter(Rubric.event_id == submission.event_id)
        .first()
    )
    if not rubric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No rubric found for this event",
        )
    return rubric


def submit_evaluation(db: Session, data: EvaluationSubmit) -> Evaluation:
    """
    Submit a judge's evaluation for a submission.

    Validation steps:
    1. Validate judge exists and has judge role
    2. Validate submission exists
    3. Validate judge is assigned to this submission
    4. Load rubric criteria
    5. Validate all criteria are scored
    6. Validate score ranges against max_score
    7. Calculate weighted total score
    8. Check for duplicate submitted evaluation
    9. Persist evaluation + scores atomically
    """
    # 1. Validate judge
    judge = db.get(User, data.judge_id)
    if not judge or judge.role != "judge":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a judge",
        )

    # 2. Validate submission
    submission = db.get(Submission, data.submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    # 3. Validate assignment
    assignment = (
        db.query(JudgeAssignment)
        .filter(
            JudgeAssignment.judge_id == data.judge_id,
            JudgeAssignment.submission_id == data.submission_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Judge is not assigned to this submission",
        )

    # 4. Load rubric criteria
    rubric = (
        db.query(Rubric)
        .options(joinedload(Rubric.criteria))
        .filter(Rubric.event_id == submission.event_id)
        .first()
    )
    if not rubric or not rubric.criteria:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rubric/criteria found for this event",
        )

    criteria_map: dict[uuid.UUID, RubricCriteria] = {c.id: c for c in rubric.criteria}

    # 5. Validate all criteria provided
    provided_criterion_ids = {s.criterion_id for s in data.scores}
    required_criterion_ids = set(criteria_map.keys())
    missing = required_criterion_ids - provided_criterion_ids
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Missing scores for criteria: {[str(m) for m in missing]}",
        )

    # 6. Validate score ranges
    for score_input in data.scores:
        criterion = criteria_map.get(score_input.criterion_id)
        if not criterion:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unknown criterion: {score_input.criterion_id}",
            )
        if score_input.score < 0 or score_input.score > criterion.max_score:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Score {score_input.score} for '{criterion.name}' "
                    f"is out of range [0, {criterion.max_score}]"
                ),
            )

    # 7. Calculate weighted total score
    total_weight = sum(c.weight for c in rubric.criteria)
    if total_weight == 0:
        total_weight = 1.0

    total_score = sum(
        (score_input.score / criteria_map[score_input.criterion_id].max_score)
        * criteria_map[score_input.criterion_id].weight
        * 100  # normalise to 0-100
        for score_input in data.scores
    ) / total_weight

    # 8. Check for duplicate SUBMITTED evaluation
    existing = (
        db.query(Evaluation)
        .filter(
            Evaluation.submission_id == data.submission_id,
            Evaluation.judge_id == data.judge_id,
            Evaluation.status == "submitted",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Judge has already submitted an evaluation for this submission",
        )

    # 9. Persist atomically
    evaluation = Evaluation(
        submission_id=data.submission_id,
        judge_id=data.judge_id,
        feedback=data.feedback,
        total_score=round(total_score, 4),
        status="submitted",
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(evaluation)
    db.flush()  # get evaluation.id before adding scores

    for score_input in data.scores:
        ev_score = EvaluationScore(
            evaluation_id=evaluation.id,
            criterion_id=score_input.criterion_id,
            score=score_input.score,
        )
        db.add(ev_score)

    db.commit()
    db.refresh(evaluation)
    return evaluation


def get_judge_evaluations(db: Session, judge_id: uuid.UUID) -> list[Evaluation]:
    """Return all evaluations submitted by a judge."""
    return (
        db.query(Evaluation)
        .options(joinedload(Evaluation.scores))
        .filter(Evaluation.judge_id == judge_id)
        .all()
    )
