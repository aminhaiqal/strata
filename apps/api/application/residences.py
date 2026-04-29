from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from models.db import Residence, ResidenceStatus

from .shared import ValidationError


@dataclass(slots=True)
class CreateResidence:
    name: str
    address: str
    timezone: str
    currency: str
    billing_cycle_day: int
    status: ResidenceStatus = ResidenceStatus.active


class ResidenceService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_residence(self, command: CreateResidence) -> Residence:
        if not 1 <= command.billing_cycle_day <= 31:
            raise ValidationError("billing_cycle_day must be between 1 and 31")

        residence = Residence(
            name=command.name,
            address=command.address,
            timezone=command.timezone,
            currency=command.currency,
            billing_cycle_day=command.billing_cycle_day,
            status=command.status,
        )
        self.db.add(residence)
        self.db.flush()
        return residence
