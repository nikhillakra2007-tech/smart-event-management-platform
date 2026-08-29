"""Test fixtures and database setup."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from sqlalchemy import text
from app.core.database import Base
import app.models  # register all models


LEADERBOARD_VIEW = """
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.event_id,
    s.id AS submission_id,
    s.title AS submission_title,
    COUNT(e.id) FILTER (WHERE e.status = 'submitted') AS evaluation_count,
    COALESCE(AVG(e.total_score) FILTER (WHERE e.status = 'submitted'), 0) AS average_score,
    COALESCE(SUM(e.total_score) FILTER (WHERE e.status = 'submitted'), 0) AS aggregate_score,
    RANK() OVER (
        PARTITION BY t.event_id
        ORDER BY COALESCE(AVG(e.total_score) FILTER (WHERE e.status = 'submitted'), 0) DESC
    ) AS rank
FROM teams t
LEFT JOIN submissions s ON s.team_id = t.id AND s.status = 'submitted'
LEFT JOIN evaluations e ON e.submission_id = s.id
GROUP BY t.id, t.name, t.event_id, s.id, s.title;
"""


# Use a separate test database
TEST_DATABASE_URL = "postgresql+psycopg://postgres:1234@127.0.0.1:5432/smart_event_test"


@pytest.fixture(scope="session")
def engine():
    """Create test database engine and tables."""
    eng = create_engine(TEST_DATABASE_URL, echo=False)
    Base.metadata.create_all(eng)
    # Create leaderboard view after tables exist
    with eng.connect() as conn:
        conn.execute(text("DROP VIEW IF EXISTS leaderboard"))
        conn.execute(text(LEADERBOARD_VIEW))
        conn.commit()
    yield eng
    with eng.connect() as conn:
        conn.execute(text("DROP VIEW IF EXISTS leaderboard"))
        conn.commit()
    Base.metadata.drop_all(eng)


@pytest.fixture(scope="function")
def db(engine) -> Session:
    """Provide a clean database session per test, rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()

    TestingSession = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = TestingSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()
