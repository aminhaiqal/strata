from __future__ import annotations

import io
import os
import unittest

os.environ["JWT_SECRET"] = "l84R3SjSXerHZIevQ39nYwzvcZsDr4pm8xt3bSAfrQp"

from fastapi import HTTPException
from fastapi import UploadFile
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
from models.db import AuditLog, Base, Block, EntityStatus, ImportBatch, ImportStatus, Residence, ResidenceStatus, Unit, UnitUser, User, UserRole
from models.db.enums import UnitUserRelationshipType
from routes.admin import (
    CreateBlockRequest,
    CreateResidentAccountRequest,
    CreateUnitRequest,
    LinkResidentRequest,
    UpdateBlockRequest,
    UpdateResidentAccountRequest,
    UpdateResidenceRequest,
    UpdateUnitRequest,
    create_block,
    create_unit,
    create_resident_account,
    get_import_batch,
    get_residence,
    get_unit,
    import_units,
    list_blocks,
    list_residences,
    list_units,
    link_resident_to_unit,
    list_residents,
    list_unit_residents,
    unlink_resident_from_unit,
    update_block,
    update_resident_account,
    update_residence,
    update_unit,
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
                AdminLoginRequest(email="admin@example.com", password="secret123"),
                db,
            )

        self.assertEqual(response.token_type, "bearer")
        self.assertEqual(response.user.id, 10)

    def test_admin_login_rejects_non_admin_user(self) -> None:
        with Session(self.engine) as db:
            user = authenticate_admin(
                db=db,
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
        with Session(self.engine) as db:
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "resident_created"))
        self.assertIsNotNone(audit_log)

    def test_list_residences_returns_current_admin_residence_only(self) -> None:
        with Session(self.engine) as db:
            response = list_residences(self.current_admin, db)

        self.assertEqual([residence.id for residence in response], [1])

    def test_get_residence_rejects_other_residence(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                get_residence(2, self.current_admin, db)

        self.assertEqual(error.exception.status_code, 400)

    def test_update_residence(self) -> None:
        with Session(self.engine) as db:
            response = update_residence(
                1,
                UpdateResidenceRequest(name="Updated Residence", billing_cycle_day=15),
                self.current_admin,
                db,
            )
            residence = db.get(Residence, 1)
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "residence_updated"))

        self.assertEqual(response.name, "Updated Residence")
        self.assertEqual(residence.billing_cycle_day, 15)
        self.assertIsNotNone(audit_log)

    def test_create_and_update_block(self) -> None:
        with Session(self.engine) as db:
            block = create_block(
                CreateBlockRequest(name="C", description="Tower C"),
                self.current_admin,
                db,
            )
            updated = update_block(
                block.id,
                UpdateBlockRequest(description="Updated Tower"),
                self.current_admin,
                db,
            )
            blocks = list_blocks(self.current_admin, db)
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "block_updated"))

        self.assertEqual(block.name, "C")
        self.assertEqual(updated.description, "Updated Tower")
        self.assertEqual([item.id for item in blocks], [1, block.id])
        self.assertIsNotNone(audit_log)

    def test_create_unit_and_filter_units(self) -> None:
        with Session(self.engine) as db:
            response = create_unit(
                CreateUnitRequest(
                    block_id=1,
                    unit_number="A-2-2",
                    owner_name="Alice Owner",
                    tenant_name="Bob Tenant",
                    is_occupied=False,
                ),
                self.current_admin,
                db,
            )
            inactive_units = list_units(
                block_id=None,
                status_filter=None,
                is_occupied=False,
                search="alice",
                current_admin=self.current_admin,
                db=db,
            )
            fetched = get_unit(response.id, self.current_admin, db)
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "unit_created"))

        self.assertEqual(response.unit_number, "A-2-2")
        self.assertEqual([unit.id for unit in inactive_units], [response.id])
        self.assertEqual(fetched.id, response.id)
        self.assertIsNotNone(audit_log)

    def test_update_unit_rejects_cross_residence_block(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                update_unit(
                    1,
                    UpdateUnitRequest(block_id=2),
                    self.current_admin,
                    db,
                )

        self.assertEqual(error.exception.status_code, 400)

    def test_create_unit_rejects_duplicate_number_in_same_block(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                create_unit(
                    CreateUnitRequest(block_id=1, unit_number="A-1-1"),
                    self.current_admin,
                    db,
                )

        self.assertEqual(error.exception.status_code, 400)

    def test_update_unit(self) -> None:
        with Session(self.engine) as db:
            response = update_unit(
                1,
                UpdateUnitRequest(owner_phone="999", status=EntityStatus.inactive),
                self.current_admin,
                db,
            )
            unit = db.get(Unit, 1)
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "unit_updated"))

        self.assertEqual(response.status, EntityStatus.inactive)
        self.assertEqual(unit.owner_phone, "999")
        self.assertIsNotNone(audit_log)

    def test_import_units_creates_units_and_tracks_errors(self) -> None:
        csv_content = "\n".join(
            [
                "block_name,unit_number,floor,unit_type,owner_name,owner_phone,owner_email,tenant_name,tenant_phone,tenant_email,is_occupied,status",
                "A,A-3-3,3,standard,Owner One,123,owner@example.com,Tenant One,456,tenant@example.com,true,active",
                "Unknown,A-4-4,4,standard,Owner Two,123,owner2@example.com,Tenant Two,456,tenant2@example.com,false,inactive",
            ]
        ).encode("utf-8")

        with Session(self.engine) as db:
            response = import_units(
                UploadFile(filename="units.csv", file=io.BytesIO(csv_content)),
                self.current_admin,
                db,
            )
            created_unit = db.scalar(select(Unit).where(Unit.unit_number == "A-3-3"))
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "units_import_completed"))
            batch = get_import_batch(response.id, self.current_admin, db)

        self.assertEqual(response.status, ImportStatus.failed)
        self.assertEqual(response.success_rows, 1)
        self.assertEqual(response.failed_rows, 1)
        self.assertIsNotNone(created_unit)
        self.assertEqual(batch.id, response.id)
        self.assertEqual(len(batch.errors), 1)
        self.assertIsNotNone(audit_log)

    def test_import_units_rejects_empty_file(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                import_units(
                    UploadFile(filename="units.csv", file=io.BytesIO(b"")),
                    self.current_admin,
                    db,
                )

        self.assertEqual(error.exception.status_code, 400)

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
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "resident_updated"))

        self.assertEqual(response.status, EntityStatus.inactive)
        self.assertEqual(resident.phone, "999")
        self.assertIsNotNone(audit_log)

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
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "resident_linked_to_unit"))

        self.assertEqual(response.user_id, resident.id)
        self.assertIsNotNone(link)
        self.assertIsNotNone(audit_log)

    def test_unlink_resident_from_unit(self) -> None:
        with Session(self.engine) as db:
            response = unlink_resident_from_unit(1, 20, self.current_admin, db)
            link = db.scalar(select(UnitUser).where(UnitUser.unit_id == 1, UnitUser.user_id == 20))
            audit_log = db.scalar(select(AuditLog).where(AuditLog.action == "resident_unlinked_from_unit"))

        self.assertEqual(response.status_code, 204)
        self.assertIsNone(link)
        self.assertIsNotNone(audit_log)

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
