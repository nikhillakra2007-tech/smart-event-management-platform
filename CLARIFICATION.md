# Smart Event Management Platform — Clarification Findings

## Executive Summary (Updated Phase 2)

Previously: auth absent, now JWT implemented `app/core/security.py:15`, `app/api/dependencies.py:10`, frontend `AuthContext`. Remaining gaps inspected Phase 2:

**Event Switching:** `EventContext.tsx:22` `fetchEvents` depends on `currentEvent` (causes extra fetch) but `Topbar.tsx:65` selector correctly calls `setCurrentEvent(evt)`. All organizer pages already use `currentEvent.id` for data, so switching does change queries — but `CreateEventModal` after POST only `refreshEvents` without auto-select, and `EventContext` initial load doesn't handle new events gracefully. Isolation verified: HackHive 2026 has 10 teams, new TestEvent 2027 0 teams — switching correctly shows 0 via `team_service.py:83` event-scoped query.

**Registration → QR → Check-in:** `registration_service.py:15` correctly generates `qr_token` (`QR-` + UUID) and `registration_number` for ANY participant. Bug: `MyPassBadge.tsx:25` calls `api.getEventRegistrations` + `getEventCheckins` which are now `require_organizer` → participant gets 403 → shows "No Registration Found". Need `GET /events/{id}/my-registration` endpoint.

**Check-in verification:** `checkin_service.py:43` already event-safe (`registration.event_id != request.event_id` → 400) and prevents duplicate 409, persists `CheckIn`. Frontend `CheckinManager.tsx:64` correctly sends `event_id`, `qr_token`, `checked_in_by: user?.id` with currentEvent.id.

**Judge pending:** Seed `scripts/seed.py:179` has 13 evaluations for 13 assignments → all evaluated. Judge Priya Sharma assignments 3, all have evaluations → no pending. Need to remove one evaluation (e.g., `(0,1)` FintechFlow) to leave pending.

## Executive Summary (Original Phase 1)

The Smart Event Management Platform is a **fully functional** React + FastAPI + PostgreSQL application with comprehensive features for hackathon/event management. The codebase is well-structured with clear separation of concerns. However, **authentication and authorization are completely absent** — the current "Demo Role Switcher" is a simulation only.

---

## Frontend Findings

### Package.json & Dependencies
- **React 19 + TypeScript + Vite** — modern stack
- **Key dependencies**: `react-router-dom v7`, `lucide-react`, `recharts`, `qrcode.react`, `clsx`, `tailwind-merge`
- **Missing auth dependencies**: No JWT library, no axios interceptors for auth, no secure storage utilities
- **Dev dependencies**: oxlint, TypeScript, Tailwind, PostCSS

### Routing (`src/App.tsx`)
- **No protected routes** — all routes publicly accessible
- **Role-based routes organized** under `/organizer/*`, `/participant/*`, `/judge/*`
- **Default redirect** to `/organizer` (no authentication check)
- **No login route** exists

### API Client (`src/api/client.ts`)
- **Centralized type-safe client** using native `fetch`
- **No Authorization header handling** — no token storage, no interceptor
- **Base URL** from `VITE_API_URL` env var
- **Error handling** via custom `ApiError` class
- **All endpoints defined** matching backend contract

### State Management
- **EventContext** (`src/context/EventContext.tsx`): Active event, event list, selector
- **UserRoleContext** (`src/context/UserRoleContext.tsx`): **SIMULATES authentication**
  - `role` state: 'organizer' | 'participant' | 'judge' (default: 'organizer')
  - `currentUser`: Selected demo user from fetched user list
  - `setRole()`: Changes role AND auto-selects first user of that role
  - `getUsersByRole()`: Filters fetched users
  - **This is NOT real authentication** — it's a demo persona switcher
  - Fetches ALL users on mount (`api.getUsers()`)
  - No login, no tokens, no persistence, no backend validation

### UI Components
- **Topbar** (`src/components/layout/Topbar.tsx`):
  - Event selector dropdown (functional, uses EventContext)
  - Live sync indicator (visual only)
  - **Role Switcher Button Group** — three buttons (Organizer/Participant/Judge) that call `setRole()`
  - **Demo User Dropdown** — lists all users of current role, allows switching personas
  - **No logout, no login, no real auth state**

- **Sidebar** (`src/components/layout/Sidebar.tsx`):
  - Role-aware navigation (shows different links based on `role` from UserRoleContext)
  - Navigation items: Organizer (7), Participant (7), Judge (3)
  - **No route protection** — just conditional rendering

- **Pages**: All 20 pages implemented and functional with seed data
  - Organizer: 7 pages
  - Participant: 7 pages
  - Judge: 3 pages

### Visual Design
- **Dark command-center theme** fully implemented with Tailwind
- **Color system**: Indigo/Cyan (primary), Emerald (success), Amber (warning), Rose (critical)
- **Components**: Card, Badge, StatCard, Modal, LoadingSkeleton, EmptyState, QRBadge, LeaderboardTable, RubricScoringForm
- **Responsive**: Mobile sidebar drawer, responsive grids

