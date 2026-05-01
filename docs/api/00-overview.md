# API Overview

This documentation covers the endpoints that are currently implemented and ready to use.

## Base URL

Use your API host, for example:

```text
http://localhost:8000
```

## Content Types

- JSON endpoints: `Content-Type: application/json`
- File upload endpoints: `Content-Type: multipart/form-data`

## Authorization Header

Protected endpoints require a bearer token:

```http
Authorization: Bearer <access_token>
```

## Roles

Current implemented auth behavior:
- Admin endpoints accept `residence_admin`
- Resident endpoints accept `resident`

## Common Error Shape

Most errors return:

```json
{
  "detail": "error message"
}
```

Common statuses:
- `400 Bad Request`
- `401 Unauthorized`
- `404 Not Found`
- `502 Bad Gateway` for storage-related failures on payment proof access or upload
