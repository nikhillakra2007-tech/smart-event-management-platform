"""Analytics Pydantic schemas."""

from pydantic import BaseModel


class AttendanceTimePoint(BaseModel):
    hour: str
    count: int


class ScoreDistributionBucket(BaseModel):
    range: str
    count: int


class AnnouncementViewStat(BaseModel):
    title: str
    view_count: int
    type: str


class EventAnalytics(BaseModel):
    event_id: str
    total_registrations: int
    checked_in_count: int
    not_checked_in_count: int
    check_in_percentage: float
    teams_formed: int
    submissions_count: int
    evaluated_submissions: int
    average_score: float | None
    score_distribution: list[ScoreDistributionBucket]
    attendance_over_time: list[AttendanceTimePoint]
    announcement_stats: list[AnnouncementViewStat]
    total_announcement_views: int
