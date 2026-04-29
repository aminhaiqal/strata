# Axelyn Strata — Finance Module Requirements

## 1. Product Overview

Axelyn Strata is a modular property operations system built for JMB, MC, and strata residential communities.

The first module, Axelyn Strata Finance, replaces colour-coded spreadsheets and manual payment follow-ups with a structured backend system for tracking maintenance fees, arrears, payment proofs, installment plans, and debtor classifications.

## 2. Core Objective

The Finance module must provide a reliable source of truth for residence collection operations.

It should answer:

- Who owes money?
- How much do they owe?
- Since when?
- What category are they in?
- Has follow-up been done?
- Has payment proof been submitted?
- Has the payment been verified?
- What changed, when, and by whom?

## 3. Main Problems Addressed

- Manual spreadsheet tracking
- Colour-coded debtor status
- No live collection dashboard
- Lost payment proof in WhatsApp
- Inconsistent follow-ups
- No audit trail
- Residents disputing balances
- Admins manually checking payment history
- No prioritization of serious debtors
- Poor visibility into total outstanding amounts

## 4. User Roles

### 4.1 Axelyn Super Admin

Can:

- Create residences
- Manage residence admins
- View all system data
- Configure system-level settings

### 4.2 Residence Admin

Can:

- Manage units
- Manage charges
- Verify payments
- Reject payments
- Create installment plans
- Add follow-up records
- View dashboard and reports

### 4.3 Finance Admin

Can:

- Manage financial records
- Verify payment proof
- View reports
- Add follow-up records

Cannot:

- Manage system settings
- Manage other admins

### 4.4 Resident / Tenant

Can:

- View own unit balance
- View unpaid charges
- Upload payment proof
- Track payment status
- View installment plan

## 5. Core Entities

## 5.1 Residence

Represents one residential community.

Required fields:

- id
- name
- address
- timezone
- currency
- billing_cycle_day
- status
- created_at
- updated_at

## 5.2 Block / Building

Represents a block, tower, or building inside a residence.

Required fields:

- id
- residence_id
- name
- description
- created_at
- updated_at

## 5.3 Unit

Represents one property unit.

Required fields:

- id
- residence_id
- block_id
- unit_number
- floor
- unit_type
- owner_name
- owner_phone
- owner_email
- tenant_name
- tenant_phone
- tenant_email
- is_occupied
- status
- created_at
- updated_at

## 5.4 User

Represents a person who can access the system.

Required fields:

- id
- residence_id
- name
- email
- phone
- password_hash
- role
- status
- created_at
- updated_at

## 5.5 Unit User

Links users to units.

Required fields:

- id
- unit_id
- user_id
- relationship_type
- created_at

Relationship types:

- owner
- tenant
- representative

## 6. Financial Entities

## 6.1 Charge

Represents money billed to a unit.

Examples:

- Maintenance fee
- Sinking fund
- Penalty
- Special repair fee
- Late fee

Required fields:

- id
- residence_id
- unit_id
- charge_type
- description
- amount
- billing_month
- due_date
- status
- created_by
- created_at
- updated_at

Charge statuses:

- pending
- partially_paid
- paid
- waived
- cancelled
- overdue

## 6.2 Payment

Represents money submitted or received.

Required fields:

- id
- residence_id
- unit_id
- amount
- payment_date
- payment_method
- reference_no
- status
- submitted_by
- verified_by
- verified_at
- rejected_reason
- created_at
- updated_at

Payment statuses:

- pending_verification
- verified
- rejected
- cancelled

## 6.3 Payment Proof

Stores receipt or payment proof metadata.

Required fields:

- id
- payment_id
- storage_provider
- file_key
- mime_type
- file_size
- uploaded_by
- created_at

Storage rule:

- Files should be stored in Cloudflare R2.
- The database should store object keys, not public URLs.
- Receipt access should use signed URLs.

Example file key:

```text
receipts/{residence_id}/{unit_id}/{payment_id}.jpg
```

## 6.4 Payment Allocation

Links verified payments to specific charges.

Required fields:

- id
- payment_id
- charge_id
- amount_allocated
- created_at

Business rules:

- One payment may cover multiple charges.
- One charge may be paid by multiple payments.
- Payment allocation cannot exceed payment amount.
- Charge allocation cannot exceed charge balance unless overpayment handling exists.

## 7. Installment Plan
## 7.1 Installment Plan

