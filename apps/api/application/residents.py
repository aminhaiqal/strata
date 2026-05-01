from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import normalize_email
from models.db import (
    Charge,
    EntityStatus,
    InstallmentPlan,
    Payment,
    PaymentProof,
    PaymentStatus,
    Unit,
    UnitUser,
    UnitUserRelationshipType,
    User,
    UserRole,
)
from storage import PaymentProofStorage, build_payment_proof_key

from .shared import NotFoundError, ValidationError


@dataclass(slots=True)
class CreateResidentUser:
    residence_id: int
    name: str
    email: str
    phone: str | None
    password_hash: str


@dataclass(slots=True)
class LinkResidentToUnit:
    unit_id: int
    user_id: int
    relationship_type: UnitUserRelationshipType


@dataclass(slots=True)
class UpdateResidentUser:
    actor_residence_id: int
    user_id: int
    name: str | None = None
    phone: str | None = None
    status: EntityStatus | None = None


@dataclass(slots=True)
class SubmitResidentPayment:
    resident_user_id: int
    unit_id: int
    amount: Decimal
    payment_date: date
    payment_method: str
    reference_no: str | None = None
    proof_filename: str | None = None
    proof_content_type: str = ""
    proof_content: bytes = b""


@dataclass(frozen=True, slots=True)
class ResidentPaymentProofAccess:
    payment: Payment
    proof: PaymentProof


class ResidentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_resident_user(self, command: CreateResidentUser) -> User:
        existing_user = self.db.scalar(
            select(User).where(
                User.residence_id == command.residence_id,
                User.email == normalize_email(command.email),
            )
        )
        if existing_user is not None:
            raise ValidationError("a user with this email already exists in the residence")

        resident = User(
            residence_id=command.residence_id,
            name=command.name,
            email=normalize_email(command.email),
            phone=command.phone,
            password_hash=command.password_hash,
            role=UserRole.resident,
        )
        self.db.add(resident)
        self.db.flush()
        return resident

    def list_residents(self, residence_id: int) -> list[User]:
        return list(
            self.db.scalars(
                select(User)
                .where(User.residence_id == residence_id, User.role == UserRole.resident)
                .order_by(User.id)
            )
        )

    def update_resident_user(self, command: UpdateResidentUser) -> User:
        resident = self._ensure_resident_user(command.user_id)
        if resident.residence_id != command.actor_residence_id:
            raise ValidationError("resident and admin must belong to the same residence")

        if command.name is not None:
            resident.name = command.name
        if command.phone is not None:
            resident.phone = command.phone
        if command.status is not None:
            resident.status = command.status
        self.db.flush()
        return resident

    def link_resident_to_unit(self, command: LinkResidentToUnit) -> UnitUser:
        user = self._ensure_user_exists(command.user_id)
        unit = self._ensure_unit_exists(command.unit_id)

        if user.role != UserRole.resident:
            raise ValidationError("only users with the resident role can be linked as residents")
        if user.residence_id != unit.residence_id:
            raise ValidationError("resident and unit must belong to the same residence")

        existing_link = self.db.scalar(
            select(UnitUser).where(UnitUser.unit_id == command.unit_id, UnitUser.user_id == command.user_id)
        )
        if existing_link is not None:
            raise ValidationError("resident is already linked to this unit")

        link = UnitUser(
            unit_id=command.unit_id,
            user_id=command.user_id,
            relationship_type=command.relationship_type,
        )
        self.db.add(link)
        self.db.flush()
        return link

    def list_linked_units(self, resident_user_id: int) -> list[Unit]:
        self._ensure_resident_user(resident_user_id)
        return list(
            self.db.scalars(
                select(Unit)
                .join(UnitUser, UnitUser.unit_id == Unit.id)
                .where(UnitUser.user_id == resident_user_id)
                .order_by(Unit.id)
            )
        )

    def get_linked_unit(self, resident_user_id: int, unit_id: int) -> Unit:
        self._ensure_resident_user(resident_user_id)
        unit = self.db.scalar(
            select(Unit)
            .join(UnitUser, UnitUser.unit_id == Unit.id)
            .where(Unit.id == unit_id, UnitUser.user_id == resident_user_id)
        )
        if unit is None:
            raise NotFoundError("Linked unit", unit_id)
        return unit

    def list_unit_residents(self, residence_id: int, unit_id: int) -> list[UnitUser]:
        unit = self._ensure_unit_exists(unit_id)
        if unit.residence_id != residence_id:
            raise ValidationError("unit and admin must belong to the same residence")
        return list(
            self.db.scalars(
                select(UnitUser)
                .join(User, User.id == UnitUser.user_id)
                .where(UnitUser.unit_id == unit_id, User.role == UserRole.resident)
                .order_by(UnitUser.id)
            )
        )

    def list_unit_charges(self, resident_user_id: int, unit_id: int) -> list[Charge]:
        unit = self.get_linked_unit(resident_user_id, unit_id)
        return list(
            self.db.scalars(
                select(Charge).where(Charge.unit_id == unit.id).order_by(Charge.due_date.desc(), Charge.id.desc())
            )
        )

    def list_unit_payments(self, resident_user_id: int, unit_id: int) -> list[Payment]:
        unit = self.get_linked_unit(resident_user_id, unit_id)
        return list(
            self.db.scalars(
                select(Payment)
                .where(Payment.unit_id == unit.id)
                .order_by(Payment.payment_date.desc(), Payment.id.desc())
            )
        )

    def get_installment_plan(self, resident_user_id: int, unit_id: int) -> InstallmentPlan | None:
        unit = self.get_linked_unit(resident_user_id, unit_id)
        return self.db.scalar(
            select(InstallmentPlan)
            .where(InstallmentPlan.unit_id == unit.id)
            .order_by(InstallmentPlan.id.desc())
        )

    def get_payment_proof_access(self, resident_user_id: int, payment_id: int) -> ResidentPaymentProofAccess:
        self._ensure_resident_user(resident_user_id)
        payment = self.db.scalar(
            select(Payment)
            .join(UnitUser, UnitUser.unit_id == Payment.unit_id)
            .where(Payment.id == payment_id, UnitUser.user_id == resident_user_id)
        )
        if payment is None:
            raise NotFoundError("Payment", payment_id)

        proof = self.db.scalar(
            select(PaymentProof)
            .where(PaymentProof.payment_id == payment.id)
            .order_by(PaymentProof.created_at.asc(), PaymentProof.id.asc())
        )
        if proof is None:
            raise NotFoundError("Payment proof", payment_id)

        return ResidentPaymentProofAccess(payment=payment, proof=proof)

    def submit_payment(self, command: SubmitResidentPayment, *, storage: PaymentProofStorage) -> Payment:
        unit = self.get_linked_unit(command.resident_user_id, command.unit_id)
        if command.amount <= Decimal("0"):
            raise ValidationError("payment amount must be greater than zero")
        if not command.proof_content:
            raise ValidationError("payment proof file is required")

        payment = Payment(
            residence_id=unit.residence_id,
            unit_id=unit.id,
            amount=command.amount,
            payment_date=command.payment_date,
            payment_method=command.payment_method,
            reference_no=command.reference_no,
            status=PaymentStatus.pending_verification,
            submitted_by=command.resident_user_id,
        )
        self.db.add(payment)
        self.db.flush()

        stored_file = storage.upload_payment_proof(
            key=build_payment_proof_key(
                residence_id=unit.residence_id,
                unit_id=unit.id,
                payment_id=payment.id,
                filename=command.proof_filename,
            ),
            content=command.proof_content,
            content_type=command.proof_content_type,
        )
        proof = PaymentProof(
            payment_id=payment.id,
            storage_provider=stored_file.storage_provider,
            file_key=stored_file.file_key,
            mime_type=stored_file.mime_type,
            file_size=stored_file.file_size,
            uploaded_by=command.resident_user_id,
        )
        self.db.add(proof)
        return payment

    def unlink_resident_from_unit(self, *, residence_id: int, unit_id: int, user_id: int) -> None:
        unit = self._ensure_unit_exists(unit_id)
        resident = self._ensure_resident_user(user_id)
        if unit.residence_id != residence_id or resident.residence_id != residence_id:
            raise ValidationError("resident, unit, and admin must belong to the same residence")

        link = self.db.scalar(select(UnitUser).where(UnitUser.unit_id == unit_id, UnitUser.user_id == user_id))
        if link is None:
            raise NotFoundError("Resident unit link", unit_id)

        self.db.delete(link)
        self.db.flush()

    def _ensure_user_exists(self, user_id: int) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User", user_id)
        return user

    def _ensure_unit_exists(self, unit_id: int) -> Unit:
        unit = self.db.get(Unit, unit_id)
        if unit is None:
            raise NotFoundError("Unit", unit_id)
        return unit

    def _ensure_resident_user(self, user_id: int) -> User:
        user = self._ensure_user_exists(user_id)
        if user.role != UserRole.resident:
            raise ValidationError("user is not a resident")
        return user
