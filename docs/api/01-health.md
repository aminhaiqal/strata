# Health Endpoints

## `GET /health`

Purpose:
- Simple service health check

Headers:
- none

Payload:
- none

Returns `200 OK`:

```json
{
  "status": "ok"
}
```

## `GET /health/db`

Purpose:
- Database connectivity health check

Headers:
- none

Payload:
- none

Returns `200 OK`:

```json
{
  "status": "ok"
}
```
