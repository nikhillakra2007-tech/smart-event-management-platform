# Smart Event Management Platform — Specification

## Problem

Organizing large-scale events (hackathons, tech fests, conferences) requires juggling multiple disconnected platforms for registration, attendee verification, team formation, announcements, judging and live tracking. This creates friction, data silos, and poor participant experience.

**Goal:** Build a unified, real-time Smart Event Management Platform that consolidates the end-to-end event lifecycle into a single interactive dark-mode command center.

---

## Users & Roles

| Role | Description | Key Views & Actions |
|------|-------------|---------------------|
| **Organizer** | Creates/manages events, oversees registrations, teams, judging, announcements, and analytics | Command Center Dashboard, Check-in Monitor, Team/Submission Oversight, Announcement Center, Live Leaderboard, Full Analytics, **Event Creation** |
| **Participant** | Registers for an event, check-in QR badge, forms a team, submits a project | Personal Hub, My Registration & QR Badge, Rule-based Team Discovery, My Team, Project Submission, Announcements Feed |
| **Judge** | Evaluates submissions against a rubric, submits scores and feedback | Judge Portal, Assigned Submissions, Interactive Rubric Scoring Form, Scoring History |

---

## Core User Journeys

### 1. Participant Journey
1. **Registration & QR Badge**: View confirmed registration with unique QR token and badge.
2. **Check-in**: Present QR token at verification station (or self-verify via token) to activate attendance.
3. **Smart Team Discovery**: Browse candidates scored via rule-based algorithm on overlapping skills, project interests, and compatible roles.
4. **Team Formation**: Create a new team or join an existing team.
5. **Project Submission**: Submit repository URL, demo URL, title, and description.
6. **Announcements**: Read real-time broadcast announcements (general, schedule, venue, critical).
7. **Live Leaderboard**: View live standings once evaluations start rolling in.

### 2. Judge Journey
1. **Assignments**: View all submissions assigned to this judge.
2. **Review & Scoring**: Inspect submission details, repository, and live demo link.
3. **Rubric Evaluation**: Score each criterion against defined `max_score` with weighted multipliers.
4. **Feedback Submission**: Write qualitative feedback and submit final evaluation atomically.
5. **Score Verification**: Confirm total score is calculated deterministically and reflected on the leaderboard.

### 3. Organizer Journey
1. **Command Center**: View real-time key metrics (Registrations, Check-in %, Teams Formed, Submissions, Judging Progress).
2. **Attendance Management**: Monitor live check-ins and verify attendee QR tokens in real time.
3. **Team & Submission Oversight**: Track all teams, member counts, and project submissions.
4. **Announcements Management**: Compose, draft, and publish announcements with priority tags.
5. **Judging Progress**: Track completed vs pending evaluations per judge/submission.
6. **Leaderboard**: Watch live team standings calculated dynamically from PostgreSQL VIEW.
7. **Deep Analytics**: Inspect attendance hourly curve, score distribution histograms, and announcement engagement.
8. **Event Creation**: Create new events with name, description, venue, start/end times, and status.

---

## Authentication & Authorization Requirements

### Current State (Pre-Implementation)
- **No authentication exists**. The frontend uses a "Demo Role Switcher" that simulates role switching by fetching all users from the backend and allowing manual persona selection.
- **No login page**, no password handling, no JWT tokens, no session management.
- **Backend API endpoints are all public** — no authorization checks.
- **Frontend routes are not protected** — users can access any dashboard by manually changing the URL.

### Required Authentication Flow

```
Login Page
    ↓
POST /api/auth/login { email, password }
    ↓
Backend validates credentials (bcrypt password hash)
    ↓
JWT generated with claims: { sub: user_id, role: user_role, exp: timestamp }
    ↓
Frontend stores JWT securely (HttpOnly cookie or memory + localStorage for refresh)
    ↓
Protected API requests send Bearer token: Authorization: Bearer <jwt>
    ↓
Backend validates JWT signature, expiry, extracts user_id + role
    ↓
Role-based authorization dependency checks required role
    ↓
User accesses only permitted resources
```

### Functional Requirements — Authentication

