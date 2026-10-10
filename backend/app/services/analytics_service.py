"""Analytics service — aggregate statistics from existing tables."""

import uuid
from collections import Counter

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.registration import Registration, CheckIn
from app.models.team import Team
from app.models.submission import Submission
from app.models.judging import Evaluation
from app.models.announcement import Announcement, AnnouncementView
from app.schemas.analytics import (
    EventAnalytics,
    AttendanceTimePoint,
    ScoreDistributionBucket,
    AnnouncementViewStat,
)


def get_event_analytics(db: Session, event_id: uuid.UUID) -> EventAnalytics:
    """
    Compute comprehensive event analytics entirely from existing data.

    No dedicated analytics tables needed.
    """
    # --- Registrations ---
    total_registrations = (
        db.query(func.count(Registration.id))
        .filter(Registration.event_id == event_id)
        .scalar()
    ) or 0

    # --- Check-ins ---
    checked_in_count = (
        db.query(func.count(Registration.id))
        .join(CheckIn, (CheckIn.registration_id == Registration.id) & (CheckIn.status == "active"))
        .filter(Registration.event_id == event_id)
        .scalar()
    ) or 0

    not_checked_in_count = total_registrations - checked_in_count
    check_in_percentage = (
        round((checked_in_count / total_registrations) * 100, 2)
        if total_registrations > 0
        else 0.0
    )

    # --- Teams ---
    teams_formed = (
        db.query(func.count(Team.id))
        .filter(Team.event_id == event_id)
        .scalar()
    ) or 0

    # --- Submissions ---
    submissions_count = (
        db.query(func.count(Submission.id))
        .filter(Submission.event_id == event_id, Submission.status == "submitted")
        .scalar()
    ) or 0

    # --- Evaluations (query only needed scalar columns) ---
    eval_rows = (
        db.query(Evaluation.submission_id, Evaluation.total_score)
        .join(Submission, Evaluation.submission_id == Submission.id)
        .filter(Submission.event_id == event_id, Evaluation.status == "submitted")
        .all()
    )
    evaluated_submissions = len({row.submission_id for row in eval_rows})
    scores = [row.total_score for row in eval_rows if row.total_score is not None]
    average_score = round(sum(scores) / len(scores), 4) if scores else None

    # Score distribution buckets (0-20, 20-40, 40-60, 60-80, 80-100)
    buckets = [
        ("0-20", 0, 20),
        ("20-40", 20, 40),
        ("40-60", 40, 60),
        ("60-80", 60, 80),
        ("80-100", 80, 101),
    ]
    score_distribution = [
        ScoreDistributionBucket(
            range=label,
            count=sum(1 for s in scores if low <= s < high),
        )
        for label, low, high in buckets
    ]

    # --- Attendance over time (by hour of check-in) ---
    sql = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('hour', ci.checked_in_at), 'HH24:00') AS hour,
            COUNT(*) AS count
        FROM checkins ci
        JOIN registrations r ON r.id = ci.registration_id
        WHERE r.event_id = :event_id AND ci.status = 'active'
        GROUP BY DATE_TRUNC('hour', ci.checked_in_at)
        ORDER BY DATE_TRUNC('hour', ci.checked_in_at)
    """)
    attendance_rows = db.execute(sql, {"event_id": str(event_id)}).mappings().all()
    attendance_over_time = [
        AttendanceTimePoint(hour=row["hour"], count=int(row["count"]))
        for row in attendance_rows
    ]

    # --- Announcements (single aggregation query, no N+1) ---
    announcement_rows = (
        db.query(
            Announcement.title,
            Announcement.type,
            func.count(AnnouncementView.id).label("view_count"),
        )
        .outerjoin(AnnouncementView, Announcement.id == AnnouncementView.announcement_id)
        .filter(Announcement.event_id == event_id, Announcement.is_published == True)
        .group_by(Announcement.id, Announcement.title, Announcement.type)
        .all()
    )
    announcement_stats = []
    total_views = 0
    for ann in announcement_rows:
        vc = int(ann.view_count)
        total_views += vc
        announcement_stats.append(
            AnnouncementViewStat(
                title=ann.title,
                view_count=vc,
                type=ann.type,
            )
        )

    return EventAnalytics(
        event_id=str(event_id),
        total_registrations=total_registrations,
        checked_in_count=checked_in_count,
        not_checked_in_count=not_checked_in_count,
        check_in_percentage=check_in_percentage,
        teams_formed=teams_formed,
        submissions_count=submissions_count,
        evaluated_submissions=evaluated_submissions,
        average_score=average_score,
        score_distribution=score_distribution,
        attendance_over_time=attendance_over_time,
        announcement_stats=announcement_stats,
        total_announcement_views=total_views,
    )
