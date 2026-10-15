"""
FairShare Backend Configuration
Provides environment-specific configurations (Development, Production, Testing)
with security controls for JWT, CORS, and file uploads.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base Configuration with default settings and security constraints."""

    # Core Security
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-fairshare-secret-key-change-in-prod")
    
    # JWT Authentication
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret-fairshare")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # Supabase Credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # CORS Configuration
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

    # File Upload Security Settings
    # Enforces 10MB file limit to prevent DoS via massive payloads
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 10 * 1024 * 1024))
    UPLOAD_BUCKET = os.getenv("UPLOAD_BUCKET", "evidence_files")
    
    # MIME Type & Extension Whitelists to prevent arbitrary executable execution
    ALLOWED_EXTENSIONS = {
        "pdf", "png", "jpg", "jpeg", "webp", "gif",
        "doc", "docx", "txt", "md", "csv", "json", "zip"
    }
    ALLOWED_MIME_TYPES = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production environment configuration with strict assertions."""
    DEBUG = False
    TESTING = False

    @classmethod
    def validate_production_keys(cls):
        """Ensure critical secrets are explicitly provided and not default in production."""
        if cls.SECRET_KEY in ("dev-fairshare-secret-key-change-in-prod", ""):
            raise ValueError("SECRET_KEY must be securely configured in production.")
        if cls.JWT_SECRET in ("dev-jwt-secret-fairshare", ""):
            raise ValueError("JWT_SECRET must be securely configured in production.")
        if not cls.SUPABASE_URL or not cls.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be provided in production.")


class TestingConfig(Config):
    """Testing environment configuration."""
    DEBUG = True
    TESTING = True
    JWT_EXPIRATION_HOURS = 1


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}


def get_config():
    """Returns configuration class based on FLASK_ENV or APP_ENV."""
    env = os.getenv("FLASK_ENV", os.getenv("APP_ENV", "development")).lower()
    return config_by_name.get(env, DevelopmentConfig)
