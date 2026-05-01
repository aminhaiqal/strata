from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from models.db import Block, EntityStatus, Residence, ResidenceStatus, Unit

from .shared import NotFoundError, ValidationError


@dataclass(slots=True)
class CreateResidence:
    name: str
    address: str
    timezone: str
    currency: str
    billing_cycle_day: int
    status: ResidenceStatus = ResidenceStatus.active


@dataclass(slots=True)
class UpdateResidence:
    residence_id: int
    name: str | None = None
    address: str | None = None
    timezone: str | None = None
    currency: str | None = None
    billing_cycle_day: int | None = None
    status: ResidenceStatus | None = None


@dataclass(slots=True)
class CreateBlock:
    residence_id: int
    name: str
    description: str | None = None


@dataclass(slots=True)
class UpdateBlock:
    block_id: int
    residence_id: int
    name: str | None = None
    description: str | None = None


@dataclass(slots=True)
class CreateUnit:
    residence_id: int
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


@dataclass(slots=True)
class UpdateUnit:
    unit_id: int
    residence_id: int
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


class ResidenceService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_residence(self, command: CreateResidence) -> Residence:
        self._validate_billing_cycle_day(command.billing_cycle_day)

        residence = Residence(
            name=command.name,
            address=command.address,
            timezone=command.timezone,
            currency=command.currency,
            billing_cycle_day=command.billing_cycle_day,
            status=command.status,
        )
        self.db.add(residence)
        self.db.flush()
        return residence

    def list_residences(self, *, actor_residence_id: int) -> list[Residence]:
        residence = self._ensure_residence_exists(actor_residence_id)
        return [residence]

    def get_residence(self, *, actor_residence_id: int, residence_id: int) -> Residence:
        residence = self._ensure_residence_exists(residence_id)
        if residence.id != actor_residence_id:
            raise ValidationError("residence and admin must belong to the same residence")
        return residence

    def update_residence(self, command: UpdateResidence, *, actor_residence_id: int) -> Residence:
        residence = self.get_residence(actor_residence_id=actor_residence_id, residence_id=command.residence_id)

        if command.billing_cycle_day is not None:
            self._validate_billing_cycle_day(command.billing_cycle_day)
            residence.billing_cycle_day = command.billing_cycle_day
        if command.name is not None:
            residence.name = command.name
        if command.address is not None:
            residence.address = command.address
        if command.timezone is not None:
            residence.timezone = command.timezone
        if command.currency is not None:
            residence.currency = command.currency
        if command.status is not None:
            residence.status = command.status

        self.db.flush()
        return residence

    def _ensure_residence_exists(self, residence_id: int) -> Residence:
        residence = self.db.get(Residence, residence_id)
        if residence is None:
            raise NotFoundError("Residence", residence_id)
        return residence

    def _validate_billing_cycle_day(self, billing_cycle_day: int) -> None:
        if not 1 <= billing_cycle_day <= 31:
            raise ValidationError("billing_cycle_day must be between 1 and 31")


class BlockService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_block(self, command: CreateBlock) -> Block:
        self._ensure_residence_exists(command.residence_id)

        block = Block(
            residence_id=command.residence_id,
            name=command.name,
            description=command.description,
        )
        self.db.add(block)
        self.db.flush()
        return block

    def list_blocks(self, *, residence_id: int) -> list[Block]:
        self._ensure_residence_exists(residence_id)
        return list(
            self.db.scalars(
                select(Block).where(Block.residence_id == residence_id).order_by(Block.id)
            )
        )

    def get_block(self, *, residence_id: int, block_id: int) -> Block:
        block = self._ensure_block_exists(block_id)
        if block.residence_id != residence_id:
            raise ValidationError("block and admin must belong to the same residence")
        return block

    def get_block_by_name(self, *, residence_id: int, name: str) -> Block | None:
        self._ensure_residence_exists(residence_id)
        return self.db.scalar(select(Block).where(Block.residence_id == residence_id, Block.name == name))

    def update_block(self, command: UpdateBlock) -> Block:
        block = self.get_block(residence_id=command.residence_id, block_id=command.block_id)
        if command.name is not None:
            block.name = command.name
        if command.description is not None:
            block.description = command.description
        self.db.flush()
        return block

    def _ensure_residence_exists(self, residence_id: int) -> Residence:
        residence = self.db.get(Residence, residence_id)
        if residence is None:
            raise NotFoundError("Residence", residence_id)
        return residence

    def _ensure_block_exists(self, block_id: int) -> Block:
        block = self.db.get(Block, block_id)
        if block is None:
            raise NotFoundError("Block", block_id)
        return block


