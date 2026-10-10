"""Planner service — handles Schedule, Task Milestones, Budget, and Template Generation."""

import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.planner import EventScheduleItem, EventPlannerTask, EventBudgetItem
from app.schemas.planner import (
    ScheduleItemCreate,
    PlannerTaskCreate,
    PlannerTaskUpdate,
    BudgetItemCreate,
    BudgetItemUpdate,
    GeneratePlanTemplateRequest,
    PlannerOverviewResponse,
    ScheduleItemResponse,
    PlannerTaskResponse,
    BudgetItemResponse,
)


# ---------------------------------------------------------------------------
# Schedule Operations
# ---------------------------------------------------------------------------

def list_schedule_items(db: Session, event_id: uuid.UUID) -> list[EventScheduleItem]:
    """List all schedule items for an event ordered by day and start time."""
    return (
        db.query(EventScheduleItem)
        .filter(EventScheduleItem.event_id == event_id)
        .order_by(EventScheduleItem.day_number.asc(), EventScheduleItem.order_index.asc(), EventScheduleItem.start_time.asc())
        .all()
    )


def create_schedule_item(db: Session, event_id: uuid.UUID, data: ScheduleItemCreate) -> EventScheduleItem:
    """Create a new schedule item."""
    item = EventScheduleItem(
        event_id=event_id,
        title=data.title,
        description=data.description,
        day_number=data.day_number,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        category=data.category,
        speaker=data.speaker,
        is_milestone=data.is_milestone,
        order_index=data.order_index,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_schedule_item(db: Session, event_id: uuid.UUID, item_id: uuid.UUID) -> None:
    """Delete a schedule item."""
    item = (
        db.query(EventScheduleItem)
        .filter(EventScheduleItem.id == item_id, EventScheduleItem.event_id == event_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule item not found")
    db.delete(item)
    db.commit()


# ---------------------------------------------------------------------------
# Planner Task Operations
# ---------------------------------------------------------------------------

def list_planner_tasks(db: Session, event_id: uuid.UUID) -> list[EventPlannerTask]:
    """List all planner tasks for an event."""
    return (
        db.query(EventPlannerTask)
        .filter(EventPlannerTask.event_id == event_id)
        .order_by(EventPlannerTask.order_index.asc(), EventPlannerTask.created_at.desc())
        .all()
    )


def create_planner_task(db: Session, event_id: uuid.UUID, data: PlannerTaskCreate) -> EventPlannerTask:
    """Create a new planner checklist task."""
    task = EventPlannerTask(
        event_id=event_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        category=data.category,
        assignee=data.assignee,
        due_date=data.due_date,
        order_index=data.order_index,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_planner_task(db: Session, event_id: uuid.UUID, task_id: uuid.UUID, data: PlannerTaskUpdate) -> EventPlannerTask:
    """Update status, priority, or details of a planner task."""
    task = (
        db.query(EventPlannerTask)
        .filter(EventPlannerTask.id == task_id, EventPlannerTask.event_id == event_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(task, field, val)

    if data.status == "completed" and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    elif data.status and data.status != "completed":
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return task


def delete_planner_task(db: Session, event_id: uuid.UUID, task_id: uuid.UUID) -> None:
    """Delete a planner task."""
    task = (
        db.query(EventPlannerTask)
        .filter(EventPlannerTask.id == task_id, EventPlannerTask.event_id == event_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()


# ---------------------------------------------------------------------------
# Budget Item Operations
# ---------------------------------------------------------------------------

def list_budget_items(db: Session, event_id: uuid.UUID) -> list[EventBudgetItem]:
    """List all budget items for an event."""
    return (
        db.query(EventBudgetItem)
        .filter(EventBudgetItem.event_id == event_id)
        .order_by(EventBudgetItem.created_at.asc())
        .all()
    )


def create_budget_item(db: Session, event_id: uuid.UUID, data: BudgetItemCreate) -> EventBudgetItem:
    """Create a new budget item."""
    item = EventBudgetItem(
        event_id=event_id,
        item_name=data.item_name,
        category=data.category,
        planned_cost=data.planned_cost,
        actual_cost=data.actual_cost,
        status=data.status,
        vendor=data.vendor,
        notes=data.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_budget_item(db: Session, event_id: uuid.UUID, item_id: uuid.UUID) -> None:
    """Delete a budget item."""
    item = (
        db.query(EventBudgetItem)
        .filter(EventBudgetItem.id == item_id, EventBudgetItem.event_id == event_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget item not found")
    db.delete(item)
    db.commit()


# ---------------------------------------------------------------------------
# Overview & Template Generation
# ---------------------------------------------------------------------------

def get_planner_overview(db: Session, event_id: uuid.UUID) -> PlannerOverviewResponse:
    """Return all planner data and aggregated metrics for the event."""
    schedule_items = list_schedule_items(db, event_id)
    tasks = list_planner_tasks(db, event_id)
    budget_items = list_budget_items(db, event_id)

    total_planned = sum(b.planned_cost for b in budget_items)
    total_actual = sum(b.actual_cost for b in budget_items)

    task_stats = {
        "todo": sum(1 for t in tasks if t.status == "todo"),
        "in_progress": sum(1 for t in tasks if t.status == "in_progress"),
        "completed": sum(1 for t in tasks if t.status == "completed"),
        "blocked": sum(1 for t in tasks if t.status == "blocked"),
        "total": len(tasks),
    }

    return PlannerOverviewResponse(
        schedule_items=[ScheduleItemResponse.model_validate(s) for s in schedule_items],
        tasks=[PlannerTaskResponse.model_validate(t) for t in tasks],
        budget_items=[BudgetItemResponse.model_validate(b) for b in budget_items],
        total_planned_budget=round(total_planned, 2),
        total_actual_budget=round(total_actual, 2),
        task_stats=task_stats,
    )


def generate_plan_template(
    db: Session, event_id: uuid.UUID, req: GeneratePlanTemplateRequest
) -> PlannerOverviewResponse:
    """
    Generate standard comprehensive schedule agenda, milestone tasks, and budget items
    tailored to the chosen template type.
    """
    # Verify event exists
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    template = req.template_type
    budget = req.estimated_budget

    if template == "hackathon_24h":
        schedule_data = [
            {"day": 1, "start": "08:30 AM", "end": "09:30 AM", "title": "Check-in, Badges & Breakfast", "cat": "meal", "loc": "Main Lobby", "milestone": False, "order": 1},
            {"day": 1, "start": "09:30 AM", "end": "10:30 AM", "title": "Opening Ceremony & Challenge Brief", "cat": "ceremony", "loc": "Main Auditorium", "milestone": True, "speaker": "Organizing Committee", "order": 2},
            {"day": 1, "start": "10:30 AM", "end": "11:30 AM", "title": "Team Formation & Teammate Discovery", "cat": "networking", "loc": "Collaboration Floor", "milestone": False, "order": 3},
            {"day": 1, "start": "11:30 AM", "end": "12:00 PM", "title": "Hacking Begins 🚀", "cat": "milestone", "loc": "All Hack Pods", "milestone": True, "order": 4},
            {"day": 1, "start": "01:00 PM", "end": "02:00 PM", "title": "Lunch & Sponsor Tech Talks", "cat": "meal", "loc": "Dining Area", "milestone": False, "order": 5},
            {"day": 1, "start": "03:30 PM", "end": "05:00 PM", "title": "Mentorship Check-in Round 1", "cat": "workshop", "loc": "Mentor Stations", "milestone": False, "order": 6},
            {"day": 1, "start": "07:30 PM", "end": "08:30 PM", "title": "Dinner & Lightning Demos", "cat": "meal", "loc": "Dining Area", "milestone": False, "order": 7},
            {"day": 1, "start": "11:59 PM", "end": "12:30 AM", "title": "Midnight Pizza & Energy Boost", "cat": "meal", "loc": "Snack Corner", "milestone": False, "order": 8},
            {"day": 2, "start": "08:00 AM", "end": "09:00 AM", "title": "Day 2 Breakfast & Coffee Bar", "cat": "meal", "loc": "Dining Area", "milestone": False, "order": 9},
            {"day": 2, "start": "10:30 AM", "end": "11:00 AM", "title": "Project Submission Deadline ⏰", "cat": "milestone", "loc": "Platform", "milestone": True, "order": 10},
            {"day": 2, "start": "11:30 AM", "end": "01:30 PM", "title": "Judging & Demo Presentations", "cat": "judging", "loc": "Demo Arena", "milestone": True, "order": 11},
            {"day": 2, "start": "02:00 PM", "end": "03:00 PM", "title": "Awards Ceremony & Wrap-up 🏆", "cat": "ceremony", "loc": "Main Auditorium", "milestone": True, "speaker": "Judges & Sponsors", "order": 12},
        ]
        task_data = [
            {"title": "Finalize venue WiFi and high-speed power drops", "cat": "logistics", "pri": "critical", "status": "in_progress", "due": "2 Days Before"},
            {"title": "Confirm 6 industry judges & load scoring rubrics", "cat": "mentors", "pri": "critical", "status": "todo", "due": "3 Days Before"},
            {"title": "Order participant swag kits, lanyards & custom stickers", "cat": "prizes", "pri": "high", "status": "completed", "due": "1 Week Before"},
            {"title": "Coordinate catering for Day 1 Lunch/Dinner + Midnight Snack", "cat": "catering", "pri": "high", "status": "in_progress", "due": "4 Days Before"},
            {"title": "Test live leaderboard and QR check-in stations", "cat": "platform", "pri": "critical", "status": "completed", "due": "1 Day Before"},
            {"title": "Send reminder broadcast with arrival & parking guidelines", "cat": "marketing", "pri": "medium", "status": "todo", "due": "24 Hours Before"},
            {"title": "Prepare winning trophies, certificates & prize checks", "cat": "prizes", "pri": "high", "status": "todo", "due": "Day of Event"},
        ]
        budget_data = [
            {"name": "Venue & Audio-Visual Production", "cat": "venue", "plan": budget * 0.35, "actual": budget * 0.32, "status": "approved", "vendor": "Innovation Convention Center"},
            {"name": "Catering (Meals, Coffee, Midnight Snacks)", "cat": "catering", "plan": budget * 0.30, "actual": budget * 0.28, "status": "approved", "vendor": "Gourmet Event Catering"},
            {"name": "Prize Pool & Winner Grants", "cat": "prizes", "plan": budget * 0.20, "actual": budget * 0.20, "status": "approved", "vendor": "Sponsorship Fund"},
            {"name": "Swag Bags, T-Shirts & Badges", "cat": "logistics", "plan": budget * 0.10, "actual": budget * 0.09, "status": "paid", "vendor": "PrintCraft Media"},
            {"name": "Emergency Contingency & Hardware Supplies", "cat": "tech", "plan": budget * 0.05, "actual": 0.0, "status": "planned", "vendor": "Internal Reserve"},
        ]
    elif template == "conference":
        schedule_data = [
            {"day": 1, "start": "08:00 AM", "end": "09:00 AM", "title": "Registration, Welcome Kit & Coffee", "cat": "meal", "loc": "Grand Foyer", "milestone": False, "order": 1},
            {"day": 1, "start": "09:00 AM", "end": "10:15 AM", "title": "Visionary Keynote Address", "cat": "keynote", "loc": "Main Stage", "milestone": True, "speaker": "Keynote Guest", "order": 2},
            {"day": 1, "start": "10:30 AM", "end": "12:00 PM", "title": "Panel: Next-Gen AI & System Architectures", "cat": "workshop", "loc": "Hall A", "milestone": False, "order": 3},
            {"day": 1, "start": "12:00 PM", "end": "01:30 PM", "title": "Networking Luncheon", "cat": "meal", "loc": "Dining Terrace", "milestone": False, "order": 4},
            {"day": 1, "start": "01:30 PM", "end": "03:30 PM", "title": "Technical Deep-Dive Tracks & Workshops", "cat": "workshop", "loc": "Breakout Rooms 1-4", "milestone": False, "order": 5},
            {"day": 1, "start": "04:00 PM", "end": "05:30 PM", "title": "Fireside Chat & Closing Keynote", "cat": "keynote", "loc": "Main Stage", "milestone": True, "order": 6},
        ]
        task_data = [
            {"title": "Confirm keynote speakers flight & accommodation details", "cat": "mentors", "pri": "critical", "status": "completed", "due": "2 Weeks Before"},
            {"title": "Set up livestreaming & stage recording equipment", "cat": "platform", "pri": "high", "status": "in_progress", "due": "1 Day Before"},
            {"title": "Print conference programs & attendee badges", "cat": "logistics", "pri": "high", "status": "completed", "due": "3 Days Before"},
            {"title": "Sponsor booth placement & banner installations", "cat": "sponsors", "pri": "medium", "status": "todo", "due": "Evening Before"},
        ]
        budget_data = [
            {"name": "Auditorium & Stage Rental", "cat": "venue", "plan": budget * 0.40, "actual": budget * 0.40, "status": "paid", "vendor": "Grand Expo Center"},
            {"name": "Keynote Speaker Honorariums & Travel", "cat": "general", "plan": budget * 0.25, "actual": budget * 0.22, "status": "approved", "vendor": "Speaker Agency"},
            {"name": "Gourmet Buffet & Tea Breaks", "cat": "catering", "plan": budget * 0.25, "actual": budget * 0.24, "status": "approved", "vendor": "Deluxe Catering Co."},
            {"name": "Marketing, Signage & Live Media", "cat": "marketing", "plan": budget * 0.10, "actual": budget * 0.08, "status": "paid", "vendor": "PixelMedia Studio"},
        ]
    else:  # workshop or generic
        schedule_data = [
            {"day": 1, "start": "09:00 AM", "end": "09:30 AM", "title": "Attendee Arrival & Setup", "cat": "general", "loc": "Lab 1", "milestone": False, "order": 1},
            {"day": 1, "start": "09:30 AM", "end": "11:30 AM", "title": "Hands-on Masterclass: Part 1", "cat": "workshop", "loc": "Lab 1", "milestone": True, "speaker": "Lead Instructor", "order": 2},
            {"day": 1, "start": "11:30 AM", "end": "12:00 PM", "title": "Coffee Break & Group Q&A", "cat": "meal", "loc": "Lounge", "milestone": False, "order": 3},
            {"day": 1, "start": "12:00 PM", "end": "02:00 PM", "title": "Guided Project Building & Code Review", "cat": "workshop", "loc": "Lab 1", "milestone": True, "order": 4},
            {"day": 1, "start": "02:00 PM", "end": "02:30 PM", "title": "Certificates & Open Discussions", "cat": "ceremony", "loc": "Lab 1", "milestone": False, "order": 5},
        ]
        task_data = [
            {"title": "Prepare cloud sandbox environments and repo starter kits", "cat": "platform", "pri": "critical", "status": "completed", "due": "3 Days Before"},
            {"title": "Print workshop cheat sheets & setup guide", "cat": "logistics", "pri": "medium", "status": "todo", "due": "1 Day Before"},
            {"title": "Arrange refreshments & coffee station", "cat": "catering", "pri": "medium", "status": "in_progress", "due": "Day of Event"},
        ]
        budget_data = [
            {"name": "Lab & High-Spec Computing Facility", "cat": "venue", "plan": budget * 0.45, "actual": budget * 0.45, "status": "approved", "vendor": "TechLab Center"},
            {"name": "Refreshments & Coffee", "cat": "catering", "plan": budget * 0.25, "actual": budget * 0.20, "status": "approved", "vendor": "Artisan Coffee"},
            {"name": "Student Kits & Software Licenses", "cat": "tech", "plan": budget * 0.30, "actual": budget * 0.28, "status": "paid", "vendor": "Cloud Provider"},
        ]

    # Insert items
    for s in schedule_data:
        item = EventScheduleItem(
            event_id=event_id,
            title=s["title"],
            day_number=s["day"],
            start_time=s["start"],
            end_time=s["end"],
            location=s["loc"],
            category=s["cat"],
            speaker=s.get("speaker"),
            is_milestone=s["milestone"],
            order_index=s["order"],
        )
        db.add(item)

    for t in task_data:
        task = EventPlannerTask(
            event_id=event_id,
            title=t["title"],
            status=t["status"],
            priority=t["pri"],
            category=t["cat"],
            due_date=t["due"],
        )
        db.add(task)

    for b in budget_data:
        b_item = EventBudgetItem(
            event_id=event_id,
            item_name=b["name"],
            category=b["cat"],
            planned_cost=round(b["plan"], 2),
            actual_cost=round(b["actual"], 2),
            status=b["status"],
            vendor=b["vendor"],
        )
        db.add(b_item)

    db.commit()

    return get_planner_overview(db, event_id)
