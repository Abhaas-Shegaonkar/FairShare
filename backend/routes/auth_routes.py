"""
Authentication and Student Profile Routes (`/api/auth`)
Handles registration, login, JWT issuance, and authenticated profile lookups.
"""
from flask import Blueprint, jsonify, g
from utils.validators import validate_body, RegisterSchema, LoginSchema
from services.auth_service import register_user, login_user, get_user_profile
from middleware.auth_middleware import require_auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
@validate_body(RegisterSchema)
def register(validated_data: RegisterSchema):
    """
    POST /api/auth/register
    Creates student profile, hashes password with bcrypt, automatically claims
    any pending project invitations matching the user's email, and returns JWT session token.
    """
    result = register_user(
        email=validated_data.email,
        password=validated_data.password,
        name=validated_data.name
    )
    return jsonify({
        "success": True,
        "data": result,
        "message": "Student account registered successfully."
    }), 201


@auth_bp.route("/login", methods=["POST"])
@validate_body(LoginSchema)
def login(validated_data: LoginSchema):
    """
    POST /api/auth/login
    Verifies student credentials against bcrypt hash and returns a signed JWT token.
    """
    result = login_user(
        email=validated_data.email,
        password=validated_data.password
    )
    return jsonify({
        "success": True,
        "data": result,
        "message": "Login successful."
    }), 200


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_current_user():
    """
    GET /api/auth/me
    Retrieves the authenticated student's profile without exposing sensitive fields like password_hash.
    Protected by @require_auth decorator.
    """
    user_id = g.current_user["id"]
    profile = get_user_profile(user_id)
    return jsonify({
        "success": True,
        "data": {
            "user": profile
        }
    }), 200
