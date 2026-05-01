from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from application import (
    ApplicationError,
    BlockService,
    CreateBlock,
    CreateUnit,
    ResidenceService,
    UnitService,
    UpdateBlock,
    UpdateResidence,
    UpdateUnit,
)
from auth import AuthenticatedAdmin, get_current_admin_user
from database import get_db
from models.db import EntityStatus, ResidenceStatus
from models.schemas import BlockSchema, ResidenceSchema, UnitSchema

from .admin_common import log_audit, raise_http_error, serialize_block, serialize_residence, serialize_unit

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateResidenceRequest(BaseModel):
    name: str | None = None
    address: str | None = None
    timezone: str | None = None
    currency: str | None = None
    billing_cycle_day: int | None = None
    status: ResidenceStatus | None = None


class CreateBlockRequest(BaseModel):
    name: str
    description: str | None = None


class UpdateBlockRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class CreateUnitRequest(BaseModel):
    block_id: int
    unit_number: str
    floor: str | None = None
    unit_type: str | None = None
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    tenant_name: str | None = None
    tenant_phone: str | None = None
    tenant_email: str | None = None
    is_occupied: bool = True
    status: EntityStatus = EntityStatus.active


class UpdateUnitRequest(BaseModel):
    block_id: int | None = None
    unit_number: str | None = None
    floor: str | None = None
    unit_type: str | None = None
    owner_name: str | None = None
    owner_phone: str | None = None
    owner_email: str | None = None
    tenant_name: str | None = None
    tenant_phone: str | None = None
    tenant_email: str | None = None
    is_occupied: bool | None = None
    status: EntityStatus | None = None