class UnitService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_unit(self, command: CreateUnit) -> Unit:
        block = self._ensure_block_exists(command.block_id)
        if block.residence_id != command.residence_id:
            raise ValidationError("unit and block must belong to the same residence")
        if not command.unit_number.strip():
            raise ValidationError("unit_number is required")

        self._ensure_unit_number_available(
            residence_id=command.residence_id,
            block_id=command.block_id,
            unit_number=command.unit_number,
        )

        unit = Unit(
            residence_id=command.residence_id,
            block_id=command.block_id,
            unit_number=command.unit_number,
            floor=command.floor,
            unit_type=command.unit_type,
            owner_name=command.owner_name,
            owner_phone=command.owner_phone,
            owner_email=command.owner_email,
            tenant_name=command.tenant_name,
            tenant_phone=command.tenant_phone,
            tenant_email=command.tenant_email,
            is_occupied=command.is_occupied,
            status=command.status,
        )
        self.db.add(unit)
        self.db.flush()
        return unit

    def list_units(
        self,
        *,
        residence_id: int,
        block_id: int | None = None,
        status: EntityStatus | None = None,
        is_occupied: bool | None = None,
        search: str | None = None,
    ) -> list[Unit]:
        self._ensure_residence_exists(residence_id)
        if block_id is not None:
            block = self._ensure_block_exists(block_id)
            if block.residence_id != residence_id:
                raise ValidationError("block and admin must belong to the same residence")

        query: Select[tuple[Unit]] = select(Unit).where(Unit.residence_id == residence_id)
        if block_id is not None:
            query = query.where(Unit.block_id == block_id)
        if status is not None:
            query = query.where(Unit.status == status)
        if is_occupied is not None:
            query = query.where(Unit.is_occupied == is_occupied)
        if search:
            search_value = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Unit.unit_number).like(search_value),
                    func.lower(func.coalesce(Unit.owner_name, "")).like(search_value),
                    func.lower(func.coalesce(Unit.tenant_name, "")).like(search_value),
                )
            )

        query = query.order_by(Unit.id)
        return list(self.db.scalars(query))

    def get_unit(self, *, residence_id: int, unit_id: int) -> Unit:
        unit = self._ensure_unit_exists(unit_id)
        if unit.residence_id != residence_id:
            raise ValidationError("unit and admin must belong to the same residence")
        return unit

    def update_unit(self, command: UpdateUnit) -> Unit:
        unit = self.get_unit(residence_id=command.residence_id, unit_id=command.unit_id)

        new_block_id = command.block_id if command.block_id is not None else unit.block_id
        new_unit_number = command.unit_number if command.unit_number is not None else unit.unit_number
        if not new_unit_number.strip():
            raise ValidationError("unit_number is required")
        if new_block_id != unit.block_id or new_unit_number != unit.unit_number:
            block = self._ensure_block_exists(new_block_id)
            if block.residence_id != command.residence_id:
                raise ValidationError("unit and block must belong to the same residence")
            self._ensure_unit_number_available(
                residence_id=command.residence_id,
                block_id=new_block_id,
                unit_number=new_unit_number,
                exclude_unit_id=unit.id,
            )
            unit.block_id = new_block_id
            unit.unit_number = new_unit_number

        if command.floor is not None:
            unit.floor = command.floor
        if command.unit_type is not None:
            unit.unit_type = command.unit_type
        if command.owner_name is not None:
            unit.owner_name = command.owner_name
        if command.owner_phone is not None:
            unit.owner_phone = command.owner_phone
        if command.owner_email is not None:
            unit.owner_email = command.owner_email
        if command.tenant_name is not None:
            unit.tenant_name = command.tenant_name
        if command.tenant_phone is not None:
            unit.tenant_phone = command.tenant_phone
        if command.tenant_email is not None:
            unit.tenant_email = command.tenant_email
        if command.is_occupied is not None:
            unit.is_occupied = command.is_occupied
        if command.status is not None:
            unit.status = command.status

        self.db.flush()
        return unit

    def _ensure_residence_exists(self, residence_id: int) -> Residence:
        residence = self.db.get(Residence, residence_id)
        if residence is None:
            raise NotFoundError("Residence", residence_id)
        return residence

    def _ensure_block_exists(self, block_id: int) -> Block:
        block = self.db.get(Block, block_id)
        if block is None:
            raise NotFoundError("Block", block_id)
        return block

    def _ensure_unit_exists(self, unit_id: int) -> Unit:
        unit = self.db.get(Unit, unit_id)
        if unit is None:
            raise NotFoundError("Unit", unit_id)
        return unit

    def _ensure_unit_number_available(
        self,
        *,
        residence_id: int,
        block_id: int,
        unit_number: str,
        exclude_unit_id: int | None = None,
    ) -> None:
        query = select(Unit).where(
            Unit.residence_id == residence_id,
            Unit.block_id == block_id,
            Unit.unit_number == unit_number,
        )
        if exclude_unit_id is not None:
            query = query.where(Unit.id != exclude_unit_id)
        existing_unit = self.db.scalar(query)
        if existing_unit is not None:
            raise ValidationError("a unit with this number already exists in the block")
