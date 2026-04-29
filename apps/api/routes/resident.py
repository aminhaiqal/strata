from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from application import ApplicationError, NotFoundError, ResidentService, SubmitResidentPayment, ValidationError
from database import get_db
from models.db import AccountSnapshot
from models.schemas import ChargeSchema, InstallmentPlanSchema, PaymentSchema, UnitSchema

router = APIRouter(prefix="/resident", tags=["resident"])


class ResidentBalanceSchema(BaseModel):
    unit_id: int
    total_charged: Decimal
    total_paid: Decimal
    total_outstanding: Decimal
    pending_payment_amount: Decimal
    oldest_unpaid_due_date: date | None
    months_overdue: int
    classification: str
    last_payment_date: date | None
    last_follow_up_date: date | None


class ResidentPaymentCreateRequest(BaseModel):
    amount: Decimal
    payment_date: date
    payment_method: str
    reference_no: str | None = None


def get_resident_user_id(
    x_resident_user_id: Annotated[int | None, Header(alias="X-Resident-User-Id")] = None,
) -> int:
    if x_resident_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Resident-User-Id header is required until authentication is implemented",
        )
    return x_resident_user_id


def _raise_http_error(error: ApplicationError) -> None:
    if isinstance(error, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="unexpected application error")


@router.get("/units", response_model=list[UnitSchema])
def list_linked_units(
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> list[UnitSchema]:
    service = ResidentService(db)
    try:
        return [UnitSchema.model_validate(unit) for unit in service.list_linked_units(resident_user_id)]
    except ApplicationError as error:
        _raise_http_error(error)


@router.get("/units/{unit_id}/balance", response_model=ResidentBalanceSchema)
def get_unit_balance(
    unit_id: int,
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> ResidentBalanceSchema:
    service = ResidentService(db)
    try:
        service.get_linked_unit(resident_user_id, unit_id)
    except ApplicationError as error:
        _raise_http_error(error)

    snapshot = db.scalar(
        select(AccountSnapshot).where(AccountSnapshot.unit_id == unit_id).order_by(AccountSnapshot.updated_at.desc())
    )
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Balance snapshot for unit {unit_id} was not found")

    return ResidentBalanceSchema(
        unit_id=snapshot.unit_id,
        total_charged=snapshot.total_charged,
        total_paid=snapshot.total_paid,
        total_outstanding=snapshot.total_outstanding,
        pending_payment_amount=snapshot.pending_payment_amount,
        oldest_unpaid_due_date=snapshot.oldest_unpaid_due_date,
        months_overdue=snapshot.months_overdue,
        classification=snapshot.classification.value,
        last_payment_date=snapshot.last_payment_date,
        last_follow_up_date=snapshot.last_follow_up_date,
    )


@router.get("/units/{unit_id}/charges", response_model=list[ChargeSchema])
def list_unit_charges(
    unit_id: int,
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> list[ChargeSchema]:
    service = ResidentService(db)
    try:
        return [
            ChargeSchema.model_validate(charge)
            for charge in service.list_unit_charges(resident_user_id=resident_user_id, unit_id=unit_id)
        ]
    except ApplicationError as error:
        _raise_http_error(error)


@router.get("/units/{unit_id}/payments", response_model=list[PaymentSchema])
def list_unit_payments(
    unit_id: int,
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> list[PaymentSchema]:
    service = ResidentService(db)
    try:
        return [
            PaymentSchema.model_validate(payment)
            for payment in service.list_unit_payments(resident_user_id=resident_user_id, unit_id=unit_id)
        ]
    except ApplicationError as error:
        _raise_http_error(error)


@router.post("/units/{unit_id}/payments", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
def submit_payment(
    unit_id: int,
    payload: ResidentPaymentCreateRequest,
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> PaymentSchema:
    service = ResidentService(db)
    try:
        payment = service.submit_payment(
            SubmitResidentPayment(
                resident_user_id=resident_user_id,
                unit_id=unit_id,
                amount=payload.amount,
                payment_date=payload.payment_date,
                payment_method=payload.payment_method,
                reference_no=payload.reference_no,
            )
        )
        db.commit()
        db.refresh(payment)
        return PaymentSchema.model_validate(payment)
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)


@router.get("/units/{unit_id}/installment-plan", response_model=InstallmentPlanSchema | None)
def get_installment_plan(
    unit_id: int,
    resident_user_id: int = Depends(get_resident_user_id),
    db: Session = Depends(get_db),
) -> InstallmentPlanSchema | None:
    service = ResidentService(db)
    try:
        plan = service.get_installment_plan(resident_user_id=resident_user_id, unit_id=unit_id)
        return InstallmentPlanSchema.model_validate(plan) if plan is not None else None
    except ApplicationError as error:
        _raise_http_error(error)
