# Smart Event Management Platform — Implementation Tasks

## Phase 1: Backend Authentication Foundation

### 1.1 Backend: Add JWT Configuration
- [ ] Edit `backend/app/core/config.py` — add JWT settings (secret_key, algorithm, access_expire_minutes, refresh_expire_days)
- [ ] Edit `backend/.env.example` — document new JWT env vars
- [ ] Edit `backend/.env` — add JWT secret for local development

### 1.2 Backend: Create Security Utilities
- [ ] Create `backend/app/core/security.py` with:
  - `hash_password(password: str) -> str` using bcrypt (cost=12)
  - `verify_password(plain: str, hashed: str) -> bool`
  - `create_access_token(data: dict, expires_delta: timedelta) -> str`
  - `create_refresh_token(data: dict) -> str`
  - `decode_token(token: str) -> TokenPayload` with Pydantic validation

### 1.3 Backend: Add Password Hash to User Model
- [ ] Edit `backend/app/models/user.py` — add `password_hash` column (String(255), nullable=False)
- [ ] Generate Alembic migration: `alembic revision --autogenerate -m "add_password_hash_to_users"`
- [ ] Review migration file in `backend/alembic/versions/`
- [ ] Apply migration: `alembic upgrade head`

### 1.4 Backend: Create Auth Schemas
- [ ] Create `backend/app/schemas/auth.py` with:
  - `LoginRequest` (email, password)
  - `TokenResponse` (access_token, refresh_token, token_type, expires_in)
  - `TokenPayload` (sub, role, exp, iat, type)
  - `RefreshRequest` (refresh_token)
  - `UserResponse` (reuse existing or extend)

### 1.5 Backend: Create Auth Router
- [ ] Create `backend/app/api/auth.py` with endpoints:
  - `POST /auth/login` — validate user, check password, return tokens
  - `POST /auth/refresh` — validate refresh token, issue new access token
  - `POST /auth/logout` — optionally blacklist refresh token
  - `GET /auth/me` — return current user from validated access token

### 1.6 Backend: Create Auth Dependencies
- [ ] Create `backend/app/api/dependencies.py` with:
  - `get_current_user` — decode token, fetch user, return User
  - `require_organizer` — check role == 'organizer'
  - `require_participant` — check role == 'participant'
  - `require_judge` — check role == 'judge'
  - `require_any_authenticated` — any valid role

### 1.7 Backend: Apply Auth to All Protected Endpoints
- [ ] Edit `backend/app/api/router.py` — include auth router
- [ ] Edit `backend/app/api/events.py` — POST requires organizer
- [ ] Edit `backend/app/api/users.py` — add auth dependencies
- [ ] Edit `backend/app/api/registrations.py` — add auth dependencies
- [ ] Edit `backend/app/api/checkins.py` — add auth dependencies
- [ ] Edit `backend/app/api/teams.py` — add auth dependencies (participant for create/join, any for list)
- [ ] Edit `backend/app/api/submissions.py` — add auth dependencies
- [ ] Edit `backend/app/api/judging.py` — add auth dependencies (judge for assignments/evaluations)
- [ ] Edit `backend/app/api/announcements.py` — add auth dependencies
- [ ] Edit `backend/app/api/leaderboard.py` — add auth dependencies
- [ ] Edit `backend/app/api/analytics.py` — add auth dependencies (organizer only)

### 1.8 Backend: Update Seed Script with Passwords
- [ ] Edit `backend/scripts/seed.py` — add `password` field to ORGANIZER, JUDGES, PARTICIPANTS
- [ ] Import and use `hash_password()` from security module
- [ ] Set default password: `"demo123"` for all demo users
- [ ] Run seed: `python scripts/seed.py` (after migration applied)

### 1.9 Backend: Verify Auth Works
- [ ] Start backend: `uvicorn app.main:app --reload --port 8000`
- [ ] Test login via Swagger UI at `/docs`
- [ ] Test protected endpoints with Bearer token
- [ ] Test role authorization (403 for wrong role)

---

## Phase 2: Frontend Authentication

