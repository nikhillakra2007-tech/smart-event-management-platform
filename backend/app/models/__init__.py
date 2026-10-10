"""Models package — imports all models to ensure they are registered with Base.metadata."""

from app.models.event import Event
from app.models.user import User, ParticipantProfile
from app.models.registration import Registration, CheckIn
from app.models.team import Team, TeamMember
from app.models.submission import Submission
from app.models.judging import (
    JudgeAssignment,
    Rubric,
    RubricCriteria,
    Evaluation,
    EvaluationScore,
)
from app.models.announcement import Announcement, AnnouncementView
from app.models.planner import EventScheduleItem, EventPlannerTask, EventBudgetItem

__all__ = [
    "Event",
    "User",
    "ParticipantProfile",
    "Registration",
    "CheckIn",
    "Team",
    "TeamMember",
    "Submission",
    "JudgeAssignment",
    "Rubric",
    "RubricCriteria",
    "Evaluation",
    "EvaluationScore",
    "Announcement",
    "AnnouncementView",
    "EventScheduleItem",
    "EventPlannerTask",
    "EventBudgetItem",
]
