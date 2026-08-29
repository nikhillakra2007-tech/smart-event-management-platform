# Smart Event Management Platform — Implementation Plan

## Follow-up Phase 2 — Complete Workflows (Event Switching + Registration→QR→Check-in + Judge Pending)

**Goal:** Make existing selector, QR, judging fully demo-able generically.

**1. Event Switching Fix:**
- Inspect `EventContext.tsx:38` dependency bug, `Topbar.tsx:65` selector, `CreateEventModal.tsx:1`.
- Keep `Topbar` selector as-is (no new selector). Fix `fetchEvents` to not loop on `currentEvent` dep (use ref or empty deps + manual refresh). Ensure `refreshEvents` after `POST /events` repopulates `events` and optionally `setCurrentEvent(newEvent)`. Verify all organizer pages use `currentEvent.id` (already do).
- Test isolation: query counts per event.

**2. Registration → QR → Check-in Fix:**
- Reuse `registration_service.py:15` QR generation (already generic). Add backend `GET /events/{event_id}/my-registration` (`app/api/registrations.py:1`) — `require_any_authenticated`, query `Registration` where `event_id` and `user_id == current_user.id`, return 404 if none, else `RegistrationResponse`.
- Fix `MyPassBadge.tsx:20` to call `api.getMyRegistration(eventId)` + `api.getEventCheckins` alternative: participant check-in status via `my-registration`'s checkins or new `GET /events/{id}/my-checkin`. Minimal: keep checkins fetch but make it accessible or derive from registration.
- Ensure `CheckinManager.tsx:64` already event-safe, verify `checked_in_by` passed.

**3. Judge Pending Fix:**
- Update `scripts/seed.py:179` `EVALUATION_SCORES_MATRIX` remove `(0,1)` entry, so Judge 0 has 3 assignments, 2 evaluations, 1 pending. Keep other 12 evaluations. No schema change.

**Reuse:** No new tables, no duplicate QR/event systems.

## Architecture Overview (Preserved — Phase 1)

```
React + Vite + TypeScript Frontend (Port 5173)
┌─────────────────────────────────────────────────────────┐
│  App Shell: Sidebar, Topbar, User Menu, Event Bar       │
├─────────────────┬───────────────────┬───────────────────┤
│ Organizer Views │ Participant Views │    Judge Views    │
│ • Command Center│ • My Pass / QR    │ • Judge Portal    │
│ • QR Monitor    │ • Team Discovery  │ • Rubric Evaluator│
│ • Announcements │ • My Team         │ • Scoring History │
│ • Leaderboard   │ • Submission      │ • Live Rankings   │
│ • Deep Analytics│ • Broadcasts Feed │                   │
│ • Event Mgmt    │                   │                   │
└─────────────────┴───────────────────┴───────────────────┘
                      │
              Centralized API Client (with JWT interceptor)
                      │
                      ▼
FastAPI Backend (Port 8000)
┌─────────────────────────────────────────────────────────┐
│ Routers: /auth, /events, /users, /registrations,        │
│          /checkins, /teams, /submissions, /judging,     │
│          /announcements, /leaderboard, /analytics       │
└──────────────────────────┬──────────────────────────────┘
                           │
                    SQLAlchemy ORM
                           │
                           ▼
              PostgreSQL 18 Database (Neon)
              (15 Tables + Leaderboard VIEW)
```

---

## Phase 1: Backend Authentication Foundation

### 1.1 Add JWT Configuration to Settings
**File**: `backend/app/core/config.py`
- Add: `jwt_secret_key`, `jwt_algorithm` (HS256), `jwt_access_token_expire_minutes` (15), `jwt_refresh_token_expire_days` (7)
- Load from environment variables

### 1.2 Create Security Utilities
**File**: `backend/app/core/security.py` (NEW)
- `hash_password(password: str) -> str` — bcrypt with cost=12
- `verify_password(plain: str, hashed: str) -> bool`
- `create_access_token(data: dict, expires_delta: timedelta) -> str`
- `create_refresh_token(data: dict) -> str`
- `decode_token(token: str) -> TokenPayload` (Pydantic model)

### 1.3 Add Password Hash to User Model
**File**: `backend/app/models/user.py`
- Add `password_hash: Mapped[str] = mapped_column(String(255), nullable=False)`
- **Migration required** — generate Alembic migration

