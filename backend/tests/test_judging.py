"""Tests for judging service."""

import uuid
import pytest

from app.core.security import hash_password
from app.models.event import Event
from app.models.user import User
from app.models.team import Team, TeamMember
from app.models.submission import Submission
from app.models.judging import JudgeAssignment, Rubric, RubricCriteria
from app.schemas.judging import EvaluationSubmit, EvaluationScoreInput
from app.services.judging_service import submit_evaluation


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def judging_setup(db):
    """Full judging test setup."""
    event = Event(name="Judging Test Event", status="active")
    db.add(event)
    db.flush()

    # Judge
    judge = User(
        name="Test Judge", 
        email=f"judge.{uuid.uuid4().hex[:6]}@test.com", 
        role="judge",
        password_hash=hash_password("testpass123"),
    )
    db.add(judge)
    db.flush()

    # Non-judge user
    non_judge = User(
        name="Not A Judge", 
        email=f"notjudge.{uuid.uuid4().hex[:6]}@test.com", 
        role="participant",
        password_hash=hash_password("testpass123"),
    )
    db.add(non_judge)
    db.flush()

    # Team and submission
    team = Team(event_id=event.id, name="Test Team", status="submitted")
    db.add(team)
    db.flush()

    submission = Submission(
        event_id=event.id,
        team_id=team.id,
        title="Test Submission",
        status="submitted",
    )
    db.add(submission)
    db.flush()

    # Rubric with criteria
    rubric = Rubric(event_id=event.id, name="Test Rubric")
    db.add(rubric)
    db.flush()

    criteria = [
        RubricCriteria(rubric_id=rubric.id, name="Innovation", max_score=25.0, weight=1.5, sort_order=0),
        RubricCriteria(rubric_id=rubric.id, name="Technical", max_score=30.0, weight=2.0, sort_order=1),
    ]
    for c in criteria:
        db.add(c)
    db.flush()

    # Judge assignment
    assignment = JudgeAssignment(judge_id=judge.id, submission_id=submission.id)
    db.add(assignment)
    db.flush()

    return event, judge, non_judge, submission, rubric, criteria, assignment


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_evaluation_submission_success(db, judging_setup):
    """Judge can submit a valid evaluation."""
    event, judge, _, submission, rubric, criteria, _ = judging_setup

    data = EvaluationSubmit(
        submission_id=submission.id,
        judge_id=judge.id,
        feedback="Great work!",
        scores=[
            EvaluationScoreInput(criterion_id=criteria[0].id, score=20.0),
            EvaluationScoreInput(criterion_id=criteria[1].id, score=25.0),
        ],
    )
    evaluation = submit_evaluation(db, data)

    assert evaluation.id is not None
    assert evaluation.status == "submitted"
    assert evaluation.total_score is not None
    assert evaluation.total_score > 0


def test_non_judge_cannot_evaluate(db, judging_setup):
    """A participant (non-judge) cannot submit an evaluation."""
    from fastapi import HTTPException

    event, _, non_judge, submission, rubric, criteria, _ = judging_setup

    data = EvaluationSubmit(
        submission_id=submission.id,
        judge_id=non_judge.id,
        scores=[
            EvaluationScoreInput(criterion_id=criteria[0].id, score=20.0),
            EvaluationScoreInput(criterion_id=criteria[1].id, score=25.0),
        ],
    )
    with pytest.raises(HTTPException) as exc_info:
        submit_evaluation(db, data)

    assert exc_info.value.status_code == 403


def test_unassigned_judge_cannot_evaluate(db, judging_setup):
    """A judge not assigned to a submission cannot evaluate it."""
    from fastapi import HTTPException

    event, _, _, submission, rubric, criteria, _ = judging_setup

    other_judge = User(
        name="Other Judge", 
        email=f"other.{uuid.uuid4().hex[:6]}@test.com", 
        role="judge",
        password_hash=hash_password("testpass123"),
    )
    db.add(other_judge)
    db.flush()

    data = EvaluationSubmit(
        submission_id=submission.id,
        judge_id=other_judge.id,
        scores=[
            EvaluationScoreInput(criterion_id=criteria[0].id, score=20.0),
            EvaluationScoreInput(criterion_id=criteria[1].id, score=25.0),
        ],
    )
    with pytest.raises(HTTPException) as exc_info:
        submit_evaluation(db, data)

    assert exc_info.value.status_code == 403
    assert "not assigned" in exc_info.value.detail


def test_score_out_of_range_rejected(db, judging_setup):
    """Score exceeding max_score for a criterion is rejected."""
    from fastapi import HTTPException

    event, judge, _, submission, rubric, criteria, _ = judging_setup

    data = EvaluationSubmit(
        submission_id=submission.id,
        judge_id=judge.id,
        scores=[
            EvaluationScoreInput(criterion_id=criteria[0].id, score=99.0),  # max is 25
            EvaluationScoreInput(criterion_id=criteria[1].id, score=25.0),
        ],
    )
    with pytest.raises(HTTPException) as exc_info:
        submit_evaluation(db, data)

    assert exc_info.value.status_code == 422
    assert "out of range" in exc_info.value.detail


def test_duplicate_evaluation_prevented(db, judging_setup):
    """A judge cannot submit a second evaluation for the same submission."""
    from fastapi import HTTPException

    event, judge, _, submission, rubric, criteria, _ = judging_setup

    scores_data = [
        EvaluationScoreInput(criterion_id=criteria[0].id, score=20.0),
        EvaluationScoreInput(criterion_id=criteria[1].id, score=25.0),
    ]

    data = EvaluationSubmit(submission_id=submission.id, judge_id=judge.id, scores=scores_data)
    submit_evaluation(db, data)

    with pytest.raises(HTTPException) as exc_info:
        submit_evaluation(db, data)

    assert exc_info.value.status_code == 409


def test_weighted_score_calculation(db, judging_setup):
    """Total score is correctly calculated using weights."""
    event, judge, _, submission, rubric, criteria, _ = judging_setup

    # criteria[0]: max=25, weight=1.5
    # criteria[1]: max=30, weight=2.0
    data = EvaluationSubmit(
        submission_id=submission.id,
        judge_id=judge.id,
        scores=[
            EvaluationScoreInput(criterion_id=criteria[0].id, score=25.0),  # 100% of max
            EvaluationScoreInput(criterion_id=criteria[1].id, score=30.0),  # 100% of max
        ],
    )
    evaluation = submit_evaluation(db, data)

    # Both at 100% → total_score should be 100
    assert abs(evaluation.total_score - 100.0) < 0.01
