# Backend Architecture — Smart Event Management Platform

## Architecture Overview

```
Client (Browser / API Consumer)
         |
         v
  FastAPI REST API (app/main.py)
         |
         v
  API Routers (app/api/)
         |
         v
  Service Layer (app/services/)
         |
         v
  SQLAlchemy ORM (app/models/)
         |
         v
  PostgreSQL 18
         |
         v
  leaderboard VIEW (auto-updated)
```

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── core/
│   │   ├── config.py            # Settings via pydantic-settings
│   │   └── database.py          # Engine, session, Base, get_db
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── event.py
│   │   ├── user.py              # User + ParticipantProfile
│   │   ├── registration.py      # Registration + CheckIn
│   │   ├── team.py              # Team + TeamMember
│   │   ├── submission.py
│   │   ├── judging.py           # JudgeAssignment, Rubric, Criteria, Evaluation, Score
│   │   └── announcement.py      # Announcement + AnnouncementView
│   ├── schemas/                 # Pydantic v2 request/response models
│   │   ├── event.py
│   │   ├── user.py
│   │   ├── registration.py
│   │   ├── team.py
│   │   ├── submission.py
│   │   ├── judging.py
│   │   ├── announcement.py
│   │   ├── leaderboard.py
│   │   └── analytics.py
│   ├── api/                     # FastAPI routers
│   │   ├── router.py            # Aggregated router (prefix: /api)
│   │   ├── events.py
│   │   ├── registrations.py
│   │   ├── checkins.py
│   │   ├── teams.py
│   │   ├── submissions.py
│   │   ├── judging.py
│   │   ├── announcements.py
│   │   ├── leaderboard.py
│   │   └── analytics.py
│   └── services/                # Business logic layer
│       ├── registration_service.py
│       ├── checkin_service.py
│       ├── team_service.py
│       ├── judging_service.py
│       ├── leaderboard_service.py
│       ├── analytics_service.py
│       └── announcement_service.py
├── alembic/                     # Alembic migration files
│   ├── env.py
│   └── versions/
│       └── 59412317ee8c_initial_schema.py
├── scripts/
│   └── seed.py                  # Deterministic seed script
├── tests/                       # pytest test suite
│   ├── conftest.py
│   ├── test_registration.py
│   ├── test_checkin.py
│   ├── test_team_discovery.py
│   ├── test_judging.py
│   ├── test_leaderboard.py
│   └── test_announcements.py
└── requirements.txt
```

---

## API Endpoints

### Events
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events` | List all events |
| GET | `/api/events/{event_id}` | Get event by ID |
| POST | `/api/events` | Create event |

### Registrations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/registrations` | Register participant (returns QR token) |
| GET | `/api/events/{event_id}/registrations` | List all registrations |

### Check-ins
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/checkins/verify` | Verify QR token → create check-in |
| GET | `/api/events/{event_id}/checkins` | List all check-in statuses |

### Teams
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{event_id}/teams` | List teams |
| POST | `/api/events/{event_id}/teams` | Create team |
| POST | `/api/events/{event_id}/teams/{team_id}/join` | Join team |
| GET | `/api/events/{event_id}/team-discovery/{user_id}` | Rule-based teammate discovery |

### Submissions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{event_id}/submissions` | List submissions |
| GET | `/api/submissions/{submission_id}` | Get submission |

### Judging
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/judges/{judge_id}/assignments` | Judge's assigned submissions |
| GET | `/api/submissions/{submission_id}/rubric` | Get rubric for submission |
| POST | `/api/evaluations` | Submit evaluation with scores |
| GET | `/api/judges/{judge_id}/evaluations` | Judge's evaluation history |

### Announcements
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{event_id}/announcements` | List published announcements |
| GET | `/api/announcements/{announcement_id}` | Get announcement |
| POST | `/api/events/{event_id}/announcements` | Create announcement (draft) |
| POST | `/api/announcements/{announcement_id}/publish` | Publish announcement |
| POST | `/api/announcements/{announcement_id}/view` | Record view (engagement) |

### Leaderboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{event_id}/leaderboard` | Live leaderboard from VIEW |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/events/{event_id}/analytics` | Comprehensive event analytics |

---

## Service Layer Details

### Registration Service
- Generates unique QR tokens (`QR-<UUID_HEX>`)
- Generates sequential registration numbers (`REG-<EVENT_SHORT>-NNNN`)
- Prevents duplicate registration (409 on conflict)
- Validates event and user existence

### Check-in Service (QR Verification)
1. Find registration by `qr_token`
2. Verify token belongs to `event_id`
3. Verify `registration_status == 'confirmed'`
4. Check for existing active check-in (prevent duplicates)
5. Create `CheckIn` record with timestamp

### Team Discovery (Rule-Based Matching)
**Scoring algorithm:**
```
score = (matching_skills × 2 + matching_interests × 3 + compatible_roles × 1)
        / theoretical_max × 100
```
- `matching_skills`: skills present in both seeker and candidate profiles
- `matching_interests`: project interests present in both profiles
- `compatible_roles`: roles the candidate has that the seeker does NOT have
- Normalised to 0-100, sorted descending

Excludes: seeker themselves + users already in a team for this event.

### Judging Service
9-step validation pipeline:
1. Validate judge role
2. Validate submission exists
3. Validate judge assignment
4. Load rubric criteria
5. Validate all criteria scored
6. Validate score ranges (0 to `max_score`)
7. Calculate weighted total: `Σ(score/max_score × weight × 100) / total_weight`
8. Prevent duplicate submitted evaluations
9. Persist atomically (evaluation + scores in one transaction)

### Leaderboard Service
Queries the PostgreSQL `leaderboard` VIEW:
```sql
SELECT team_name, average_score, aggregate_score, evaluation_count, rank
FROM leaderboard
WHERE event_id = :event_id
ORDER BY rank ASC
```
Rankings update automatically when new evaluations are submitted.

### Analytics Service
All metrics derived from existing tables (no analytics-specific tables):
- Registration counts (total, checked-in, percentage)
- Team and submission counts
- Score aggregation and distribution bucketing
- Attendance over time (SQL group by hour)
- Announcement engagement (view counts per announcement)

### Announcement Service
- Draft-first: announcements created in `is_published=False` state
- Explicit publish step: organizer calls `/publish` endpoint
- Participant/judge feeds filter to `is_published=True` only
- View tracking: idempotent (`ON CONFLICT DO NOTHING` equivalent)

---

## Leaderboard VIEW

```sql
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
```

---

## Realtime Integration Plan

The backend is designed for easy realtime integration. Key events to propagate:

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `checkin.created` | POST /api/checkins/verify | Organizer attendance dashboard |
| `announcement.published` | POST /api/announcements/{id}/publish | Participant/judge feeds |
| `evaluation.submitted` | POST /api/evaluations | Leaderboard, organizer analytics |
| `leaderboard.updated` | After evaluation submitted | All participant views |

**Implementation path (Phase 2):**
1. Add `fastapi-events` or custom EventBus
2. Emit events from service layer after successful mutations
3. Create SSE endpoint: `GET /api/events/{event_id}/stream`
4. Frontend subscribes via `EventSource` API

No WebSocket server needed for basic realtime — SSE (Server-Sent Events) is sufficient
for one-directional leaderboard/announcement updates.

---

## Running the Backend

```bash
cd backend

# Development server (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API documentation
open http://localhost:8000/docs     # Swagger UI
open http://localhost:8000/redoc    # ReDoc

# Health check
curl http://localhost:8000/health

# Run tests
pytest tests/ -v
```
