# Smart Event Management Platform — Implementation Plan

## Architecture Overview

```
Frontend (future phase)
       |
       v
FastAPI REST API  (backend/app/main.py + api/ routers)
       |
       v
Service Layer     (backend/app/services/)
       |
       v
SQLAlchemy ORM    (backend/app/models/)
       |
       v
PostgreSQL        (via psycopg3 async-compatible sync driver)
       |
       v
Realtime-ready    (data immediately queryable; SSE/WS in next phase)
```

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary keys | UUID (uuid.uuid4) | Globally unique, no collision |
| Array fields | PostgreSQL ARRAY(String) | Native array for skills/roles/interests |
| Leaderboard | SQL VIEW + aggregation | Always reflects live evaluation data |
| Analytics | Query-time aggregation | No redundant tables |
| Team discovery | Scoring function | Set intersection on skills/interests/roles |
| QR token | UUID string in registration | No image library required |
| Migrations | Alembic autogenerate | Track every schema change |
| Realtime | Polling/SSE-ready endpoints | WebSocket deferred to frontend phase |

## Component Map

### backend/app/core/
- `config.py` — Settings via pydantic-settings (reads DATABASE_URL from .env)
- `database.py` — SQLAlchemy engine, SessionLocal, Base, get_db dependency

### backend/app/models/
- `event.py` — Event
- `user.py` — User, ParticipantProfile
- `registration.py` — Registration, CheckIn
- `team.py` — Team, TeamMember
- `submission.py` — Submission
- `judging.py` — JudgeAssignment, Rubric, RubricCriteria, Evaluation, EvaluationScore
- `announcement.py` — Announcement, AnnouncementView

### backend/app/schemas/
- One Pydantic schema file per model group (request + response models)

### backend/app/api/
- `events.py`, `registrations.py`, `checkins.py`, `teams.py`
- `submissions.py`, `judging.py`, `announcements.py`
- `leaderboard.py`, `analytics.py`

### backend/app/services/
- `registration_service.py` — register, generate QR token, verify
- `checkin_service.py` — QR verify → create check-in
- `team_service.py` — create team, join team, discovery
- `judging_service.py` — assign, evaluate, validate, calculate score
- `leaderboard_service.py` — aggregate query / VIEW
- `analytics_service.py` — aggregate statistics
- `announcement_service.py` — CRUD, publish, record view

### alembic/
- `env.py` configured to import all models
- Initial migration: `0001_initial.py`

### scripts/
- `seed.py` — deterministic seed; safe to rerun (TRUNCATE + INSERT)

### tests/
- `test_registration.py`, `test_checkin.py`, `test_team_discovery.py`
- `test_judging.py`, `test_leaderboard.py`, `test_announcements.py`

## Proposed Changes (File List)

### [NEW] Project Root
- `.env.example`
- `.gitignore`
- `README.md`
- `SPECIFICATION.md` (already created)
- `IMPLEMENTATION_PLAN.md` (this file)
- `DATABASE.md`
- `BACKEND.md`

### [NEW] backend/
- `requirements.txt`
- `app/__init__.py`
- `app/main.py`
- `app/core/__init__.py`
- `app/core/config.py`
- `app/core/database.py`
- `app/models/__init__.py`
- `app/models/event.py`
- `app/models/user.py`
- `app/models/registration.py`
- `app/models/team.py`
- `app/models/submission.py`
- `app/models/judging.py`
- `app/models/announcement.py`
- `app/schemas/__init__.py`
- `app/schemas/event.py`
- `app/schemas/user.py`
- `app/schemas/registration.py`
- `app/schemas/team.py`
- `app/schemas/submission.py`
- `app/schemas/judging.py`
- `app/schemas/announcement.py`
- `app/schemas/leaderboard.py`
- `app/schemas/analytics.py`
- `app/api/__init__.py`
- `app/api/router.py`
- `app/api/events.py`
- `app/api/registrations.py`
- `app/api/checkins.py`
- `app/api/teams.py`
- `app/api/submissions.py`
- `app/api/judging.py`
- `app/api/announcements.py`
- `app/api/leaderboard.py`
- `app/api/analytics.py`
- `app/services/__init__.py`
- `app/services/registration_service.py`
- `app/services/checkin_service.py`
- `app/services/team_service.py`
- `app/services/judging_service.py`
- `app/services/leaderboard_service.py`
- `app/services/analytics_service.py`
- `app/services/announcement_service.py`
- `alembic.ini`
- `alembic/env.py`
- `alembic/script.py.mako`
- `alembic/versions/0001_initial_schema.py`
- `scripts/__init__.py`
- `scripts/seed.py`
- `tests/__init__.py`
- `tests/conftest.py`
- `tests/test_registration.py`
- `tests/test_checkin.py`
- `tests/test_team_discovery.py`
- `tests/test_judging.py`
- `tests/test_leaderboard.py`
- `tests/test_announcements.py`

## Leaderboard Design

```sql
-- PostgreSQL VIEW (created via Alembic migration)
CREATE VIEW leaderboard AS
SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.event_id,
    s.id AS submission_id,
    s.title AS submission_title,
    COUNT(e.id) AS evaluation_count,
    COALESCE(AVG(e.total_score), 0) AS average_score,
    COALESCE(SUM(e.total_score), 0) AS aggregate_score,
    RANK() OVER (
        PARTITION BY t.event_id
        ORDER BY COALESCE(AVG(e.total_score), 0) DESC
    ) AS rank
FROM teams t
LEFT JOIN submissions s ON s.team_id = t.id AND s.status = 'submitted'
LEFT JOIN evaluations e ON e.submission_id = s.id AND e.status = 'submitted'
WHERE t.event_id = t.event_id  -- always true, filter in query
GROUP BY t.id, t.name, t.event_id, s.id, s.title;
```

## Team Discovery Scoring

```
match_score = 0
For each matching skill:  +2 points
For each matching interest: +3 points
For each compatible role (different from seeker): +1 point
Normalize to 0-100 by dividing by theoretical max
```

## Realtime Integration Plan

When frontend is built, these endpoints will be enhanced:
- `GET /api/events/{id}/checkins` — add SSE streaming variant
- `GET /api/events/{id}/leaderboard` — add SSE streaming variant
- `GET /api/events/{id}/announcements` — add SSE streaming variant

Implementation path: FastAPI `StreamingResponse` with SSE format, or
upgrade to `fastapi-events` + Redis pub/sub if scale requires it.

## Verification Plan

### Automated
- `pytest backend/tests/ -v` — full test suite

### Manual
1. `alembic upgrade head` — migration succeeds
2. `python scripts/seed.py` — seed completes without errors
3. `uvicorn app.main:app --reload` from backend/ — server starts
4. Browse `http://localhost:8000/docs` — Swagger UI loads
5. Test key endpoints via docs UI