| ID | Requirement |
|----|-------------|
| **AUTH-1** | User login endpoint `POST /api/auth/login` accepting email + password |
| **AUTH-2** | Password hashing using bcrypt (cost factor ≥ 12) |
| **AUTH-3** | JWT access token generation (RS256 or HS256 with strong secret) |
| **AUTH-4** | JWT payload: `sub` (user_id), `role` (organizer/participant/judge), `exp` (15-30 min), `iat` |
| **AUTH-5** | Refresh token mechanism (optional but recommended: HttpOnly cookie, 7-day expiry) |
| **AUTH-6** | Token validation middleware/dependency for protected routes |
| **AUTH-7** | Role-based authorization dependency: `require_organizer`, `require_participant`, `require_judge`, `require_any_role` |
| **AUTH-8** | Logout endpoint `POST /api/auth/logout` (invalidates refresh token if used) |
| **AUTH-9** | Current user endpoint `GET /api/auth/me` returns authenticated user + role |
| **AUTH-10** | Frontend login page matching existing dark command-center visual design |
| **AUTH-11** | Protected frontend routes — redirect to login if unauthenticated |
| **AUTH-12** | Role-aware navigation — only show links for authenticated user's role |
| **AUTH-13** | Automatic redirect to correct dashboard after login based on role |
| **AUTH-14** | Invalid/expired token handling — redirect to login with message |
| **AUTH-15** | Demo seed users must have passwords set for demonstration |

### Non-Functional Requirements — Authentication

| ID | Requirement |
|----|-------------|
| **AUTH-NF-1** | JWT secret MUST be configurable via environment variable (`JWT_SECRET_KEY`), never hardcoded |
| **AUTH-NF-2** | Password hashes MUST never be exposed in API responses |
| **AUTH-NF-3** | Tokens MUST expire (access: 15-30 min, refresh: 7 days) |
| **AUTH-NF-4** | CORS must be restricted in production (currently `allow_origins=["*"]` for dev) |
| **AUTH-NF-5** | HTTPS required in production for secure cookie transmission |
| **AUTH-NF-6** | Rate limiting on login endpoint (e.g., 5 attempts/minute per IP) |

---

## Multi-Event Creation Requirements

### Current State
- **Event model already supports multiple events** (name, description, venue, start_time, end_time, status)
- **All data is event-scoped** via `event_id` foreign keys (registrations, teams, submissions, rubrics, announcements, check-ins)
- **HackHive 2026** is pre-seeded as the demo event
- **POST /api/events** endpoint already exists for creating events
- **Frontend has EventContext** with event selector dropdown in Topbar

### Required Multi-Event Features

| ID | Requirement |
|----|-------------|
| **MULTI-1** | Organizer-only "Add Event" button in Organizer navigation/top-left area |
| **MULTI-2** | Event creation modal/form with fields: name (required), description, venue, start_time, end_time, status (default: draft) |
| **MULTI-3** | Form submits to `POST /api/events` with proper validation |
| **MULTI-4** | New event appears in Event selector dropdown for all roles |
| **MULTI-5** | Event-specific data isolation: registrations, check-ins, teams, submissions, evaluations, announcements, leaderboard, analytics MUST remain associated with correct event |
| **MULTI-6** | HackHive 2026 seed data MUST remain intact and functional |
| **MULTI-7** | Organizer can switch between events and see only that event's data |
| **MULTI-8** | Participants/Judges can only access data for events they're registered/assigned to (future enhancement: for now, event selector shows all events) |
| **MULTI-9** | If schema changes needed, create proper Alembic migration |

---

## Performance Optimization Requirements

### Current State
- Frontend uses `useLivePolling` hook (6-second interval) for leaderboard, check-ins, announcements, judging
- Backend uses SQLAlchemy with synchronous sessions
- Some endpoints may have N+1 query issues (e.g., team member loading, evaluation loading)
- No database indexes beyond those in initial migration
- No pagination on list endpoints
- Frontend re-renders may not be optimized (no React.memo, useMemo, useCallback in all places)

### Required Performance Optimizations

