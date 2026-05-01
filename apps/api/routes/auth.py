from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import authenticate_admin, authenticate_resident, create_access_token
from database import get_db
from models.schemas import UserSchema

router = APIRouter(prefix="/auth", tags=["auth"])


class ResidentLoginRequest(BaseModel):
    email: str
    password: str


class ResidentLoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserSchema


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserSchema


@router.post("/resident/login", response_model=ResidentLoginResponse)
def resident_login(payload: ResidentLoginRequest, db: Session = Depends(get_db)) -> ResidentLoginResponse:
    user = authenticate_resident(
        db=db,
        email=payload.email,
        password=payload.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid residence, email, or password",
        )

    access_token, expires_in = create_access_token(user=user)
    return ResidentLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserSchema.model_validate(user),
    )


@router.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> AdminLoginResponse:
    user = authenticate_admin(
        db=db,
        email=payload.email,
        password=payload.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid residence, email, or password",
        )

    access_token, expires_in = create_access_token(user=user)
    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in,
        user=UserSchema.model_validate(user),
    )
