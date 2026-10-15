"""
Project and Team Management Routes (`/api/projects`)
Handles workspace creation, project listings, detail retrieval, and roster invitations.
Protected by @require_auth.
"""
from flask import Blueprint, jsonify, g
from utils.validators import validate_body, CreateProjectSchema, AddMemberSchema
from middleware.auth_middleware import require_auth
from services.project_service import (
    list_user_projects,
    create_project,
    get_project_details,
    add_project_member,
)

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("", methods=["GET"])
@require_auth
def list_projects():
    """
    GET /api/projects
    Lists all active projects the authenticated user belongs to.
    """
    user_id = g.current_user["id"]
    projects = list_user_projects(user_id)
    return jsonify({
        "success": True,
        "data": projects
    }), 200


@projects_bp.route("", methods=["POST"])
@require_auth
@validate_body(CreateProjectSchema)
def create_project_route(validated_data: CreateProjectSchema):
    """
    POST /api/projects
    Creates a new project workspace and dispatches teammate invitations.
    """
    user_id = g.current_user["id"]
    user_name = g.current_user.get("name", "Student")
    payload = validated_data.model_dump()

    result = create_project(creator_user_id=user_id, creator_name=user_name, data=payload)
    return jsonify({
        "success": True,
        "data": result,
        "message": f"Project workspace '{result.get('name')}' created successfully."
    }), 201


@projects_bp.route("/<project_id>", methods=["GET"])
@require_auth
def get_project_workspace_route(project_id: str):
    """
    GET /api/projects/<project_id>
    Retrieves project workspace metadata, team roster, pending invites, and stats.
    Enforces project membership authorization.
    """
    user_id = g.current_user["id"]
    details = get_project_details(project_id=project_id, user_id=user_id)
    return jsonify({
        "success": True,
        "data": details
    }), 200


@projects_bp.route("/<project_id>/members", methods=["POST"])
@require_auth
@validate_body(AddMemberSchema)
def add_member_route(project_id: str, validated_data: AddMemberSchema):
    """
    POST /api/projects/<project_id>/members
    Adds an existing registered student or creates a pending invitation for a new email.
    """
    user_id = g.current_user["id"]
    user_name = g.current_user.get("name", "Student")

    result = add_project_member(
        project_id=project_id,
        inviter_user_id=user_id,
        inviter_name=user_name,
        email=validated_data.email,
        role=validated_data.role
    )
    return jsonify({
        "success": True,
        "data": result,
        "message": f"Team member invitation for '{validated_data.email}' processed successfully."
    }), 201