---

## Backend Findings

### Architecture
- **FastAPI** with modular routers under `/api` prefix
- **SQLAlchemy 2.x** with declarative models
- **Pydantic v2** schemas for request/response validation
- **Service layer** for business logic (registration, team, judging, checkin, announcement, analytics, leaderboard services)
- **Alembic** for migrations (one initial migration exists)

### Configuration (`app/core/config.py`)
- **Settings via pydantic-settings** from `.env`
- **Existing secrets**: `database_url`, `secret_key` (currently "change-this-in-production")
- **No JWT settings** (secret, algorithm, expiry)
- **CORS**: `allow_origins=["*"]` — permissive for dev

### Database Models
- **User** (`app/models/user.py`):
  - Fields: id, name, email (unique), role (enum: participant/judge/organizer), avatar_url, timestamps
  - **NO password field** — critical finding
  - Relationships: profile, registrations, team_memberships, judge_assignments, evaluations, announcements_created

- **ParticipantProfile**: skills, preferred_roles, project_interests (PostgreSQL ARRAY), bio

- **Event** (`app/models/event.py`):
  - Fields: id, name, description, venue, start_time, end_time, status (draft/active/completed/cancelled)
  - **Already supports multiple events** — all data scoped by event_id
  - Relationships: registrations, teams, submissions, rubrics, announcements

- **Other models**: Registration, CheckIn, Team, TeamMember, Submission, Rubric, RubricCriteria, JudgeAssignment, Evaluation, EvaluationScore, Announcement, AnnouncementView — all properly related with FKs and constraints

### API Endpoints (Current)
All endpoints are **public (no auth)**:
- `/api/events` — GET (list), GET/{id}, POST (create)
- `/api/users` — GET (list with role filter), GET/{id}, GET/{id}/profile
- `/api/registrations` — POST, GET /events/{id}/registrations
- `/api/checkins` — POST /verify, GET /events/{id}/checkins
- `/api/teams` — GET /events/{id}/teams, POST /events/{id}/teams, POST /join, GET /team-discovery
- `/api/submissions` — GET /events/{id}/submissions, GET/{id}, POST /events/{id}/submissions
- `/api/judging` — GET /judges/{id}/assignments, GET /submissions/{id}/rubric, POST /evaluations, GET /judges/{id}/evaluations
- `/api/announcements` — GET /events/{id}/announcements, POST, POST /publish, POST /view
- `/api/leaderboard` — GET /events/{id}/leaderboard
- `/api/analytics` — GET /events/{id}/analytics

### Seed Data (`scripts/seed.py`)
- **HackHive 2026** event (id: `aaaaaaaa-0000-0000-0000-000000000001`)
- **1 Organizer**: Alex Rivera (fixed UUID)
- **5 Judges**: Fixed UUIDs with emails
- **40 Participants**: Fixed UUIDs with skills, roles, interests, bios
- **40 Registrations** with QR tokens
- **30 Check-ins** (75% attendance)
- **10 Teams** with submissions
- **Rubric** with 4 criteria (Innovation, Technical, Impact, Presentation)
- **13 Evaluations** with scores
- **8 Announcements** with views
- **Safe to rerun**: Clears all data before inserting

### Tests
- **34 pytest tests** in `backend/tests/` covering: registrations, checkins, teams, judging, announcements, leaderboard
- **Conftest**: Creates test database, overrides get_db dependency

---

## Database Findings

### Schema (Alembic Initial Migration)
- **15 tables + 1 view (leaderboard)**
- **All tables have proper indexes** on FKs and commonly queried columns
- **Unique constraints** enforce business rules (one registration per user per event, unique QR token, etc.)
- **PostgreSQL enums** for status fields
- **Leaderboard view** calculates rankings dynamically

### Multi-Event Support
- **Fully supported at database level** — every data table has `event_id` FK
- **Event isolation** is inherent in the schema design
- **No schema changes needed** for basic multi-event functionality

---

## Environment & Deployment

### Frontend
- **Vercel** deployment target
- **Environment**: `VITE_API_URL` (e.g., `https://api.example.com/api`)
- **Build**: `npm run build` → `dist/`