### 2.1 Frontend: Install Dependencies
- [ ] `cd frontend && npm install js-cookie @types/js-cookie`

### 2.2 Frontend: Create Auth Types
- [ ] Create `frontend/src/types/auth.ts` with:
  - `LoginRequest`, `TokenResponse`, `AuthUser`
  - `AuthState` interface

### 2.3 Frontend: Create Auth API Module
- [ ] Create `frontend/src/api/auth.ts` with:
  - `login(credentials)` — POST /auth/login, store tokens
  - `refresh()` — POST /auth/refresh
  - `logout()` — POST /auth/logout, clear tokens
  - `getMe()` — GET /auth/me

### 2.4 Frontend: Create Auth Context (Replaces UserRoleContext)
- [ ] Create `frontend/src/context/AuthContext.tsx` with:
  - State: user, accessToken, refreshToken, isAuthenticated, loading
  - Methods: login, logout, refreshToken, checkAuth (call on init)
  - Token storage: localStorage (access + refresh) for simplicity
  - Auto-refresh on 401: intercept, refresh, retry once
  - Role helpers: `isOrganizer`, `isParticipant`, `isJudge`

### 2.5 Frontend: Update API Client with Auth Interceptor
- [ ] Edit `frontend/src/api/client.ts`:
  - Add `Authorization: Bearer <accessToken>` header to all requests
  - Handle 401: attempt refresh, retry once, then logout + redirect
  - Export `setAuthToken()`, `clearAuthToken()` for auth context

### 2.6 Frontend: Create Login Page
- [ ] Create `frontend/src/pages/auth/Login.tsx`:
  - Dark command-center visual design (match existing)
  - Email + password form with validation
  - Error states: invalid credentials, network error
  - Loading state with spinner
  - Redirect based on role after success
  - Demo credentials hint

### 2.7 Frontend: Create Protected Route Wrapper
- [ ] Create `frontend/src/components/auth/ProtectedRoute.tsx`:
  - Require authentication
  - Optional `allowedRoles` prop
  - Redirect to `/login` if unauthenticated
  - Redirect to correct dashboard if wrong role

### 2.8 Frontend: Update App.tsx with Auth Routes
- [ ] Edit `frontend/src/App.tsx`:
  - Wrap with `AuthProvider` + `EventProvider`
  - Add `/login` route (public)
  - Wrap role routes with `ProtectedRoute` + `allowedRoles`
  - Remove `UserRoleProvider`

### 2.9 Frontend: Update Topbar (Replace Role Switcher)
- [ ] Edit `frontend/src/components/layout/Topbar.tsx`:
  - Remove Role Switcher button group
  - Remove Demo User Dropdown
  - Add User Menu Dropdown with: name, email, role badge, Logout button
  - Keep Event Selector (unchanged)

### 2.10 Frontend: Update Sidebar (Minimal)
- [ ] Edit `frontend/src/components/layout/Sidebar.tsx`:
  - Use `user.role` from AuthContext instead of simulated `role`
  - Add "Create Event" nav item for Organizer (opens modal)

### 2.11 Frontend: Delete Old UserRoleContext
- [ ] Delete `frontend/src/context/UserRoleContext.tsx`
- [ ] Update any imports (should be none after App.tsx change)

---

## Phase 3: Multi-Event Creation UI

### 3.1 Backend: Verify POST /api/events Has Auth
- [ ] Confirm `backend/app/api/events.py` POST has `require_organizer` dependency

### 3.2 Frontend: Add Event Create Types
- [ ] Edit `frontend/src/types/api.ts` — add `EventCreateRequest` interface

### 3.3 Frontend: Add Create Event API Call
- [ ] Edit `frontend/src/api/client.ts` — add `createEvent(payload)` function

### 3.4 Frontend: Create Event Creation Modal
- [ ] Create `frontend/src/components/organizer/CreateEventModal.tsx`:
  - Form: name (required), description, venue, start_time, end_time, status (default draft)
  - Validation: required fields, date logic
  - Submit: call API, on success close modal, refresh events, toast

