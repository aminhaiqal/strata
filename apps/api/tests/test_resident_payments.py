from __future__ import annotations

import unittest
from datetime import date
from decimal import Decimal
from io import BytesIO

from fastapi import HTTPException, UploadFile
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.datastructures import Headers

from auth import AuthenticatedUser, hash_password
from models.db import (
    Base,
    Block,
    EntityStatus,
    Payment,
    PaymentProof,
    PaymentStatus,
    Residence,
    ResidenceStatus,
    Unit,
    UnitUser,
    UnitUserRelationshipType,
    User,
    UserRole,
)
from routes.resident import get_payment_proof, submit_payment
from storage import MAX_PAYMENT_PROOF_SIZE_BYTES, PaymentProofStorage, SignedFileUrl, StorageError, StoredFile


class FakePaymentProofStorage(PaymentProofStorage):
    def upload_payment_proof(self, *, key: str, content: bytes, content_type: str) -> StoredFile:
        return StoredFile(
            storage_provider="fake",
            file_key=key,
            mime_type=content_type,
            file_size=len(content),
        )

    def generate_payment_proof_download_url(self, *, file_key: str):
        return SignedFileUrl(url=f"https://files.example/{file_key}", expires_in=300)


class FailingPaymentProofStorage(PaymentProofStorage):
    def upload_payment_proof(self, *, key: str, content: bytes, content_type: str) -> StoredFile:
        raise StorageError("payment proof upload failed")

    def generate_payment_proof_download_url(self, *, file_key: str):
        raise StorageError("payment proof signed URL generation failed")


