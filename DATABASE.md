# Database Setup — Smart Event Management Platform

## Overview

The platform uses **PostgreSQL 18** as the primary database, accessed via **SQLAlchemy 2.x ORM**
and managed with **Alembic** migrations. All primary keys are UUIDs.

---

## Prerequisites

- PostgreSQL 16+ installed and running
- Python 3.11+ with pip

---

## Database Creation

```bash
# Connect to PostgreSQL as superuser
psql -U postgres -h localhost

# Create the application database
CREATE DATABASE smart_event ENCODING 'UTF8';

# Optional: create a dedicated user
CREATE USER event_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE smart_event TO event_user;
\q
```

---

## Environment Configuration

Copy `.env.example` to `backend/.env` and update:

```env
DATABASE_URL=postgresql+psycopg://postgres:your_password@127.0.0.1:5432/smart_event
APP_ENV=development
APP_DEBUG=true
SECRET_KEY=change-this-in-production
```

> **Never commit `.env`** — it is in `.gitignore`.

---

## Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## Run Migrations

```bash
cd backend
python -m alembic upgrade head
```

Expected output: `Running upgrade -> 59412317ee8c, initial_schema`

### Check Migration Status

```bash
python -m alembic current
python -m alembic history
```

### Rollback Migration

```bash
python -m alembic downgrade -1
```

---

## Seed Data

```bash
cd backend
PYTHONIOENCODING=utf-8 python scripts/seed.py
```

This creates:
- **1 event**: HackHive 2026
- **1 organizer**: Alex Rivera
- **5 judges**: Dr. Priya Sharma, Marcus Chen, Dr. Fatima Al-Hassan, James Okafor, Dr. Sofia Petrov
- **40 participants** with full profiles (skills, roles, interests)
- **40 registrations** (all confirmed, with unique QR tokens)
- **30 check-ins** (~75% attendance)
- **10 teams** (Code Crafters, Tech Titans, Innovators Hub, Binary Builders, Neural Ninjas, Debug Dynasty, Pixel Pirates, Data Dynamos, Cloud Crusaders, Stack Surgeons)
- **10 submissions** (one per team)
- **1 rubric** with 4 criteria (Innovation, Technical Implementation, Impact, Presentation)
- **13 evaluations** with criterion scores
- **8 announcements** (general, schedule, venue, critical)
- **176 announcement views**

The script is **safely rerunnable** — clears all data before inserting.

---

## Database Tables

| Table | Description |
|-------|-------------|
| `events` | Hackathons, tech fests, conferences |
| `users` | All users (participants, judges, organizers) |
| `participant_profiles` | Extended profiles with skills/roles/interests (PostgreSQL ARRAY) |
| `registrations` | Event registrations with unique QR tokens |
| `checkins` | Attendance check-in records |
| `teams` | Teams within events |
| `team_members` | Team membership records |
| `submissions` | Project submissions per team |
| `judge_assignments` | Judge-to-submission assignments |
| `rubrics` | Judging rubrics per event |
| `rubric_criteria` | Individual scoring criteria (Innovation, Tech, Impact, Presentation) |
| `evaluations` | Judge evaluations with total score |
| `evaluation_scores` | Per-criterion scores within an evaluation |
| `announcements` | Event announcements (draft/published) |
| `announcement_views` | Engagement tracking records |

**View:** `leaderboard` — live ranking calculated from evaluations

---

## Verify Database

```bash
# Connect and list tables
psql -U postgres -d smart_event -c "\dt"

# Check leaderboard view
psql -U postgres -d smart_event -c "SELECT team_name, average_score, rank FROM leaderboard ORDER BY rank LIMIT 5;"

# Check registrations
psql -U postgres -d smart_event -c "SELECT COUNT(*) FROM registrations;"
```

---

## Useful Queries

```sql
-- Live leaderboard for event
SELECT team_name, submission_title, evaluation_count, average_score, rank
FROM leaderboard
WHERE event_id = 'aaaaaaaa-0000-0000-0000-000000000001'
ORDER BY rank;

-- Check-in rate
SELECT
    COUNT(*) AS total_registrations,
    COUNT(ci.id) AS checked_in,
    ROUND(COUNT(ci.id) * 100.0 / COUNT(*), 2) AS check_in_pct
FROM registrations r
LEFT JOIN checkins ci ON ci.registration_id = r.id AND ci.status = 'active';

-- Score distribution
SELECT
    CASE
        WHEN total_score < 20 THEN '0-20'
        WHEN total_score < 40 THEN '20-40'
        WHEN total_score < 60 THEN '40-60'
        WHEN total_score < 80 THEN '60-80'
        ELSE '80-100'
    END AS range,
    COUNT(*) AS count
FROM evaluations WHERE status = 'submitted'
GROUP BY 1 ORDER BY 1;
```
