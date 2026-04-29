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

## Health endpoints

- `GET /health`
- `GET /health/db`
