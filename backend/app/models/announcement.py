"""Announcement and AnnouncementView models."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Announcement(Base):
    """Event announcement created by an organizer."""

    __tablename__ = "announcements"

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
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(
        Enum("general", "schedule", "venue", "critical", name="announcement_type"),
        nullable=False,
        default="general",
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="announcements")
    creator: Mapped["User | None"] = relationship(
        "User", back_populates="announcements_created"
    )
    views: Mapped[list["AnnouncementView"]] = relationship(
        "AnnouncementView",
        back_populates="announcement",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Announcement id={self.id} title={self.title!r}>"


class AnnouncementView(Base):
    """Records when a user views an announcement — used for engagement analytics."""

    __tablename__ = "announcement_views"
    __table_args__ = (
        # One view record per user per announcement (idempotent view tracking)
        UniqueConstraint(
            "announcement_id", "user_id", name="uq_announcement_view_user"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    announcement_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("announcements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    announcement: Mapped["Announcement"] = relationship(
        "Announcement", back_populates="views"
    )

    def __repr__(self) -> str:
        return f"<AnnouncementView ann={self.announcement_id} user={self.user_id}>"
