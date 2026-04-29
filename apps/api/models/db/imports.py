from __future__ import annotations

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import ImportStatus, ImportType
from .residence import Residence, User


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    import_type: Mapped[ImportType] = mapped_column(Enum(ImportType), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[ImportStatus] = mapped_column(Enum(ImportStatus), default=ImportStatus.uploaded, nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint("total_rows >= 0", name="ck_import_batches_total_rows_non_negative"),
        CheckConstraint("success_rows >= 0", name="ck_import_batches_success_rows_non_negative"),
        CheckConstraint("failed_rows >= 0", name="ck_import_batches_failed_rows_non_negative"),
    )

    residence: Mapped[Residence] = relationship()
    uploader: Mapped[User] = relationship()
    errors: Mapped[list[ImportError]] = relationship(back_populates="import_batch")


class ImportError(Base):
    __tablename__ = "import_errors"

    id: Mapped[int] = mapped_column(primary_key=True)
    import_batch_id: Mapped[int] = mapped_column(ForeignKey("import_batches.id"), nullable=False, index=True)
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    field: Mapped[str] = mapped_column(String(120), nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    raw_value: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (CheckConstraint("row_number > 0", name="ck_import_errors_row_number_positive"),)

    import_batch: Mapped[ImportBatch] = relationship(back_populates="errors")
