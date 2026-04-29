from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from models.db import (
    Notification,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    Residence,
    Unit,
    User,
)

from .shared import NotFoundError


@dataclass(slots=True)
class CreateNotification:
    residence_id: int
    recipient_user_id: int
    type: NotificationType
    channel: NotificationChannel
    title: str
    message: str
    unit_id: int | None = None
    status: NotificationStatus = NotificationStatus.pending


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_notification(self, command: CreateNotification) -> Notification:
        self._ensure_residence_exists(command.residence_id)
        self._ensure_user_exists(command.recipient_user_id)
        if command.unit_id is not None:
            self._ensure_unit_exists(command.unit_id)

        notification = Notification(
            residence_id=command.residence_id,
            recipient_user_id=command.recipient_user_id,
            unit_id=command.unit_id,
            type=command.type,
            channel=command.channel,
            title=command.title,
            message=command.message,
            status=command.status,
        )
        self.db.add(notification)
        self.db.flush()
        return notification

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

    def _ensure_unit_exists(self, unit_id: int) -> Unit:
        unit = self.db.get(Unit, unit_id)
        if unit is None:
            raise NotFoundError("Unit", unit_id)
        return unit
