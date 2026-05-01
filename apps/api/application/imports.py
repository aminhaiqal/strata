from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.db import ImportBatch, ImportError, ImportStatus, ImportType, Residence, User

from .shared import NotFoundError


@dataclass(slots=True)
class StartImportBatch:
    residence_id: int
    import_type: ImportType
    filename: str
    uploaded_by: int


@dataclass(slots=True)
class RecordImportError:
    import_batch_id: int
    row_number: int
    field: str
    error_message: str
    raw_value: str | None = None


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

    def get_batch(self, *, residence_id: int, batch_id: int) -> ImportBatch:
        batch = self.db.scalar(
            select(ImportBatch).where(
                ImportBatch.id == batch_id,
                ImportBatch.residence_id == residence_id,
            )
        )
        if batch is None:
            raise NotFoundError("Import batch", batch_id)
        return batch

    def record_error(self, command: RecordImportError) -> ImportError:
        batch = self.db.get(ImportBatch, command.import_batch_id)
        if batch is None:
            raise NotFoundError("Import batch", command.import_batch_id)

        error = ImportError(
            import_batch_id=command.import_batch_id,
            row_number=command.row_number,
            field=command.field,
            error_message=command.error_message,
            raw_value=command.raw_value,
        )
        self.db.add(error)
        self.db.flush()
        return error

    def complete_batch(
        self,
        *,
        batch_id: int,
        status: ImportStatus,
        total_rows: int,
        success_rows: int,
        failed_rows: int,
    ) -> ImportBatch:
        batch = self.db.get(ImportBatch, batch_id)
        if batch is None:
            raise NotFoundError("Import batch", batch_id)

        batch.status = status
        batch.total_rows = total_rows
        batch.success_rows = success_rows
        batch.failed_rows = failed_rows
        batch.completed_at = datetime.now(UTC)
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
