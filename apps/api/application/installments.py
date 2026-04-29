from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from models.db import InstallmentPlan, InstallmentPlanStatus, Unit, User

from .shared import NotFoundError, ValidationError


@dataclass(slots=True)
class CreateInstallmentPlan:
    residence_id: int
    unit_id: int
    total_amount: Decimal
    start_date: date
    end_date: date
    created_by: int
    approved_by: int | None = None
    status: InstallmentPlanStatus = InstallmentPlanStatus.active


class InstallmentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_plan(self, command: CreateInstallmentPlan) -> InstallmentPlan:
        self._ensure_unit_exists(command.unit_id)
        self._ensure_user_exists(command.created_by)
        if command.approved_by is not None:
            self._ensure_user_exists(command.approved_by)

        if command.total_amount <= Decimal("0"):
            raise ValidationError("installment total_amount must be greater than zero")
        if command.end_date < command.start_date:
            raise ValidationError("installment end_date must not be before start_date")

        plan = InstallmentPlan(
            residence_id=command.residence_id,
            unit_id=command.unit_id,
            total_amount=command.total_amount,
            start_date=command.start_date,
            end_date=command.end_date,
            status=command.status,
            created_by=command.created_by,
            approved_by=command.approved_by,
        )
        self.db.add(plan)
        self.db.flush()
        return plan

    def _ensure_unit_exists(self, unit_id: int) -> Unit:
        unit = self.db.get(Unit, unit_id)
        if unit is None:
            raise NotFoundError("Unit", unit_id)
        return unit

    def _ensure_user_exists(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        return user
