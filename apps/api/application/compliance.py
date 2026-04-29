from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from models.db import AuditLog, Residence, User

from .shared import NotFoundError


@dataclass(slots=True)
class LogAuditEntry:
    residence_id: int
    actor_user_id: int
    entity_type: str
    entity_id: str
    action: str
    before_json: dict[str, Any] | None = None
    after_json: dict[str, Any] | None = None
    ip_address: str | None = None
    user_agent: str | None = None


class AuditLogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def log(self, command: LogAuditEntry) -> AuditLog:
        self._ensure_residence_exists(command.residence_id)
        self._ensure_user_exists(command.actor_user_id)

        audit_log = AuditLog(
            residence_id=command.residence_id,
            actor_user_id=command.actor_user_id,
            entity_type=command.entity_type,
            entity_id=command.entity_id,
            action=command.action,
            before_json=command.before_json,
            after_json=command.after_json,
            ip_address=command.ip_address,
            user_agent=command.user_agent,
        )
        self.db.add(audit_log)
        self.db.flush()
        return audit_log

    def _ensure_residence_exists(self, residence_id: int) -> Residence:
        residence = self.db.get(Residence, residence_id)
        if residence is None:
            raise NotFoundError("Residence", residence_id)
        return residence

    def _ensure_user_exists(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        return user
