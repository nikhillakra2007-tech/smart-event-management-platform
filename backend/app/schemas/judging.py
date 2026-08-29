"""Judging Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class JudgeAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    judge_id: uuid.UUID
    submission_id: uuid.UUID
    assigned_at: datetime


class RubricCriteriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rubric_id: uuid.UUID
    name: str
    description: str | None
    max_score: float
    weight: float
    sort_order: int


class RubricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    event_id: uuid.UUID
    name: str
    description: str | None
    criteria: list[RubricCriteriaResponse]
    created_at: datetime
    updated_at: datetime


class EvaluationScoreInput(BaseModel):
    criterion_id: uuid.UUID
    score: float = Field(..., ge=0)


class EvaluationSubmit(BaseModel):
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    feedback: str | None = None
    scores: list[EvaluationScoreInput]


class EvaluationScoreResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    evaluation_id: uuid.UUID
    criterion_id: uuid.UUID
    score: float


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    submission_id: uuid.UUID
    judge_id: uuid.UUID
    feedback: str | None
    total_score: float | None
    status: Literal["draft", "submitted"]
    submitted_at: datetime | None
    updated_at: datetime
    scores: list[EvaluationScoreResponse] = []