### 1.4 Create Auth Schemas
**File**: `backend/app/schemas/auth.py` (NEW)
- `LoginRequest`: email, password
- `TokenResponse`: access_token, refresh_token, token_type, expires_in
- `TokenPayload`: sub (user_id), role, exp, iat, type (access/refresh)
- `RefreshRequest`: refresh_token
- `UserResponse`: extend existing with role (already exists)

### 1.5 Create Auth Router
**File**: `backend/app/api/auth.py` (NEW)
- `POST /auth/login` — validate credentials, return tokens
- `POST /auth/refresh` — validate refresh token, return new access token
- `POST /auth/logout` — blacklist refresh token (optional: in-memory set for simplicity)
- `GET /auth/me` — return current user from validated access token

### 1.6 Create Auth Dependencies
**File**: `backend/app/api/dependencies.py` (NEW)
- `get_current_user` — decode access token, fetch user from DB, return User
- `require_organizer` — depends on get_current_user, check role == 'organizer'
- `require_participant` — depends on get_current_user, check role == 'participant'
- `require_judge` — depends on get_current_user, check role == 'judge'
- `require_any_authenticated` — depends on get_current_user, any role

### 1.7 Apply Auth Dependencies to Protected Endpoints
**Files**: All routers in `backend/app/api/`
- Add `current_user: User = Depends(require_organizer)` to organizer-only endpoints
- Add `current_user: User = Depends(require_participant)` to participant-only endpoints
- Add `current_user: User = Depends(require_judge)` to judge-only endpoints
- Add `current_user: User = Depends(require_any_authenticated)` to shared endpoints

**Endpoint-Role Mapping**:
| Endpoint | Required Role |
|----------|---------------|
| `/api/events` POST | organizer |
| `/api/events/{id}/registrations` | organizer |
| `/api/checkins/verify` | organizer |
| `/api/events/{id}/checkins` | organizer |
| `/api/events/{id}/teams` GET | any authenticated |
| `/api/events/{id}/teams` POST | participant |
| `/api/events/{id}/teams/{id}/join` | participant |
| `/api/events/{id}/team-discovery/{user_id}` | participant (own user_id) |
| `/api/events/{id}/submissions` GET | any authenticated |
| `/api/events/{id}/submissions` POST | participant |
| `/api/submissions/{id}` | any authenticated |
| `/api/judges/{id}/assignments` | judge (own judge_id) |
| `/api/submissions/{id}/rubric` | judge (assigned) or organizer |
| `/api/evaluations` POST | judge (assigned) |
| `/api/judges/{id}/evaluations` | judge (own) |
| `/api/events/{id}/announcements` GET (all=true) | organizer |
| `/api/events/{id}/announcements` GET | participant/judge (published only) |
| `/api/events/{id}/announcements` POST | organizer |
| `/api/announcements/{id}/publish` | organizer |
| `/api/announcements/{id}/view` | participant/judge |
| `/api/events/{id}/leaderboard` | any authenticated |
| `/api/events/{id}/analytics` | organizer |
| `/api/users` | organizer (or any for own profile) |

### 1.8 Update Seed Script with Passwords
**File**: `backend/scripts/seed.py`
- Add `password` field to ORGANIZER, JUDGES, PARTICIPANTS data
- Use `hash_password()` to store hashes
- Default password for all demo users: `"demo123"` (or similar)

### 1.9 Generate & Apply Alembic Migration
```bash
cd backend
alembic revision --autogenerate -m "add_password_hash_to_users"
# Review migration file
alembic upgrade head
```

### 1.10 Run Seed with Passwords
```bash
cd backend
python scripts/seed.py
```

---

## Phase 2: Frontend Authentication

### 2.1 Install Auth Dependencies
```bash
cd frontend
npm install js-cookie @types/js-cookie  # for cookie handling
# OR use native document.cookie + memory storage
```

### 2.2 Create Auth Types
**File**: `frontend/src/types/auth.ts` (NEW)
- `LoginRequest`, `TokenResponse`, `AuthUser` (extends User with token)
- `AuthState`: user, accessToken, refreshToken, isAuthenticated, isLoading

### 2.3 Create Auth API Module
**File**: `frontend/src/api/auth.ts` (NEW)
- `login(credentials)` — POST /auth/login, store tokens
- `refresh()` — POST /auth/refresh
- `logout()` — POST /auth/logout, clear tokens
- `getMe()` — GET /auth/me

