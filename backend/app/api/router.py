"""API router — aggregates all sub-routers."""

from fastapi import APIRouter

from app.api import (
    auth,
    events,
    users,
    registrations,
    checkins,
    teams,
    submissions,
    judging,
    announcements,
    leaderboard,
    analytics,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(users.router)
api_router.include_router(registrations.router)
api_router.include_router(checkins.router)
api_router.include_router(teams.router)
api_router.include_router(submissions.router)
api_router.include_router(judging.router)
api_router.include_router(announcements.router)
api_router.include_router(leaderboard.router)
api_router.include_router(analytics.router)

