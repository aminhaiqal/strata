# Admin API: Residences

All endpoints in this document require:

```http
Authorization: Bearer <admin_token>
```

Only the current admin's residence is accessible with the current implementation.

## `GET /admin/residences`

Purpose:
- List the current admin's accessible residence records

Headers:
- `Authorization: Bearer <admin_token>`

Payload:
- none

Returns `200 OK`:

```json
[
  {
    "id": 1,
    "name": "Residency One",
    "address": "123 Street",
    "timezone": "Asia/Kuala_Lumpur",
    "currency": "MYR",
    "billing_cycle_day": 1,
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
]
```

## `GET /admin/residences/{residence_id}`

Purpose:
- Fetch one residence record

Headers:
- `Authorization: Bearer <admin_token>`

Path params:
- `residence_id`: integer

Payload:
- none

Returns `200 OK`:

```json
{
  "id": 1,
  "name": "Residency One",
  "address": "123 Street",
  "timezone": "Asia/Kuala_Lumpur",
  "currency": "MYR",
  "billing_cycle_day": 1,
  "status": "active",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

Returns:
- `400` if the requested residence is outside the admin scope
- `404` if not found

## `PATCH /admin/residences/{residence_id}`

Purpose:
- Update the current admin's residence

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Path params:
- `residence_id`: integer

Payload:

```json
{
  "name": "Updated Residence",
  "address": "Updated Address",
  "timezone": "Asia/Kuala_Lumpur",
  "currency": "MYR",
  "billing_cycle_day": 15,
  "status": "active"
}
```

All fields are optional. Send only the fields you want to change.

Returns `200 OK`:

```json
{
  "id": 1,
  "name": "Updated Residence",
  "address": "Updated Address",
  "timezone": "Asia/Kuala_Lumpur",
  "currency": "MYR",
  "billing_cycle_day": 15,
  "status": "active",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T01:00:00Z"
}
```

Validation notes:
- `billing_cycle_day` must be between `1` and `31`