### 2.4 Create Auth Context (Replaces UserRoleContext)
**File**: `frontend/src/context/AuthContext.tsx` (NEW, replaces UserRoleContext.tsx)
- State: user, accessToken, refreshToken, isAuthenticated, loading
- Methods: login, logout, refreshToken, checkAuth (call on app init)
- Token storage: **HttpOnly cookie for refresh, memory for access** (or localStorage for both with short expiry)
- Auto-refresh: intercept 401, call refresh, retry original request
- Role-based helpers: `isOrganizer`, `isParticipant`, `isJudge`

### 2.5 Update API Client with Auth Interceptor
**File**: `frontend/src/api/client.ts`
- Add `Authorization: Bearer <accessToken>` header to all requests
- Handle 401: attempt refresh, retry once, then logout + redirect to login
- Export `setAuthToken(token)` and `clearAuthToken()` for auth context

### 2.6 Create Login Page
**File**: `frontend/src/pages/auth/Login.tsx` (NEW)
- **Visual design**: Match existing dark command-center theme
- Form: Email input, Password input, Submit button
- Error handling: Invalid credentials, network error
- Loading state: Disabled button, spinner
- Redirect after login: Based on user role → `/organizer`, `/participant`, `/judge`
- Demo credentials hint: Show "Demo: alex.rivera@techhive.com / demo123"

### 2.7 Create Protected Route Wrapper
**File**: `frontend/src/components/auth/ProtectedRoute.tsx` (NEW)
- Wrapper component requiring authentication
- Optional `allowedRoles` prop for role-based protection
- Redirect to `/login` if unauthenticated
- Redirect to appropriate dashboard if wrong role

### 2.8 Update App.tsx with Auth Routes
**File**: `frontend/src/App.tsx`
- Wrap with `AuthProvider` (new) + `EventProvider`
- Add `/login` route (public)
- Wrap all role routes with `ProtectedRoute` with appropriate `allowedRoles`
- Remove `UserRoleProvider` (replaced by `AuthProvider`)

### 2.9 Update Topbar Component
**File**: `frontend/src/components/layout/Topbar.tsx`
- Remove Role Switcher button group
- Remove Demo User Dropdown
- Add **User Menu Dropdown** with:
  - User name, email, role badge
  - "Switch Event" (keep event selector)
  - **Logout** button
- Show role-appropriate label (Organizer/Participant/Judge)

### 2.10 Update Sidebar (Minimal Changes)
**File**: `frontend/src/components/layout/Sidebar.tsx`
- Keep role-based navigation logic
- Now uses real `user.role` from AuthContext instead of simulated `role`

### 2.11 Update EventContext (Minor)
**File**: `frontend/src/context/EventContext.tsx`
- No major changes needed
- Ensure `refreshEvents()` called after event creation

---

## Phase 3: Multi-Event Creation UI (Organizer)

### 3.1 Backend: Verify POST /api/events Works with Auth
- Endpoint exists in `app/api/events.py`
- Add `current_user: User = Depends(require_organizer)` dependency
- Return created event

### 3.2 Frontend: Add Event Creation Types
**File**: `frontend/src/types/api.ts` (extend)
- `EventCreateRequest`: name, description?, venue?, start_time?, end_time?, status? (default "draft")

### 3.3 Frontend: Add Create Event API Call
**File**: `frontend/src/api/client.ts`
- `createEvent(payload: EventCreateRequest)` — POST /api/events

### 3.4 Frontend: Create Event Creation Modal
**File**: `frontend/src/components/organizer/CreateEventModal.tsx` (NEW)
- Trigger: "Add Event" button in Organizer sidebar/topbar
- Form fields:
  - Event Name (required, text)
  - Description (optional, textarea)
  - Venue (optional, text)
  - Start Date/Time (optional, datetime-local)
  - End Date/Time (optional, datetime-local)
  - Status (select: draft/active/completed/cancelled, default: draft)
- Validation: Required fields, date logic (end > start)
- Submit: Call `api.createEvent()`, on success close modal, call `refreshEvents()`, show success toast

### 3.5 Frontend: Add "Add Event" Button
**File**: `frontend/src/components/layout/Sidebar.tsx` (Organizer section)
- Add "Create Event" nav item or button in sidebar header
- Or add to Topbar organizer section
- **Recommendation**: Add as first item in Organizer navigation: "Create Event" → opens modal

