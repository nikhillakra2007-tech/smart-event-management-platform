# Task Tracker — Smart Event Management Platform (Frontend & Integration)

## Phase 1: Specifications & Plan
- [x] SPECIFY: Updated SPECIFICATION.md with complete frontend architecture, user journeys, dark command-center aesthetic, route map, and API integration details
- [x] CLARIFY: Inspected existing backend endpoints, schemas, seed IDs, and verified all 34 backend unit tests
- [x] PLAN: Updated IMPLEMENTATION_PLAN.md with frontend component structure, role switching, live polling, and contract mappings

## Phase 2: Frontend Setup & Foundations
- [x] Initialize React + Vite + TypeScript in `frontend/`
- [x] Install dependencies: `lucide-react`, `recharts`, `qrcode.react`, `react-router-dom`, `clsx`, `tailwind-merge`
- [x] Configure Tailwind CSS with dark command-center color palette & typography
- [x] Create `.env.example` with `VITE_API_URL=http://127.0.0.1:8000/api`
- [x] Create centralized type-safe API client (`src/api/client.ts` and `src/types/api.ts`)

## Phase 3: Global State & Shell
- [x] Implement `EventContext` (active event, load events, switch event)
- [x] Implement `UserRoleContext` (active demo role: organizer/participant/judge, user selector with avatars)
- [x] Implement `useLivePolling` hook for automatic real-time sync (leaderboard, attendance, announcements, judging)
- [x] Build Application Shell:
  - Responsive Sidebar with role-tailored links
  - Topbar with Event Selector, Live Connection pulse badge, and Demo Role Switcher
  - Status badges, Card components, Metric stat cards, Loading skeletons, Empty states, Modal overlay

## Phase 4: Organizer Command Center & Views
- [x] **Command Center Dashboard** (`/organizer`):
  - KPI cards (Total Registrations, Checked In count & %, Teams Formed, Submissions Count, Avg Score)
  - Quick Attendance radial/bar gauge
  - Live Leaderboard Top 5 podium
  - Active Judging progress bar
  - Recent announcements list with priority tags
- [x] **Check-in Station & Attendee Monitor** (`/organizer/checkins`):
  - Manual QR token verification form with instant check-in action
  - Live attendee table with filter by checked-in status, search by name/email
- [x] **Teams & Submissions Oversight** (`/organizer/teams`):
  - List of all teams, member counts, project interests, and submission statuses
  - Expandable team details with member list and repository/demo URLs
- [x] **Announcement Studio** (`/organizer/announcements`):
  - Create new announcement form (general, schedule, venue, critical)
  - Draft vs Published tabs
  - One-click Publish action that pushes broadcast to participant & judge feeds
- [x] **Judging Oversight** (`/organizer/judging`):
  - Rubric criteria list with weights and max scores
  - Judge assignments list & evaluation completion rate
- [x] **Live Leaderboard Screen** (`/organizer/leaderboard`):
  - Ranked table from PostgreSQL VIEW
  - Rank 1, 2, 3 podium badge highlights
  - Average score, total score, evaluation count
- [x] **Analytics Dashboard** (`/organizer/analytics`):
  - Hourly Attendance timeline area chart
  - Score distribution histogram (0-20, 20-40, 40-60, 60-80, 80-100)
  - Announcement view engagement bar chart

## Phase 5: Participant Experience
- [x] **Participant Hub** (`/participant`):
  - Event welcome banner and quick status overview
  - Personal checklist (Registration, Check-in, Team, Submission)
  - Live published broadcasts
- [x] **My Pass & QR Badge** (`/participant/badge`):
  - Digital hackathon attendee badge with rendered SVG QR code from `qr_token`
  - Registration number, check-in status badge, user skills
- [x] **Check-in Station** (`/participant/checkin`):
  - One-click QR token verification simulation
  - Shows instant feedback (Success, Already Checked In, Error states)
- [x] **Smart Teammate Discovery** (`/participant/discovery`):
  - Real backend rule-based matching (`GET /api/events/{id}/team-discovery/{user_id}`)
  - Candidate cards showing Match Score percentage, matching skills tags, matching interests tags, and compatible roles
  - Search and filter by skill / interest
- [x] **My Team Workspace** (`/participant/team`):
  - Current team details, teammates, roles
  - If not in a team: Create team form or Join existing team by ID/name
- [x] **Project Submission** (`/participant/submission`):
  - Title, description, repository URL, demo URL input form
  - Connects to backend `POST /api/events/{id}/submissions`
  - Real-time submission status badge
- [x] **Broadcasts Bulletin** (`/participant/announcements`):
  - Published announcements only
  - Automatic view recording (`POST /api/announcements/{id}/view`)

## Phase 6: Judge Experience
- [x] **Judge Portal Dashboard** (`/judge`):
  - Assigned submissions overview (total, pending, evaluated)
  - Quick action buttons to evaluate
- [x] **Interactive Rubric Scoring** (`/judge/evaluate/:submissionId`):
  - Submission overview with repository and demo preview buttons
  - Dynamic criteria loaded from event rubric
  - Interactive score inputs with validation against `max_score`
  - Live calculated weighted total score
  - Qualitative feedback field
  - Submit evaluation (`POST /api/evaluations`) with success redirect
- [x] **Evaluation History** (`/judge/history`):
  - Completed scores and feedback review

## Phase 7: Verification, Polling & Polish
- [x] Verify live polling updates across all roles
- [x] Verify TypeScript compilation (`tsc -b`) and Vite production build (`npm run build`)
- [x] Verify responsive layout across Desktop, Tablet, and Mobile
- [x] End-to-end demo flow audit (Organizer -> Participant -> Judge -> Leaderboard -> Analytics)
- [x] Document in `README.md` and complete final status report
