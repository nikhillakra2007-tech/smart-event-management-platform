"""Leaderboard Pydantic schemas."""

import uuid

from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    rank: int
    team_id: uuid.UUID
    team_name: str
    event_id: uuid.UUID
    submission_id: uuid.UUID | None
    submission_title: str | None
    evaluation_count: int
    average_score: float
    aggregate_score: float
