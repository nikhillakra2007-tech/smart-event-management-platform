"""Test fixtures and database setup."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from sqlalchemy import text
from app.core.database import Base, get_db
from app.core.security import hash_password
import app.models  # register all models
from app.main import app


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


@pytest.fixture(scope="function")
def client(db):
    """Create test client with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def organizer_token(db, client):
    """Create organizer user and return auth token."""
    from app.models.user import User
    from app.core.security import create_access_token
    
    user = User(
        id="00000000-0000-0000-0000-000000000001",
        name="Test Organizer",
        email="test.organizer@example.com",
        role="organizer",
        password_hash=hash_password("testpass123")
    )
    db.add(user)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return token


@pytest.fixture(scope="function")
def participant_token(db, client):
    """Create participant user and return auth token."""
    from app.models.user import User
    from app.models.registration import Registration
    from app.core.security import create_access_token
    import uuid
    
    user = User(
        id="10000000-0000-0000-0000-000000000001",
        name="Test Participant",
        email="test.participant@example.com",
        role="participant",
        password_hash=hash_password("testpass123")
    )
    db.add(user)
    
    event_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000001")
    reg = Registration(
        event_id=event_id,
        user_id=user.id,
        registration_number="REG-TEST-0001",
        qr_token="QR-TEST123",
        registration_status="confirmed"
    )
    db.add(reg)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return token


@pytest.fixture(scope="function")
def judge_token(db, client):
    """Create judge user and return auth token."""
    from app.models.user import User
    from app.core.security import create_access_token
    
    user = User(
        id="00000000-0000-0000-0000-000000000010",
        name="Test Judge",
        email="test.judge@example.com",
        role="judge",
        password_hash=hash_password("testpass123")
    )
    db.add(user)
    db.commit()
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return token


@pytest.fixture(scope="function")
def auth_headers_organizer(organizer_token):
    return {"Authorization": f"Bearer {organizer_token}"}


@pytest.fixture(scope="function")
def auth_headers_participant(participant_token):
    return {"Authorization": f"Bearer {participant_token}"}


@pytest.fixture(scope="function")
def auth_headers_judge(judge_token):
    return {"Authorization": f"Bearer {judge_token}"}