### 3.5 Frontend: Add "Add Event" Button in Sidebar
- [ ] Edit `frontend/src/components/layout/Sidebar.tsx`:
  - Add "Create Event" as first item in Organizer navigation
  - Opens CreateEventModal

### 3.6 Frontend: Integrate Modal in Organizer Dashboard
- [ ] Edit `frontend/src/pages/organizer/OrganizerDashboard.tsx`:
  - Import and render `CreateEventModal`
  - Manage open/close state

---

## Phase 4: Performance Optimization

### 4.1 Backend: Profile & Fix N+1 Queries
- [ ] Enable SQLAlchemy echo temporarily in `database.py`
- [ ] Run frontend, identify N+1 patterns in logs
- [ ] Edit service files to add `joinedload`/`selectinload`:
  - `team_service.get_event_teams` — load members + users
  - `judging_service.get_judge_assignments` — load submission + team + event
  - `announcement_service.get_announcements` — load creator + views
  - `registration_service.get_event_registrations` — load user + checkins

### 4.2 Backend: Add Pagination
- [ ] Edit list endpoints to accept `skip`, `limit` params
- [ ] Create paginated response schemas
- [ ] Update: registrations, teams, submissions, announcements, users

### 4.3 Backend: Add Indexes (If Needed)
- [ ] Analyze slow queries with `EXPLAIN ANALYZE`
- [ ] Create migration for new indexes
- [ ] Apply migration

### 4.4 Frontend: Eliminate Duplicate API Calls
- [ ] Audit Network tab for duplicate requests
- [ ] Share data via Context or lift state up

### 4.5 Frontend: Optimize Re-renders
- [ ] Add `React.memo` to: StatCard, Badge, Card, LeaderboardTable rows, TeamDiscovery cards
- [ ] Add `useMemo` for: match scores, chart data transformations
- [ ] Add `useCallback` for: handlers passed to memoized children

### 4.6 Frontend: Lazy Load Non-Critical Sections
- [ ] Edit `AnalyticsDashboard.tsx` — lazy load Recharts components
- [ ] Edit `JudgingOversight.tsx` — lazy load large tables
- [ ] Use `React.lazy` + `Suspense` with LoadingSkeleton

### 4.7 Frontend: Optimize Live Polling
- [ ] Edit `useLivePolling.ts`:
  - Reduce frequency: analytics 30s, announcements 15s
  - Add Page Visibility API to pause when tab hidden
  - Add `enabled` flag per data type

---

## Phase 5: Testing & Verification

### 5.1 Backend Tests
- [ ] Run `cd backend && pytest` — all 34 existing tests pass
- [ ] Create `backend/tests/test_auth.py`:
  - Login success with valid credentials
  - Login failure with invalid credentials
  - Access token validation
  - Refresh token flow
  - Role authorization (403 for wrong role)
  - Protected endpoint access with valid token

### 5.2 Frontend Build & Type Check
- [ ] `cd frontend && npm run build` — production build succeeds
- [ ] `cd frontend && npx tsc --noEmit` — no TypeScript errors

### 5.3 Integration Testing (Manual)
- [ ] Login as Organizer (alex.rivera@techhive.com / demo123) → verify `/organizer` dashboard
- [ ] Login as Participant (arjun.mehta@dev.io / demo123) → verify `/participant` dashboard
- [ ] Login as Judge (priya.sharma@judgehive.ai / demo123) → verify `/judge` dashboard
- [ ] Cross-role access: Organizer token → participant endpoint → 403
- [ ] Create new event as Organizer → verify in event selector
- [ ] Switch to new event → verify empty state (no data mixing)
- [ ] Switch back to HackHive 2026 → verify all seed data intact
- [ ] Logout → redirect to `/login`
- [ ] Expired token simulation → verify refresh or redirect

