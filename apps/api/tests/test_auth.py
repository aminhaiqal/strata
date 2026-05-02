from __future__ import annotations

import asyncio
import os
import unittest
from datetime import date

os.environ["JWT_SECRET"] = "l84R3SjSXerHZIevQ39nYwzvcZsDr4pm8xt3bSAfrQp"

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import (
    authenticate_resident,
    create_access_token,
    get_current_resident_user,
    hash_password,
)
from main import app
from routes.auth import ResidentLoginRequest, resident_login
from routes.resident import list_linked_units
from models.db import (
    AccountSnapshot,
    Base,
    Block,
    ClassificationCategory,
    EntityStatus,
    Residence,
    ResidenceStatus,
    Unit,
    UnitUser,
    UnitUserRelationshipType,
    User,
    UserRole,
)


class AuthApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(bind=cls.engine, autoflush=False, autocommit=False, expire_on_commit=False)
        Base.metadata.create_all(cls.engine)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.engine.dispose()

    def setUp(self) -> None:
        Base.metadata.drop_all(self.engine)
        Base.metadata.create_all(self.engine)
        self._seed_data()

    def _seed_data(self) -> None:
        with Session(self.engine) as db:
            residence = Residence(
                id=1,
                name="Residency One",
                address="123 Street",
                timezone="Asia/Kuala_Lumpur",
                currency="MYR",
                billing_cycle_day=1,
                status=ResidenceStatus.active,
            )
            block = Block(id=1, residence_id=1, name="A")
            unit = Unit(
                id=1,
                residence_id=1,
                block_id=1,
                unit_number="A-1-1",
                is_occupied=True,
                status=EntityStatus.active,
            )
            resident = User(
                id=1,
                residence_id=1,
                name="Resident User",
                email="resident@example.com",
                phone=None,
                password_hash=hash_password("secret123"),
                role=UserRole.resident,
                status=EntityStatus.active,
            )
            finance = User(
                id=2,
                residence_id=1,
                name="Finance User",
                email="finance@example.com",
                phone=None,
                password_hash=hash_password("secret123"),
                role=UserRole.finance_admin,
                status=EntityStatus.active,
            )
            inactive_resident = User(
                id=3,
                residence_id=1,
                name="Inactive Resident",
                email="inactive@example.com",
                phone=None,
                password_hash=hash_password("secret123"),
                role=UserRole.resident,
                status=EntityStatus.inactive,
            )
            unit_link = UnitUser(
                id=1,
                unit_id=1,
                user_id=1,
                relationship_type=UnitUserRelationshipType.owner,
            )
            snapshot = AccountSnapshot(
                id=1,
                residence_id=1,
                unit_id=1,
                total_charged=100,
                total_paid=50,
                total_outstanding=50,
                pending_payment_amount=0,
                oldest_unpaid_due_date=date(2026, 4, 15),
                months_overdue=1,
                classification=ClassificationCategory.recently_overdue,
                last_payment_date=date(2026, 4, 1),
                last_follow_up_date=None,
            )

            db.add_all([residence, block, unit, resident, finance, inactive_resident, unit_link, snapshot])
            db.commit()

    def test_resident_login_returns_bearer_token(self) -> None:
        with Session(self.engine) as db:
            response = resident_login(
                ResidentLoginRequest(email="resident@example.com", password="secret123"),
                db,
            )

        self.assertEqual(response.token_type, "bearer")
        self.assertTrue(response.access_token)
        self.assertEqual(response.user.id, 1)

    def test_resident_login_rejects_wrong_password(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                resident_login(
                    ResidentLoginRequest(email="resident@example.com", password="wrong"),
                    db,
                )

        self.assertEqual(error.exception.status_code, 401)

    def test_resident_login_rejects_non_resident_user(self) -> None:
        with Session(self.engine) as db:
            user = authenticate_resident(
                db=db,
                email="finance@example.com",
                password="secret123",
            )

        self.assertIsNone(user)

    def test_resident_login_rejects_inactive_user(self) -> None:
        with Session(self.engine) as db:
            user = authenticate_resident(
                db=db,
                email="inactive@example.com",
                password="secret123",
            )

        self.assertIsNone(user)

    def test_resident_route_requires_bearer_token(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                get_current_resident_user(None, db)

        self.assertEqual(error.exception.status_code, 401)

    def test_resident_route_accepts_valid_bearer_token(self) -> None:
        with Session(self.engine) as db:
            user = db.get(User, 1)
            token, _ = create_access_token(user=user)
            current_user = get_current_resident_user(
                HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
                db,
            )
            response = list_linked_units(current_user, db)

        self.assertEqual(len(response), 1)
        self.assertEqual(response[0].id, 1)

    def test_resident_route_rejects_malformed_token(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                get_current_resident_user(
                    HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.token"),
                    db,
                )

        self.assertEqual(error.exception.status_code, 401)

    def test_admin_login_preflight_is_allowed_for_local_admin_app(self) -> None:
        async def exercise_preflight() -> tuple[int | None, dict[str, str]]:
            response_status: int | None = None
            response_headers: dict[str, str] = {}

            scope = {
                "type": "http",
                "asgi": {"version": "3.0"},
                "http_version": "1.1",
                "method": "OPTIONS",
                "scheme": "http",
                "path": "/auth/admin/login",
                "raw_path": b"/auth/admin/login",
                "query_string": b"",
                "headers": [
                    (b"origin", b"http://127.0.0.1:5173"),
                    (b"access-control-request-method", b"POST"),
                    (b"access-control-request-headers", b"content-type"),
                ],
                "client": ("127.0.0.1", 5173),
                "server": ("127.0.0.1", 8000),
            }

            async def receive() -> dict[str, object]:
                return {"type": "http.request", "body": b"", "more_body": False}

            async def send(message: dict[str, object]) -> None:
                nonlocal response_status, response_headers
                if message["type"] == "http.response.start":
                    response_status = int(message["status"])
                    response_headers = {
                        key.decode("latin-1"): value.decode("latin-1")
                        for key, value in message["headers"]
                    }

            await app(scope, receive, send)
            return response_status, response_headers

        status_code, headers = asyncio.run(exercise_preflight())

        self.assertEqual(status_code, 200)
        self.assertEqual(headers.get("access-control-allow-origin"), "http://127.0.0.1:5173")


if __name__ == "__main__":
    unittest.main()
