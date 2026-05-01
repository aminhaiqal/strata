from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from application import (
    ApplicationError,
    BlockService,
    CreateUnit,
    ImportBatchService,
    RecordImportError,
    StartImportBatch,
    UnitService,
    ValidationError,
)
from auth import AuthenticatedAdmin, get_current_admin_user
from database import get_db
from models.db import EntityStatus, ImportStatus, ImportType
from models.schemas import ImportBatchSchema

from .admin_common import log_audit, raise_http_error

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/imports/units", response_model=ImportBatchSchema, status_code=status.HTTP_201_CREATED)
def import_units(
    file: UploadFile = File(...),
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ImportBatchSchema:
    import_service = ImportBatchService(db)
    block_service = BlockService(db)
    unit_service = UnitService(db)
    try:
        batch = import_service.start_batch(
            StartImportBatch(
                residence_id=current_admin.residence_id,
                import_type=ImportType.units,
                filename=file.filename or "units.csv",
                uploaded_by=current_admin.id,
            )
        )
        content = file.file.read()
        if not content:
            raise ValidationError("import file is required")

        reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
        missing_fields = sorted(_required_fields().difference(reader.fieldnames or []))
        if missing_fields:
            return _complete_missing_header_import(
                db=db,
                current_admin=current_admin,
                import_service=import_service,
                batch_id=batch.id,
                missing_fields=missing_fields,
            )

        total_rows = 0
        success_rows = 0
        failed_rows = 0
        for row_number, row in enumerate(reader, start=2):
            total_rows += 1
            try:
                block_name = (row.get("block_name") or "").strip()
                if not block_name:
                    raise ValidationError("block_name is required")
                block = block_service.get_block_by_name(residence_id=current_admin.residence_id, name=block_name)
                if block is None:
                    raise ValidationError("block was not found in the residence")

                unit_service.create_unit(
                    CreateUnit(
                        residence_id=current_admin.residence_id,
                        block_id=block.id,
                        unit_number=(row.get("unit_number") or "").strip(),
                        floor=_empty_to_none(row.get("floor")),
                        unit_type=_empty_to_none(row.get("unit_type")),
                        owner_name=_empty_to_none(row.get("owner_name")),
                        owner_phone=_empty_to_none(row.get("owner_phone")),
                        owner_email=_empty_to_none(row.get("owner_email")),
                        tenant_name=_empty_to_none(row.get("tenant_name")),
                        tenant_phone=_empty_to_none(row.get("tenant_phone")),
                        tenant_email=_empty_to_none(row.get("tenant_email")),
                        is_occupied=_parse_csv_bool(row.get("is_occupied")),
                        status=_parse_entity_status(row.get("status")),
                    )
                )
                success_rows += 1
            except ApplicationError as error:
                failed_rows += 1
                import_service.record_error(
                    RecordImportError(
                        import_batch_id=batch.id,
                        row_number=row_number,
                        field=_infer_error_field(str(error)),
                        error_message=str(error),
                        raw_value=str(row),
                    )
                )

        batch = import_service.complete_batch(
            batch_id=batch.id,
            status=ImportStatus.completed if failed_rows == 0 else ImportStatus.failed,
            total_rows=total_rows,
            success_rows=success_rows,
            failed_rows=failed_rows,
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="import_batch",
            entity_id=str(batch.id),
            action="units_import_completed",
            after_json={
                "status": batch.status.value,
                "total_rows": total_rows,
                "success_rows": success_rows,
                "failed_rows": failed_rows,
            },
        )
        db.commit()
        db.refresh(batch)
        return ImportBatchSchema.model_validate(batch)
    except UnicodeDecodeError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="import file must be valid UTF-8 CSV") from error
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)


@router.get("/imports/{batch_id}", response_model=ImportBatchSchema)
def get_import_batch(
    batch_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ImportBatchSchema:
    service = ImportBatchService(db)
    try:
        batch = service.get_batch(residence_id=current_admin.residence_id, batch_id=batch_id)
        return ImportBatchSchema.model_validate(batch)
    except ApplicationError as error:
        raise_http_error(error)


def _required_fields() -> set[str]:
    return {
        "block_name",
        "unit_number",
        "floor",
        "unit_type",
        "owner_name",
        "owner_phone",
        "owner_email",
        "tenant_name",
        "tenant_phone",
        "tenant_email",
        "is_occupied",
        "status",
    }


def _complete_missing_header_import(
    *,
    db: Session,
    current_admin: AuthenticatedAdmin,
    import_service: ImportBatchService,
    batch_id: int,
    missing_fields: list[str],
) -> ImportBatchSchema:
    for field_name in missing_fields:
        import_service.record_error(
            RecordImportError(
                import_batch_id=batch_id,
                row_number=1,
                field=field_name,
                error_message="missing required column",
            )
        )
    batch = import_service.complete_batch(
        batch_id=batch_id,
        status=ImportStatus.failed,
        total_rows=0,
        success_rows=0,
        failed_rows=len(missing_fields),
    )
    log_audit(
        db,
        current_admin=current_admin,
        entity_type="import_batch",
        entity_id=str(batch.id),
        action="units_import_completed",
        after_json={"status": batch.status.value, "success_rows": 0, "failed_rows": len(missing_fields)},
    )
    db.commit()
    db.refresh(batch)
    return ImportBatchSchema.model_validate(batch)


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _parse_csv_bool(value: str | None) -> bool:
    normalized = (value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    raise ValidationError("is_occupied must be true or false")


def _parse_entity_status(value: str | None) -> EntityStatus:
    normalized = (value or "").strip().lower()
    if not normalized:
        return EntityStatus.active
    try:
        return EntityStatus(normalized)
    except ValueError as error:
        raise ValidationError("status must be active or inactive") from error


def _infer_error_field(message: str) -> str:
    if "block" in message:
        return "block_name"
    if "status" in message:
        return "status"
    if "occupied" in message:
        return "is_occupied"
    if "unit" in message:
        return "unit_number"
    return "row"
