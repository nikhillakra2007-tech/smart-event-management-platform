# Smart Event Management Platform — Specification

## Problem

Organizing large-scale events (hackathons, tech fests, conferences) requires juggling multiple
disconnected platforms for registration, attendee verification, team formation, announcements,
judging and live tracking. This creates friction, data silos, and poor participant experience.

**Goal:** Build a unified, real-time Smart Event Management Platform that consolidates the
end-to-end event lifecycle into a single interactive dark-mode command center.

---

## Users & Roles

| Role | Description | Key Views & Actions |
|------|-------------|---------------------|
| **Organizer** | Creates/manages events, oversees registrations, teams, judging, announcements, and analytics | Command Center Dashboard, Check-in Monitor, Team/Submission Oversight, Announcement Center, Live Leaderboard, Full Analytics |
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

---

## Functional Requirements

### FR-1: Registration & Attendee Check-in
- **FR-1.1**: Participants can register for an event (one registration per user per event).
- **FR-1.2**: Each registration generates a unique QR token (`QR-<UUID>`) and registration number (`REG-<SHORT>-<SEQ>`).
- **FR-1.3**: QR token verification endpoint (`POST /api/checkins/verify`) verifies token, event match, confirmed status, and records check-in.
- **FR-1.4**: Duplicate active check-ins are prevented (409 Conflict).
- **FR-1.5**: Organizer can view all registrations, filter by check-in status, and search by name/email.
- **FR-1.6**: Check-in timestamps drive hourly attendance analytics.

### FR-2: Smart Team Formation (Rule-Based Matching)
- **FR-2.1**: Participant profiles store `skills`, `preferred_roles`, `project_interests`, and `bio`.
- **FR-2.2**: Rule-based teammate discovery endpoint (`GET /api/events/{id}/team-discovery/{user_id}`) computes:
  - `matching_skills` (+2 pts each)
  - `matching_interests` (+3 pts each)
  - `compatible_roles` (+1 pt each)
  - Normalized 0-100 `match_score`
- **FR-2.3**: Excludes candidates already in teams and the seeker themselves.
- **FR-2.4**: Participants can create teams and join open teams.

### FR-3: Broadcast & Announcement Center
- **FR-3.1**: Organizers create announcements with categories: `general`, `schedule`, `venue`, `critical`.
- **FR-3.2**: Draft/Publish workflow: announcements start as drafts; organizer explicitly publishes.
- **FR-3.3**: Participant and Judge feeds only receive `is_published=True` broadcasts.
- **FR-3.4**: Announcement views are recorded idempotently (`POST /api/announcements/{id}/view`) for analytics.

### FR-4: Interactive Judging Portal
- **FR-4.1**: Judges view assigned submissions (`GET /api/judges/{id}/assignments`).
- **FR-4.2**: Judging rubric is loaded dynamically (`GET /submissions/{id}/rubric`).
- **FR-4.3**: Scores are validated within `[0, max_score]` for every criterion.
- **FR-4.4**: Total score is computed deterministically with criterion weights:
  $$\text{Total} = \frac{\sum (\text{score}_i / \text{max\_score}_i \times \text{weight}_i \times 100)}{\sum \text{weight}_i}$$
- **FR-4.5**: Atomic submission prevents duplicate evaluations for the same judge/submission pair.

### FR-5: Live Leaderboard & Event Analytics
- **FR-5.1**: Leaderboard is queried directly from the PostgreSQL `leaderboard` SQL VIEW.
- **FR-5.2**: Shows rank, team name, submission title, evaluation count, average score, and aggregate score.
- **FR-5.3**: Instant updates when evaluations are submitted.
- **FR-5.4**: Analytics endpoint (`GET /api/events/{id}/analytics`) provides registration totals, check-in percentage, team count, submissions count, score distribution buckets, hourly attendance, and announcement view stats.

---

## Frontend Architecture & UX Design

### Visual Language: Dark Command Center
- **Backgrounds**: Deep obsidian (`#090d16`, `#0f172a`), slate card surfaces (`#1e293b`).
- **Borders & Dividers**: Subtle borders (`rgba(255, 255, 255, 0.08)`).
- **Accents**:
  - Emerald (`#10b981`): Success, verified check-in, active state.
  - Cyan / Indigo (`#06b6d4`, `#6366f1`): Primary actions, active navigation, matching metrics.
  - Amber (`#f59e0b`): Warning, pending evaluations, schedule alerts.
  - Rose (`#f43f5e`): Critical broadcasts, errors, cancellations.
- **Typography**: Inter / Outfit sans-serif with strong hierarchy and high contrast ratios.

### Layout & Navigation Structure
```
+-------------------------------------------------------------------------+
| Topbar: [Logo & HackHive 2026] [Live Status: Connected] [Role Switcher] |
+-------------------------------------------------------------------------+
| Sidebar        | Main Content Area                                      |
| - Organizer    |  - Metric KPI Cards (Registrations, Checkins, Teams...) |
| - Participant  |  - Two-Column Command View / Focused Workspace         |
| - Judge        |  - Interactive Data Grids & Action Forms               |
| - Live Monitor |  - Live Visual Charts & Status Badges                  |
+-------------------------------------------------------------------------+
```

### Route Map
| Route | Role / Section | Purpose |
|-------|----------------|---------|
| `/` | Redirect | Default to `/organizer` (or active role) |
| `/organizer` | Organizer | Command Center (KPIs, Attendance, Quick Leaderboard, Live Feed) |
| `/organizer/checkins` | Organizer | QR Check-in Station & Attendee Verification Monitor |
| `/organizer/teams` | Organizer | Teams & Submissions Oversight |
| `/organizer/announcements` | Organizer | Broadcast Studio (Create, Draft, Publish) |
| `/organizer/judging` | Organizer | Judging Matrix & Evaluator Progress |
| `/organizer/leaderboard` | Organizer | Full Live Leaderboard Rankings |
| `/organizer/analytics` | Organizer | Deep Analytics (Hourly Curve, Distribution, Engagement) |
| `/participant` | Participant | Participant Hub (Event Info, Registration Status, Action Items) |
| `/participant/badge` | Participant | My Registration & QR Badge Pass |
| `/participant/checkin` | Participant | Self-Check-in Verification Simulator |
| `/participant/discovery` | Participant | Smart Teammate Discovery with Match Scoring |
| `/participant/team` | Participant | My Team & Join/Create Workspace |
| `/participant/submission` | Participant | Project Submission Form & Status |
| `/participant/announcements` | Participant | Broadcast Bulletin (Published only) |
| `/judge` | Judge | Judge Command Portal (Assignments & Summary) |
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
