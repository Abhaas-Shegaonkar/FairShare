"""
Authentication Service
Handles secure bcrypt password hashing, JWT token issuance & validation,
student registration, login, and automatic claiming of pending project invitations.
"""
import logging
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from config import Config
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from middleware.error_handler import ConflictError, UnauthorizedError, NotFoundError, APIError

logger = logging.getLogger(__name__)


def hash_password(plain_password: str) -> str:
    """Hashes a plaintext password using bcrypt with 12 salt rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def generate_jwt_token(user_id: str, email: str, name: str) -> str:
    """Generates a signed JWT session token with standard claims."""
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(hours=Config.JWT_EXPIRATION_HOURS)

    payload = {
        "sub": str(user_id),
        "email": email,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int(expiration.timestamp()),
        "iss": "fairshare-auth",
    }

    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)
    # PyJWT 2.x returns a string directly
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_jwt_token(token: str) -> dict:
    """Decodes and validates a JWT token. Raises UnauthorizedError on failure."""
    try:
        payload = jwt.decode(
            token,
            Config.JWT_SECRET,
            algorithms=[Config.JWT_ALGORITHM],
            issuer="fairshare-auth"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(
            message="Your session has expired. Please log in again.",
            code="TOKEN_EXPIRED"
        )
    except (jwt.InvalidTokenError, Exception) as e:
        raise UnauthorizedError(
            message="Authentication token is invalid or malformed.",
            code="INVALID_TOKEN",
            details=str(e) if Config.DEBUG else None
        )


def sanitize_user(user_dict: dict) -> dict:
    """Strips sensitive columns (such as password_hash) from user dicts."""
    if not user_dict:
        return {}
    return {
        "id": user_dict.get("id"),
        "email": user_dict.get("email"),
        "name": user_dict.get("name"),
        "avatar_url": user_dict.get("avatar_url"),
        "created_at": user_dict.get("created_at")
    }


def claim_pending_invitations(user_id: str, email: str, user_name: str) -> int:
    """
    Finds any pending project invitations matching the student's email,
    adds them as project members, updates invite status to 'accepted',
    and logs the activity event.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        logger.warning("Database client unavailable; skipping invitation claiming.")
        return 0

    claimed_count = 0
    try:
        # 1. Query pending invites for this email
        res = client.table("project_invitations").select("*").eq("email", email.lower()).eq("status", "pending").execute()
        invites = res.data or []

        for invite in invites:
            proj_id = invite.get("project_id")
            role = invite.get("role", "Member")
            invite_id = invite.get("id")

            # 2. Add to project_members
            client.table("project_members").insert({
                "project_id": proj_id,
                "user_id": user_id,
                "role": role,
            }).execute()

            # 3. Update invite status
            client.table("project_invitations").update({
                "status": "accepted"
            }).eq("id", invite_id).execute()

            # 4. Log in activity_logs
            client.table("activity_logs").insert({
                "project_id": proj_id,
                "user_id": user_id,
                "action_type": "MEMBER_JOINED",
                "description": f"{user_name} joined the project as {role}."
            }).execute()

            claimed_count += 1

    except Exception as e:
        logger.error(f"Error claiming invitations for {email}: {str(e)}")

    return claimed_count


def register_user(email: str, password: str, name: str) -> dict:
    """
    Registers a new student profile in Supabase:
    1. Verifies email uniqueness.
    2. Hashes password securely with bcrypt.
    3. Persists record to users table.
    4. Automatically resolves any pending invitations.
    5. Returns sanitized profile and signed JWT token.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    clean_email = email.strip().lower()

    if client:
        # Check if email is already registered
        existing = client.table("users").select("id").eq("email", clean_email).execute()
        if existing.data and len(existing.data) > 0:
            raise ConflictError(
                message=f"A student account with email '{clean_email}' already exists.",
                code="USER_ALREADY_EXISTS"
            )

        hashed = hash_password(password)
        insert_res = client.table("users").insert({
            "email": clean_email,
            "password_hash": hashed,
            "name": name.strip(),
            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.strip()}"
        }).execute()

        if not insert_res.data:
            raise APIError("Failed to persist user profile to database.", code="DATABASE_ERROR", status_code=500)

        user_record = insert_res.data[0]
        user_id = user_record["id"]
        claimed = claim_pending_invitations(user_id, clean_email, name.strip())
    else:
        # Dev fallback when DB credentials are not yet configured
        logger.warning("Operating in mock mode: Supabase credentials not provided.")
        user_id = "00000000-0000-0000-0000-000000000001"
        user_record = {
            "id": user_id,
            "email": clean_email,
            "name": name.strip(),
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        claimed = 0

    token = generate_jwt_token(user_id=user_id, email=clean_email, name=name.strip())
    return {
        "user": sanitize_user(user_record),
        "claimed_invitations": claimed,
        "token": token
    }


def login_user(email: str, password: str) -> dict:
    """
    Verifies student credentials and issues a signed JWT token.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    clean_email = email.strip().lower()

    if client:
        res = client.table("users").select("*").eq("email", clean_email).execute()
        if not res.data or len(res.data) == 0:
            raise UnauthorizedError(
                message="Invalid email or password.",
                code="INVALID_CREDENTIALS"
            )

        user_record = res.data[0]
        if not verify_password(password, user_record.get("password_hash", "")):
            raise UnauthorizedError(
                message="Invalid email or password.",
                code="INVALID_CREDENTIALS"
            )

        user_id = user_record["id"]
        user_name = user_record.get("name", "Student")
    else:
        logger.warning("Operating in mock mode: Supabase credentials not provided.")
        user_id = "00000000-0000-0000-0000-000000000001"
        user_name = "Student"
        user_record = {
            "id": user_id,
            "email": clean_email,
            "name": user_name,
            "avatar_url": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    token = generate_jwt_token(user_id=user_id, email=clean_email, name=user_name)
    return {
        "user": sanitize_user(user_record),
        "token": token
    }


def get_user_profile(user_id: str) -> dict:
    """
    Fetches student profile by user UUID without exposing password_hash.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if client:
        res = client.table("users").select("*").eq("id", user_id).execute()
        if not res.data or len(res.data) == 0:
            raise NotFoundError(message="Student profile not found.", code="USER_NOT_FOUND")
        return sanitize_user(res.data[0])

    return {
        "id": user_id,
        "email": "student@college.edu",
        "name": "Student",
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
