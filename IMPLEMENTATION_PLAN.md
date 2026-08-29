# Smart Event Management Platform — Implementation Plan (Frontend & Full-Stack Integration)

## Architecture Overview

```
                          REACT + VITE + TYPESCRIPT FRONTEND (Port 5173)
                   ┌─────────────────────────────────────────────────────────┐
                   │  App Shell: Sidebar, Topbar, Role Switcher, Event Bar   │
                   ├─────────────────┬───────────────────┬───────────────────┤
                   │ Organizer Views │ Participant Views │    Judge Views    │
                   │ • Command Center│ • My Pass / QR    │ • Judge Portal    │
                   │ • QR Monitor    │ • Team Discovery  │ • Rubric Evaluator│
                   │ • Announcements │ • My Team         │ • Scoring History │
                   │ • Leaderboard   │ • Submission      │ • Live Rankings   │
                   │ • Deep Analytics│ • Broadcasts Feed │                   │
                   └─────────────────┴───────────────────┴───────────────────┘
                                              │
                                   Centralized API Client
                                  (Axios / Typed Fetch API)
                                              │
                                              ▼
                               FASTAPI BACKEND (Port 8000)
                   ┌─────────────────────────────────────────────────────────┐
                   │ Routers: /events, /registrations, /checkins, /teams,    │
                   │          /submissions, /judging, /announcements,        │
                   │          /leaderboard, /analytics, /users               │
                   └──────────────────────────┬──────────────────────────────┘
                                              │
                                        SQLAlchemy ORM
                                              │
                                              ▼
                                   POSTGRESQL 18 DATABASE
                                (15 Tables + Leaderboard VIEW)
```

---

## 1. Frontend Core Foundations

### 1.1 Technology Choices
- **Build Tool**: Vite (`react-ts` template)
- **Styling**: Tailwind CSS v3 with custom dark command-center palette
- **Icons**: `lucide-react` (clean, technical, SVG-based)
- **Charts**: `recharts` for polished, responsive dark-mode charts (Attendance Area Chart, Score Histogram, Radial Gauges)
- **Routing**: `react-router-dom` v6
- **QR Code Rendering**: `qrcode.react` (lightweight SVG/Canvas QR generation)
- **State Management**:
  - `EventContext`: Active event metadata, event list
  - `UserRoleContext`: Active demo user & role (`organizer`, `participant`, `judge`), user list selector
  - `LivePollHook`: Periodic auto-fetch (every 6 seconds) for leaderboard, check-in totals, and announcements

---

## 2. API Contract & Schema Mapping

The frontend strictly communicates with existing backend endpoints:

| Feature Area | Endpoint | HTTP Method | Frontend Hook / Function |
|--------------|----------|-------------|--------------------------|
| **Events** | `/api/events` | GET | `getEvents()` |
| **Events** | `/api/events/{id}` | GET | `getEvent(id)` |
| **Users** | `/api/users` | GET | `getUsers(role?)` |
| **Users** | `/api/users/{id}` | GET | `getUser(id)` |
| **Registrations** | `/api/events/{id}/registrations` | GET | `getEventRegistrations(id)` |
| **Registrations** | `/api/registrations` | POST | `registerParticipant(data)` |
| **Check-in** | `/api/checkins/verify` | POST | `verifyCheckin(data)` |
| **Check-in** | `/api/events/{id}/checkins` | GET | `getEventCheckins(id)` |
| **Teams** | `/api/events/{id}/teams` | GET | `getEventTeams(id)` |
| **Teams** | `/api/events/{id}/teams` | POST | `createTeam(id, data)` |
| **Teams** | `/api/events/{id}/teams/{teamId}/join` | POST | `joinTeam(id, teamId, data)` |
| **Team Discovery** | `/api/events/{id}/team-discovery/{userId}` | GET | `discoverTeammates(id, userId)` |
| **Submissions** | `/api/events/{id}/submissions` | GET | `getEventSubmissions(id)` |
| **Submissions** | `/api/submissions/{id}` | GET | `getSubmission(id)` |
| **Judging** | `/api/judges/{id}/assignments` | GET | `getJudgeAssignments(id)` |
| **Judging** | `/api/submissions/{id}/rubric` | GET | `getSubmissionRubric(id)` |
| **Judging** | `/api/evaluations` | POST | `submitEvaluation(data)` |
| **Judging** | `/api/judges/{id}/evaluations` | GET | `getJudgeEvaluations(id)` |
| **Announcements** | `/api/events/{id}/announcements?all={bool}` | GET | `getAnnouncements(id, all)` |
| **Announcements** | `/api/events/{id}/announcements` | POST | `createAnnouncement(id, data)` |
| **Announcements** | `/api/announcements/{id}/publish` | POST | `publishAnnouncement(id)` |
| **Announcements** | `/api/announcements/{id}/view` | POST | `recordAnnouncementView(id, data)` |
| **Leaderboard** | `/api/events/{id}/leaderboard` | GET | `getLeaderboard(id)` |
| **Analytics** | `/api/events/{id}/analytics` | GET | `getEventAnalytics(id)` |