| ID | Requirement |
|----|-------------|
| **PERF-1** | Identify actual bottlenecks via profiling before optimizing |
| **PERF-2** | Eliminate duplicate API calls (e.g., same data fetched by multiple components) |
| **PERF-3** | Fix N+1 queries using SQLAlchemy `joinedload`/`selectinload` |
| **PERF-4** | Add database indexes where justified by query patterns |
| **PERF-5** | Implement pagination on list endpoints (registrations, teams, submissions, announcements) |
| **PERF-6** | Optimize expensive queries (leaderboard view, analytics) |
| **PERF-7** | Reduce unnecessary frontend re-renders (React.memo, useMemo, useCallback where beneficial) |
| **PERF-8** | Lazy-load non-critical sections (analytics charts, announcement history) |
| **PERF-9** | Avoid unnecessarily large API responses (select only needed fields) |
| **PERF-10** | Improve dashboard loading time (parallel data fetching, skeleton screens) |
| **PERF-11** | Cache safe read-heavy data where appropriate (event list, rubric criteria) |
| **PERF-12** | Optimize live polling — reduce frequency or use conditional fetching |

---

## Frontend Architecture & UX Design (Preserved)

### Visual Language: Dark Command Center
- **Backgrounds**: Deep obsidian (`#090d16`, `#0f172a`), slate card surfaces (`#1e293b`)
- **Borders & Dividers**: Subtle borders (`rgba(255, 255, 255, 0.08)`)
- **Accents**:
  - Emerald (`#10b981`): Success, verified check-in, active state
  - Cyan / Indigo (`#06b6d4`, `#6366f1`): Primary actions, active navigation, matching metrics
  - Amber (`#f59e0b`): Warning, pending evaluations, schedule alerts
  - Rose (`#f43f5e`): Critical broadcasts, errors, cancellations
- **Typography**: Inter / Outfit sans-serif with strong hierarchy and high contrast ratios

### Layout & Navigation Structure (Unchanged)
```
+-------------------------------------------------------------------------+
| Topbar: [Logo & Event Name] [Live Status: Connected] [Role Badge] [User Menu] |
+-------------------------------------------------------------------------+
| Sidebar        | Main Content Area                                      |
| - Organizer    |  - Metric KPI Cards (Registrations, Checkins, Teams...) |
| - Participant  |  - Two-Column Command View / Focused Workspace         |
| - Judge        |  - Interactive Data Grids & Action Forms               |
| - Live Monitor |  - Live Visual Charts & Status Badges                  |
+-------------------------------------------------------------------------+
```

### Route Map (Extended with Login)
| Route | Role / Section | Purpose |
|-------|----------------|---------|
| `/login` | Public | Login page (new) |
| `/` | Redirect | Default to role-appropriate dashboard |
| `/organizer` | Organizer | Command Center |
| `/organizer/checkins` | Organizer | QR Check-in Station & Attendee Verification |
| `/organizer/teams` | Organizer | Teams & Submissions Oversight |
| `/organizer/announcements` | Organizer | Broadcast Studio |
| `/organizer/judging` | Organizer | Judging Matrix & Evaluator Progress |
| `/organizer/leaderboard` | Organizer | Full Live Leaderboard Rankings |
| `/organizer/analytics` | Organizer | Deep Analytics |
| `/participant` | Participant | Participant Hub |
| `/participant/badge` | Participant | My Registration & QR Badge Pass |
| `/participant/checkin` | Participant | Self-Check-in Verification Simulator |
| `/participant/discovery` | Participant | Smart Teammate Discovery |
| `/participant/team` | Participant | My Team & Join/Create Workspace |
| `/participant/submission` | Participant | Project Submission Form |
| `/participant/announcements` | Participant | Broadcast Bulletin (Published only) |
| `/judge` | Judge | Judge Command Portal |
| `/judge/evaluate/:submissionId` | Judge | Interactive Rubric Scoring Form |
| `/judge/history` | Judge | Submitted Evaluations & Feedback History |

---

## Technical Constraints & Standards