### Backend
- **Render** deployment target
- **Environment**: `DATABASE_URL`, `APP_ENV`, `APP_DEBUG`, `SECRET_KEY`
- **Neon PostgreSQL** for database
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Local Development
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev` (port 5173)
- Database: PostgreSQL on localhost:5432 (or Neon)

---

## Critical Gaps for Implementation

### Authentication (COMPLETELY MISSING)
1. **User model needs `password_hash` field** — add via Alembic migration
2. **Password hashing utility** — bcrypt with cost ≥ 12
3. **JWT settings** in config: `jwt_secret_key`, `jwt_algorithm`, `jwt_access_token_expire_minutes`, `jwt_refresh_token_expire_days`
4. **Auth schemas**: LoginRequest, TokenResponse, TokenPayload, RefreshRequest
5. **Auth router**: POST /login, POST /refresh, POST /logout, GET /me
6. **Auth dependency**: `get_current_user` (validates JWT, returns User)
7. **Role dependencies**: `require_organizer`, `require_participant`, `require_judge`
8. **Apply dependencies** to all protected endpoints
9. **Frontend**: Login page, token storage, axios/fetch interceptor, protected routes, logout

### Multi-Event Creation (MOSTLY EXISTS)
1. **Backend POST /api/events already exists** — just needs auth + organizer role check
2. **Frontend**: "Add Event" button in Organizer sidebar/topbar
3. **Frontend**: Event creation modal/form
4. **Frontend**: Integration with EventContext (refresh events after creation)
5. **Seed data**: Ensure passwords set for demo users

### Performance (INCREMENTAL)
1. **Profile first** — identify actual bottlenecks
2. **Common issues to check**: N+1 in team member loading, evaluation loading, announcement views
3. **Add pagination** to list endpoints
4. **Add indexes** where query plans show sequential scans
5. **Frontend**: React.memo, useMemo, useCallback for expensive components
6. **Optimize polling**: conditional fetch, reduce frequency for non-critical data

---

## Decisions Needed

### Authentication Approach
1. **Token storage**: HttpOnly cookie (more secure) vs localStorage + memory (easier for SPA)
   - **Recommendation**: HttpOnly cookie for refresh token, memory for access token (or short-lived access token in memory only)
2. **Token expiry**: 15 min access / 7 day refresh (standard)
3. **Algorithm**: HS256 (simpler, shared secret) vs RS256 (more secure, key rotation)
   - **Recommendation**: HS256 with strong secret from env for simplicity
4. **Password hashing**: bcrypt (standard) vs argon2 (more secure)
   - **Recommendation**: bcrypt (available in passlib, widely supported)

### Multi-Event UX
1. **Event creation**: Modal vs dedicated page — **Modal** (simpler, matches announcement studio pattern)
2. **Event switching**: Already implemented in Topbar — keep as-is
3. **Default event for new users**: First active event or HackHive 2026

### Performance Scope
1. **Focus areas**: Dashboard loading, leaderboard polling, team discovery, analytics queries
2. **Measure before optimizing** — use backend logs, frontend Network tab, React Profiler

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing demo (HackHive 2026) | HIGH | Seed script must preserve event; add passwords to existing users via migration |
| JWT secret in repo | HIGH | Use env var only; .env in .gitignore |
| CORS misconfiguration in prod | MEDIUM | Document production CORS settings |
| N+1 queries causing slowdown | MEDIUM | Profile with SQLAlchemy echo=True; add joinedload |
| Frontend token handling bugs | MEDIUM | Comprehensive auth flow testing |
| Migration failure on existing data | HIGH | Test migration on copy of seeded DB first |

---

## Files That Will Need Changes

### Backend (New Files)
- `app/core/security.py` — password hashing, JWT utilities
- `app/schemas/auth.py` — auth request/response schemas
- `app/api/auth.py` — auth router (login, refresh, logout, me)
- `app/api/dependencies.py` — auth dependencies (get_current_user, require_role)
- `alembic/versions/xxx_add_password_hash.py` — migration for password_hash column

### Backend (Modified Files)
- `app/models/user.py` — add password_hash column
- `app/core/config.py` — add JWT settings
- `app/main.py` — potentially adjust CORS for production
- `app/api/router.py` — include auth router
- `app/api/*.py` — add auth dependencies to protected endpoints
- `scripts/seed.py` — add passwords to demo users

### Frontend (New Files)
- `src/pages/auth/Login.tsx` — login page
- `src/hooks/useAuth.ts` — auth state management
- `src/components/auth/ProtectedRoute.tsx` — route wrapper
- `src/api/auth.ts` — auth API calls

### Frontend (Modified Files)
- `src/api/client.ts` — add Authorization header interceptor
- `src/context/UserRoleContext.tsx` — replace with real auth context
- `src/App.tsx` — add login route, protected routes
- `src/components/layout/Topbar.tsx` — replace role switcher with user menu + logout
- `src/components/layout/Sidebar.tsx` — ensure role-based nav works with real auth
- `frontend/.env.example` — add any new env vars

---

## Summary

**The platform is feature-complete for event management but has ZERO authentication.** The demo role switcher is a clever but insecure simulation. The database schema already supports multi-event perfectly. Performance optimization opportunities exist but should be measured first.

**Priority order for implementation:**
1. **Authentication** (backend + frontend) — enables everything else
2. **Multi-event creation UI** — small frontend addition, backend already ready
3. **Performance optimization** — measure, then optimize incrementally