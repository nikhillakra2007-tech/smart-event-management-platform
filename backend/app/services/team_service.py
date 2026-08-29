"""Team service — create teams, join teams, rule-based teammate discovery."""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.team import Team, TeamMember
from app.models.user import User, ParticipantProfile
from app.schemas.team import TeamCreate, TeamDiscoveryResult


# ---------------------------------------------------------------------------
# Team CRUD
# ---------------------------------------------------------------------------

def create_team(db: Session, event_id: uuid.UUID, data: TeamCreate) -> Team:
    """Create a new team for an event. Team name must be unique within the event."""
    existing = (
        db.query(Team)
        .filter(Team.event_id == event_id, Team.name == data.name)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A team named '{data.name}' already exists in this event",
        )

    team = Team(
        event_id=event_id,
        name=data.name,
        project_interest=data.project_interest,
        status="forming",
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def join_team(
    db: Session, event_id: uuid.UUID, team_id: uuid.UUID, user_id: uuid.UUID, role: str | None = None
) -> TeamMember:
    """
    Add a user to a team.
    Enforces: user cannot be in multiple teams for the same event.
    """
    # Verify team belongs to event
    team = db.query(Team).filter(Team.id == team_id, Team.event_id == event_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found in this event")

    # Check if user already in a team for this event
    existing_membership = (
        db.query(TeamMember)
        .join(Team)
        .filter(Team.event_id == event_id, TeamMember.user_id == user_id)
        .first()
    )
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already in a team for this event",
        )

    # Check not already in THIS team specifically
    dup = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, TeamMember.user_id == user_id
    ).first()
    if dup:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already in this team")

    member = TeamMember(team_id=team_id, user_id=user_id, role=role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def get_event_teams(db: Session, event_id: uuid.UUID) -> list[dict]:
    """Return teams for an event with member count."""
    teams = db.query(Team).filter(Team.event_id == event_id).all()
    result = []
    for team in teams:
        result.append({
            "id": team.id,
            "event_id": team.event_id,
            "name": team.name,
            "project_interest": team.project_interest,
            "status": team.status,
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "member_count": len(team.members),
        })
    return result


# ---------------------------------------------------------------------------
# Rule-based Team Discovery
# ---------------------------------------------------------------------------

def _compute_match_score(
    seeker_skills: list[str],
    seeker_interests: list[str],
    seeker_roles: list[str],
    candidate_skills: list[str],
    candidate_interests: list[str],
    candidate_roles: list[str],
) -> tuple[float, list[str], list[str], list[str]]:
    """
    Deterministic scoring algorithm:
      +2 per matching skill
      +3 per matching project interest
      +1 per compatible role (candidate has a role the seeker doesn't have)

    Normalised to 0-100 against a theoretical max.
    """
    seeker_skills_set = {s.lower() for s in seeker_skills}
    seeker_interests_set = {i.lower() for i in seeker_interests}
    seeker_roles_set = {r.lower() for r in seeker_roles}

    matching_skills = [
        s for s in candidate_skills if s.lower() in seeker_skills_set
    ]
    matching_interests = [
        i for i in candidate_interests if i.lower() in seeker_interests_set
    ]
    # Compatible roles: candidate has a role the seeker does NOT have
    compatible_roles = [
        r for r in candidate_roles if r.lower() not in seeker_roles_set
    ]

    raw_score = (
        len(matching_skills) * 2
        + len(matching_interests) * 3
        + len(compatible_roles) * 1
    )

    # Theoretical max: all seeker skills match (×2) + all seeker interests match (×3) + 3 role points
    theoretical_max = (
        len(seeker_skills) * 2 + len(seeker_interests) * 3 + 3
    )
    if theoretical_max == 0:
        theoretical_max = 1  # avoid division by zero

    normalised = min(100.0, round((raw_score / theoretical_max) * 100, 2))
    return normalised, matching_skills, matching_interests, compatible_roles


def discover_teammates(
    db: Session, event_id: uuid.UUID, user_id: uuid.UUID
) -> list[TeamDiscoveryResult]:
    """
    Return a scored, sorted list of potential teammates for a participant.

    Excludes:
    - The seeker themselves
    - Users already in a team for this event

    Sorted by match_score descending.
    """
    # Load seeker profile
    seeker = (
        db.query(User)
        .options(joinedload(User.participant_profile))
        .filter(User.id == user_id)
        .first()
    )
    if not seeker or not seeker.participant_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant profile not found for user",
        )

    seeker_profile = seeker.participant_profile

    # Find users already in teams for this event
    users_in_teams: set[uuid.UUID] = {
        m.user_id
        for m in db.query(TeamMember)
        .join(Team)
        .filter(Team.event_id == event_id)
        .all()
    }

    # Load all other participants with profiles
    candidates = (
        db.query(User)
        .options(joinedload(User.participant_profile))
        .filter(
            User.id != user_id,
            User.role == "participant",
        )
        .all()
    )

    results: list[TeamDiscoveryResult] = []
    for candidate in candidates:
        if not candidate.participant_profile:
            continue
        if candidate.id in users_in_teams:
            continue

        cp = candidate.participant_profile
        score, m_skills, m_interests, c_roles = _compute_match_score(
            seeker_skills=seeker_profile.skills or [],
            seeker_interests=seeker_profile.project_interests or [],
            seeker_roles=seeker_profile.preferred_roles or [],
            candidate_skills=cp.skills or [],
            candidate_interests=cp.project_interests or [],
            candidate_roles=cp.preferred_roles or [],
        )

        results.append(
            TeamDiscoveryResult(
                user_id=candidate.id,
                name=candidate.name,
                email=candidate.email,
                skills=cp.skills or [],
                preferred_roles=cp.preferred_roles or [],
                project_interests=cp.project_interests or [],
                bio=cp.bio,
                matching_skills=m_skills,
                matching_interests=m_interests,
                compatible_roles=c_roles,
                match_score=score,
            )
        )

    # Sort by match_score descending, then name alphabetically
    results.sort(key=lambda r: (-r.match_score, r.name))
    return results
