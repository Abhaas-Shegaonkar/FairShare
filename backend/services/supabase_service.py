"""
Supabase Database and Storage Client Singleton Service
Manages connections, service role operations, and storage bucket interactions
for the FairShare backend.
"""
import os
import logging
from typing import Optional
from supabase import create_client, Client
from config import Config

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Returns the singleton standard Supabase client (using anon/public key).
    Gracefully returns None if credentials are not configured in local environment.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = Config.SUPABASE_URL
    key = Config.SUPABASE_KEY

    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY is missing. Supabase client not initialized.")
        return None

    try:
        _supabase_client = create_client(url, key)
        logger.info("Supabase client initialized successfully.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None


def get_supabase_admin_client() -> Optional[Client]:
    """
    Returns the singleton administrative Supabase client (using service role key).
    Used for backend system operations that bypass RLS (e.g. initial setup, automated snapshots).
    Falls back to standard client if service role key is not configured.
    """
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    url = Config.SUPABASE_URL
    admin_key = Config.SUPABASE_SERVICE_ROLE_KEY or Config.SUPABASE_KEY

    if not url or not admin_key:
        logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.")
        return None

    try:
        _supabase_admin_client = create_client(url, admin_key)
        logger.info("Supabase admin client initialized successfully.")
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase admin client: {str(e)}")
        return None


def check_database_health() -> dict:
    """
    Tests connectivity to Supabase and reports database status.
    """
    client = get_supabase_client()
    if not client:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "SUPABASE_URL and SUPABASE_KEY must be configured in .env."
        }

    try:
        # Ping users table with limit 1
        response = client.table("users").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "connected": True,
            "message": "Successfully connected to Supabase PostgreSQL database."
        }
    except Exception as e:
        return {
            "status": "degraded",
            "connected": False,
            "message": f"Database query failed: {str(e)}"
        }
