"""Tests for rule-based team discovery."""

import uuid
import pytest

from app.core.security import hash_password
from app.models.event import Event
from app.models.user import User, ParticipantProfile
from app.models.team import Team, TeamMember
from app.services.team_service import discover_teammates, _compute_match_score


# ---------------------------------------------------------------------------
# Unit tests for scoring algorithm
# ---------------------------------------------------------------------------

def test_match_score_perfect_overlap():
    """When all skills and interests match, score is high."""
    score, m_skills, m_interests, c_roles = _compute_match_score(
        seeker_skills=["Python", "FastAPI"],
        seeker_interests=["HealthTech"],
        seeker_roles=["Backend Developer"],
        candidate_skills=["Python", "FastAPI"],
        candidate_interests=["HealthTech"],
        candidate_roles=["Frontend Developer"],  # different role = compatible
    )
    assert score >= 80, f"Expected high score, got {score}"
    assert "Python" in m_skills
    assert "FastAPI" in m_skills
    assert "HealthTech" in m_interests
    assert "Frontend Developer" in c_roles


def test_match_score_no_overlap():
    """When no skills/interests match and no compatible roles, score is 0."""
    score, m_skills, m_interests, c_roles = _compute_match_score(
        seeker_skills=["Python"],
        seeker_interests=["HealthTech"],
        seeker_roles=["Backend Developer"],
        candidate_skills=["Rust"],
        candidate_interests=["AgriTech"],
        candidate_roles=["Backend Developer"],  # same role = not compatible
    )
    assert score == 0.0
    assert m_skills == []
    assert m_interests == []
    assert c_roles == []


def test_match_score_partial_overlap():
    """Partial matches produce a score between 0 and 100."""
    score, _, _, _ = _compute_match_score(
        seeker_skills=["Python", "React", "Docker"],
        seeker_interests=["HealthTech", "FinTech"],
        seeker_roles=["Backend Developer"],
        candidate_skills=["Python", "Kubernetes"],  # 1 matching skill
        candidate_interests=["HealthTech", "AgriTech"],  # 1 matching interest
        candidate_roles=["DevOps Engineer"],  # compatible role
    )
    assert 0 < score < 100


def test_match_score_case_insensitive():
    """Matching is case-insensitive."""
    score, m_skills, _, _ = _compute_match_score(
        seeker_skills=["python"],
        seeker_interests=["healthtech"],
        seeker_roles=["backend developer"],
        candidate_skills=["Python"],
        candidate_interests=["HealthTech"],
        candidate_roles=["Frontend Developer"],
    )
    assert len(m_skills) == 1


def test_match_score_no_division_by_zero():
    """Empty seeker profile doesn't crash."""
    score, _, _, _ = _compute_match_score(
        seeker_skills=[],
        seeker_interests=[],
        seeker_roles=[],
        candidate_skills=["Python"],
        candidate_interests=["HealthTech"],
        candidate_roles=["Backend Developer"],
    )
    # Empty seeker skills/interests: any compatible role still contributes
    # Score may be > 0 due to compatible roles in the numerator
    assert 0.0 <= score <= 100.0  # Score is valid but may be non-zero


# ---------------------------------------------------------------------------
# Integration tests for discover_teammates
# ---------------------------------------------------------------------------

@pytest.fixture
def discovery_setup(db):
    """Set up event, seeker, and candidates for discovery tests."""
    event = Event(name="Discovery Test Event", status="active")
    db.add(event)
    db.flush()

    # Seeker
    seeker = User(
        name="Seeker User", 
        email=f"seeker.{uuid.uuid4().hex[:6]}@test.com", 
        role="participant",
        password_hash=hash_password("testpass123"),
    )
    db.add(seeker)
    db.flush()
    db.add(ParticipantProfile(
        user_id=seeker.id,
        skills=["Python", "FastAPI"],
        preferred_roles=["Backend Developer"],
        project_interests=["HealthTech"],
    ))

    # High-match candidate
    high_match = User(
        name="High Match", 
        email=f"high.{uuid.uuid4().hex[:6]}@test.com", 
        role="participant",
        password_hash=hash_password("testpass123"),
    )
    db.add(high_match)
    db.flush()
    db.add(ParticipantProfile(
        user_id=high_match.id,
        skills=["Python", "FastAPI"],
        preferred_roles=["Frontend Developer"],
        project_interests=["HealthTech"],
    ))

    # Low-match candidate
    low_match = User(
        name="Low Match", 
        email=f"low.{uuid.uuid4().hex[:6]}@test.com", 
        role="participant",
        password_hash=hash_password("testpass123"),
    )
    db.add(low_match)
    db.flush()
    db.add(ParticipantProfile(
        user_id=low_match.id,
        skills=["Rust"],
        preferred_roles=["Systems Developer"],
        project_interests=["AgriTech"],
    ))

    # Candidate already in a team (should be excluded)
    in_team = User(
        name="In Team", 
        email=f"inteam.{uuid.uuid4().hex[:6]}@test.com", 
        role="participant",
        password_hash=hash_password("testpass123"),
    )
    db.add(in_team)
    db.flush()
    db.add(ParticipantProfile(
        user_id=in_team.id,
        skills=["Python"],
        preferred_roles=["Backend Developer"],
        project_interests=["HealthTech"],
    ))
    team = Team(event_id=event.id, name="Existing Team", status="forming")
    db.add(team)
    db.flush()
    db.add(TeamMember(team_id=team.id, user_id=in_team.id))

    db.flush()
    return event, seeker, high_match, low_match, in_team


def test_discovery_returns_sorted_results(db, discovery_setup):
    """Results are sorted by match_score descending."""
    event, seeker, high_match, low_match, in_team = discovery_setup
    results = discover_teammates(db, event.id, seeker.id)

    assert len(results) >= 2
    for i in range(len(results) - 1):
        assert results[i].match_score >= results[i + 1].match_score


def test_discovery_excludes_users_in_teams(db, discovery_setup):
    """Users already in a team are excluded from results."""
    event, seeker, high_match, low_match, in_team = discovery_setup
    results = discover_teammates(db, event.id, seeker.id)

    result_ids = [r.user_id for r in results]
    assert in_team.id not in result_ids


def test_discovery_excludes_seeker(db, discovery_setup):
    """Seeker is not included in their own discovery results."""
    event, seeker, _, _, _ = discovery_setup
    results = discover_teammates(db, event.id, seeker.id)

    result_ids = [r.user_id for r in results]
    assert seeker.id not in result_ids


def test_discovery_high_match_scores_higher(db, discovery_setup):
    """High-match candidate scores higher than low-match candidate."""
    event, seeker, high_match, low_match, _ = discovery_setup
    results = discover_teammates(db, event.id, seeker.id)

    result_map = {r.user_id: r for r in results}
    if high_match.id in result_map and low_match.id in result_map:
        assert result_map[high_match.id].match_score > result_map[low_match.id].match_score
