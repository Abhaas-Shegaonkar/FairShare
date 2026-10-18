"""
Peer Feedback Routes (`/api/projects/<id>/feedback`)
Provides structured, 6-dimension teammate evaluations with anti-self-review guards,
review status tracking, and aggregated, anonymized rating views.
Protected by @require_auth.
"""
import logging
from flask import Blueprint, jsonify, request, g
from middleware.auth_middleware import require_auth
from utils.validators import validate_body, SubmitFeedbackSchema
from services.feedback_service import (
    submit_peer_review,
    get_peer_feedback_status,
    get_peer_feedback_summary,
)
from services.scoring_engine import calculate_member_contribution

logger = logging.getLogger(__name__)

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/projects")


@feedback_bp.route("/<project_id>/feedback", methods=["POST"])
@require_auth
@validate_body(SubmitFeedbackSchema)
def submit_peer_feedback_route(project_id: str, validated_data: SubmitFeedbackSchema):
    """
    POST /api/projects/<project_id>/feedback
    Submits structured 6-dimension evaluation for a teammate.
    Enforces check constraint to disallow self-reviews (reviewer_id != reviewee_id).
    """
    reviewer_id = g.current_user["id"]
    payload = validated_data.model_dump()

    result = submit_peer_review(
        project_id=project_id,
        reviewer_id=reviewer_id,
        data=payload
    )

    # Recompute reviewee contribution score with new peer evaluation
    try:
        calculate_member_contribution(project_id=project_id, user_id=validated_data.reviewee_id)
    except Exception as e:
        logger.warning(f"Could not immediately recompute score for {validated_data.reviewee_id}: {str(e)}")

    return jsonify({
        "success": True,
        "message": result.get("message", "Feedback submitted successfully and anonymously.")
    }), 201


@feedback_bp.route("/<project_id>/feedback/status", methods=["GET"])
@require_auth
def get_feedback_status_route(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/status
    Returns the list of team member IDs that the authenticated user has already evaluated.
    """
    reviewer_id = g.current_user["id"]
    status_data = get_peer_feedback_status(project_id=project_id, reviewer_id=reviewer_id)

    return jsonify({
        "success": True,
        "data": status_data,
        "message": "Peer feedback completion status retrieved successfully."
    }), 200


@feedback_bp.route("/<project_id>/feedback/summary", methods=["GET"])
@require_auth
def get_feedback_summary_route(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/summary
    Returns anonymized, aggregated category ratings computed via v_peer_feedback_summary.
    Accepts optional ?user_id= query param, defaulting to current authenticated student.
    """
    target_user_id = request.args.get("user_id") or g.current_user["id"]
    summary_data = get_peer_feedback_summary(project_id=project_id, user_id=target_user_id)

    return jsonify({
        "success": True,
        "data": summary_data,
        "message": "Anonymized feedback summary retrieved successfully."
    }), 200
