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
from .auth_middleware import require_auth, optional_auth

__all__ = [
    "APIError",
    "NotFoundError",
    "UnauthorizedError",
    "ForbiddenError",
    "ConflictError",
    "ValidationError",
    "register_error_handlers",
    "require_auth",
    "optional_auth",
]
