"""FastAPI dependencies for authentication and authorization."""

import uuid
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

DbDep = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbDep,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Extract and validate user from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type (expected access token)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, uuid.UUID(payload.sub))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_organizer(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require organizer role."""
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer access required",
        )
    return current_user


def require_participant(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require participant role."""
    if current_user.role != "participant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Participant access required",
        )
    return current_user


def require_judge(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require judge role."""
    if current_user.role != "judge":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Judge access required",
        )
    return current_user


def require_any_authenticated(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Require any authenticated user (any role)."""
    return current_user