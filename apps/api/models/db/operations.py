from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import ClassificationCategory, FollowUpStatus, FollowUpType, NoteVisibility
from .residence import Residence, Unit, User


class FollowUpRecord(Base):
    __tablename__ = "follow_up_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    follow_up_type: Mapped[FollowUpType] = mapped_column(Enum(FollowUpType), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    next_follow_up_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[FollowUpStatus] = mapped_column(Enum(FollowUpStatus), default=FollowUpStatus.open, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
    creator: Mapped[User] = relationship()


class AdminNote(Base):
    __tablename__ = "admin_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    visibility: Mapped[NoteVisibility] = mapped_column(
        Enum(NoteVisibility), default=NoteVisibility.internal_only, nullable=False
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
    creator: Mapped[User] = relationship()


class AccountSnapshot(Base):
    __tablename__ = "account_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    total_charged: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_outstanding: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    pending_payment_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    oldest_unpaid_due_date: Mapped[date | None] = mapped_column(Date)
    months_overdue: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    classification: Mapped[ClassificationCategory] = mapped_column(Enum(ClassificationCategory), nullable=False)
    last_payment_date: Mapped[date | None] = mapped_column(Date)
    last_follow_up_date: Mapped[date | None] = mapped_column(Date)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("months_overdue >= 0", name="ck_account_snapshots_months_overdue_non_negative"),
        UniqueConstraint("residence_id", "unit_id", name="uq_account_snapshots_residence_unit"),
    )

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