### 3.6 Frontend: Integrate Modal in Organizer Layout
**File**: `frontend/src/pages/organizer/OrganizerDashboard.tsx` or `AppLayout.tsx`
- Add `CreateEventModal` component
- Manage open/close state

---

## Phase 4: Performance Optimization

### 4.1 Backend Query Optimization

#### 4.1.1 Profile Current Queries
- Enable SQLAlchemy echo temporarily: `echo=True` in `database.py`
- Run frontend, observe queries in logs
- Identify N+1 patterns

#### 4.1.2 Fix N+1 Queries (Common Patterns)
**File**: `backend/app/services/*.py`
- `team_service.get_event_teams`: Use `joinedload(Team.members).joinedload(TeamMember.user)`
- `judging_service.get_judge_assignments`: Use `joinedload` for submission, team, event
- `announcement_service.get_announcements`: Use `joinedload` for creator, views
- `registration_service.get_event_registrations`: Use `joinedload` for user, checkins

#### 4.1.3 Add Pagination to List Endpoints
**Files**: `app/api/*.py`, `app/schemas/*.py`
- Add `skip`, `limit` parameters to: registrations, teams, submissions, announcements, users
- Return paginated response schema: `items`, `total`, `skip`, `limit`

#### 4.1.4 Add Database Indexes (If Needed)
**Migration**: New Alembic migration
- Analyze slow queries with `EXPLAIN ANALYZE`
- Add indexes on frequently filtered columns:
  - `registrations.registration_status` (if filtering)
  - `announcements.is_published` + `event_id` (composite)
  - `evaluations.status` + `judge_id` (composite)
  - `submissions.status` + `event_id` (composite)

#### 4.1.5 Optimize Expensive Queries
- **Leaderboard view**: Already a materialized view (good)
- **Analytics**: Consider caching or pre-aggregation for large datasets
- **Team discovery**: Already uses raw SQL in service (efficient)

### 4.2 Frontend Performance Optimization

#### 4.2.1 Eliminate Duplicate API Calls
- **Audit**: Check Network tab for duplicate requests
- **Pattern**: Multiple components calling same endpoint (e.g., `getEvent`, `getUsers`)
- **Fix**: Share data via Context or lift state up

#### 4.2.2 Optimize Re-renders
**Files**: Various components
- Add `React.memo` to: `StatCard`, `Badge`, `Card`, `LeaderboardTable` rows, `TeamDiscoveryResult` cards
- Use `useMemo` for: expensive computations (match scores, chart data transformations)
- Use `useCallback` for: event handlers passed to memoized children

#### 4.2.3 Lazy Load Non-Critical Sections
**Files**: `src/pages/organizer/AnalyticsDashboard.tsx`, `src/pages/organizer/JudgingOversight.tsx`
- Use `React.lazy` + `Suspense` for: Recharts components, large tables
- Load analytics charts only when tab active

#### 4.2.4 Optimize Live Polling
**File**: `src/hooks/useLivePolling.ts`
- Reduce frequency for non-critical data (analytics: 30s, announcements: 15s)
- Add `enabled` flag to pause when tab not visible (Page Visibility API)
- Conditional fetch: only poll if data changed (ETag/Last-Modified) — future enhancement

#### 4.2.5 Reduce API Payload Size
**Files**: `backend/app/schemas/*.py`, `backend/app/api/*.py`
- Use separate "list" schemas with fewer fields vs "detail" schemas
- Example: `TeamListResponse` (no members) vs `TeamDetailResponse` (with members)

---

## Phase 5: Testing & Verification

### 5.1 Backend Tests
- **Existing**: Run `pytest` — ensure all 34 tests pass
- **New Auth Tests** (add to `backend/tests/`):
  - `test_auth.py`: login success, login failure, token validation, role authorization
  - Test each protected endpoint with/without auth, with wrong role

### 5.2 Frontend Build & Type Check
```bash
cd frontend
npm run build        # Vite production build
npx tsc --noEmit     # TypeScript type check
```

### 5.3 Integration Testing (Manual)
- Login as Organizer → verify all organizer pages work
- Login as Participant → verify all participant pages work
- Login as Judge → verify all judge pages work
- Cross-role access attempts → verify 403/redirect
- Create new event → verify appears in selector, data isolation
- Logout → verify redirect to login
- Expired token → verify refresh or redirect

