from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from models.db import (
    AdminNote,
    FollowUpRecord,
    FollowUpStatus,
    FollowUpType,
    NoteVisibility,
    Residence,
    Unit,
    User,
)

from .shared import NotFoundError


@dataclass(slots=True)
class RecordFollowUp:
    residence_id: int
    unit_id: int
    created_by: int
    follow_up_type: FollowUpType
    message: str
    next_follow_up_date: date | None = None
    status: FollowUpStatus = FollowUpStatus.open


@dataclass(slots=True)
class AddAdminNote:
    residence_id: int
    unit_id: int
    created_by: int
    note: str
    visibility: NoteVisibility = NoteVisibility.internal_only


class CollectionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record_follow_up(self, command: RecordFollowUp) -> FollowUpRecord:
        self._ensure_residence_exists(command.residence_id)
        self._ensure_unit_exists(command.unit_id)
        self._ensure_user_exists(command.created_by)

        follow_up = FollowUpRecord(
            residence_id=command.residence_id,
            unit_id=command.unit_id,
            created_by=command.created_by,
            follow_up_type=command.follow_up_type,
            message=command.message,
            next_follow_up_date=command.next_follow_up_date,
            status=command.status,
        )
        self.db.add(follow_up)
        self.db.flush()
        return follow_up

    def add_admin_note(self, command: AddAdminNote) -> AdminNote:
        self._ensure_residence_exists(command.residence_id)
        self._ensure_unit_exists(command.unit_id)
        self._ensure_user_exists(command.created_by)

        note = AdminNote(
            residence_id=command.residence_id,
            unit_id=command.unit_id,
            created_by=command.created_by,
            note=command.note,
            visibility=command.visibility,
        )
        self.db.add(note)
        self.db.flush()
        return note

    def _ensure_residence_exists(self, residence_id: int) -> Residence:
        residence = self.db.get(Residence, residence_id)
        if residence is None:
            raise NotFoundError("Residence", residence_id)
        return residence

    def _ensure_unit_exists(self, unit_id: int) -> Unit:
        unit = self.db.get(Unit, unit_id)
        if unit is None:
            raise NotFoundError("Unit", unit_id)
        return unit

    def _ensure_user_exists(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        return user