@router.get("/residences", response_model=list[ResidenceSchema])
def list_residences(
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[ResidenceSchema]:
    service = ResidenceService(db)
    return [
        ResidenceSchema.model_validate(residence)
        for residence in service.list_residences(actor_residence_id=current_admin.residence_id)
    ]


@router.get("/residences/{residence_id}", response_model=ResidenceSchema)
def get_residence(
    residence_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ResidenceSchema:
    service = ResidenceService(db)
    try:
        residence = service.get_residence(actor_residence_id=current_admin.residence_id, residence_id=residence_id)
        return ResidenceSchema.model_validate(residence)
    except ApplicationError as error:
        raise_http_error(error)


@router.patch("/residences/{residence_id}", response_model=ResidenceSchema)
def update_residence(
    residence_id: int,
    payload: UpdateResidenceRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> ResidenceSchema:
    service = ResidenceService(db)
    try:
        residence = service.get_residence(actor_residence_id=current_admin.residence_id, residence_id=residence_id)
        before_json = serialize_residence(residence)
        residence = service.update_residence(
            UpdateResidence(
                residence_id=residence_id,
                name=payload.name,
                address=payload.address,
                timezone=payload.timezone,
                currency=payload.currency,
                billing_cycle_day=payload.billing_cycle_day,
                status=payload.status,
            ),
            actor_residence_id=current_admin.residence_id,
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="residence",
            entity_id=str(residence.id),
            action="residence_updated",
            before_json=before_json,
            after_json=serialize_residence(residence),
        )
        db.commit()
        db.refresh(residence)
        return ResidenceSchema.model_validate(residence)
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)


@router.post("/blocks", response_model=BlockSchema, status_code=status.HTTP_201_CREATED)
def create_block(
    payload: CreateBlockRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> BlockSchema:
    service = BlockService(db)
    try:
        block = service.create_block(
            CreateBlock(
                residence_id=current_admin.residence_id,
                name=payload.name,
                description=payload.description,
            )
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="block",
            entity_id=str(block.id),
            action="block_created",
            after_json=serialize_block(block),
        )
        db.commit()
        db.refresh(block)
        return BlockSchema.model_validate(block)
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)


@router.get("/blocks", response_model=list[BlockSchema])
def list_blocks(
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[BlockSchema]:
    service = BlockService(db)
    return [BlockSchema.model_validate(block) for block in service.list_blocks(residence_id=current_admin.residence_id)]


@router.get("/blocks/{block_id}", response_model=BlockSchema)
def get_block(
    block_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> BlockSchema:
    service = BlockService(db)
    try:
        block = service.get_block(residence_id=current_admin.residence_id, block_id=block_id)
        return BlockSchema.model_validate(block)
    except ApplicationError as error:
        raise_http_error(error)


@router.patch("/blocks/{block_id}", response_model=BlockSchema)
def update_block(
    block_id: int,
    payload: UpdateBlockRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> BlockSchema:
    service = BlockService(db)
    try:
        block = service.get_block(residence_id=current_admin.residence_id, block_id=block_id)
        before_json = serialize_block(block)
        block = service.update_block(
            UpdateBlock(
                block_id=block_id,
                residence_id=current_admin.residence_id,
                name=payload.name,
                description=payload.description,
            )
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="block",
            entity_id=str(block.id),
            action="block_updated",
            before_json=before_json,
            after_json=serialize_block(block),
        )
        db.commit()
        db.refresh(block)
        return BlockSchema.model_validate(block)
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)


@router.post("/units", response_model=UnitSchema, status_code=status.HTTP_201_CREATED)
def create_unit(
    payload: CreateUnitRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UnitSchema:
    service = UnitService(db)
    try:
        unit = service.create_unit(
            CreateUnit(
                residence_id=current_admin.residence_id,
                block_id=payload.block_id,
                unit_number=payload.unit_number,
                floor=payload.floor,
                unit_type=payload.unit_type,
                owner_name=payload.owner_name,
                owner_phone=payload.owner_phone,
                owner_email=payload.owner_email,
                tenant_name=payload.tenant_name,
                tenant_phone=payload.tenant_phone,
                tenant_email=payload.tenant_email,
                is_occupied=payload.is_occupied,
                status=payload.status,
            )
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="unit",
            entity_id=str(unit.id),
            action="unit_created",
            after_json=serialize_unit(unit),
        )
        db.commit()
        db.refresh(unit)
        return UnitSchema.model_validate(unit)
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)


@router.get("/units", response_model=list[UnitSchema])
def list_units(
    block_id: int | None = Query(default=None),
    status_filter: EntityStatus | None = Query(default=None, alias="status"),
    is_occupied: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[UnitSchema]:
    service = UnitService(db)
    try:
        units = service.list_units(
            residence_id=current_admin.residence_id,
            block_id=block_id,
            status=status_filter,
            is_occupied=is_occupied,
            search=search,
        )
        return [UnitSchema.model_validate(unit) for unit in units]
    except ApplicationError as error:
        raise_http_error(error)


@router.get("/units/{unit_id}", response_model=UnitSchema)
def get_unit(
    unit_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UnitSchema:
    service = UnitService(db)
    try:
        unit = service.get_unit(residence_id=current_admin.residence_id, unit_id=unit_id)
        return UnitSchema.model_validate(unit)
    except ApplicationError as error:
        raise_http_error(error)


@router.patch("/units/{unit_id}", response_model=UnitSchema)
def update_unit(
    unit_id: int,
    payload: UpdateUnitRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UnitSchema:
    service = UnitService(db)
    try:
        unit = service.get_unit(residence_id=current_admin.residence_id, unit_id=unit_id)
        before_json = serialize_unit(unit)
        unit = service.update_unit(
            UpdateUnit(
                unit_id=unit_id,
                residence_id=current_admin.residence_id,
                block_id=payload.block_id,
                unit_number=payload.unit_number,
                floor=payload.floor,
                unit_type=payload.unit_type,
                owner_name=payload.owner_name,
                owner_phone=payload.owner_phone,
                owner_email=payload.owner_email,
                tenant_name=payload.tenant_name,
                tenant_phone=payload.tenant_phone,
                tenant_email=payload.tenant_email,
                is_occupied=payload.is_occupied,
                status=payload.status,
            )
        )
        log_audit(
            db,
            current_admin=current_admin,
            entity_type="unit",
            entity_id=str(unit.id),
            action="unit_updated",
            before_json=before_json,
            after_json=serialize_unit(unit),
        )
        db.commit()
        db.refresh(unit)
        return UnitSchema.model_validate(unit)
    except ApplicationError as error:
        db.rollback()
        raise_http_error(error)
