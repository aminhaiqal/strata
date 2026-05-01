from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select

APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from auth import hash_password, normalize_email
from database import SessionLocal
from models.db import EntityStatus, Residence, ResidenceStatus, User, UserRole


@dataclass(slots=True)
class BootstrapArgs:
    admin_name: str
    admin_email: str
    admin_password: str
    residence_id: int | None
    residence_name: str | None
    residence_address: str | None
    timezone: str
    currency: str
    billing_cycle_day: int


def parse_args() -> BootstrapArgs:
    parser = argparse.ArgumentParser(
        description="Create the first residence admin for the Strata API database."
    )
    parser.add_argument("--admin-name", required=True)
    parser.add_argument("--admin-email", required=True)
    parser.add_argument("--admin-password", required=True)
    parser.add_argument("--residence-id", type=int)
    parser.add_argument("--residence-name")
    parser.add_argument("--residence-address")
    parser.add_argument("--timezone", default="Asia/Kuala_Lumpur")
    parser.add_argument("--currency", default="MYR")
    parser.add_argument("--billing-cycle-day", type=int, default=1)

    parsed = parser.parse_args()

    if parsed.residence_id is None:
        if not parsed.residence_name or not parsed.residence_address:
            parser.error(
                "--residence-name and --residence-address are required when --residence-id is not provided"
            )
    elif parsed.residence_name or parsed.residence_address:
        parser.error(
            "--residence-name and --residence-address cannot be used together with --residence-id"
        )

    if not 1 <= parsed.billing_cycle_day <= 31:
        parser.error("--billing-cycle-day must be between 1 and 31")

    return BootstrapArgs(
        admin_name=parsed.admin_name,
        admin_email=parsed.admin_email,
        admin_password=parsed.admin_password,
        residence_id=parsed.residence_id,
        residence_name=parsed.residence_name,
        residence_address=parsed.residence_address,
        timezone=parsed.timezone,
        currency=parsed.currency,
        billing_cycle_day=parsed.billing_cycle_day,
    )


def main() -> None:
    args = parse_args()
    normalized_email = normalize_email(args.admin_email)

    with SessionLocal() as db:
        existing_user = db.scalar(select(User).where(User.email == normalized_email))
        if existing_user is not None:
            raise SystemExit(f"User with email {normalized_email} already exists")

        residence = resolve_residence(db, args)
        admin = User(
            residence_id=residence.id,
            name=args.admin_name.strip(),
            email=normalized_email,
            password_hash=hash_password(args.admin_password),
            role=UserRole.residence_admin,
            status=EntityStatus.active,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    print(f"Created residence_admin id={admin.id} for residence id={residence.id} email={admin.email}")


def resolve_residence(db, args: BootstrapArgs) -> Residence:
    if args.residence_id is not None:
        residence = db.get(Residence, args.residence_id)
        if residence is None:
            raise SystemExit(f"Residence id={args.residence_id} was not found")
        return residence

    residence = Residence(
        name=args.residence_name.strip(),
        address=args.residence_address.strip(),
        timezone=args.timezone,
        currency=args.currency,
        billing_cycle_day=args.billing_cycle_day,
        status=ResidenceStatus.active,
    )
    db.add(residence)
    db.flush()
    return residence


if __name__ == "__main__":
    main()