### 5.4 Regression Testing
- All existing features from IMPLEMENTATION_PLAN.md Phase 4-6
- HackHive 2026 seed data intact
- Demo credentials work for all three roles

### 5.5 Performance Verification
- Backend: Check query count per request (SQLAlchemy echo)
- Frontend: React DevTools Profiler — no unnecessary renders
- Network tab: No duplicate requests, reasonable payload sizes
- Dashboard load time: < 2 seconds

---

## File Change Summary

### Backend New Files
1. `app/core/security.py`
2. `app/schemas/auth.py`
3. `app/api/auth.py`
4. `app/api/dependencies.py`
5. `alembic/versions/xxx_add_password_hash_to_users.py`

### Backend Modified Files
1. `app/core/config.py` — JWT settings
2. `app/models/user.py` — password_hash column
3. `app/main.py` — CORS review (optional)
4. `app/api/router.py` — include auth router
5. `app/api/events.py` — add organizer auth to POST
6. `app/api/users.py` — add auth dependencies
7. `app/api/registrations.py` — add auth dependencies
8. `app/api/checkins.py` — add auth dependencies
9. `app/api/teams.py` — add auth dependencies
10. `app/api/submissions.py` — add auth dependencies
11. `app/api/judging.py` — add auth dependencies
12. `app/api/announcements.py` — add auth dependencies
13. `app/api/leaderboard.py` — add auth dependencies
14. `app/api/analytics.py` — add auth dependencies
15. `scripts/seed.py` — add passwords to demo users

### Frontend New Files
1. `src/types/auth.ts`
2. `src/api/auth.ts`
3. `src/context/AuthContext.tsx`
4. `src/pages/auth/Login.tsx`
5. `src/components/auth/ProtectedRoute.tsx`
6. `src/components/organizer/CreateEventModal.tsx`

### Frontend Modified Files
1. `src/api/client.ts` — auth interceptor
2. `src/App.tsx` — auth routes, protected routes
3. `src/components/layout/Topbar.tsx` — user menu + logout
4. `src/components/layout/Sidebar.tsx` — "Add Event" button
5. `src/context/UserRoleContext.tsx` — **REPLACE** with AuthContext
6. `src/types/api.ts` — EventCreateRequest
7. `frontend/.env.example` — document any new vars

---

## Deployment Considerations

### Environment Variables (Backend)
```env
# Existing
DATABASE_URL=postgresql+psycopg://...
APP_ENV=production
APP_DEBUG=false
SECRET_KEY=strong-random-secret

# New (add to .env.example and production)
JWT_SECRET_KEY=very-long-random-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Environment Variables (Frontend)
```env
# Existing
VITE_API_URL=https://api.example.com/api
```

### CORS (Production)
**File**: `backend/app/main.py`
```python
# Production: restrict to frontend domain
allow_origins=["https://your-frontend.vercel.app"]
allow_credentials=True
```

### HTTPS Required
- JWT in cookies/headers requires HTTPS in production
- Render + Vercel provide HTTPS by default

---

## Rollback Plan

If critical issues arise:
1. **Backend**: `alembic downgrade -1` to remove password_hash column
2. **Frontend**: Revert to `UserRoleContext` (git checkout)
3. **Seed**: Re-run original seed.py (without passwords)
4. **Deploy**: Rollback to previous Render/Vercel deployment

---

## Timeline Estimate

| Phase | Tasks | Estimate |
|-------|-------|----------|
| 1. Backend Auth | 1.1-1.10 | 4-6 hours |
| 2. Frontend Auth | 2.1-2.11 | 4-6 hours |
| 3. Multi-Event UI | 3.1-3.6 | 1-2 hours |
| 4. Performance | 4.1-4.2 | 2-4 hours (measure first) |
| 5. Testing | 5.1-5.5 | 2-3 hours |
| **Total** | | **13-21 hours** |

---

## Success Criteria

✅ All 34 existing backend tests pass  
✅ Frontend builds without TypeScript errors  
✅ Login works for all three roles with demo credentials  
✅ Role-based access enforced at API level (not just frontend)  
✅ Organizer can create new events  
✅ New events appear in selector, data isolated  
✅ HackHive 2026 demo works exactly as before  
✅ No obvious performance regressions  
✅ Application runs locally end-to-end  
✅ Ready for Vercel + Render deployment