---

## 3. UI Component Architecture

```
frontend/src/
├── api/
│   └── client.ts              # Type-safe API client functions
├── types/
│   └── api.ts                 # Full TypeScript interfaces matching Pydantic schemas
├── context/
│   ├── EventContext.tsx       # Active event state & selector
│   └── UserRoleContext.tsx    # Active role (organizer/judge/participant) & demo user switcher
├── hooks/
│   └── useLivePolling.ts      # Automatic periodic refresh for live screens
├── components/
│   ├── common/
│   │   ├── Badge.tsx          # Status badges (success, warning, critical, active)
│   │   ├── Card.tsx           # Standardized glass/slate container
│   │   ├── StatCard.tsx       # Metric KPI widget with trend indicator
│   │   ├── LoadingSkeleton.tsx# Polished loading state
│   │   ├── EmptyState.tsx     # Clean empty message & icon
│   │   └── Modal.tsx          # Accessible overlay modal
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main application shell with responsive sidebar
│   │   ├── Sidebar.tsx        # Role-based navigation links
│   │   ├── Topbar.tsx         # Live status indicator, event picker, demo role switcher
│   │   └── MobileNav.tsx      # Responsive drawer navigation
│   ├── qr/
│   │   ├── QRBadge.tsx        # High-res QR code badge with event branding
│   │   └── QRScannerModal.tsx # Manual token & quick-paste check-in input
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx # Live ranked table with top-3 podium highlights
│   └── judging/
│       └── RubricScoringForm.tsx # Interactive criteria score sliders/inputs & live total
└── pages/
    ├── organizer/
    │   ├── OrganizerDashboard.tsx  # Command Center primary showcase
    │   ├── CheckinManager.tsx      # Check-in station & attendee verification table
    │   ├── TeamsSubmissions.tsx    # Team formation & project tracker
    │   ├── AnnouncementStudio.tsx  # Create, draft & publish broadcast bulletins
    │   ├── JudgingOversight.tsx    # Judge assignments & scoring progress
    │   ├── LiveLeaderboardPage.tsx # Live leaderboard presentation screen
    │   └── AnalyticsDashboard.tsx  # Charts, attendance curves & engagement
    ├── participant/
    │   ├── ParticipantHub.tsx      # Participant home summary
    │   ├── MyPassBadge.tsx         # Digital event badge & QR token
    │   ├── CheckinStation.tsx      # Self-verification check-in simulation
    │   ├── TeammateDiscovery.tsx   # Rule-based teammate matchmaking cards
    │   ├── MyTeamView.tsx          # Team members, role assignments & join/create
    │   ├── ProjectSubmission.tsx   # Repo/demo links submission
    │   └── AnnouncementsFeed.tsx   # Live published broadcasts feed
    └── judge/
        ├── JudgeDashboard.tsx      # Assignments list & evaluation status
        ├── EvaluateSubmission.tsx  # Full rubric grading interface
        └── EvaluationHistory.tsx   # Completed reviews & historical score sheet
```

---

## 4. Verification & Testing Strategy

1. **Static Typing & Compilation**: `tsc --noEmit` & `npm run build`
2. **API Verification**: Verify 100% of frontend routes connect to backend endpoints and render seed data.
3. **Live Mutation Loop**:
   - Verify Check-in: Run verification → Organizer Attendance increases from 30 to 31.
   - Verify Judging: Score an assigned submission → Leaderboard recalculates and updates podium ranking live.
   - Verify Broadcast: Organizer drafts & publishes announcement → Instant appearance in Participant bulletin.
   - Verify Team Discovery: Match score algorithm reflects correct skill/interest overlap percentages.
