from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from models.db import Charge, ChargeStatus, Payment, PaymentStatus, Unit, User

from .shared import NotFoundError, ValidationError


@dataclass(slots=True)
class CreateCharge:
    residence_id: int
    unit_id: int
    charge_type: str
    amount: Decimal
    billing_month: date
    due_date: date
    created_by: int
    description: str | None = None
    status: ChargeStatus = ChargeStatus.pending


@dataclass(slots=True)
class SubmitPayment:
    residence_id: int
    unit_id: int
    amount: Decimal
    payment_date: date
    payment_method: str
    submitted_by: int
    reference_no: str | None = None


class BillingService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_charge(self, command: CreateCharge) -> Charge:
        self._ensure_unit_exists(command.unit_id)
        self._ensure_user_exists(command.created_by)

        if command.amount <= Decimal("0"):
            raise ValidationError("charge amount must be greater than zero")

        charge = Charge(
            residence_id=command.residence_id,
            unit_id=command.unit_id,
            charge_type=command.charge_type,
            description=command.description,
            amount=command.amount,
            billing_month=command.billing_month,
            due_date=command.due_date,
            status=command.status,
            created_by=command.created_by,
        )
        self.db.add(charge)
        self.db.flush()
        return charge

    def submit_payment(self, command: SubmitPayment) -> Payment:
        self._ensure_unit_exists(command.unit_id)
        self._ensure_user_exists(command.submitted_by)

        if command.amount <= Decimal("0"):
            raise ValidationError("payment amount must be greater than zero")

        payment = Payment(
            residence_id=command.residence_id,
            unit_id=command.unit_id,
            amount=command.amount,
            payment_date=command.payment_date,
            payment_method=command.payment_method,
            reference_no=command.reference_no,
            status=PaymentStatus.pending_verification,
            submitted_by=command.submitted_by,
        )
        self.db.add(payment)
        self.db.flush()
        return payment

    def verify_payment(self, payment_id: int, verified_by: int) -> Payment:
        payment = self.db.get(Payment, payment_id)
        if payment is None:
            raise NotFoundError("Payment", payment_id)

        self._ensure_user_exists(verified_by)

        if payment.status != PaymentStatus.pending_verification:
            raise ValidationError("only pending payments can be verified")

        payment.status = PaymentStatus.verified
        payment.verified_by = verified_by
        payment.verified_at = datetime.now(timezone.utc)
        self.db.flush()
        return payment

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