- **No AI/LLMs**: 100% deterministic logic.
- **Single Monorepo**: Frontend in `frontend/`, backend in `backend/`.
- **FastAPI + PostgreSQL Backend**: Verified and running as source of truth.
- **React + Vite + TypeScript**: Type-safe client architecture.
- **Zero Mock Fallbacks for Live Features**: All numbers and tables load from backend REST endpoints.
- **Lightweight Polling**: Real-time updates without heavy socket infrastructure.
- **Alembic** manages database schema migrations — DO NOT manually edit production database tables.
- **Environment variables** for all secrets (JWT_SECRET_KEY, DATABASE_URL, etc.)
- **Preserve existing architecture**: React/Vite → FastAPI → SQLAlchemy → PostgreSQL/Neon

---

## Security Requirements

- Never hardcode: passwords, JWT secret, database credentials, API keys, private credentials
- Use environment variables for all secrets
- Do not commit secrets to repository
- Review and restrict CORS for production
- Ensure authentication works locally and in deployment (Vercel + Render + Neon)
- Use secure password hashing (bcrypt, cost ≥ 12)
- Do not expose password hashes or sensitive credentials through API responses
- JWT tokens must be validated on every protected request
- Role authorization enforced at API level, not just frontend

---

## Data and Implementation Notes

- The engine accepts missing signals and unknown input columns; preserve that behavior when extending ingestion.
- `bp_systolic` is supported by the engine and detector pipeline but is not part of the dashboard's core vital cards.
- Data files in `data/` include both CSV and JSONL representations of demo patients; `data/README.md` documents the larger CardioGuard synthetic table.
- The app-level `.gitignore` excludes `.env`, virtual environments, Python caches, and large local datasets. Avoid treating generated caches or local environment files as source changes.

---

## Acceptance Criteria

### Authentication
- [ ] Valid Organizer login → redirects to `/organizer`
- [ ] Valid Participant login → redirects to `/participant`
- [ ] Valid Judge login → redirects to `/judge`
- [ ] Invalid credentials → shows error message on login page
- [ ] Unauthenticated access to protected route → redirects to `/login`
- [ ] Expired/invalid JWT → redirects to `/login` with session expired message
- [ ] Logout → clears session, redirects to `/login`
- [ ] Organizer CANNOT access Participant/Judge protected API endpoints
- [ ] Participant CANNOT access Organizer/Judge protected API endpoints
- [ ] Judge CANNOT access Organizer/Participant protected API endpoints

### Multi-Event
- [ ] HackHive 2026 still exists and works exactly as before
- [ ] Existing seeded data (users, registrations, teams, submissions, evaluations, announcements, check-ins) unchanged
- [ ] Organizer can create a new event via "Add Event" UI
- [ ] New event is persisted in database
- [ ] New event appears in Event selector dropdown
- [ ] Event-specific records remain isolated (no data mixing between events)
- [ ] Leaderboard data does not mix between events
- [ ] Teams/submissions/evaluations remain associated with correct event

### Existing Features (Regression)
- [ ] Organizer Dashboard loads with correct KPIs
- [ ] Check-in Monitor works (QR verification, attendee table)
- [ ] QR Badge displays correctly for participants
- [ ] QR Check-in verification works
- [ ] Teams & Team Discovery work
- [ ] Team Matcher works
- [ ] Project Submissions work
- [ ] Announcements (create, draft, publish, view) work
- [ ] Judging Oversight works
- [ ] Judge Evaluation (rubric scoring) works
- [ ] Scoring History works
- [ ] Live Leaderboard updates in real-time
- [ ] Analytics Dashboard loads charts correctly
- [ ] Participant Hub works

### Performance
- [ ] No obvious N+1 database queries in backend logs
- [ ] Dashboard loads within acceptable time (< 2s for typical data)
- [ ] No duplicate API calls visible in Network tab
- [ ] No unnecessary frontend re-renders (React DevTools Profiler)
- [ ] No functionality removed or simplified

### Build & Deployment
- [ ] Backend tests pass (pytest)
- [ ] Frontend TypeScript compilation passes (`tsc -b`)
- [ ] Frontend production build succeeds (`npm run build`)
- [ ] Database migrations apply cleanly (`alembic upgrade head`)
- [ ] Backend starts without errors
- [ ] Application runs locally end-to-end

