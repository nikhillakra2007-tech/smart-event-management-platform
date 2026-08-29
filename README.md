# Smart Event Management Platform

> A unified, real-time command center and event management system for hackathons, tech fests, and conferences.

## 🚀 Live Demo

[Smart Event Management Platform](https://smart-event-management-platform-beta.vercel.app)

## Problem Statement

Organizing large-scale events requires juggling multiple disconnected platforms for registration, check-in, team formation, judging, and live tracking. This platform consolidates the entire event lifecycle into a single interactive dark-mode-first command center backed by a robust FastAPI + PostgreSQL backend.

---

## Features

| Feature Area | Capabilities & Flow | Status |
|---|---|:---:|
| **Participant Hub** | Digital QR Attendee Pass, check-in simulator, skills profile, checklist | ✅ |
| **Smart Teammate Discovery** | Deterministic rule-based matchmaking (+2 pts skill, +3 pts interest, +1 pt role) | ✅ |
| **Team Workspace & Submissions** | Form/join squad, GitHub repo submission, live deployment links | ✅ |
| **QR Check-in Station** | On-site cryptographic token verification & instant attendance admissions | ✅ |
| **Announcement Studio** | Organizer broadcast composer with draft & publish states, auto view counters | ✅ |
| **Judge Scoring Portal** | Dynamic weighted rubric scoring (0-100), criterion sliders, qualitative notes | ✅ |
| **Live Leaderboard** | Real-time ranked standings from PostgreSQL view with top 3 podium highlights | ✅ |
| **Deep Operations Analytics** | Hourly attendance curve, score distribution histogram, broadcast impressions | ✅ |
| **Live Polling Engine** | Automated continuous data synchronization across all client portals | ✅ |
| **Demo Persona Switcher** | 1-click switching between Organizer, Judge, and Participant personas | ✅ |

---

## User Roles & Journeys

- **Organizer** (`/organizer`): Command center KPI overview, QR attendance verification, team & submission oversight, announcement studio, rubric management, SQL view leaderboard, deep analytics charts.
- **Participant** (`/participant`): Digital QR badge pass, self-verification check-in, smart teammate recommendation matcher, team formation, project deliverables submission, broadcast notification bulletin.
- **Judge** (`/judge`): Assigned project queue, interactive weighted rubric scoring sliders (Innovation, Technical, Impact, Presentation), evaluation history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & Theme** | Tailwind CSS + Dark Command-Center Palette (`#07090e`, `#0d1117`, `#6366f1`, `#06b6d4`, `#10b981`) |
| **Icons & Visuals** | Lucide React |
| **Data Visualization** | Recharts (AreaChart, BarChart) |
| **QR Generation** | `qrcode.react` (SVG level H) |
| **API Client** | Native fetch with TypeScript models and error wrappers |
| **Backend API** | FastAPI + Pydantic v2 |
| **ORM & Database** | SQLAlchemy 2.x + PostgreSQL 18 + Alembic |
| **Backend Tests** | 34 pytest unit & integration tests |

---

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql+psycopg://postgres:password@127.0.0.1:5432/smart_event

# Run database migrations
python -m alembic upgrade head

# Seed demo data (HackHive 2026 event, 46 users, 40 registrations, 10 teams, rubrics, evaluations)
python scripts/seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```
Frontend web application will open at `http://localhost:5173`.

### 3. Running Backend Tests & Frontend Build Validation

```bash
# Run backend pytest suite (34 tests)
cd backend
pytest

# Validate frontend TypeScript compilation & production bundle
cd ../frontend
npm run build
```

---

## Architecture & Seed Data Summary

The platform is pre-loaded with **HackHive 2026** seed data:
- **46 Users**: 1 Organizer (*Alex Rivera*), 5 Certified Judges (*Dr. Priya Sharma, Marcus Chen, Dr. Fatima Al-Hassan, James Okafor, Dr. Sofia Petrov*), and 40 Participants with skill profiles.
- **40 Registrations** with cryptographic QR tokens.
- **30 Verified Check-ins** (75% on-site attendance).
- **10 Squad Teams & Submissions**: Code Crafters, Tech Titans, Innovators Hub, Binary Builders, Neural Ninjas, Debug Dynasty, Pixel Pirates, Data Dynamos, Cloud Crusaders, Stack Surgeons.
- **Rubric Matrix**: 4 weighted criteria (Innovation 30%, Technical Implementation 30%, Impact 20%, Presentation 20%).
- **13 Completed Evaluations** & live PostgreSQL view leaderboard calculation (Rank #1: *Neural Ninjas*).
- **8 Broadcast Announcements** with view impressions tracking.
