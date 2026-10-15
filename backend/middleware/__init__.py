"""
FairShare Backend Middleware Package
"""
from .error_handler import (
    APIError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    ValidationError,
    register_error_handlers,
)

__all__ = [
    "APIError",
    "NotFoundError",
    "UnauthorizedError",
    "ForbiddenError",
    "ConflictError",
    "ValidationError",
    "register_error_handlers",
]
