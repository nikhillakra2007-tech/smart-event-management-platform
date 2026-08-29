"""User and ParticipantProfile models."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """Platform user — can be a participant, judge, or organizer."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    role: Mapped[str] = mapped_column(
        Enum("participant", "judge", "organizer", name="user_role"),
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
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
    participant_profile: Mapped["ParticipantProfile | None"] = relationship(
        "ParticipantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    registrations: Mapped[list["Registration"]] = relationship(
        "Registration", back_populates="user"
    )
    team_memberships: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="user"
    )
    judge_assignments: Mapped[list["JudgeAssignment"]] = relationship(
        "JudgeAssignment", back_populates="judge"
    )
    evaluations: Mapped[list["Evaluation"]] = relationship(
        "Evaluation", back_populates="judge"
    )
    announcements_created: Mapped[list["Announcement"]] = relationship(
        "Announcement", back_populates="creator"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"


class ParticipantProfile(Base):
    """Extended profile for participant users — supports team discovery."""

    __tablename__ = "participant_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    # PostgreSQL ARRAY columns for rule-based matching
    skills: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    preferred_roles: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    project_interests: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    user: Mapped["User"] = relationship("User", back_populates="participant_profile")

    def __repr__(self) -> str:
        return f"<ParticipantProfile user_id={self.user_id}>"
