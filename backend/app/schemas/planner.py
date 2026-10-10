"""Pydantic schemas for Event Planner — Schedule, Tasks, Budget, and Template Generator."""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Schedule Item Schemas
# ---------------------------------------------------------------------------

class ScheduleItemCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    day_number: int = 1
    start_time: str = Field(..., max_length=50)
    end_time: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=255)
    category: str = "general"
    speaker: str | None = Field(None, max_length=255)
    is_milestone: bool = False
    order_index: int = 0


class ScheduleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    title: str
    description: str | None = None
    day_number: int
    start_time: str
    end_time: str | None = None
    location: str | None = None
    category: str
    speaker: str | None = None
    is_milestone: bool
    order_index: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Planner Task Schemas
# ---------------------------------------------------------------------------

class PlannerTaskCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    status: str = "todo"  # todo, in_progress, completed, blocked
    priority: str = "medium"  # critical, high, medium, low
    category: str = "logistics"  # logistics, marketing, sponsors, mentors, prizes, catering, platform
    assignee: str | None = Field(None, max_length=255)
    due_date: str | None = Field(None, max_length=50)
    order_index: int = 0


class PlannerTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    category: str | None = None
    assignee: str | None = None
    due_date: str | None = None
    completed_at: datetime | None = None
    order_index: int | None = None


class PlannerTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    title: str
    description: str | None = None
    status: str
    priority: str
    category: str
    assignee: str | None = None
    due_date: str | None = None
    completed_at: datetime | None = None
    order_index: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Budget Item Schemas
# ---------------------------------------------------------------------------

class BudgetItemCreate(BaseModel):
    item_name: str = Field(..., max_length=255)
    category: str = "general"
    planned_cost: float = 0.0
    actual_cost: float = 0.0
    status: str = "planned"
    vendor: str | None = Field(None, max_length=255)
    notes: str | None = None


class BudgetItemUpdate(BaseModel):
    item_name: str | None = None
    category: str | None = None
    planned_cost: float | None = None
    actual_cost: float | None = None
    status: str | None = None
    vendor: str | None = None
    notes: str | None = None


class BudgetItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    item_name: str
    category: str
    planned_cost: float
    actual_cost: float
    status: str
    vendor: str | None = None
    notes: str | None = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Template Generator Payload
# ---------------------------------------------------------------------------

class GeneratePlanTemplateRequest(BaseModel):
    template_type: str = "hackathon_24h"  # hackathon_24h, hackathon_48h, conference, workshop
    estimated_budget: float = 5000.0
    custom_notes: str | None = None


class PlannerOverviewResponse(BaseModel):
    schedule_items: list[ScheduleItemResponse]
    tasks: list[PlannerTaskResponse]
    budget_items: list[BudgetItemResponse]
    total_planned_budget: float
    total_actual_budget: float
    task_stats: dict[str, int]
