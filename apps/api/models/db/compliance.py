from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import NotificationChannel, NotificationStatus, NotificationType
from .residence import Residence, Unit, User


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    actor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    before_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    after_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    residence: Mapped[Residence] = relationship()
    actor: Mapped[User] = relationship()


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    residence_id: Mapped[int] = mapped_column(ForeignKey("residences.id"), nullable=False, index=True)
    recipient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    unit_id: Mapped[int | None] = mapped_column(ForeignKey("units.id"), index=True)
    type: Mapped[NotificationType] = mapped_column(Enum(NotificationType), nullable=False)
    channel: Mapped[NotificationChannel] = mapped_column(Enum(NotificationChannel), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus), default=NotificationStatus.pending, nullable=False
    )
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    residence: Mapped[Residence] = relationship()
    recipient: Mapped[User] = relationship()
    unit: Mapped[Unit | None] = relationship()
