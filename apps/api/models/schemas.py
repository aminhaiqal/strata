from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from .db import (
    ChargeStatus,
    ClassificationCategory,
    EntityStatus,
    FollowUpStatus,
    FollowUpType,
    ImportStatus,
    ImportType,
    InstallmentPlanStatus,
    InstallmentScheduleStatus,
    NoteVisibility,
    NotificationChannel,
    NotificationStatus,
    NotificationType,
    PaymentStatus,
    ResidenceStatus,
    UnitUserRelationshipType,
    UserRole,
)


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ResidenceSchema(ORMBase):
    id: int
    name: str
    address: str
    timezone: str
    currency: str
    billing_cycle_day: int
    status: ResidenceStatus
    created_at: datetime
    updated_at: datetime


class BlockSchema(ORMBase):
    id: int
    residence_id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class UnitSchema(ORMBase):
    id: int
    residence_id: int
    block_id: int
    unit_number: str
    floor: str | None
    unit_type: str | None
    owner_name: str | None
    owner_phone: str | None
    owner_email: str | None
    tenant_name: str | None
    tenant_phone: str | None
    tenant_email: str | None
    is_occupied: bool
    status: EntityStatus
    created_at: datetime
    updated_at: datetime


class UserSchema(ORMBase):
    id: int
    residence_id: int
    name: str
    email: str
    phone: str | None
    role: UserRole
    status: EntityStatus
    created_at: datetime
    updated_at: datetime


class UnitUserSchema(ORMBase):
    id: int
    unit_id: int
    user_id: int
    relationship_type: UnitUserRelationshipType
    created_at: datetime


class UnitResidentLinkSchema(BaseModel):
    unit_id: int
    user_id: int
    relationship_type: UnitUserRelationshipType
    resident: UserSchema


class ChargeSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    charge_type: str
    description: str | None
    amount: Decimal
    billing_month: date
    due_date: date
    status: ChargeStatus
    created_by: int
    created_at: datetime
    updated_at: datetime


class PaymentSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    amount: Decimal
    payment_date: date
    payment_method: str
    reference_no: str | None
    status: PaymentStatus
    submitted_by: int
    verified_by: int | None
    verified_at: datetime | None
    rejected_reason: str | None
    created_at: datetime
    updated_at: datetime


class PaymentProofSchema(ORMBase):
    id: int
    payment_id: int
    storage_provider: str
    file_key: str
    mime_type: str
    file_size: int
    uploaded_by: int
    created_at: datetime


class PaymentProofAccessSchema(BaseModel):
    payment_id: int
    file_key: str
    mime_type: str
    file_size: int
    url: str
    expires_in: int


class PaymentAllocationSchema(ORMBase):
    id: int
    payment_id: int
    charge_id: int
    amount_allocated: Decimal
    created_at: datetime


class InstallmentPlanSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    total_amount: Decimal
    start_date: date
    end_date: date
    status: InstallmentPlanStatus
    created_by: int
    approved_by: int | None
    created_at: datetime
    updated_at: datetime


class InstallmentScheduleSchema(ORMBase):
    id: int
    installment_plan_id: int
    due_date: date
    amount_due: Decimal
    amount_paid: Decimal
    status: InstallmentScheduleStatus
    created_at: datetime
    updated_at: datetime


class FollowUpRecordSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    follow_up_type: FollowUpType
    message: str
    next_follow_up_date: date | None
    status: FollowUpStatus
    created_by: int
    created_at: datetime


class AdminNoteSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    note: str
    visibility: NoteVisibility
    created_by: int
    created_at: datetime


class AccountSnapshotSchema(ORMBase):
    id: int
    residence_id: int
    unit_id: int
    total_charged: Decimal
    total_paid: Decimal
    total_outstanding: Decimal
    pending_payment_amount: Decimal
    oldest_unpaid_due_date: date | None
    months_overdue: int
    classification: ClassificationCategory
    last_payment_date: date | None
    last_follow_up_date: date | None
    updated_at: datetime


class ImportBatchSchema(ORMBase):
    id: int
    residence_id: int
    import_type: ImportType
    filename: str
    status: ImportStatus
    total_rows: int
    success_rows: int
    failed_rows: int
    uploaded_by: int
    created_at: datetime
    completed_at: datetime | None


class ImportErrorSchema(ORMBase):
    id: int
    import_batch_id: int
    row_number: int
    field: str
    error_message: str
    raw_value: str | None


class AuditLogSchema(ORMBase):
    id: int
    residence_id: int
    actor_user_id: int
    entity_type: str
    entity_id: str
    action: str
    before_json: dict | None
    after_json: dict | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class NotificationSchema(ORMBase):
    id: int
    residence_id: int
    recipient_user_id: int
    unit_id: int | None
    type: NotificationType
    channel: NotificationChannel
    title: str
    message: str
    status: NotificationStatus
    sent_at: datetime | None
    created_at: datetime
