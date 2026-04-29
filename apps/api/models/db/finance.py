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
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import ChargeStatus, PaymentStatus
from .residence import Residence, Unit, User


class Charge(Base, TimestampMixin):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    charge_type: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    billing_month: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ChargeStatus] = mapped_column(Enum(ChargeStatus), default=ChargeStatus.pending, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    __table_args__ = (CheckConstraint("amount > 0", name="ck_charges_amount_positive"),)

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
    creator: Mapped[User] = relationship(foreign_keys=[created_by])
    allocations: Mapped[list[PaymentAllocation]] = relationship(back_populates="charge")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(60), nullable=False)
    reference_no: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.pending_verification, nullable=False
    )
    submitted_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    verified_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejected_reason: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (CheckConstraint("amount > 0", name="ck_payments_amount_positive"),)

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
    submitter: Mapped[User] = relationship(foreign_keys=[submitted_by])
    verifier: Mapped[User | None] = relationship(foreign_keys=[verified_by])
    proofs: Mapped[list[PaymentProof]] = relationship(back_populates="payment")
    allocations: Mapped[list[PaymentAllocation]] = relationship(back_populates="payment")


class PaymentProof(Base):
    __tablename__ = "payment_proofs"

    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), nullable=False, index=True)
    storage_provider: Mapped[str] = mapped_column(String(40), nullable=False, default="cloudflare_r2")
    file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (CheckConstraint("file_size > 0", name="ck_payment_proofs_file_size_positive"),)

    payment: Mapped[Payment] = relationship(back_populates="proofs")
    uploader: Mapped[User] = relationship()


class PaymentAllocation(Base):
    __tablename__ = "payment_allocations"

    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), nullable=False, index=True)
    charge_id: Mapped[int] = mapped_column(ForeignKey("charges.id"), nullable=False, index=True)
    amount_allocated: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint("amount_allocated > 0", name="ck_payment_allocations_amount_positive"),
        UniqueConstraint("payment_id", "charge_id", name="uq_payment_allocations_payment_charge"),
    )

    payment: Mapped[Payment] = relationship(back_populates="allocations")
    charge: Mapped[Charge] = relationship(back_populates="allocations")
