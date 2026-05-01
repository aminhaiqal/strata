# Admin API: Units

All endpoints in this document require:

```http
Authorization: Bearer <admin_token>
```

## `POST /admin/units`

Purpose:
- Create a unit

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
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
  "status": "active"
}
```

Required fields:
- `block_id`
- `unit_number`

Returns `201 Created`:

```json
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
```

Validation notes:
- `unit_number` cannot be blank
- `block_id` must belong to the admin's residence
- unit number must be unique within `(residence_id, block_id, unit_number)`

## `GET /admin/units`

Purpose:
- List units with optional filters

Headers:
- `Authorization: Bearer <admin_token>`

Query params:
- `block_id`: optional integer
- `status`: optional `active|inactive`
- `is_occupied`: optional `true|false`
- `search`: optional string

Example:

```text
/admin/units?block_id=1&status=active&is_occupied=true&search=A-10
```

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

Search behavior:
- matches `unit_number`
- matches `owner_name`
- matches `tenant_name`

## `GET /admin/units/{unit_id}`

Purpose:
- Fetch one unit

Headers:
- `Authorization: Bearer <admin_token>`

Path params:
- `unit_id`: integer

Returns `200 OK`:

```json
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
```

## `PATCH /admin/units/{unit_id}`

Purpose:
- Update one unit

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "block_id": 1,
  "unit_number": "A-10-02",
  "floor": "10",
  "unit_type": "premium",
  "owner_name": "Alice Owner",
  "owner_phone": "0111111111",
  "owner_email": "alice@example.com",
  "tenant_name": "Bob Tenant",
  "tenant_phone": "0199999999",
  "tenant_email": "bob@example.com",
  "is_occupied": false,
  "status": "inactive"
}
```

All fields are optional.

Returns `200 OK`:

```json
{
  "id": 100,
  "residence_id": 1,
  "block_id": 1,
  "unit_number": "A-10-02",
  "floor": "10",
  "unit_type": "premium",
  "owner_name": "Alice Owner",
  "owner_phone": "0111111111",
  "owner_email": "alice@example.com",
  "tenant_name": "Bob Tenant",
  "tenant_phone": "0199999999",
  "tenant_email": "bob@example.com",
  "is_occupied": false,
  "status": "inactive",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T01:00:00Z"
}
```
