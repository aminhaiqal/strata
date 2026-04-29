from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import InstallmentPlanStatus, InstallmentScheduleStatus
from .residence import Residence, Unit, User


class InstallmentPlan(Base, TimestampMixin):
    __tablename__ = "installment_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"), nullable=False, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[InstallmentPlanStatus] = mapped_column(
        Enum(InstallmentPlanStatus), default=InstallmentPlanStatus.active, nullable=False
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))

    __table_args__ = (CheckConstraint("total_amount > 0", name="ck_installment_plans_total_positive"),)

    residence: Mapped[Residence] = relationship()
    unit: Mapped[Unit] = relationship()
    creator: Mapped[User] = relationship(foreign_keys=[created_by])
    approver: Mapped[User | None] = relationship(foreign_keys=[approved_by])
    schedules: Mapped[list[InstallmentSchedule]] = relationship(back_populates="installment_plan")


class InstallmentSchedule(Base, TimestampMixin):
    __tablename__ = "installment_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    installment_plan_id: Mapped[int] = mapped_column(
        ForeignKey("installment_plans.id"), nullable=False, index=True
    )
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    status: Mapped[InstallmentScheduleStatus] = mapped_column(
        Enum(InstallmentScheduleStatus), default=InstallmentScheduleStatus.pending, nullable=False
    )

    __table_args__ = (
        CheckConstraint("amount_due > 0", name="ck_installment_schedules_amount_due_positive"),
        CheckConstraint("amount_paid >= 0", name="ck_installment_schedules_amount_paid_non_negative"),
    )

    installment_plan: Mapped[InstallmentPlan] = relationship(back_populates="schedules")
