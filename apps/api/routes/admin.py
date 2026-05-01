from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from application import (
    ApplicationError,
    CreateResidentUser,
    LinkResidentToUnit,
    ResidentService,
    UpdateResidentUser,
    ValidationError,
)
from auth import AuthenticatedAdmin, get_current_admin_user, hash_password
from database import get_db
from models.db import EntityStatus, UnitUserRelationshipType
from models.schemas import UnitResidentLinkSchema, UserSchema

router = APIRouter(prefix="/admin", tags=["admin"])


class CreateResidentAccountRequest(BaseModel):
    name: str
    email: str
    temporary_password: str
    phone: str | None = None


class UpdateResidentAccountRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    status: EntityStatus | None = None


class LinkResidentRequest(BaseModel):
    user_id: int
    relationship_type: UnitUserRelationshipType


def _raise_http_error(error: ApplicationError) -> None:
    if isinstance(error, ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.post("/residents", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def create_resident_account(
    payload: CreateResidentAccountRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UserSchema:
    service = ResidentService(db)
    try:
        resident = service.create_resident_user(
            CreateResidentUser(
                residence_id=current_admin.residence_id,
                name=payload.name,
                email=payload.email,
                phone=payload.phone,
                password_hash=hash_password(payload.temporary_password),
            )
        )
        db.commit()
        db.refresh(resident)
        return UserSchema.model_validate(resident)
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)


@router.get("/residents", response_model=list[UserSchema])
def list_residents(
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[UserSchema]:
    service = ResidentService(db)
    return [UserSchema.model_validate(user) for user in service.list_residents(current_admin.residence_id)]


@router.patch("/residents/{user_id}", response_model=UserSchema)
def update_resident_account(
    user_id: int,
    payload: UpdateResidentAccountRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UserSchema:
    service = ResidentService(db)
    try:
        resident = service.update_resident_user(
            UpdateResidentUser(
                actor_residence_id=current_admin.residence_id,
                user_id=user_id,
                name=payload.name,
                phone=payload.phone,
                status=payload.status,
            )
        )
        db.commit()
        db.refresh(resident)
        return UserSchema.model_validate(resident)
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)


@router.get("/units/{unit_id}/residents", response_model=list[UnitResidentLinkSchema])
def list_unit_residents(
    unit_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[UnitResidentLinkSchema]:
    service = ResidentService(db)
    try:
        links = service.list_unit_residents(current_admin.residence_id, unit_id)
        return [
            UnitResidentLinkSchema(
                unit_id=link.unit_id,
                user_id=link.user_id,
                relationship_type=link.relationship_type,
                resident=UserSchema.model_validate(link.user),
            )
            for link in links
        ]
    except ApplicationError as error:
        _raise_http_error(error)


@router.post("/units/{unit_id}/residents", response_model=UnitResidentLinkSchema, status_code=status.HTTP_201_CREATED)
def link_resident_to_unit(
    unit_id: int,
    payload: LinkResidentRequest,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> UnitResidentLinkSchema:
    service = ResidentService(db)
    try:
        link = service.link_resident_to_unit(
            LinkResidentToUnit(
                unit_id=unit_id,
                user_id=payload.user_id,
                relationship_type=payload.relationship_type,
            )
        )
        if link.user.residence_id != current_admin.residence_id:
            raise ValidationError("resident and admin must belong to the same residence")
        db.commit()
        db.refresh(link)
        return UnitResidentLinkSchema(
            unit_id=link.unit_id,
            user_id=link.user_id,
            relationship_type=link.relationship_type,
            resident=UserSchema.model_validate(link.user),
        )
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)


@router.delete("/units/{unit_id}/residents/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unlink_resident_from_unit(
    unit_id: int,
    user_id: int,
    current_admin: AuthenticatedAdmin = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> Response:
    service = ResidentService(db)
    try:
        service.unlink_resident_from_unit(
            residence_id=current_admin.residence_id,
            unit_id=unit_id,
            user_id=user_id,
        )
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ApplicationError as error:
        db.rollback()
        _raise_http_error(error)