### 5.4 Regression Testing (All Existing Features)
- [ ] Organizer Dashboard KPIs load correctly
- [ ] Check-in Monitor: QR verification works, attendee table filters
- [ ] QR Badge displays for participant
- [ ] QR Check-in verification works
- [ ] Team Discovery: match scoring works
- [ ] Team creation/join works
- [ ] Project Submission works
- [ ] Announcements: create, draft, publish, view tracking
- [ ] Judging Oversight: assignments, progress
- [ ] Judge Evaluation: rubric scoring, submission
- [ ] Scoring History works
- [ ] Live Leaderboard updates in real-time
- [ ] Analytics Dashboard charts load
- [ ] Participant Hub works

### 5.5 Performance Verification
- [ ] Backend: Check query count per request (should be minimal)
- [ ] Frontend: React DevTools Profiler — no unnecessary renders
- [ ] Network tab: No duplicate requests, reasonable payload sizes
- [ ] Dashboard load time < 2 seconds

### 5.6 Deployment Readiness
- [ ] Backend: Update CORS in `main.py` for production
- [ ] Frontend: Verify `VITE_API_URL` works with production backend
- [ ] Document all required environment variables
- [ ] Test production build locally with `npm run preview`

---

## Task Dependencies

```
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9
                                                      ↓
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11
                                                      ↓
3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
                                                      ↓
4.1 → 4.2 → 4.3 (parallel with 4.4 → 4.5 → 4.6 → 4.7)
                                                      ↓
5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
```

---

## Demo Credentials (After Seed)

| Role | Email | Password |
|------|-------|----------|
| Organizer | alex.rivera@techhive.com | demo123 |
| Judge | priya.sharma@judgehive.ai | demo123 |
| Judge | marcus.chen@evaluate.io | demo123 |
| Judge | fatima.hassan@techeval.com | demo123 |
| Judge | james.okafor@judge.tech | demo123 |
| Judge | sofia.petrov@assess.ai | demo123 |
| Participant | arjun.mehta@dev.io | demo123 |
| Participant | preethi.nair@dev.io | demo123 |
| ... | (all 40 participants) | demo123 |

---

## Commands Reference

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
pytest
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npx tsc --noEmit
```

---

## Phase 2: Complete Workflows (Follow-up)

### Event Switching (9 tasks)
- [x] Inspect `EventContext.tsx` active event state and `Topbar.tsx` selector
- [x] Inspect `app/api/events.py` auth and event-scoped endpoints
- [x] Fix `EventContext` fetch loop and ensure `refreshEvents` after Add Event
- [x] Verify `CreateEventModal` persists via FastAPI/SQLAlchemy/PostgreSQL and appears in selector
- [x] Connect `currentEvent.id` to all organizer queries (already done)
- [x] Verify data isolation (Event A 10 teams vs Event B 0)

### Registration → QR → Check-in (10 tasks)
- [x] Inspect `registration_service.py` QR generation (`QR-` UUID) and `Registration` model
- [x] Verify `POST /registrations` creates unique `qr_token` generically
- [x] Add `GET /events/{id}/my-registration` endpoint (any authenticated, own only)
- [x] Fix `MyPassBadge.tsx` to use `my-registration` instead of organizer-only list
- [x] Inspect `checkin_service.py` event-safe validation (`registration.event_id == request.event_id`)
- [x] Verify `CheckinManager` sends `event_id` + `qr_token` + `checked_in_by`
- [x] Persist check-in via `CheckIn` model, prevent duplicate 409
- [x] Test new participant end-to-end (register → QR badge → organizer verify → persisted)

### Judge Pending (7 tasks)
- [x] Inspect `scripts/seed.py` `EVALUATION_SCORES_MATRIX` (13 evals → all evaluated)
- [x] Remove one evaluation e.g., `(0,1)` to leave Judge 0 pending
- [x] Verify `JudgeDashboard` pending vs evaluated counts, rubric submit, leaderboard update

### Testing Phase 2
- [ ] New participant registration → QR badge → organizer check-in → persisted + status update
- [ ] Invalid QR, wrong-event QR, duplicate check-in rejected
- [ ] Event switching A→B→new→HackHive isolation
- [ ] Judge pending → submit → history/leaderboard
- [ ] Regression all dashboards + `npm run build` + `pytest`