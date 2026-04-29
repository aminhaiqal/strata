from enum import StrEnum


class ResidenceStatus(StrEnum):
    active = "active"
    inactive = "inactive"


class UserRole(StrEnum):
    super_admin = "super_admin"
    residence_admin = "residence_admin"
    finance_admin = "finance_admin"
    resident = "resident"


class EntityStatus(StrEnum):
    active = "active"
    inactive = "inactive"


class UnitUserRelationshipType(StrEnum):
    owner = "owner"
    tenant = "tenant"
    representative = "representative"


class ChargeStatus(StrEnum):
    pending = "pending"
    partially_paid = "partially_paid"
    paid = "paid"
    waived = "waived"
    cancelled = "cancelled"
    overdue = "overdue"


class PaymentStatus(StrEnum):
    pending_verification = "pending_verification"
    verified = "verified"
    rejected = "rejected"
    cancelled = "cancelled"


class InstallmentPlanStatus(StrEnum):
    active = "active"
    completed = "completed"
    defaulted = "defaulted"
    cancelled = "cancelled"


class InstallmentScheduleStatus(StrEnum):
    pending = "pending"
    partially_paid = "partially_paid"
    paid = "paid"
    missed = "missed"


class FollowUpType(StrEnum):
    whatsapp = "whatsapp"
    phone_call = "phone_call"
    email = "email"
    in_person = "in_person"
    notice_letter = "notice_letter"
    legal_warning = "legal_warning"
    other = "other"


class FollowUpStatus(StrEnum):
    open = "open"
    done = "done"
    no_response = "no_response"
    promised_to_pay = "promised_to_pay"
    escalated = "escalated"


class NoteVisibility(StrEnum):
    internal_only = "internal_only"
    visible_to_finance_admin = "visible_to_finance_admin"
    visible_to_resident = "visible_to_resident"


class ClassificationCategory(StrEnum):
    healthy = "healthy"
    pending_verification = "pending_verification"
    recently_overdue = "recently_overdue"
    long_overdue = "long_overdue"
    never_paid = "never_paid"
    irregular = "irregular"
    legacy_debtor = "legacy_debtor"
    on_installment = "on_installment"
    under_review = "under_review"


class ImportType(StrEnum):
    units = "units"
    opening_balances = "opening_balances"
    historical_payments = "historical_payments"
    monthly_charges = "monthly_charges"


class ImportStatus(StrEnum):
    uploaded = "uploaded"
    validated = "validated"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class NotificationType(StrEnum):
    payment_submitted = "payment_submitted"
    payment_verified = "payment_verified"
    payment_rejected = "payment_rejected"
    overdue_reminder = "overdue_reminder"
    installment_due = "installment_due"
    follow_up_due = "follow_up_due"


class NotificationChannel(StrEnum):
    in_app = "in_app"
    email = "email"
    whatsapp_manual = "whatsapp_manual"
    whatsapp_api_later = "whatsapp_api_later"


class NotificationStatus(StrEnum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    cancelled = "cancelled"
