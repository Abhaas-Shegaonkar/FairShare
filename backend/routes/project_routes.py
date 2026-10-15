"""
Project and Team Management Routes (`/api/projects`)
Handles workspace creation, project listings, detail retrieval, and roster invitations.
"""
from flask import Blueprint, jsonify, request
from utils.validators import validate_body, CreateProjectSchema, AddMemberSchema

projects_bp = Blueprint("projects", __name__, url_prefix="/api/projects")


@projects_bp.route("", methods=["GET"])
def list_projects():
    """
    GET /api/projects
    Lists all active projects the authenticated user belongs to.
    """
    return jsonify({
        "success": True,
        "data": [],
        "message": "Projects listing endpoint ready."
    }), 200


@projects_bp.route("", methods=["POST"])
@validate_body(CreateProjectSchema)
def create_project(validated_data: CreateProjectSchema):
    """
    POST /api/projects
    Creates a new project workspace and dispatches teammate invitations.
    """
    return jsonify({
        "success": True,
        "data": {
            "project": {
                "id": "placeholder-project-id",
                "name": validated_data.name,
                "description": validated_data.description,
                "category": validated_data.category,
                "start_date": validated_data.start_date,
                "deadline": validated_data.deadline
            },
            "members": [],
            "pending_invites": len(validated_data.members) if validated_data.members else 0
        },
        "message": "Project creation endpoint ready."
    }), 201


@projects_bp.route("/<project_id>", methods=["GET"])
def get_project_details(project_id: str):
    """
    GET /api/projects/<project_id>
    Retrieves project workspace metadata, team members, pending invites, and stats.
    """
    return jsonify({
        "success": True,
        "data": {
            "project": {
                "id": project_id,
                "name": "Smart Water Management System",
                "category": "IoT & Full-Stack",
                "start_date": "2026-08-01",
                "deadline": "2026-09-30"
            },
            "members": [],
            "pending_invites": [],
            "stats": {
                "total_tasks": 0,
                "completed_tasks": 0,
                "progress": "0%"
            }
        }
    }), 200


@projects_bp.route("/<project_id>/members", methods=["POST"])
@validate_body(AddMemberSchema)
def add_project_member(project_id: str, validated_data: AddMemberSchema):
    """
    POST /api/projects/<project_id>/members
    Adds an existing registered student or creates a pending invitation for a new email.
    """
    return jsonify({
        "success": True,
        "data": {
            "email": validated_data.email,
            "role": validated_data.role,
            "status": "added"
        },
        "message": "Project member invitation endpoint ready."
    }), 201
