from __future__ import annotations

import os
import unittest

os.environ["JWT_SECRET"] = "l84R3SjSXerHZIevQ39nYwzvcZsDr4pm8xt3bSAfrQp"

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from auth import (
    AuthenticatedAdmin,
    authenticate_admin,
    create_access_token,
    get_current_admin_user,
    hash_password,
)
from models.db import Base, Block, EntityStatus, Residence, ResidenceStatus, Unit, UnitUser, User, UserRole
from models.db.enums import UnitUserRelationshipType
from routes.admin import (
    CreateResidentAccountRequest,
    LinkResidentRequest,
    UpdateResidentAccountRequest,
    create_resident_account,
    link_resident_to_unit,
    list_residents,
    list_unit_residents,
    unlink_resident_from_unit,
    update_resident_account,
)
from routes.auth import AdminLoginRequest, admin_login


class AdminResidentApiTests(unittest.TestCase):
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
        self.current_admin = AuthenticatedAdmin(id=10, residence_id=1, role=UserRole.residence_admin)

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
            other_residence = Residence(
                id=2,
                name="Residency Two",
                address="234 Street",
                timezone="Asia/Kuala_Lumpur",
                currency="MYR",
                billing_cycle_day=1,
                status=ResidenceStatus.active,
            )
            block = Block(id=1, residence_id=1, name="A")
            other_block = Block(id=2, residence_id=2, name="B")
            unit = Unit(
                id=1,
                residence_id=1,
                block_id=1,
                unit_number="A-1-1",
                is_occupied=True,
                status=EntityStatus.active,
            )
            other_unit = Unit(
                id=2,
                residence_id=2,
                block_id=2,
                unit_number="B-1-1",
                is_occupied=True,
                status=EntityStatus.active,
            )
            admin = User(
                id=10,
                residence_id=1,
                name="Residence Admin",
                email="admin@example.com",
                phone=None,
                password_hash=hash_password("secret123"),
                role=UserRole.residence_admin,
                status=EntityStatus.active,
            )
            finance_admin = User(
                id=11,
                residence_id=1,
                name="Finance Admin",
                email="finance@example.com",
                phone=None,
                password_hash=hash_password("secret123"),
                role=UserRole.finance_admin,
                status=EntityStatus.active,
            )
            resident = User(
                id=20,
                residence_id=1,
                name="Resident One",
                email="resident1@example.com",
                phone="111",
                password_hash=hash_password("secret123"),
                role=UserRole.resident,
                status=EntityStatus.active,
            )
            other_resident = User(
                id=21,
                residence_id=2,
                name="Resident Two",
                email="resident2@example.com",
                phone="222",
                password_hash=hash_password("secret123"),
                role=UserRole.resident,
                status=EntityStatus.active,
            )
            db.add_all(
                [
                    residence,
                    other_residence,
                    block,
                    other_block,
                    unit,
                    other_unit,
                    admin,
                    finance_admin,
                    resident,
                    other_resident,
                    UnitUser(
                        id=1,
                        unit_id=1,
                        user_id=20,
                        relationship_type=UnitUserRelationshipType.owner,
                    ),
                ]
            )
            db.commit()

    def test_admin_login_returns_bearer_token(self) -> None:
        with Session(self.engine) as db:
            response = admin_login(
                AdminLoginRequest(residence_id=1, email="admin@example.com", password="secret123"),
                db,
            )

        self.assertEqual(response.token_type, "bearer")
        self.assertEqual(response.user.id, 10)

    def test_admin_login_rejects_non_admin_user(self) -> None:
        with Session(self.engine) as db:
            user = authenticate_admin(
                db=db,
                residence_id=1,
                email="finance@example.com",
                password="secret123",
            )

        self.assertIsNone(user)

    def test_admin_route_accepts_valid_bearer_token(self) -> None:
        with Session(self.engine) as db:
            user = db.get(User, 10)
            token, _ = create_access_token(user=user)
            current_admin = get_current_admin_user(
                HTTPAuthorizationCredentials(scheme="Bearer", credentials=token),
                db,
            )

        self.assertEqual(current_admin.id, 10)
        self.assertEqual(current_admin.role, UserRole.residence_admin)

    def test_create_resident_account(self) -> None:
        with Session(self.engine) as db:
            response = create_resident_account(
                CreateResidentAccountRequest(
                    name="New Resident",
                    email="newresident@example.com",
                    temporary_password="temp12345",
                    phone="333",
                ),
                self.current_admin,
                db,
            )
            resident = db.scalar(select(User).where(User.email == "newresident@example.com"))

        self.assertEqual(response.role, UserRole.resident)
        self.assertIsNotNone(resident)
        self.assertEqual(resident.residence_id, 1)

    def test_list_residents_only_returns_current_residence(self) -> None:
        with Session(self.engine) as db:
            response = list_residents(self.current_admin, db)

        self.assertEqual([resident.id for resident in response], [20])

    def test_update_resident_account_deactivates_resident(self) -> None:
        with Session(self.engine) as db:
            response = update_resident_account(
                20,
                UpdateResidentAccountRequest(status=EntityStatus.inactive, phone="999"),
                self.current_admin,
                db,
            )
            resident = db.get(User, 20)

        self.assertEqual(response.status, EntityStatus.inactive)
        self.assertEqual(resident.phone, "999")

    def test_list_unit_residents_returns_links(self) -> None:
        with Session(self.engine) as db:
            response = list_unit_residents(1, self.current_admin, db)

        self.assertEqual(len(response), 1)
        self.assertEqual(response[0].resident.id, 20)
        self.assertEqual(response[0].relationship_type, UnitUserRelationshipType.owner)

    def test_link_resident_to_unit(self) -> None:
        with Session(self.engine) as db:
            create_resident_account(
                CreateResidentAccountRequest(
                    name="Second Resident",
                    email="second@example.com",
                    temporary_password="temp12345",
                    phone=None,
                ),
                self.current_admin,
                db,
            )
            resident = db.scalar(select(User).where(User.email == "second@example.com"))

            response = link_resident_to_unit(
                1,
                LinkResidentRequest(user_id=resident.id, relationship_type=UnitUserRelationshipType.tenant),
                self.current_admin,
                db,
            )
            link = db.scalar(select(UnitUser).where(UnitUser.unit_id == 1, UnitUser.user_id == resident.id))

        self.assertEqual(response.user_id, resident.id)
        self.assertIsNotNone(link)

    def test_unlink_resident_from_unit(self) -> None:
        with Session(self.engine) as db:
            response = unlink_resident_from_unit(1, 20, self.current_admin, db)
            link = db.scalar(select(UnitUser).where(UnitUser.unit_id == 1, UnitUser.user_id == 20))

        self.assertEqual(response.status_code, 204)
        self.assertIsNone(link)

    def test_link_resident_to_unit_rejects_cross_residence_user(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                link_resident_to_unit(
                    1,
                    LinkResidentRequest(user_id=21, relationship_type=UnitUserRelationshipType.tenant),
                    self.current_admin,
                    db,
                )

        self.assertEqual(error.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
