"""Security utilities: password hashing and JWT token handling."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from pydantic import BaseModel, ValidationError

from app.core.config import settings


class TokenPayload(BaseModel):
    """JWT token payload structure."""

    sub: str  # user_id as string
    role: str
    exp: int  # expiration timestamp
    iat: int  # issued at timestamp
    type: str  # "access" or "refresh"


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    # bcrypt has a 72 byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.jwt_access_token_expire_minutes
        )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> TokenPayload:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError as e:
        raise ValueError("Token has expired") from e
    except jwt.InvalidTokenError as e:
        raise ValueError("Invalid token") from e
    except ValidationError as e:
        raise ValueError("Invalid token payload") from e