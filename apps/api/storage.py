from __future__ import annotations

import os
from dataclasses import dataclass
from uuid import uuid4


ALLOWED_PAYMENT_PROOF_MIME_TYPES = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
    }
)
MAX_PAYMENT_PROOF_SIZE_BYTES = int(os.getenv("PAYMENT_PROOF_MAX_BYTES", str(5 * 1024 * 1024)))
PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS = int(os.getenv("PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS", "300"))


class StorageError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class StoredFile:
    storage_provider: str
    file_key: str
    mime_type: str
    file_size: int


@dataclass(frozen=True, slots=True)
class SignedFileUrl:
    url: str
    expires_in: int


class PaymentProofStorage:
    def upload_payment_proof(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
    ) -> StoredFile:
        raise NotImplementedError

    def generate_payment_proof_download_url(self, *, file_key: str) -> SignedFileUrl:
        raise NotImplementedError


class CloudflareR2Storage(PaymentProofStorage):
    def __init__(self) -> None:
        self.bucket_name = _get_required_env("R2_BUCKET_NAME")
        self.endpoint_url = _get_required_env("R2_ENDPOINT_URL")
        self.access_key_id = _get_required_env("R2_ACCESS_KEY_ID")
        self.secret_access_key = _get_required_env("R2_SECRET_ACCESS_KEY")
        self.region = os.getenv("R2_REGION", "auto")

    def upload_payment_proof(
        self,
        *,
        key: str,
        content: bytes,
        content_type: str,
    ) -> StoredFile:
        client = self._build_client()

        try:
            client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type,
            )
        except Exception as exc:  # pragma: no cover - boto3 exception types vary
            raise StorageError("payment proof upload failed") from exc

        return StoredFile(
            storage_provider="cloudflare_r2",
            file_key=key,
            mime_type=content_type,
            file_size=len(content),
        )

    def generate_payment_proof_download_url(self, *, file_key: str) -> SignedFileUrl:
        client = self._build_client()

        try:
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_key},
                ExpiresIn=PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS,
            )
        except Exception as exc:  # pragma: no cover - boto3 exception types vary
            raise StorageError("payment proof signed URL generation failed") from exc

        return SignedFileUrl(url=url, expires_in=PAYMENT_PROOF_SIGNED_URL_TTL_SECONDS)

    def _build_client(self):
        try:
            import boto3
        except ImportError as exc:
            raise StorageError("boto3 is required for Cloudflare R2 storage") from exc

        return boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            region_name=self.region,
        )


def build_payment_proof_key(*, residence_id: int, unit_id: int, payment_id: int, filename: str | None) -> str:
    extension = ""
    if filename and "." in filename:
        extension = f".{filename.rsplit('.', 1)[1].lower()}"
    unique_suffix = uuid4().hex
    return f"payment-proofs/residences/{residence_id}/units/{unit_id}/payments/{payment_id}/{unique_suffix}{extension}"


def get_payment_proof_storage() -> PaymentProofStorage:
    backend = os.getenv("FILE_STORAGE_BACKEND", "cloudflare_r2")
    if backend == "cloudflare_r2":
        return CloudflareR2Storage()
    raise RuntimeError(f"unsupported file storage backend: {backend}")


def _get_required_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise StorageError(f"missing required storage setting: {name}")
