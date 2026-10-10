"""Event Planner models — Schedule Items, Planning Tasks, and Budget Allocations."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EventScheduleItem(Base):
    """Represents a scheduled agenda item or milestone in the event timeline."""

    __tablename__ = "event_schedule_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    day_number: Mapped[int] = mapped_column(default=1, nullable=False)
    start_time: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "09:00 AM" or ISO string
    end_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)  # e.g., "Main Stage", "Workshop Room B"
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="general"
    )  # keynote, workshop, milestone, meal, ceremony, networking, judging
    speaker: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_milestone: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event")

    def __repr__(self) -> str:
        return f"<EventScheduleItem id={self.id} title={self.title!r}>"


class EventPlannerTask(Base):
    """Represents an organizer checklist/milestone task for planning the event."""

    __tablename__ = "event_planner_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="todo"
    )  # todo, in_progress, completed, blocked
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default="medium"
    )  # critical, high, medium, low
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="logistics"
    )  # logistics, marketing, sponsors, mentors, prizes, catering, platform
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    order_index: Mapped[int] = mapped_column(default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event")

    def __repr__(self) -> str:
        return f"<EventPlannerTask id={self.id} title={self.title!r} status={self.status}>"


class EventBudgetItem(Base):
    """Represents a budget/expense item for the event planning."""

    __tablename__ = "event_budget_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="general"
    )  # venue, catering, prizes, marketing, tech, logistics
    planned_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    actual_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="planned"
    )  # planned, approved, paid, cancelled
    vendor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event")

    def __repr__(self) -> str:
        return f"<EventBudgetItem id={self.id} item={self.item_name!r}>"
