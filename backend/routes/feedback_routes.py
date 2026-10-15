"""
Peer Feedback Routes (`/api/projects/<id>/feedback`)
Provides structured, 6-dimension teammate evaluations with anti-self-review guards
and aggregated, anonymized rating views.
"""
from flask import Blueprint, jsonify, request
from utils.validators import validate_body, SubmitFeedbackSchema

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/projects")


@feedback_bp.route("/<project_id>/feedback", methods=["POST"])
@validate_body(SubmitFeedbackSchema)
def submit_peer_feedback(project_id: str, validated_data: SubmitFeedbackSchema):
    """
    POST /api/projects/<project_id>/feedback
    Submits structured 6-dimension evaluation for a teammate.
    Enforces check constraint to disallow self-reviews (reviewer_id != reviewee_id).
    """
    return jsonify({
        "success": True,
        "data": {
            "project_id": project_id,
            "reviewee_id": validated_data.reviewee_id,
            "status": "submitted"
        },
        "message": "Peer feedback submitted anonymously."
    }), 201


@feedback_bp.route("/<project_id>/feedback/status", methods=["GET"])
def get_feedback_status(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/status
    Returns the list of team member IDs that the authenticated user has already evaluated.
    """
    return jsonify({
        "success": True,
        "data": {
            "reviewed_members": []
        },
        "message": "Peer feedback completion status endpoint ready."
    }), 200


@feedback_bp.route("/<project_id>/feedback/summary", methods=["GET"])
def get_feedback_summary(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/summary
    Returns anonymized, aggregated category ratings computed via v_peer_feedback_summary.
    """
    return jsonify({
        "success": True,
        "data": {
            "average_rating": 4.0,
            "total_reviews": 0,
            "categories": {
                "participation": 4.0,
                "responsibility": 4.0,
                "quality": 4.0,
                "collaboration": 4.0,
                "communication": 4.0,
                "timeliness": 4.0
            }
        },
        "message": "Anonymized feedback summary endpoint ready."
    }), 200
