from __future__ import annotations


class ApplicationError(Exception):
    """Base class for application-layer errors."""


class NotFoundError(ApplicationError):
    def __init__(self, entity_name: str, entity_id: int) -> None:
        super().__init__(f"{entity_name} {entity_id} was not found")


class ValidationError(ApplicationError):
    pass
