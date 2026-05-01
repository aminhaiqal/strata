# Resident Portal API

All endpoints in this document require:

```http
Authorization: Bearer <resident_token>
```

## Linked Units

### `GET /resident/units`

Purpose:
- List units linked to the current resident account

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK`:

```json
[
  {
    "id": 100,
    "residence_id": 1,
    "block_id": 1,
    "unit_number": "A-10-01",
    "floor": "10",
    "unit_type": "standard",
    "owner_name": "Alice Owner",
    "owner_phone": "0123456789",
    "owner_email": "alice@example.com",
    "tenant_name": "Bob Tenant",
    "tenant_phone": "0199999999",
    "tenant_email": "bob@example.com",
    "is_occupied": true,
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
]
```

## Balance

### `GET /resident/units/{unit_id}/balance`

Purpose:
- Get the latest account snapshot for one linked unit

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK`:

```json
{
  "unit_id": 100,
  "total_charged": "500.00",
  "total_paid": "200.00",
  "total_outstanding": "300.00",
  "pending_payment_amount": "100.00",
  "oldest_unpaid_due_date": "2026-04-01",
  "months_overdue": 1,
  "classification": "recently_overdue",
  "last_payment_date": "2026-04-15",
  "last_follow_up_date": null
}
```

Returns:
- `404` if no balance snapshot exists for the unit

## Charges

### `GET /resident/units/{unit_id}/charges`

Purpose:
- List charges for one linked unit

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK`:

```json
[
  {
    "id": 1,
    "residence_id": 1,
    "unit_id": 100,
    "charge_type": "maintenance",
    "description": "April maintenance fee",
    "amount": "100.00",
    "billing_month": "2026-04-01",
    "due_date": "2026-04-15",
    "status": "pending",
    "created_by": 10,
    "created_at": "2026-04-01T00:00:00Z",
    "updated_at": "2026-04-01T00:00:00Z"
  }
]
```

## Payments

### `GET /resident/units/{unit_id}/payments`

Purpose:
- List payments for one linked unit

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK`:

```json
[
  {
    "id": 10,
    "residence_id": 1,
    "unit_id": 100,
    "amount": "100.00",
    "payment_date": "2026-04-15",
    "payment_method": "bank_transfer",
    "reference_no": "TXN-123",
    "status": "pending_verification",
    "submitted_by": 20,
    "verified_by": null,
    "verified_at": null,
    "rejected_reason": null,
    "created_at": "2026-04-15T00:00:00Z",
    "updated_at": "2026-04-15T00:00:00Z"
  }
]
```

### `POST /resident/units/{unit_id}/payments`

Purpose:
- Submit a payment with proof file

Headers:
- `Authorization: Bearer <resident_token>`
- `Content-Type: multipart/form-data`

Form fields:
- `amount`: decimal string
- `payment_date`: date in `YYYY-MM-DD`
- `payment_method`: string
- `reference_no`: optional string
- `proof_file`: uploaded file

Example multipart values:

```text
amount=100.00
payment_date=2026-05-01
payment_method=bank_transfer
reference_no=TXN-123
proof_file=<file>
```

Returns `201 Created`:

```json
{
  "id": 10,
  "residence_id": 1,
  "unit_id": 100,
  "amount": "100.00",
  "payment_date": "2026-05-01",
  "payment_method": "bank_transfer",
  "reference_no": "TXN-123",
  "status": "pending_verification",
  "submitted_by": 20,
  "verified_by": null,
  "verified_at": null,
  "rejected_reason": null,
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

Validation notes:
- proof file is required
- proof file MIME type must be allowed by storage config
- proof file size must be within the configured limit
- amount must be greater than zero

## Payment Proof Access

### `GET /resident/payments/{payment_id}/proof`

Purpose:
- Get a signed download URL for a payment proof file

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK`:

```json
{
  "payment_id": 10,
  "file_key": "payment-proofs/residences/1/units/100/payments/10/proof.png",
  "mime_type": "image/png",
  "file_size": 123456,
  "url": "https://storage.example/signed-url",
  "expires_in": 3600
}
```

## Installment Plan

### `GET /resident/units/{unit_id}/installment-plan`

Purpose:
- Get the latest installment plan for one linked unit

Headers:
- `Authorization: Bearer <resident_token>`

Returns `200 OK` with a plan:

```json
{
  "id": 1,
  "residence_id": 1,
  "unit_id": 100,
  "total_amount": "1200.00",
  "start_date": "2026-05-01",
  "end_date": "2026-10-01",
  "status": "active",
  "created_by": 10,
  "approved_by": 10,
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

Returns `200 OK` with no active or latest plan:

```json
null
```
