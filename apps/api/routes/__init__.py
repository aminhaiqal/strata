from .auth import router as auth_router
from .resident import router as resident_router

__all__ = ["auth_router", "resident_router"]
