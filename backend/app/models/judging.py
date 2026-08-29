"""Judging-related models: JudgeAssignment, Rubric, RubricCriteria, Evaluation, EvaluationScore."""

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class JudgeAssignment(Base):
    """Assigns a judge to evaluate a specific submission."""

    __tablename__ = "judge_assignments"
    __table_args__ = (
        UniqueConstraint("judge_id", "submission_id", name="uq_judge_submission"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    judge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    judge: Mapped["User"] = relationship("User", back_populates="judge_assignments")
    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="judge_assignments"
    )

    def __repr__(self) -> str:
        return f"<JudgeAssignment judge={self.judge_id} submission={self.submission_id}>"


class Rubric(Base):
    """Judging rubric scoped to an event."""

    __tablename__ = "rubrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    event: Mapped["Event"] = relationship("Event", back_populates="rubrics")
    criteria: Mapped[list["RubricCriteria"]] = relationship(
        "RubricCriteria",
        back_populates="rubric",
        cascade="all, delete-orphan",
        order_by="RubricCriteria.sort_order",
    )

    def __repr__(self) -> str:
        return f"<Rubric id={self.id} name={self.name!r}>"


class RubricCriteria(Base):
    """Individual criterion within a rubric."""

    __tablename__ = "rubric_criteria"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    rubric_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rubrics.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    rubric: Mapped["Rubric"] = relationship("Rubric", back_populates="criteria")
    evaluation_scores: Mapped[list["EvaluationScore"]] = relationship(
        "EvaluationScore", back_populates="criterion"
    )

    def __repr__(self) -> str:
        return f"<RubricCriteria id={self.id} name={self.name!r}>"


class Evaluation(Base):
    """A judge's evaluation of a submission."""

    __tablename__ = "evaluations"
    __table_args__ = (
        # A judge can only have one SUBMITTED evaluation per submission
        UniqueConstraint(
            "submission_id",
            "judge_id",
            "status",
            name="uq_evaluation_judge_submission_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    judge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("draft", "submitted", name="evaluation_status"),
        nullable=False,
        default="draft",
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="evaluations"
    )
    judge: Mapped["User"] = relationship("User", back_populates="evaluations")
    scores: Mapped[list["EvaluationScore"]] = relationship(
        "EvaluationScore", back_populates="evaluation", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Evaluation id={self.id} judge={self.judge_id}>"


class EvaluationScore(Base):
    """Per-criterion score within an evaluation."""

    __tablename__ = "evaluation_scores"
    __table_args__ = (
        # One score per criterion per evaluation
        UniqueConstraint(
            "evaluation_id", "criterion_id", name="uq_score_evaluation_criterion"
        ),
        CheckConstraint("score >= 0", name="ck_score_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    evaluation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("evaluations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    criterion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rubric_criteria.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    evaluation: Mapped["Evaluation"] = relationship(
        "Evaluation", back_populates="scores"
    )
    criterion: Mapped["RubricCriteria"] = relationship(
        "RubricCriteria", back_populates="evaluation_scores"
    )

    def __repr__(self) -> str:
        return f"<EvaluationScore eval={self.evaluation_id} criterion={self.criterion_id} score={self.score}>"