Represents a repayment agreement for a unit.

Required fields:

- id
- residence_id
- unit_id
- total_amount
- start_date
- end_date
- status
- created_by
- approved_by
- created_at
- updated_at

Statuses:

- active
- completed
- defaulted
- cancelled

## 7.2 Installment Schedule

Represents each payment schedule inside a plan.

Required fields:

- id
- installment_plan_id
- due_date
- amount_due
- amount_paid
- status
- created_at
- updated_at

Statuses:

- pending
- partially_paid
- paid
- missed

## 8. Follow-Up Management
## 8.1 Follow-Up Record

Tracks admin actions taken against overdue units.

Required fields:

- id
- residence_id
- unit_id
- follow_up_type
- message
- next_follow_up_date
- status
- created_by
- created_at

Follow-up types:

- whatsapp
- phone_call
- email
- in_person
- notice_letter
- legal_warning
- other

Statuses:

- open
- done
- no_response
- promised_to_pay
- escalated

## 8.2 Admin Note

Stores internal notes about a unit.

Required fields:

- id
- residence_id
- unit_id
- note
- visibility
- created_by
- created_at

Visibility types:

- internal_only
- visible_to_finance_admin
- visible_to_resident

Default visibility:

- internal_only

## 9. Classification Engine

Each unit must be automatically classified based on payment behavior.

## 9.1 Classification Categories

Supported categories:

- healthy
- pending_verification
- recently_overdue
- long_overdue
- never_paid
- irregular
- legacy_debtor
- on_installment
- under_review

## 9.2 Default Classification Rules
**healthy**: A unit has no overdue outstanding balance.

**pending_verification**: A unit has at least one payment proof submitted and awaiting admin verification.

**recently_overdue**: A unit has outstanding balance where the oldest unpaid due date is less than 60 days overdue.

**long_overdue**: A unit has outstanding balance where the oldest unpaid due date is between 60 and 180 days overdue.

**legacy_debtor**: A unit has outstanding balance where the oldest unpaid due date is more than 180 days overdue.

**never_paid**: A unit has charges but zero verified payments.

**irregular**: A unit has inconsistent payment behavior.

Example:
- Paid fewer than 4 out of the last 6 monthly charges on time.

**on_installment**: A unit has an active installment plan.

**under_review**: A unit has unusual financial state that requires manual admin review.

## 9.3 Classification Priority

If multiple categories apply, use this priority order:

1. on_installment
2. pending_verification
3. never_paid
4. legacy_debtor
5. long_overdue
6. recently_overdue
7. irregular
8. healthy

## 10. Balance Calculation

Balances must be derived from charges and verified payment allocations.

The system must calculate:

- total_charged
- total_verified_paid
- total_pending_payment
- total_outstanding
- oldest_unpaid_charge_date
- months_overdue
- current_month_due
- installment_due
- installment_paid
- installment_remaining

Rules:

- Pending payments must not reduce verified outstanding balance.
- Rejected payments must not affect balance.
- Cancelled charges must not affect balance.
- Waived charges must reduce outstanding amount.
- Verified payments must be allocated before reducing charge balances.

## 11. Account Snapshot

For dashboard performance, the system should store computed snapshots.

Required fields:

- id
- residence_id
- unit_id
- total_charged
- total_paid
- total_outstanding
- pending_payment_amount
- oldest_unpaid_due_date
- months_overdue
- classification
- last_payment_date
- last_follow_up_date
- updated_at

Snapshots should be refreshed when:

- charge is created
- payment is verified
- payment is rejected
- payment is allocated
- installment plan is created or updated
- follow-up record is created
- classification job runs

## 12. Import System

The backend must support importing existing spreadsheet data.

Supported imports:

- units
- opening balances
- historical payments
- monthly charges

## 12.1 Import Flow
1. Admin uploads file.
2. System parses file.
3. System validates rows.
4. System returns preview with errors.
5. Admin confirms import.
6. System creates records.
7. System logs import result.

## 12.2 Import Batch

Required fields:

- id
- residence_id
- import_type
- filename
- status
- total_rows
- success_rows
- failed_rows
- uploaded_by
- created_at
- completed_at

Statuses:

- uploaded
- validated
- processing
- completed
- failed
- cancelled

## 12.3 Import Error

Required fields:

- id
- import_batch_id
- row_number
- field
- error_message
- raw_value

## 13. Dashboard Requirements

Admin dashboard must expose:

