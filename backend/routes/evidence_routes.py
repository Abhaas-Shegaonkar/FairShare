"""
Work Evidence and File Storage Routes (`/api/upload` & `/api/evidence`)
Enforces verifiable proof-of-work, handles multipart file uploads to Supabase Storage,
and attaches deliverables (GitHub PRs, Figma links, PDFs) to tasks.
Protected by @require_auth.
"""
from flask import Blueprint, jsonify, request, g
from utils.validators import validate_body, AttachEvidenceSchema
from middleware.auth_middleware import require_auth
from services.evidence_service import (
    upload_evidence_file,
    attach_evidence_to_task,
    get_task_evidence,
    get_project_evidence_vault,
)
from services.activity_logger import get_project_activity_timeline
from middleware.error_handler import APIError

evidence_bp = Blueprint("evidence", __name__, url_prefix="/api")


@evidence_bp.route("/upload", methods=["POST"])
@require_auth
def upload_file_route():
    """
    POST /api/upload
    Receives multipart/form-data with attached deliverable file and target project_id.
    Validates MIME type, extension, size, and uploads to Supabase Storage bucket.
    """
    user_id = g.current_user["id"]

    if "file" not in request.files:
        raise APIError(
            message="Multipart form payload must contain a 'file' field.",
            code="MISSING_FILE",
            status_code=400
        )

    project_id = request.form.get("project_id", "").strip()
    if not project_id:
        raise APIError(
            message="Multipart form payload must specify 'project_id'.",
            code="MISSING_PROJECT_ID",
            status_code=400
        )

    uploaded_file = request.files["file"]
    result = upload_evidence_file(
        project_id=project_id,
        user_id=user_id,
        file_obj=uploaded_file
    )

    return jsonify({
        "success": True,
        "data": result,
        "message": f"Artifact '{result.get('file_name')}' uploaded successfully."
    }), 201


@evidence_bp.route("/tasks/<task_id>/evidence", methods=["POST"])
@require_auth
@validate_body(AttachEvidenceSchema)
def attach_evidence_route(task_id: str, validated_data: AttachEvidenceSchema):
    """
    POST /api/tasks/<task_id>/evidence
    Attaches an external URL or uploaded storage artifact to a task deliverable,
    logging an immutable event in activity_logs.
    """
    user_id = g.current_user["id"]
    user_name = g.current_user.get("name", "Student")
    payload = validated_data.model_dump()

    evidence = attach_evidence_to_task(
        task_id=task_id,
        user_id=user_id,
        user_name=user_name,
        data=payload
    )

    return jsonify({
        "success": True,
        "data": evidence,
        "message": "Verifiable proof attached to deliverable successfully."
    }), 201


@evidence_bp.route("/tasks/<task_id>/evidence", methods=["GET"])
@require_auth
def get_task_evidence_route(task_id: str):
    """
    GET /api/tasks/<task_id>/evidence
    Retrieves all attached proof artifacts for a specific deliverable task.
    """
    user_id = g.current_user["id"]
    evidence_list = get_task_evidence(task_id=task_id, user_id=user_id)
    return jsonify({
        "success": True,
        "data": evidence_list
    }), 200


@evidence_bp.route("/projects/<project_id>/evidence", methods=["GET"])
@require_auth
def get_project_evidence_vault_route(project_id: str):
    """
    GET /api/projects/<project_id>/evidence
    Retrieves the complete evidence manifest across all deliverables in a project,
    supporting ?type=github and ?member_id=uuid query filters.
    """
    user_id = g.current_user["id"]
    type_filter = request.args.get("type")
    member_filter = request.args.get("member_id")

    vault_items = get_project_evidence_vault(
        project_id=project_id,
        user_id=user_id,
        type_filter=type_filter,
        member_filter=member_filter
    )
    return jsonify({
        "success": True,
        "data": vault_items
    }), 200


@evidence_bp.route("/projects/<project_id>/activity", methods=["GET"])
@require_auth
def get_project_activity_route(project_id: str):
    """
    GET /api/projects/<project_id>/activity
    Retrieves the chronological, formatted activity timeline stream for the workspace.
    """
    user_id = g.current_user["id"]
    limit = int(request.args.get("limit", 50))
    activities = get_project_activity_timeline(
        project_id=project_id,
        user_id=user_id,
        limit=limit
    )
    return jsonify({
        "success": True,
        "data": activities
    }), 200