class ResidentPaymentApiTests(unittest.TestCase):
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
        self.current_user = AuthenticatedUser(id=1, residence_id=1, role=UserRole.resident)

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
            linked_unit = Unit(
                id=1,
                residence_id=1,
                block_id=1,
                unit_number="A-1-1",
                is_occupied=True,
                status=EntityStatus.active,
            )
            unlinked_unit = Unit(
                id=2,
                residence_id=1,
                block_id=1,
                unit_number="A-1-2",
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
            db.add_all(
                [
                    residence,
                    block,
                    linked_unit,
                    unlinked_unit,
                    resident,
                    UnitUser(id=1, unit_id=1, user_id=1, relationship_type=UnitUserRelationshipType.owner),
                ]
            )
            db.commit()

    def test_submit_payment_creates_payment_and_proof(self) -> None:
        with Session(self.engine) as db:
            response = submit_payment(
                unit_id=1,
                amount=Decimal("120.50"),
                payment_date=date(2026, 5, 1),
                payment_method="bank_transfer",
                reference_no="ABC123",
                proof_file=_build_upload_file("proof.png", b"png-bytes", "image/png"),
                current_user=self.current_user,
                db=db,
                storage=FakePaymentProofStorage(),
            )

            payment = db.scalar(select(Payment).where(Payment.id == response.id))
            proof = db.scalar(select(PaymentProof).where(PaymentProof.payment_id == response.id))

        self.assertIsNotNone(payment)
        self.assertEqual(payment.status, PaymentStatus.pending_verification)
        self.assertEqual(payment.submitted_by, 1)
        self.assertIsNotNone(proof)
        self.assertEqual(proof.uploaded_by, 1)
        self.assertEqual(proof.mime_type, "image/png")
        self.assertEqual(proof.file_size, len(b"png-bytes"))

    def test_submit_payment_rejects_missing_file_content(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                submit_payment(
                    unit_id=1,
                    amount=Decimal("120.50"),
                    payment_date=date(2026, 5, 1),
                    payment_method="bank_transfer",
                    reference_no=None,
                    proof_file=_build_upload_file("proof.png", b"", "image/png"),
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "payment proof file is required")

    def test_submit_payment_rejects_unsupported_file_type(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                submit_payment(
                    unit_id=1,
                    amount=Decimal("120.50"),
                    payment_date=date(2026, 5, 1),
                    payment_method="bank_transfer",
                    reference_no=None,
                    proof_file=_build_upload_file("proof.txt", b"text", "text/plain"),
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "unsupported payment proof file type")

    def test_submit_payment_rejects_oversized_file(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                submit_payment(
                    unit_id=1,
                    amount=Decimal("120.50"),
                    payment_date=date(2026, 5, 1),
                    payment_method="bank_transfer",
                    reference_no=None,
                    proof_file=_build_upload_file(
                        "proof.pdf",
                        b"x" * (MAX_PAYMENT_PROOF_SIZE_BYTES + 1),
                        "application/pdf",
                    ),
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.detail, "payment proof file is too large")

    def test_submit_payment_rejects_unlinked_unit(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                submit_payment(
                    unit_id=2,
                    amount=Decimal("120.50"),
                    payment_date=date(2026, 5, 1),
                    payment_method="bank_transfer",
                    reference_no=None,
                    proof_file=_build_upload_file("proof.png", b"png-bytes", "image/png"),
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 404)

    def test_submit_payment_rolls_back_on_storage_failure(self) -> None:
        with Session(self.engine) as db:
            with self.assertRaises(HTTPException) as error:
                submit_payment(
                    unit_id=1,
                    amount=Decimal("120.50"),
                    payment_date=date(2026, 5, 1),
                    payment_method="bank_transfer",
                    reference_no=None,
                    proof_file=_build_upload_file("proof.png", b"png-bytes", "image/png"),
                    current_user=self.current_user,
                    db=db,
                    storage=FailingPaymentProofStorage(),
                )

            payment_count = db.scalar(select(func.count()).select_from(Payment))
            proof_count = db.scalar(select(func.count()).select_from(PaymentProof))

        self.assertEqual(error.exception.status_code, 502)
        self.assertEqual(payment_count, 0)
        self.assertEqual(proof_count, 0)

    def test_get_payment_proof_returns_signed_url_for_linked_resident(self) -> None:
        with Session(self.engine) as db:
            payment = Payment(
                id=10,
                residence_id=1,
                unit_id=1,
                amount=Decimal("120.50"),
                payment_date=date(2026, 5, 1),
                payment_method="bank_transfer",
                status=PaymentStatus.pending_verification,
                submitted_by=1,
            )
            db.add(payment)
            db.flush()
            db.add(
                PaymentProof(
                    payment_id=payment.id,
                    storage_provider="fake",
                    file_key="payment-proofs/residences/1/units/1/payments/10/proof.png",
                    mime_type="image/png",
                    file_size=9,
                    uploaded_by=1,
                )
            )
            db.commit()

            response = get_payment_proof(
                payment_id=payment.id,
                current_user=self.current_user,
                db=db,
                storage=FakePaymentProofStorage(),
            )

        self.assertEqual(response.payment_id, 10)
        self.assertEqual(response.mime_type, "image/png")
        self.assertEqual(response.file_size, 9)
        self.assertEqual(
            response.url,
            "https://files.example/payment-proofs/residences/1/units/1/payments/10/proof.png",
        )
        self.assertEqual(response.expires_in, 300)

    def test_get_payment_proof_rejects_unlinked_payment(self) -> None:
        with Session(self.engine) as db:
            payment = Payment(
                id=11,
                residence_id=1,
                unit_id=2,
                amount=Decimal("88.00"),
                payment_date=date(2026, 5, 1),
                payment_method="bank_transfer",
                status=PaymentStatus.pending_verification,
                submitted_by=1,
            )
            db.add(payment)
            db.flush()
            db.add(
                PaymentProof(
                    payment_id=payment.id,
                    storage_provider="fake",
                    file_key="payment-proofs/residences/1/units/2/payments/11/proof.png",
                    mime_type="image/png",
                    file_size=9,
                    uploaded_by=1,
                )
            )
            db.commit()

            with self.assertRaises(HTTPException) as error:
                get_payment_proof(
                    payment_id=payment.id,
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 404)

    def test_get_payment_proof_returns_404_when_proof_missing(self) -> None:
        with Session(self.engine) as db:
            payment = Payment(
                id=12,
                residence_id=1,
                unit_id=1,
                amount=Decimal("99.00"),
                payment_date=date(2026, 5, 1),
                payment_method="bank_transfer",
                status=PaymentStatus.pending_verification,
                submitted_by=1,
            )
            db.add(payment)
            db.commit()

            with self.assertRaises(HTTPException) as error:
                get_payment_proof(
                    payment_id=payment.id,
                    current_user=self.current_user,
                    db=db,
                    storage=FakePaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 404)
        self.assertEqual(error.exception.detail, "Payment proof 12 was not found")

    def test_get_payment_proof_returns_502_when_signing_fails(self) -> None:
        with Session(self.engine) as db:
            payment = Payment(
                id=13,
                residence_id=1,
                unit_id=1,
                amount=Decimal("77.00"),
                payment_date=date(2026, 5, 1),
                payment_method="bank_transfer",
                status=PaymentStatus.pending_verification,
                submitted_by=1,
            )
            db.add(payment)
            db.flush()
            db.add(
                PaymentProof(
                    payment_id=payment.id,
                    storage_provider="fake",
                    file_key="payment-proofs/residences/1/units/1/payments/13/proof.png",
                    mime_type="image/png",
                    file_size=9,
                    uploaded_by=1,
                )
            )
            db.commit()

            with self.assertRaises(HTTPException) as error:
                get_payment_proof(
                    payment_id=payment.id,
                    current_user=self.current_user,
                    db=db,
                    storage=FailingPaymentProofStorage(),
                )

        self.assertEqual(error.exception.status_code, 502)
        self.assertEqual(error.exception.detail, "payment proof signed URL generation failed")


def _build_upload_file(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


if __name__ == "__main__":
    unittest.main()
