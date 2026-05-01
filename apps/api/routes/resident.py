from __future__ import annotations

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from application import ApplicationError, NotFoundError, ResidentService, SubmitResidentPayment, ValidationError
from auth import AuthenticatedUser, get_current_resident_user
from database import get_db
from models.db import AccountSnapshot
from models.schemas import ChargeSchema, InstallmentPlanSchema, PaymentProofAccessSchema, PaymentSchema, UnitSchema
from storage import (
    ALLOWED_PAYMENT_PROOF_MIME_TYPES,
    MAX_PAYMENT_PROOF_SIZE_BYTES,
    PaymentProofStorage,
    StorageError,
    get_payment_proof_storage,
)

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


def _raise_http_error(error: ApplicationError) -> None:
    if isinstance(error, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="unexpected application error")


@router.get("/units", response_model=list[UnitSchema])
def list_linked_units(
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
) -> list[UnitSchema]:
    service = ResidentService(db)
    try:
        return [UnitSchema.model_validate(unit) for unit in service.list_linked_units(current_user.id)]
    except ApplicationError as error:
        _raise_http_error(error)


@router.get("/units/{unit_id}/balance", response_model=ResidentBalanceSchema)
def get_unit_balance(
    unit_id: int,
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
) -> ResidentBalanceSchema:
    service = ResidentService(db)
    try:
        service.get_linked_unit(current_user.id, unit_id)
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
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
) -> list[ChargeSchema]:
    service = ResidentService(db)
    try:
        return [
            ChargeSchema.model_validate(charge)
            for charge in service.list_unit_charges(resident_user_id=current_user.id, unit_id=unit_id)
        ]
    except ApplicationError as error:
        _raise_http_error(error)


@router.get("/units/{unit_id}/payments", response_model=list[PaymentSchema])
def list_unit_payments(
    unit_id: int,
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
) -> list[PaymentSchema]:
    service = ResidentService(db)
    try:
        return [
            PaymentSchema.model_validate(payment)
            for payment in service.list_unit_payments(resident_user_id=current_user.id, unit_id=unit_id)
        ]
    except ApplicationError as error:
        _raise_http_error(error)


@router.get("/payments/{payment_id}/proof", response_model=PaymentProofAccessSchema)
def get_payment_proof(
    payment_id: int,
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
    storage: PaymentProofStorage = Depends(get_payment_proof_storage),
) -> PaymentProofAccessSchema:
    service = ResidentService(db)
    try:
        proof_access = service.get_payment_proof_access(current_user.id, payment_id)
        signed_url = storage.generate_payment_proof_download_url(file_key=proof_access.proof.file_key)
        return PaymentProofAccessSchema(
            payment_id=proof_access.payment.id,
            file_key=proof_access.proof.file_key,
            mime_type=proof_access.proof.mime_type,
            file_size=proof_access.proof.file_size,
            url=signed_url.url,
            expires_in=signed_url.expires_in,
        )
    except ApplicationError as error:
        _raise_http_error(error)
    except StorageError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


@router.post("/units/{unit_id}/payments", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
def submit_payment(
    unit_id: int,
    amount: Decimal = Form(...),
    payment_date: date = Form(...),
    payment_method: str = Form(...),
    reference_no: str | None = Form(None),
    proof_file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
    storage: PaymentProofStorage = Depends(get_payment_proof_storage),
) -> PaymentSchema:
    service = ResidentService(db)
    try:
        proof_content = proof_file.file.read()
        _validate_payment_proof_file(proof_file, proof_content)
        payment = service.submit_payment(
            SubmitResidentPayment(
                resident_user_id=current_user.id,
                unit_id=unit_id,
                amount=amount,
                payment_date=payment_date,
                payment_method=payment_method,
                reference_no=reference_no,
                proof_filename=proof_file.filename,
                proof_content_type=proof_file.content_type or "",
                proof_content=proof_content,
            ),
            storage=storage,
        )
        db.commit()
        db.refresh(payment)
        return PaymentSchema.model_validate(payment)
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)
    except StorageError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)) from error


def _validate_payment_proof_file(proof_file: UploadFile, proof_content: bytes) -> None:
    if not proof_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="payment proof file is required")

    content_type = proof_file.content_type or ""
    if content_type not in ALLOWED_PAYMENT_PROOF_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="unsupported payment proof file type")

    if len(proof_content) > MAX_PAYMENT_PROOF_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="payment proof file is too large")


@router.get("/units/{unit_id}/installment-plan", response_model=InstallmentPlanSchema | None)
def get_installment_plan(
    unit_id: int,
    current_user: AuthenticatedUser = Depends(get_current_resident_user),
    db: Session = Depends(get_db),
) -> InstallmentPlanSchema | None:
    service = ResidentService(db)
    try:
        plan = service.get_installment_plan(resident_user_id=current_user.id, unit_id=unit_id)
        return InstallmentPlanSchema.model_validate(plan) if plan is not None else None
    except ApplicationError as error:
        _raise_http_error(error)
