from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.db import EntityStatus, User, UserRole

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))

_PASSWORD_SCHEME = "pbkdf2_sha256"
_PASSWORD_ITERATIONS = 600_000
_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(slots=True)
class AuthenticatedUser:
    id: int
    residence_id: int
    role: UserRole


@dataclass(slots=True)
class AuthenticatedAdmin:
    id: int
    residence_id: int
    role: UserRole


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        _PASSWORD_ITERATIONS,
    )
    encoded_digest = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return f"{_PASSWORD_SCHEME}${_PASSWORD_ITERATIONS}${salt}${encoded_digest}"


def verify_password(password: str, stored_password: str) -> bool:
    parts = stored_password.split("$")
    if len(parts) != 4 or parts[0] != _PASSWORD_SCHEME:
        return secrets.compare_digest(stored_password, password)

    _, iterations_text, salt, expected_digest = parts
    try:
        iterations = int(iterations_text)
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    encoded_digest = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return secrets.compare_digest(encoded_digest, expected_digest)


def create_access_token(*, user: User) -> tuple[str, int]:
    if JWT_ALGORITHM != "HS256":
        raise RuntimeError(f"unsupported JWT algorithm: {JWT_ALGORITHM}")

    expires_in = JWT_EXPIRES_MINUTES * 60
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "residence_id": user.residence_id,
        "exp": int((datetime.now(UTC) + timedelta(seconds=expires_in)).timestamp()),
    }
    return _encode_jwt(payload), expires_in


def authenticate_resident(*, db: Session, email: str, password: str) -> User | None:
    user = db.scalar(
        select(User).where(
            User.email == normalize_email(email),
        )
    )
    if user is None:
        return None
    if user.role != UserRole.resident or user.status != EntityStatus.active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def authenticate_admin(*, db: Session, email: str, password: str) -> User | None:
    user = db.scalar(
        select(User).where(
            User.email == normalize_email(email),
        )
    )
    if user is None:
        return None
    if user.role != UserRole.residence_admin or user.status != EntityStatus.active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def get_current_resident_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Authentication credentials were not provided")

    payload = _decode_jwt(credentials.credentials)
    try:
        user_id = int(payload["sub"])
        residence_id = int(payload["residence_id"])
        role = UserRole(payload["role"])
    except (KeyError, TypeError, ValueError):
        raise _unauthorized("Invalid authentication token") from None

    if role != UserRole.resident:
        raise _forbidden("User is not a resident")

    user = db.get(User, user_id)
    if user is None or user.status != EntityStatus.active:
        raise _unauthorized("User account is not available")
    if user.role != UserRole.resident or user.residence_id != residence_id:
        raise _forbidden("User is not authorized for resident access")

    return AuthenticatedUser(id=user.id, residence_id=user.residence_id, role=user.role)


def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> AuthenticatedAdmin:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Authentication credentials were not provided")

    payload = _decode_jwt(credentials.credentials)
    try:
        user_id = int(payload["sub"])
        residence_id = int(payload["residence_id"])
        role = UserRole(payload["role"])
    except (KeyError, TypeError, ValueError):
        raise _unauthorized("Invalid authentication token") from None

    if role != UserRole.residence_admin:
        raise _forbidden("User is not authorized for admin access")

    user = db.get(User, user_id)
    if user is None or user.status != EntityStatus.active:
        raise _unauthorized("User account is not available")
    if user.role != UserRole.residence_admin or user.residence_id != residence_id:
        raise _forbidden("User is not authorized for admin access")

    return AuthenticatedAdmin(id=user.id, residence_id=user.residence_id, role=user.role)


def _encode_jwt(payload: dict[str, Any]) -> str:
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    encoded_header = _urlsafe_b64encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    encoded_payload = _urlsafe_b64encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("ascii"),
        hashlib.sha256,
    ).digest()
    encoded_signature = _urlsafe_b64encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def _decode_jwt(token: str) -> dict[str, Any]:
    if JWT_ALGORITHM != "HS256":
        raise _unauthorized("Invalid authentication token")

    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError:
        raise _unauthorized("Invalid authentication token") from None

    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        provided_signature = _urlsafe_b64decode(encoded_signature)
        header = json.loads(_urlsafe_b64decode(encoded_header))
        payload = json.loads(_urlsafe_b64decode(encoded_payload))
    except (ValueError, json.JSONDecodeError):
        raise _unauthorized("Invalid authentication token") from None

    if not secrets.compare_digest(provided_signature, expected_signature):
        raise _unauthorized("Invalid authentication token")
    if header.get("alg") != JWT_ALGORITHM or header.get("typ") != "JWT":
        raise _unauthorized("Invalid authentication token")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at <= int(datetime.now(UTC).timestamp()):
        raise _unauthorized("Authentication token has expired")
    return payload


def _urlsafe_b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _forbidden(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
