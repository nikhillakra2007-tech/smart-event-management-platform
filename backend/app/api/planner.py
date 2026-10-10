"""Event Planner API router."""

import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_authenticated, require_organizer
from app.core.database import get_db
from app.models.user import User
from app.schemas.planner import (
    ScheduleItemCreate,
    ScheduleItemResponse,
    PlannerTaskCreate,
    PlannerTaskUpdate,
    PlannerTaskResponse,
    BudgetItemCreate,
    BudgetItemResponse,
    GeneratePlanTemplateRequest,
    PlannerOverviewResponse,
)
from app.services import planner_service

router = APIRouter(prefix="/events/{event_id}/planner", tags=["Event Planner"])

DbDep = Annotated[Session, Depends(get_db)]


@router.get(
    "",
    response_model=PlannerOverviewResponse,
    summary="Get complete planner overview for an event",
)
def get_planner_overview(
    event_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_any_authenticated)],
):
    """Return all schedule items, tasks, and budget data with summary statistics."""
    return planner_service.get_planner_overview(db, event_id)


# ---------------------------------------------------------------------------
# Schedule Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/schedule",
    response_model=list[ScheduleItemResponse],
    summary="List event schedule agenda items",
)
def list_schedule(
    event_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_any_authenticated)],
):
    """Return ordered schedule timeline for the event."""
    return planner_service.list_schedule_items(db, event_id)


@router.post(
    "/schedule",
    response_model=ScheduleItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a schedule item",
)
def create_schedule_item(
    event_id: uuid.UUID,
    data: ScheduleItemCreate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Add a new scheduled session/milestone to event timeline (organizer only)."""
    return planner_service.create_schedule_item(db, event_id, data)


@router.delete(
    "/schedule/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a schedule item",
)
def delete_schedule_item(
    event_id: uuid.UUID,
    item_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Delete a schedule item (organizer only)."""
    planner_service.delete_schedule_item(db, event_id, item_id)


# ---------------------------------------------------------------------------
# Task Checklist Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/tasks",
    response_model=list[PlannerTaskResponse],
    summary="List planner tasks",
)
def list_tasks(
    event_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Return all planning checklist tasks for the event."""
    return planner_service.list_planner_tasks(db, event_id)


@router.post(
    "/tasks",
    response_model=PlannerTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a planner task",
)
def create_task(
    event_id: uuid.UUID,
    data: PlannerTaskCreate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Create a new planning milestone task (organizer only)."""
    return planner_service.create_planner_task(db, event_id, data)


@router.patch(
    "/tasks/{task_id}",
    response_model=PlannerTaskResponse,
    summary="Update task status or details",
)
def update_task(
    event_id: uuid.UUID,
    task_id: uuid.UUID,
    data: PlannerTaskUpdate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Update task status, priority, or details (organizer only)."""
    return planner_service.update_planner_task(db, event_id, task_id, data)


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a planner task",
)
def delete_task(
    event_id: uuid.UUID,
    task_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Delete a task (organizer only)."""
    planner_service.delete_planner_task(db, event_id, task_id)


# ---------------------------------------------------------------------------
# Budget Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/budget",
    response_model=list[BudgetItemResponse],
    summary="List budget items",
)
def list_budget(
    event_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Return all budget items for the event."""
    return planner_service.list_budget_items(db, event_id)


@router.post(
    "/budget",
    response_model=BudgetItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create budget item",
)
def create_budget(
    event_id: uuid.UUID,
    data: BudgetItemCreate,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Add a new budget expense item (organizer only)."""
    return planner_service.create_budget_item(db, event_id, data)


@router.delete(
    "/budget/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete budget item",
)
def delete_budget(
    event_id: uuid.UUID,
    item_id: uuid.UUID,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """Delete a budget item (organizer only)."""
    planner_service.delete_budget_item(db, event_id, item_id)


# ---------------------------------------------------------------------------
# Smart Generator Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/generate",
    response_model=PlannerOverviewResponse,
    summary="Generate standard schedule, tasks, and budget from template",
)
def generate_template(
    event_id: uuid.UUID,
    data: GeneratePlanTemplateRequest,
    db: DbDep,
    current_user: Annotated[User, Depends(require_organizer)],
):
    """1-Click Smart Planner generator for Hackathons, Conferences, or Workshops (organizer only)."""
    return planner_service.generate_plan_template(db, event_id, data)
