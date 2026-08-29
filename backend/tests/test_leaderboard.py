"""Tests for leaderboard service."""

import uuid
import pytest
from datetime import datetime, timezone

from app.models.event import Event
from app.models.user import User
from app.models.team import Team
from app.models.submission import Submission
from app.models.judging import JudgeAssignment, Rubric, RubricCriteria, Evaluation, EvaluationScore
from app.services.leaderboard_service import get_leaderboard


@pytest.fixture
def leaderboard_setup(db):
    """Set up two teams with different scores to verify ranking."""
    event = Event(name="Leaderboard Test Event", status="active")
    db.add(event)
    db.flush()

    judge = User(name="LB Judge", email=f"lbjudge.{uuid.uuid4().hex[:6]}@test.com", role="judge")
    db.add(judge)
    db.flush()

    rubric = Rubric(event_id=event.id, name="LB Rubric")
    db.add(rubric)
    db.flush()
    criterion = RubricCriteria(rubric_id=rubric.id, name="Score", max_score=100.0, weight=1.0, sort_order=0)
    db.add(criterion)
    db.flush()

    teams = []
    submissions = []
    for name in ["Alpha Team", "Beta Team"]:
        team = Team(event_id=event.id, name=name, status="submitted")
        db.add(team)
        db.flush()
        sub = Submission(
            event_id=event.id,
            team_id=team.id,
            title=f"{name} App",
            status="submitted",
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(sub)
        db.flush()
        assignment = JudgeAssignment(judge_id=judge.id, submission_id=sub.id)
        db.add(assignment)
        db.flush()
        teams.append(team)
        submissions.append(sub)

    # Alpha scores 90, Beta scores 60
    for sub, score in zip(submissions, [90.0, 60.0]):
        evaluation = Evaluation(
            submission_id=sub.id,
            judge_id=judge.id,
            total_score=score,
            status="submitted",
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(evaluation)
        db.flush()
        ev_score = EvaluationScore(
            evaluation_id=evaluation.id,
            criterion_id=criterion.id,
            score=score,
        )
        db.add(ev_score)

    db.commit()
    return event, teams, submissions


def test_leaderboard_ranks_correctly(db, leaderboard_setup):
    """Team with higher score gets rank 1."""
    event, teams, _ = leaderboard_setup
    entries = get_leaderboard(db, event.id)

    assert len(entries) == 2
    assert entries[0].rank == 1
    assert entries[0].team_name == "Alpha Team"
    assert entries[0].average_score == 90.0
    assert entries[1].rank == 2
    assert entries[1].team_name == "Beta Team"
    assert entries[1].average_score == 60.0


def test_leaderboard_returns_empty_for_no_teams(db):
    """Event with no teams returns empty leaderboard."""
    event = Event(name="Empty Event", status="active")
    db.add(event)
    db.commit()

    entries = get_leaderboard(db, event.id)
    assert entries == []
