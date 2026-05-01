# Admin API: Imports

All endpoints in this document require:

```http
Authorization: Bearer <admin_token>
```

## Unit Import

### `POST /admin/imports/units`

Purpose:
- Upload and process a CSV file to create units

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: multipart/form-data`

Form fields:
- `file`: CSV file

Required CSV columns:
- `block_name`
- `unit_number`
- `floor`
- `unit_type`
- `owner_name`
- `owner_phone`
- `owner_email`
- `tenant_name`
- `tenant_phone`
- `tenant_email`
- `is_occupied`
- `status`

Accepted `is_occupied` values:
- `true`
- `false`
- `1`
- `0`
- `yes`
- `no`
- `y`
- `n`

Accepted `status` values:
- `active`
- `inactive`

Example CSV:

```csv
block_name,unit_number,floor,unit_type,owner_name,owner_phone,owner_email,tenant_name,tenant_phone,tenant_email,is_occupied,status
Tower A,A-10-01,10,standard,Alice Owner,0123456789,alice@example.com,Bob Tenant,0199999999,bob@example.com,true,active
Tower A,A-10-02,10,standard,Carol Owner,0122222222,carol@example.com,,,false,inactive
```

Returns `201 Created`:

```json
{
  "id": 1,
  "residence_id": 1,
  "import_type": "units",
  "filename": "units.csv",
  "status": "completed",
  "total_rows": 2,
  "success_rows": 2,
  "failed_rows": 0,
  "uploaded_by": 10,
  "created_at": "2026-05-01T00:00:00Z",
  "completed_at": "2026-05-01T00:00:03Z",
  "errors": []
}
```

Example partial-failure response:

```json
{
  "id": 2,
  "residence_id": 1,
  "import_type": "units",
  "filename": "units.csv",
  "status": "failed",
  "total_rows": 2,
  "success_rows": 1,
  "failed_rows": 1,
  "uploaded_by": 10,
  "created_at": "2026-05-01T00:00:00Z",
  "completed_at": "2026-05-01T00:00:03Z",
  "errors": [
    {
      "id": 1,
      "import_batch_id": 2,
      "row_number": 3,
      "field": "block_name",
      "error_message": "block was not found in the residence",
      "raw_value": "{'block_name': 'Unknown', 'unit_number': 'A-4-4'}"
    }
  ]
}
```

Behavior notes:
- import is processed synchronously
- blocks must already exist
- row-level failures are stored in `errors`
- invalid rows do not stop the other rows from being processed

### `GET /admin/imports/{batch_id}`

Purpose:
- Get one import batch with its row-level errors

Headers:
- `Authorization: Bearer <admin_token>`

Returns `200 OK`:

```json
{
  "id": 2,
  "residence_id": 1,
  "import_type": "units",
  "filename": "units.csv",
  "status": "failed",
  "total_rows": 2,
  "success_rows": 1,
  "failed_rows": 1,
  "uploaded_by": 10,
  "created_at": "2026-05-01T00:00:00Z",
  "completed_at": "2026-05-01T00:00:03Z",
  "errors": [
    {
      "id": 1,
      "import_batch_id": 2,
      "row_number": 3,
      "field": "block_name",
      "error_message": "block was not found in the residence",
      "raw_value": "{'block_name': 'Unknown', 'unit_number': 'A-4-4'}"
    }
  ]
}
```