---

## Follow-up Requirements (Phase 2)

### A. Organizer Event Switching (Complete Workflow)
**User Story:** As authenticated Organizer, I click `[ HackHive 2026 ▼ ]` top-left, see all authorized events, active highlighted, select another, context updates, stay in same dashboard section, data reloads event-scoped.

**FR-EV-1:** Selector lists all events via `GET /api/events` (auth required).
**FR-EV-2:** Active event ID persisted in `EventContext` (`currentEvent`), `setCurrentEvent` triggers reload.
**FR-EV-3:** All organizer pages (`registrations`, `checkins`, `teams`, `submissions`, `announcements?all=true`, `judging`, `leaderboard`, `analytics`) query by `currentEvent.id`.
**FR-EV-4:** Adding event `POST /api/events` (organizer only) persists via SQLAlchemy, `refreshEvents` repopulates selector, auto-select optional.
**FR-EV-5:** No data mixing: Event A 10 teams, Event B 0 teams — switching shows 0.

**NFR-EV:** No duplicate `GET /events` on switch; only load new event’s data.

### B. Complete Registration → QR → Check-in Workflow
**Generic — applies to ANY participant, not Arjun-specific.**

**FR-REG-1:** `POST /api/registrations` `{event_id, user_id}` (participant, self only) creates `Registration` with `event_id`, `user_id`, `registration_number` (`REG-<short>-<seq>`), `qr_token` (`QR-<UUID>`) via `registration_service.py:15`, status `confirmed`.
**FR-REG-2:** Every successful registration has unique `qr_token` (unique index `registrations_qr_token`).
**FR-QR-1:** Participant `My Pass / QR Badge` retrieves own registration for active event — NOT via organizer-only `GET /events/{id}/registrations`. New endpoint `GET /events/{id}/my-registration` returns own record.
**FR-QR-2:** Badge displays participant identity, event, registration, QR SVG, token slice.
**FR-CHK-1:** Organizer `Check-in Monitor` `POST /api/checkins/verify` `{event_id, qr_token, checked_in_by}` validates token exists, `registration.event_id == event_id` (`checkin_service.py:43`), status confirmed, no active check-in, then creates `CheckIn` persisted.
**FR-CHK-2:** Event-safe: token for Event A rejected when Organizer views Event B (400).
**FR-CHK-3:** After check-in, organizer sees `Active Check-in`, participant sees checked-in badge, analytics `checked_in_count` increments.

**Security:** Registration creation self-only; check-in verify any authenticated but participant limited; QR not expose sensitive.

### C. Judge Pending Evaluation Demo
**FR-JDG-1:** Seed leaves one assignment pending: Judge Priya Sharma 3 assignments, 2 evaluated, 1 pending (remove one `EVALUATION_SCORES_MATRIX` entry).
**FR-JDG-2:** `GET /judges/{id}/assignments` vs `GET /judges/{id}/evaluations` diff drives Pending Review badge.
**FR-JDG-3:** Opening pending → `GET /submissions/{id}/rubric` → edit scores → `POST /evaluations` persists, calculates weighted total, status `Evaluated`, history and leaderboard update.

### Acceptance Criteria (Phase 2)
- [ ] Organizer selector shows all events, active highlighted, switch updates data without page reload, stays in section.
- [ ] Event A teams 10, Event B 0 — switching shows correct counts; no mixing for registrations/checkins/announcements/leaderboard/analytics.
- [ ] New participant `POST /registrations` → 201, `qr_token` unique, persisted.
- [ ] New participant My Pass Badge displays QR (not "No Registration Found") for active event.
- [ ] Organizer verify valid QR for active event → success, persisted CheckIn, duplicate → 409, wrong event → 400, invalid → 404.
- [ ] Participant after check-in shows Checked In, organizer monitor shows Active.
- [ ] Judge Portal shows 3 assignments, 1 Pending Review, 2 Evaluated; pending rubric submit → Evaluated, history + leaderboard reflect.