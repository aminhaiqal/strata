## Database

The API now uses SQLAlchemy sessions from `database.py`.

Default connection settings match `infra/stack.yml`:

- host: `db`
- port: `5432`
- database: `axlstrata-n1`
- user: `paxlstrata-n1`

If the API runs on the host machine instead of inside the Docker network, you need a published Postgres port and either:

- `POSTGRES_HOST=localhost`, or
- `DATABASE_URL=postgresql+psycopg://...`

## Session usage

Use the FastAPI dependency in route handlers:

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from database import get_db


@app.get("/example")
def example(db: Session = Depends(get_db)) -> dict[str, bool]:
    return {"ok": db.is_active}
```

## Application Layer

Business use cases should live in `application/`, grouped by feature:

- `application/residences.py`
- `application/payments.py`
- `application/installments.py`
- `application/collections.py`
- `application/imports.py`
- `application/notifications.py`
- `application/compliance.py`

Pattern:

- route handler builds a command object
- service runs business rules with a `Session`
- service calls `flush()` but does not `commit()`
- outer layer decides transaction boundaries

Example:

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from application import BillingService, CreateCharge
from database import get_db


@app.post("/charges")
def create_charge(db: Session = Depends(get_db)) -> dict[str, int]:
    service = BillingService(db)
    charge = service.create_charge(
        CreateCharge(
            residence_id=1,
            unit_id=10,
            charge_type="maintenance",
            amount=100,
            billing_month=date(2026, 4, 1),
            due_date=date(2026, 4, 15),
            created_by=2,
        )
    )
    db.commit()
    return {"id": charge.id}
```

## Health endpoints

- `GET /health`
- `GET /health/db`

## Resident testing

Resident routes are available under `/resident`.

Current temporary auth for testing:

- send `X-Resident-User-Id: <user_id>` in the request header

Resident endpoints:

- `GET /resident/units`
- `GET /resident/units/{unit_id}/balance`
- `GET /resident/units/{unit_id}/charges`
- `GET /resident/units/{unit_id}/payments`
- `POST /resident/units/{unit_id}/payments`
- `GET /resident/units/{unit_id}/installment-plan`

This is only a testing bridge until real authentication and authorization middleware is implemented.
