"""
Authentication and Student Profile Routes (`/api/auth`)
Handles registration, login, JWT issuance, and authenticated profile lookups.
"""
from flask import Blueprint, jsonify, request
from utils.validators import validate_body, RegisterSchema, LoginSchema

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
@validate_body(RegisterSchema)
def register(validated_data: RegisterSchema):
    """
    POST /api/auth/register
    Creates student profile, claims pending project invitations, and returns JWT session token.
    Full business logic will be bound to auth_service in Phase 5.
    """
    return jsonify({
        "success": True,
        "data": {
            "user": {
                "id": "placeholder-user-id",
                "email": validated_data.email,
                "name": validated_data.name,
                "avatar_url": None
            },
            "claimed_invitations": 0,
            "token": "placeholder-jwt-token"
        },
        "message": "Student registration endpoint ready."
    }), 201


@auth_bp.route("/login", methods=["POST"])
@validate_body(LoginSchema)
def login(validated_data: LoginSchema):
    """
    POST /api/auth/login
    Verifies student credentials and returns a signed JWT token.
    Full business logic will be bound to auth_service in Phase 5.
    """
    return jsonify({
        "success": True,
        "data": {
            "user": {
                "id": "placeholder-user-id",
                "email": validated_data.email,
                "name": "Student",
                "avatar_url": None
            },
            "token": "placeholder-jwt-token"
        },
        "message": "Login endpoint ready."
    }), 200


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """
    GET /api/auth/me
    Retrieves the authenticated student's profile without exposing password_hash.
    """
    return jsonify({
        "success": True,
        "data": {
            "user": {
                "id": "placeholder-user-id",
                "email": "student@college.edu",
                "name": "Student",
                "avatar_url": None
            }
        }
    }), 200