- collection_rate
- total_outstanding
- total_collected_this_month
- total_pending_verification
- number_of_overdue_units
- number_of_never_paid_units
- number_of_units_on_installment
- classification_breakdown
- monthly_collection_trend
- top_debtor_units
- recent_payment_submissions
- follow_ups_due_today

Suggested endpoints:
```text
GET /admin/dashboard/summary
GET /admin/dashboard/classifications
GET /admin/dashboard/collection-trend
GET /admin/dashboard/top-debtors
GET /admin/dashboard/pending-actions
```
## 14. Resident Portal Requirements

Residents must only access their own linked units.

Resident can:

- View linked units
- View current balance
- View unpaid charges
- View payment history
- Upload payment proof
- View payment verification status
- View installment plan

Suggested endpoints:
```text
GET /resident/units
GET /resident/units/{unit_id}/balance
GET /resident/units/{unit_id}/charges
GET /resident/units/{unit_id}/payments
POST /resident/units/{unit_id}/payments
GET /resident/units/{unit_id}/installment-plan
```

## 15. Admin API Requirements

Admin can:

- Create units
- Edit units
- Create charges
- Bulk-generate monthly charges
- Record manual payments
- Verify payments
- Reject payments
- Create installment plans
- Add follow-up records
- Add admin notes
- Trigger reclassification
- Export reports

Suggested endpoints:
```text
POST /admin/units
GET /admin/units
GET /admin/units/{unit_id}
PATCH /admin/units/{unit_id}

POST /admin/charges
POST /admin/charges/bulk-generate
GET /admin/units/{unit_id}/charges

POST /admin/payments/manual
GET /admin/payments/pending
POST /admin/payments/{payment_id}/verify
POST /admin/payments/{payment_id}/reject

POST /admin/installment-plans
PATCH /admin/installment-plans/{id}

POST /admin/units/{unit_id}/follow-ups
GET /admin/follow-ups/due

POST /admin/imports
GET /admin/imports/{id}

GET /admin/reports/arrears
GET /admin/reports/collection
```

## 16. Audit Log Requirements

Every sensitive financial action must be logged.

Actions to audit:

- charge_created
- charge_updated
- charge_cancelled
- payment_submitted
- payment_verified
- payment_rejected
- payment_allocated
- installment_plan_created
- installment_plan_updated
- unit_classification_changed
- manual_balance_adjustment
- import_completed
- user_role_changed

Required fields:

- id
- residence_id
- actor_user_id
- entity_type
- entity_id
- action
- before_json
- after_json
- ip_address
- user_agent
- created_at

## 17. Notification Requirements

The system should support notification records even if actual sending is manual in MVP.

Notification types:

- payment_submitted
- payment_verified
- payment_rejected
- overdue_reminder
- installment_due
- follow_up_due

Channels:

- in_app
- email
- whatsapp_manual
- whatsapp_api_later

Required fields:

- id
- residence_id
- recipient_user_id
- unit_id
- type
- channel
- title
- message
- status
- sent_at
- created_at

## 18. Reports

MVP reports:

- Arrears report
- Collection summary report
- Payment verification report
- Installment plan report
- Never-paid units report
- Long-overdue units report

Export formats:

- CSV for MVP
- PDF later

Most important report:
```text
Who owes what, since when, and what action has been taken?
```

## 19. Permission Rules

Every request must be scoped by residence_id.

Basic permission matrix:
| Role            | View Dashboard | Manage Units | Manage Charges | Verify Payments | View Reports  | Manage Users |
| --------------- | -------------- | ------------ | -------------- | --------------- | ------------- | ------------ |
| Super Admin     | Yes            | Yes          | Yes            | Yes             | Yes           | Yes          |
| Residence Admin | Yes            | Yes          | Yes            | Yes             | Yes           | Limited      |
| Finance Admin   | Yes            | No/Limited   | Yes            | Yes             | Yes           | No           |
| Resident        | No             | No           | No             | No              | Own Data Only | No           |

## 20. Backend Architecture

Recommended stack:

- Python FastAPI for API layer
- PostgreSQL for primary database
- Rust for classification and financial calculation engine
- Cloudflare R2 for receipt storage
- Background worker for imports, snapshots, and scheduled jobs

Recommended architecture:
```text
Frontend
   |
FastAPI Backend
   |
PostgreSQL
   |
Rust Engine
   |
Background Worker
   |
Cloudflare R2
```

