from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from application import ApplicationError, AuditLogService, LogAuditEntry, ValidationError
from auth import AuthenticatedAdmin
from models.schemas import BlockSchema, ResidenceSchema, UnitSchema


def raise_http_error(error: ApplicationError) -> None:
    if isinstance(error, ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


def serialize_residence(residence: object) -> dict[str, object]:
    return ResidenceSchema.model_validate(residence).model_dump(mode="json")


def serialize_block(block: object) -> dict[str, object]:
    return BlockSchema.model_validate(block).model_dump(mode="json")


def serialize_unit(unit: object) -> dict[str, object]:
    return UnitSchema.model_validate(unit).model_dump(mode="json")


def log_audit(
    db: Session,
    *,
    current_admin: AuthenticatedAdmin,
    entity_type: str,
    entity_id: str,
    action: str,
    before_json: dict[str, object] | None = None,
    after_json: dict[str, object] | None = None,
) -> None:
    AuditLogService(db).log(
        LogAuditEntry(
            residence_id=current_admin.residence_id,
            actor_user_id=current_admin.id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            before_json=before_json,
            after_json=after_json,
        )
    )
