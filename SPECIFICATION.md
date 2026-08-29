# Smart Event Management Platform — Specification

## Problem

Organizing large-scale events (hackathons, tech fests, conferences) requires juggling multiple
disconnected platforms for registration, attendee verification, team formation, announcements,
judging and live tracking. This creates friction, data silos, and poor participant experience.

**Goal:** Build a unified, real-time Smart Event Management Platform that consolidates the
end-to-end event lifecycle into a single interactive dashboard.

---

## Users & Roles

| Role | Description |
|------|-------------|
| **Participant** | Registers for an event, forms a team, submits a project |
| **Judge** | Evaluates submissions against a rubric, submits scores and feedback |
| **Organizer** | Creates/manages events, oversees registrations, teams, judging, and analytics |

---

## Core User Journeys

### Participant Journey
1. Register for an event → receive unique QR token
2. Check in on-site / virtually via QR token
3. Create or discover teams (rule-based matchmaking on skills/roles/interests)
4. Join a team and submit a project
5. View announcements and schedule updates
6. View live leaderboard after judging begins

### Judge Journey
1. Log in and view assigned submissions
2. Open a submission, review rubric criteria
3. Enter criterion scores and free-text feedback
4. Submit evaluation
5. View evaluation history

### Organizer Journey
1. Create and manage events
2. Monitor registrations and attendance (check-in analytics)
3. Manage teams and view submissions
4. Create and publish announcements (general, schedule, venue, critical)
5. Assign judges to submissions
6. Monitor judging progress
7. View live leaderboard and engagement analytics

---

## Functional Requirements

### FR-1: Registration & Attendee Check-in
- FR-1.1: Participants can register for an event (one registration per user per event)
- FR-1.2: Each registration generates a unique QR token and registration number
- FR-1.3: QR token can be verified on-site or virtually to create a check-in record
- FR-1.4: Duplicate active check-ins are prevented
- FR-1.5: Organizer can view all registrations and check-in status
- FR-1.6: Check-in timestamps are recorded for attendance-over-time analytics

### FR-2: Smart Team Formation
- FR-2.1: Participant profiles store skills, preferred roles, and project interests
- FR-2.2: Rule-based teammate discovery compares profiles and returns match scores
- FR-2.3: Participants can create teams within an event
- FR-2.4: Participants can join existing teams (one team per event)
- FR-2.5: Teams have a project interest that influences discovery

### FR-3: Broadcast & Announcement Center
- FR-3.1: Organizers can create announcements with types: general, schedule, venue, critical
- FR-3.2: Announcements are published explicitly (draft -> published)
- FR-3.3: Only published announcements appear in participant/judge feeds
- FR-3.4: Announcement view events are recorded for engagement analytics

### FR-4: Interactive Judging Portal
- FR-4.1: Judges are assigned to specific submissions
- FR-4.2: Rubric with weighted criteria is defined per event (database records)
- FR-4.3: Judge submits criterion scores and feedback per evaluation
- FR-4.4: Score range is validated against rubric max_score per criterion
- FR-4.5: Total score is calculated from criterion scores and weights
- FR-4.6: A judge cannot evaluate a submission they are not assigned to
- FR-4.7: A judge cannot submit duplicate final evaluations for the same submission

### FR-5: Live Leaderboard & Analytics
- FR-5.1: Leaderboard is calculated from evaluation data (no separate table)
- FR-5.2: Leaderboard shows team rank, aggregate score, average score, evaluation count
- FR-5.3: Leaderboard reflects newly submitted evaluations immediately
- FR-5.4: Analytics endpoint returns: total registrations, check-in count/%, teams, submissions,
           average score, score distribution, attendance over time, announcement views

---

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Database** | PostgreSQL with UUID primary keys, proper FK constraints and indexes |
| **ORM** | SQLAlchemy 2.x with declarative models |
| **Migrations** | Alembic; all schema changes via migration files |
| **API** | FastAPI with Pydantic v2 request/response models |
| **Testing** | pytest test suite covering core business logic |
| **Realtime-ready** | Backend designed for future WebSocket/SSE integration |
| **No AI** | All logic is deterministic; no external AI/ML services |
| **Repo size** | < 10 MB; no secrets committed |
| **Single branch** | main only |

---

## Data Requirements

Core entities: Event, User, ParticipantProfile, Registration, CheckIn, Team, TeamMember,
Submission, JudgeAssignment, Rubric, RubricCriteria, Evaluation, EvaluationScore,
Announcement, AnnouncementView.

Key constraints:
- User email unique
- QR token unique globally
- Registration number unique within event
- One registration per user per event
- One active check-in per registration
- One team membership per user per event
- One final evaluation per judge per submission
- Criterion scores validated against rubric max_score

---

## Realtime Requirements

Events requiring realtime propagation (future phase):
- checkin.created -> update attendance dashboard
- announcement.published -> notify participant/judge feeds
- evaluation.submitted -> trigger leaderboard recalculation
- leaderboard.updated -> push to participant views

**Current phase:** Backend data is immediately queryable after each mutation. Realtime
delivery to be implemented via Server-Sent Events (SSE) or WebSocket in the frontend phase.

---

## Success Criteria

- All database tables created via Alembic migration
- Seed script populates a complete demo event with realistic data
- All API endpoints return correct responses
- Leaderboard correctly ranks teams from evaluation data
- Analytics correctly aggregates from existing tables
- Team discovery returns scored, sorted matches
- QR verification correctly handles valid, invalid, and duplicate cases
- pytest suite passes all defined test cases
- API documentation available at /docs

---

## Out of Scope (This Phase)

- Frontend / UI (planned for next phase)
- Authentication / JWT (demo uses user IDs directly)
- Camera-based QR scanning
- Email notifications
- Payment processing
- AI/ML features of any kind
- WebSocket/SSE realtime delivery (architecture documented, not implemented)
- Production deployment / Docker / CI-CD
- Multi-tenancy beyond multiple events
