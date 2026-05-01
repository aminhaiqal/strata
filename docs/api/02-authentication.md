# Authentication

## Resident Login

### `POST /auth/resident/login`

Purpose:
- Get a resident bearer token

Headers:
- `Content-Type: application/json`

Payload:

```json
{
  "email": "resident@example.com",
  "password": "secret123"
}
```

Returns `200 OK`:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 20,
    "residence_id": 1,
    "name": "Resident One",
    "email": "resident@example.com",
    "phone": "111",
    "role": "resident",
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
}
```

Returns `401 Unauthorized` when:
- residence, email, or password is invalid

## Admin Login

### `POST /auth/admin/login`

Purpose:
- Get an admin bearer token

Headers:
- `Content-Type: application/json`

Payload:

```json
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

Returns `200 OK`:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 10,
    "residence_id": 1,
    "name": "Residence Admin",
    "email": "admin@example.com",
    "phone": null,
    "role": "residence_admin",
    "status": "active",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
}
```

Returns `401 Unauthorized` when:
- residence, email, or password is invalid
