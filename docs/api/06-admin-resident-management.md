# Admin API: Resident Management

All endpoints in this document require:

```http
Authorization: Bearer <admin_token>
```

## Resident Accounts

### `POST /admin/residents`

Purpose:
- Create a resident user account

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "name": "Resident One",
  "email": "resident1@example.com",
  "temporary_password": "temp12345",
  "phone": "0123456789"
}
```

Returns `201 Created`:

```json
{
  "id": 20,
  "residence_id": 1,
  "name": "Resident One",
  "email": "resident1@example.com",
  "phone": "0123456789",
  "role": "resident",
  "status": "active",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

Validation notes:
- email must be unique inside the residence

### `GET /admin/residents`

Purpose:
- List resident accounts in the current admin's residence

Headers:
- `Authorization: Bearer <admin_token>`

Returns `200 OK`:

```json
[
  {
    "id": 20,
    "residence_id": 1,
    "name": "Resident One",
    "email": "resident1@example.com",
    "phone": "0123456789",
    "role": "resident",
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
]
```

### `PATCH /admin/residents/{user_id}`

Purpose:
- Update a resident account

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "name": "Resident One Updated",
  "phone": "0191111111",
  "status": "inactive"
}
```

All fields are optional.

Returns `200 OK`:

```json
{
  "id": 20,
  "residence_id": 1,
  "name": "Resident One Updated",
  "email": "resident1@example.com",
  "phone": "0191111111",
  "role": "resident",
  "status": "inactive",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T01:00:00Z"
}
```

## Resident-to-Unit Linking

### `GET /admin/units/{unit_id}/residents`

Purpose:
- List resident links for one unit

Headers:
- `Authorization: Bearer <admin_token>`

Returns `200 OK`:

```json
[
  {
    "unit_id": 100,
    "user_id": 20,
    "relationship_type": "owner",
    "resident": {
      "id": 20,
      "residence_id": 1,
      "name": "Resident One",
      "email": "resident1@example.com",
      "phone": "0123456789",
      "role": "resident",
      "status": "active",
      "created_at": "2026-05-01T00:00:00Z",
      "updated_at": "2026-05-01T00:00:00Z"
    }
  }
]
```

### `POST /admin/units/{unit_id}/residents`

Purpose:
- Link a resident account to a unit

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "user_id": 20,
  "relationship_type": "tenant"
}
```

Allowed `relationship_type` values:
- `owner`
- `tenant`
- `representative`

Returns `201 Created`:

```json
{
  "unit_id": 100,
  "user_id": 20,
  "relationship_type": "tenant",
  "resident": {
    "id": 20,
    "residence_id": 1,
    "name": "Resident One",
    "email": "resident1@example.com",
    "phone": "0123456789",
    "role": "resident",
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
}
```

Validation notes:
- the resident must belong to the same residence
- the unit must belong to the same residence
- duplicate links are rejected

### `DELETE /admin/units/{unit_id}/residents/{user_id}`

Purpose:
- Remove a resident-to-unit link

Headers:
- `Authorization: Bearer <admin_token>`

Returns `204 No Content`

Response body:
- none
