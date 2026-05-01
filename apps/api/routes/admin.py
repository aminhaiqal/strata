from __future__ import annotations

from fastapi import APIRouter

from .admin_imports import get_import_batch, import_units, router as imports_router
from .admin_residence_management import (
    CreateBlockRequest,
    CreateUnitRequest,
    UpdateBlockRequest,
    UpdateResidenceRequest,
    UpdateUnitRequest,
    create_block,
    create_unit,
    get_block,
    get_residence,
    get_unit,
    list_blocks,
    list_residences,
    list_units,
    router as residence_management_router,
    update_block,
    update_residence,
    update_unit,
)
from .admin_residents import (
    CreateResidentAccountRequest,
    LinkResidentRequest,
    UpdateResidentAccountRequest,
    create_resident_account,
    link_resident_to_unit,
    list_residents,
    list_unit_residents,
    router as residents_router,
    unlink_resident_from_unit,
    update_resident_account,
)

router = APIRouter()
router.include_router(residence_management_router)
router.include_router(imports_router)
router.include_router(residents_router)

__all__ = [
    "router",
    "CreateResidentAccountRequest",
    "UpdateResidentAccountRequest",
    "LinkResidentRequest",
    "UpdateResidenceRequest",
    "CreateBlockRequest",
    "UpdateBlockRequest",
    "CreateUnitRequest",
    "UpdateUnitRequest",
    "list_residences",
    "get_residence",
    "update_residence",
    "create_block",
    "list_blocks",
    "get_block",
    "update_block",
    "create_unit",
    "list_units",
    "get_unit",
    "update_unit",
    "import_units",
    "get_import_batch",
    "create_resident_account",
    "list_residents",
    "update_resident_account",
    "list_unit_residents",
    "link_resident_to_unit",
    "unlink_resident_from_unit",
]
