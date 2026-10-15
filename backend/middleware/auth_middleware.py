"""
Authentication Middleware
Provides the `@require_auth` decorator to intercept requests to protected API endpoints,
extract and validate the Bearer JWT token, and attach `g.current_user` to Flask's context.
"""
from functools import wraps
from flask import request, g
from services.auth_service import decode_jwt_token
from middleware.error_handler import UnauthorizedError


def require_auth(fn):
    """
    Decorator for protected routes requiring student authentication.
    
    Extracts HTTP Header:
        Authorization: Bearer <token>

    Validates signature and expiration, then populates:
        g.current_user = {
            "id": "uuid-string",
            "email": "student@college.edu",
            "name": "Student Name"
        }
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "").strip()

        if not auth_header:
            raise UnauthorizedError(
                message="Authorization header is missing. Please provide a Bearer token.",
                code="UNAUTHORIZED"
            )

        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise UnauthorizedError(
                message="Invalid Authorization header format. Must be 'Bearer <token>'.",
                code="INVALID_HEADER_FORMAT"
            )

        token = parts[1].strip()
        payload = decode_jwt_token(token)

        # Attach authenticated user identity to Flask request context
        g.current_user = {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name")
        }

        return fn(*args, **kwargs)

    return wrapper


def optional_auth(fn):
    """
    Decorator for routes that can optionally identify a user if a token is present,
    without rejecting unauthenticated requests.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "").strip()
        g.current_user = None

        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            try:
                payload = decode_jwt_token(token)
                g.current_user = {
                    "id": payload.get("sub"),
                    "email": payload.get("email"),
                    "name": payload.get("name")
                }
            except Exception:
                g.current_user = None

        return fn(*args, **kwargs)

    return wrapper