Python handles:

- API routes
- authentication
- authorization
- business workflows
- file upload orchestration
- reports
- background job coordination

Rust handles:

- classification engine
- balance calculation engine
- validation rules
- snapshot generation logic
- import validation if needed

## 21. Background Jobs

Required jobs:

- recalculate_unit_balance
- reclassify_unit
- generate_monthly_charges
- process_import_batch
- refresh_dashboard_snapshots
- send_due_follow_up_notifications
- expire_pending_payment_proofs
- mark_installments_missed

Daily jobs:

- reclassify active units
- update overdue statuses
- mark missed installments
- generate follow-up reminders

Monthly jobs:

- generate maintenance charges
- generate collection report snapshot

## 22. Data Integrity Rules

The system must enforce:

- Payment amount must be positive.
- Charge amount must be positive unless adjustment type allows negative.
- Verified payment cannot be edited without audit log.
- Rejected payment cannot affect balance.
- Payment cannot allocate more than its amount.
- Charge cannot be overpaid unless overpayment handling exists.
- Installment schedule total must equal installment plan total.
- Unit number must be unique per residence and block.
- Every financial record must belong to one residence.
- Pending payment must not reduce verified outstanding balance.

## 23. Security Requirements

Minimum security requirements:

- Passwords must be hashed using Argon2 or bcrypt.
- Auth must use JWT or secure sessions.
- Role-based access control is required.
- Receipt files must use signed URLs.
- File uploads must validate MIME type.
- File uploads must have size limits.
- All financial actions must be audited.
- Auth and upload endpoints should be rate-limited.
- R2 bucket must not be publicly accessible.

Sensitive data:

- Owner phone number
- Tenant phone number
- Payment proof
- Outstanding balance
- Admin notes
- Follow-up history

## 24. MVP Scope

The MVP must include:

- Multi-residence support
- User roles
- Unit management
- Charge creation
- Bulk monthly charge generation
- Payment submission
- Payment proof upload
- Payment verification
- Payment rejection
- Payment allocation
- Balance calculation
- Unit classification
- Admin dashboard summary
- Resident balance view
- Follow-up records
- Audit logs
- CSV import for units and opening balances

## 25. Out of Scope for MVP

Do not include yet:

- WhatsApp API automation
- Payment gateway
- Full accounting ledger
- PDF invoices
- Mobile app
- AI prediction
- Legal workflow automation
- Advanced analytics
- Multi-language support

## 26. Recommended Build Order
1. Residence model
2. User and role system
3. Unit model
4. Unit-user relationship
5. Charge model
6. Payment model
7. Payment proof upload
8. Payment verification flow
9. Payment allocation logic
10. Balance calculation
11. Classification engine
12. Account snapshot table
13. Admin dashboard API
14. Resident portal API
15. Follow-up records
16. Import system
17. Audit logging
18. Reports and exports

## 27. Admin User Flow
1. Admin logs in.
2. Admin selects residence.
3. Admin imports or creates units.
4. Admin generates monthly charges.
5. System calculates balances.
6. System classifies units automatically.
7. Admin views dashboard.
8. Admin opens overdue unit.
9. Admin reviews payment and follow-up history.
10. Admin records follow-up or creates installment plan.
11. Resident submits payment proof.
12. Admin verifies or rejects payment.
13. System allocates verified payment.
14. System updates balance.
15. System reclassifies unit.
16. Dashboard updates.

## 28. Resident User Flow
1. Resident logs in.
2. Resident views linked unit.
3. Resident checks outstanding balance.
4. Resident views unpaid charges.
5. Resident uploads payment proof.
6. Payment becomes pending verification.
7. Admin verifies payment.
8. Resident sees updated balance.
9. If installment plan exists, resident sees schedule and next due date.

## 29. Success Metrics

Track these from day one:

- Collection rate improvement
- Total RM recovered
- Total outstanding reduced
- Number of overdue units reduced
- Number of never-paid units reduced
- Admin time saved
- Number of payment disputes reduced
- Number of successful follow-ups
- Average payment verification time

## 30. Positioning Statement

Axelyn Strata Finance helps JMB and MC teams recover unpaid maintenance fees faster by replacing manual spreadsheets with a live collection control system.

It gives admins real-time visibility into outstanding balances, overdue units, payment proofs, installment plans, and follow-up status.

```text
This should be your **backend requirement baseline** before writing the first API.
```