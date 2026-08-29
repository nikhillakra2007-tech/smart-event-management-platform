# Smart Event Management Platform

> A unified, real-time event management system for hackathons, tech fests, and conferences.

## Problem Statement

Organizing large-scale events requires juggling multiple disconnected platforms for registration,
check-in, team formation, judging, and live tracking. This platform consolidates the entire
event lifecycle into a single interactive backend with REST APIs ready for frontend integration.

## Features

| Feature | Status |
|---------|--------|
| Participant Registration + QR Token | ✅ |
| QR-based Attendance Check-in | ✅ |
| Rule-based Team Discovery | ✅ |
| Team Formation | ✅ |
| Project Submission Tracking | ✅ |
| Interactive Judging Portal | ✅ |
| Weighted Scoring with Rubric | ✅ |
| Live Leaderboard (PostgreSQL VIEW) | ✅ |
| Announcement Center | ✅ |
| Event Analytics Dashboard API | ✅ |
| 34 pytest tests (all passing) | ✅ |
| OpenAPI docs at `/docs` | ✅ |

## Roles

- **Participant**: Register → QR check-in → discover teammates → form team → submit project
- **Judge**: View assigned submissions → score using rubric → submit evaluation
- **Organizer**: Manage event → monitor attendance → create announcements → view analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI + Pydantic v2 |
| ORM | SQLAlchemy 2.x |
| Database | PostgreSQL 18 |
| Migrations | Alembic |
| Testing | pytest |
| Runtime | Python 3.11+ |

## Quick Start

```bash
# 1. Clone the repo
git clone <repo_url>
cd smart-event-management-platform

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Configure database
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 4. Create the database
createdb smart_event

# 5. Run migrations
python -m alembic upgrade head

# 6. Seed demo data
python scripts/seed.py

# 7. Start the server
uvicorn app.main:app --reload --port 8000

# 8. Open API docs
# http://localhost:8000/docs
```

## API Documentation

Full OpenAPI documentation available at `http://localhost:8000/docs` when running locally.

Key endpoints:

```
GET  /api/events/{id}/leaderboard     — Live ranked leaderboard
GET  /api/events/{id}/analytics       — Full event analytics
POST /api/checkins/verify             — QR token verification
GET  /api/events/{id}/team-discovery/{user_id} — Teammate discovery
POST /api/evaluations                 — Submit judge evaluation
```

## Testing

```bash
cd backend
pytest tests/ -v
# 34 tests, 0 failures
```

## Project Structure

```
smart-event-management-platform/
├── backend/              # FastAPI application
│   ├── app/             # Application code
│   ├── alembic/         # Database migrations
│   ├── scripts/         # Seed and utility scripts
│   └── tests/           # pytest test suite
├── SPECIFICATION.md     # Full project specification
├── IMPLEMENTATION_PLAN.md # Architecture and design decisions
├── DATABASE.md          # Database setup guide
├── BACKEND.md           # Backend architecture guide
└── README.md            # This file
```

## Demo Data

The seed script creates a complete demo of **HackHive 2026**:
- 46 users (1 organizer + 5 judges + 40 participants)
- 40 registrations with unique QR tokens, 30 check-ins (75% attendance)
- 10 teams: Code Crafters, Tech Titans, Innovators Hub, Binary Builders, Neural Ninjas,
  Debug Dynasty, Pixel Pirates, Data Dynamos, Cloud Crusaders, Stack Surgeons
- 10 project submissions with 13 judge evaluations
- Live leaderboard ranking (Neural Ninjas #1 at 93.58 avg)
- 8 published announcements with 176 view records

## Hackathon Submission

This project is prepared for hackathon submission per the problem statement requirements:
- Participant, Judge, and Organizer workflows fully implemented
- Deterministic rule-based matching (no AI)
- Realtime-ready architecture (SSE integration documented)
- Repository < 10 MB, single branch (main)
