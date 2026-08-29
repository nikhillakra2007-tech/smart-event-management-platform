"""Registration and CheckIn models."""

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Registration(Base):
    """Records a participant's registration for an event."""

    __tablename__ = "registrations"
    __table_args__ = (
        # One registration per user per event
        UniqueConstraint("event_id", "user_id", name="uq_registration_event_user"),
        # Registration number unique within an event
        UniqueConstraint(
            "event_id", "registration_number", name="uq_registration_number_event"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    registration_number: Mapped[str] = mapped_column(String(50), nullable=False)
    # qr_token: globally unique token for QR verification
    qr_token: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    registration_status: Mapped[str] = mapped_column(
        Enum("pending", "confirmed", "cancelled", name="registration_status"),
        nullable=False,
        default="confirmed",
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="registrations")
    user: Mapped["User"] = relationship("User", back_populates="registrations")
    checkins: Mapped[list["CheckIn"]] = relationship(
        "CheckIn", back_populates="registration", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Registration id={self.id} "
            f"event={self.event_id} user={self.user_id}>"
        )


class CheckIn(Base):
    """Records a participant check-in at an event."""

    __tablename__ = "checkins"
    __table_args__ = (
        # Prevent duplicate ACTIVE check-ins for same registration
        Index(
            "ix_checkins_registration_active",
            "registration_id",
            "status",
            unique=True,
            postgresql_where="status = 'active'",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    registration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("registrations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # user_id of the organizer/staff who performed the check-in
    checked_in_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("active", "cancelled", name="checkin_status"),
        nullable=False,
        default="active",
    )

    # Relationships
    registration: Mapped["Registration"] = relationship(
        "Registration", back_populates="checkins"
    )

    def __repr__(self) -> str:
        return f"<CheckIn id={self.id} registration={self.registration_id}>"
