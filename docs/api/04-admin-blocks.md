# Admin API: Blocks

All endpoints in this document require:

```http
Authorization: Bearer <admin_token>
```

## `POST /admin/blocks`

Purpose:
- Create a block under the current admin's residence

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "name": "Tower A",
  "description": "Main residential tower"
}
```

Returns `201 Created`:

```json
{
  "id": 1,
  "residence_id": 1,
  "name": "Tower A",
  "description": "Main residential tower",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

## `GET /admin/blocks`

Purpose:
- List blocks in the current admin's residence

Headers:
- `Authorization: Bearer <admin_token>`

Payload:
- none

Returns `200 OK`:

```json
[
  {
    "id": 1,
    "residence_id": 1,
    "name": "Tower A",
    "description": "Main residential tower",
    "created_at": "2026-05-01T00:00:00Z",
    "updated_at": "2026-05-01T00:00:00Z"
  }
]
```

## `GET /admin/blocks/{block_id}`

Purpose:
- Fetch one block

Headers:
- `Authorization: Bearer <admin_token>`

Path params:
- `block_id`: integer

Returns `200 OK`:

```json
{
  "id": 1,
  "residence_id": 1,
  "name": "Tower A",
  "description": "Main residential tower",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T00:00:00Z"
}
```

## `PATCH /admin/blocks/{block_id}`

Purpose:
- Update one block

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Payload:

```json
{
  "name": "Tower A1",
  "description": "Renamed tower"
}
```

All fields are optional.

Returns `200 OK`:

```json
{
  "id": 1,
  "residence_id": 1,
  "name": "Tower A1",
  "description": "Renamed tower",
  "created_at": "2026-05-01T00:00:00Z",
  "updated_at": "2026-05-01T01:00:00Z"
}
```
