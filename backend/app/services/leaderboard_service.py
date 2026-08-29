"""Leaderboard service — SQL-based ranking from evaluation data."""

import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.leaderboard import LeaderboardEntry


def get_leaderboard(db: Session, event_id: uuid.UUID) -> list[LeaderboardEntry]:
    """
    Calculate leaderboard from the PostgreSQL VIEW.

    Returns teams ranked by average score (descending).
    Leaderboard automatically reflects all submitted evaluations.
    """
    sql = text("""
        SELECT
            team_id,
            team_name,
            event_id,
            submission_id,
            submission_title,
            evaluation_count,
            average_score,
            aggregate_score,
            rank
        FROM leaderboard
        WHERE event_id = :event_id
        ORDER BY rank ASC, team_name ASC
    """)

    result = db.execute(sql, {"event_id": str(event_id)})
    rows = result.mappings().all()

    return [
        LeaderboardEntry(
            rank=row["rank"],
            team_id=row["team_id"],
            team_name=row["team_name"],
            event_id=row["event_id"],
            submission_id=row["submission_id"],
            submission_title=row["submission_title"],
            evaluation_count=int(row["evaluation_count"]),
            average_score=float(row["average_score"]),
            aggregate_score=float(row["aggregate_score"]),
        )
        for row in rows
    ]
