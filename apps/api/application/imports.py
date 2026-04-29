from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from models.db import ImportBatch, ImportStatus, ImportType, Residence, User

from .shared import NotFoundError


@dataclass(slots=True)
class StartImportBatch:
    residence_id: int
    import_type: ImportType
    filename: str
    uploaded_by: int


class ImportBatchService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def start_batch(self, command: StartImportBatch) -> ImportBatch:
        self._ensure_residence_exists(command.residence_id)
        self._ensure_user_exists(command.uploaded_by)

        batch = ImportBatch(
            residence_id=command.residence_id,
            import_type=command.import_type,
            filename=command.filename,
            status=ImportStatus.uploaded,
            uploaded_by=command.uploaded_by,
        )
        self.db.add(batch)
        self.db.flush()
        return batch

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
