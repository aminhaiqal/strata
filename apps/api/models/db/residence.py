from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import EntityStatus, ResidenceStatus, UnitUserRelationshipType, UserRole


class Residence(Base, TimestampMixin):
    __tablename__ = "residences"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    billing_cycle_day: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ResidenceStatus] = mapped_column(
        Enum(ResidenceStatus), default=ResidenceStatus.active, nullable=False
    )

    __table_args__ = (
        CheckConstraint("billing_cycle_day BETWEEN 1 AND 31", name="ck_residences_billing_cycle_day"),
    )


class Block(Base, TimestampMixin):
    __tablename__ = "blocks"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    residence: Mapped[Residence] = relationship()
    units: Mapped[list[Unit]] = relationship(back_populates="block")


class Unit(Base, TimestampMixin):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    block_id: Mapped[int] = mapped_column(ForeignKey("blocks.id"), nullable=False, index=True)
    unit_number: Mapped[str] = mapped_column(String(40), nullable=False)
    floor: Mapped[str | None] = mapped_column(String(20))
    unit_type: Mapped[str | None] = mapped_column(String(50))
    owner_name: Mapped[str | None] = mapped_column(String(120))
    owner_phone: Mapped[str | None] = mapped_column(String(40))
    owner_email: Mapped[str | None] = mapped_column(String(254))
    tenant_name: Mapped[str | None] = mapped_column(String(120))
    tenant_phone: Mapped[str | None] = mapped_column(String(40))
    tenant_email: Mapped[str | None] = mapped_column(String(254))
    is_occupied: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[EntityStatus] = mapped_column(Enum(EntityStatus), default=EntityStatus.active, nullable=False)

    __table_args__ = (
        UniqueConstraint("residence_id", "block_id", "unit_number", name="uq_units_residence_block_number"),
    )

    residence: Mapped[Residence] = relationship()
    block: Mapped[Block] = relationship(back_populates="units")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    status: Mapped[EntityStatus] = mapped_column(Enum(EntityStatus), default=EntityStatus.active, nullable=False)

    __table_args__ = (UniqueConstraint("residence_id", "email", name="uq_users_residence_email"),)

    residence: Mapped[Residence] = relationship()


class UnitUser(Base):
    __tablename__ = "unit_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    relationship_type: Mapped[UnitUserRelationshipType] = mapped_column(
        Enum(UnitUserRelationshipType), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("unit_id", "user_id", name="uq_unit_users_unit_user"),)

    unit: Mapped[Unit] = relationship()
    user: Mapped[User] = relationship()
