"""
Centralized Error Handling Middleware
Catches application exceptions and returns standardized JSON error envelopes
strictly adhering to the FairShare API specification.
"""
import logging
from typing import Any, Optional
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base application exception for managed API errors."""
    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        code: str = "BAD_REQUEST",
        status_code: int = 400,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details

    def to_dict(self) -> dict:
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class NotFoundError(APIError):
    def __init__(self, message: str = "The requested resource was not found.", code: str = "NOT_FOUND", details: Any = None):
        super().__init__(message=message, code=code, status_code=404, details=details)


class UnauthorizedError(APIError):
    def __init__(self, message: str = "Authentication token is missing or invalid.", code: str = "UNAUTHORIZED", details: Any = None):
        super().__init__(message=message, code=code, status_code=401, details=details)


class ForbiddenError(APIError):
    def __init__(self, message: str = "You do not have permission to perform this action.", code: str = "FORBIDDEN", details: Any = None):
        super().__init__(message=message, code=code, status_code=403, details=details)


class ConflictError(APIError):
    def __init__(self, message: str = "Resource conflict detected.", code: str = "CONFLICT", details: Any = None):
        super().__init__(message=message, code=code, status_code=409, details=details)


class ValidationError(APIError):
    def __init__(self, message: str = "Validation failed for request payload.", code: str = "VALIDATION_ERROR", details: Any = None):
        super().__init__(message=message, code=code, status_code=400, details=details)


def register_error_handlers(app: Flask):
    """Registers global error handlers on the Flask application instance."""

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError):
        """Catches custom APIError exceptions and returns structured JSON envelope."""
        return jsonify(error.to_dict()), error.status_code

    @app.errorhandler(413)
    def handle_payload_too_large(error):
        """Intercepts Werkzeug 413 Payload Too Large (e.g. file upload > 10MB)."""
        return jsonify({
            "success": False,
            "error": {
                "code": "FILE_TOO_LARGE",
                "message": "Uploaded file exceeds the maximum permitted limit of 10MB.",
                "details": None
            }
        }), 413

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        """Intercepts standard Werkzeug HTTP exceptions (404, 405, 400, etc.)."""
        # Map common HTTP status codes to machine-readable string codes
        code_mapping = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            408: "REQUEST_TIMEOUT",
            409: "CONFLICT",
            415: "UNSUPPORTED_MEDIA_TYPE",
            429: "TOO_MANY_REQUESTS",
            500: "INTERNAL_SERVER_ERROR",
        }
        err_code = code_mapping.get(error.code, "HTTP_ERROR")
        return jsonify({
            "success": False,
            "error": {
                "code": err_code,
                "message": error.description or "An HTTP error occurred.",
                "details": None
            }
        }), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error: Exception):
        """Fallback interceptor for unhandled server exceptions (500)."""
        logger.error(f"Unhandled exception on {request.method} {request.path}: {str(error)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
                "details": str(error) if app.config.get("DEBUG") else None
            }
        }), 500
