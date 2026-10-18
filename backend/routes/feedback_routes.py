"""
Peer Feedback Routes (`/api/projects/<id>/feedback`)
Provides structured, 6-dimension teammate evaluations with:
- @require_auth protection on ALL endpoints
- Server-side anti-self-review guard (reviewer cannot equal reviewee)
- Aggregated, anonymized rating views
"""
from flask import Blueprint, jsonify, request, g
from utils.validators import validate_body, SubmitFeedbackSchema
from middleware.auth_middleware import require_auth
from middleware.error_handler import APIError, ForbiddenError
from services.project_service import require_project_membership
from services.supabase_service import get_supabase_admin_client, get_supabase_client

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/projects")


@feedback_bp.route("/<project_id>/feedback", methods=["POST"])
@require_auth
@validate_body(SubmitFeedbackSchema)
def submit_peer_feedback(project_id: str, validated_data: SubmitFeedbackSchema):
    """
    POST /api/projects/<project_id>/feedback
    Submits structured 6-dimension evaluation for a teammate.
    - Enforces @require_auth: only authenticated students may submit.
    - Server-side self-review guard: reviewer_id cannot equal reviewee_id.
    - Database-level check constraint also enforces this (defense-in-depth).
    """
    reviewer_id = g.current_user["id"]
    reviewee_id = validated_data.reviewee_id

    # 1. Server-side self-review prevention (not relying solely on DB constraint)
    if reviewer_id == reviewee_id:
        raise ForbiddenError(
            message="You cannot submit a peer evaluation for yourself.",
            code="SELF_REVIEW_PROHIBITED"
        )

    # 2. Enforce project membership for both reviewer
    require_project_membership(project_id, reviewer_id)

    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Demo fallback
        return jsonify({
            "success": True,
            "data": {
                "project_id": project_id,
                "reviewer_id": reviewer_id,
                "reviewee_id": reviewee_id,
                "status": "submitted"
            },
            "message": "Peer feedback submitted anonymously."
        }), 201

    try:
        # 3. Check for duplicate review (one review per reviewer per reviewee per project)
        existing = client.table("peer_feedback").select("id").eq(
            "project_id", project_id
        ).eq("reviewer_id", reviewer_id).eq("reviewee_id", reviewee_id).execute()

        if existing.data and len(existing.data) > 0:
            raise APIError(
                message="You have already submitted a peer evaluation for this teammate.",
                code="FEEDBACK_ALREADY_SUBMITTED",
                status_code=409
            )

        # 4. Insert peer_feedback record
        insert_payload = {
            "project_id": project_id,
            "reviewer_id": reviewer_id,
            "reviewee_id": reviewee_id,
            "participation_score": validated_data.participation_score,
            "responsibility_score": validated_data.responsibility_score,
            "quality_score": validated_data.quality_score,
            "collaboration_score": validated_data.collaboration_score,
            "communication_score": validated_data.communication_score,
            "timeliness_score": validated_data.timeliness_score,
            "comments": validated_data.comments or "",
        }
        res = client.table("peer_feedback").insert(insert_payload).execute()

        if not res.data:
            raise APIError("Failed to record peer evaluation.", status_code=500)

        return jsonify({
            "success": True,
            "data": {
                "project_id": project_id,
                "reviewer_id": reviewer_id,
                "reviewee_id": reviewee_id,
                "status": "submitted"
            },
            "message": "Peer feedback submitted anonymously."
        }), 201

    except APIError:
        raise
    except Exception as e:
        raise APIError(f"Failed to submit peer feedback: {str(e)}", status_code=500)


@feedback_bp.route("/<project_id>/feedback/status", methods=["GET"])
@require_auth
def get_feedback_status(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/status
    Returns the list of team member IDs that the authenticated user has already evaluated.
    Protected by @require_auth.
    """
    reviewer_id = g.current_user["id"]
    require_project_membership(project_id, reviewer_id)

    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return jsonify({
            "success": True,
            "data": {"reviewed_member_ids": []},
            "message": "Peer feedback status endpoint ready."
        }), 200

    try:
        res = client.table("peer_feedback").select("reviewee_id").eq(
            "project_id", project_id
        ).eq("reviewer_id", reviewer_id).execute()

        reviewed_ids = [r["reviewee_id"] for r in (res.data or [])]
        return jsonify({
            "success": True,
            "data": {"reviewed_member_ids": reviewed_ids},
            "message": "Feedback completion status retrieved."
        }), 200
    except Exception as e:
        raise APIError(f"Failed to fetch feedback status: {str(e)}", status_code=500)


@feedback_bp.route("/<project_id>/feedback/summary", methods=["GET"])
@require_auth
def get_feedback_summary(project_id: str):
    """
    GET /api/projects/<project_id>/feedback/summary
    Returns anonymized, aggregated category ratings for the authenticated user.
    Reviewer identities are stripped — only aggregated averages are returned.
    Protected by @require_auth.
    """
    user_id = g.current_user["id"]
    require_project_membership(project_id, user_id)

    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return jsonify({
            "success": True,
            "data": {
                "total_reviews": 0,
                "average_rating": None,
                "categories": {
                    "participation": None, "responsibility": None, "quality": None,
                    "collaboration": None, "communication": None, "timeliness": None
                }
            },
            "message": "No peer evaluations received yet."
        }), 200

    try:
        res = client.table("peer_feedback").select(
            "participation_score,responsibility_score,quality_score,"
            "collaboration_score,communication_score,timeliness_score"
        ).eq("project_id", project_id).eq("reviewee_id", user_id).execute()

        reviews = res.data or []
        total = len(reviews)

        if total == 0:
            return jsonify({
                "success": True,
                "data": {
                    "total_reviews": 0,
                    "average_rating": None,
                    "categories": {
                        "participation": None, "responsibility": None, "quality": None,
                        "collaboration": None, "communication": None, "timeliness": None
                    }
                },
                "message": "No peer evaluations received yet."
            }), 200

        def _avg(key):
            vals = [r[key] for r in reviews if r.get(key) is not None]
            return round(sum(vals) / len(vals), 2) if vals else None

        cats = {
            "participation":  _avg("participation_score"),
            "responsibility": _avg("responsibility_score"),
            "quality":        _avg("quality_score"),
            "collaboration":  _avg("collaboration_score"),
            "communication":  _avg("communication_score"),
            "timeliness":     _avg("timeliness_score"),
        }
        all_vals = [v for v in cats.values() if v is not None]
        overall_avg = round(sum(all_vals) / len(all_vals), 2) if all_vals else None

        return jsonify({
            "success": True,
            "data": {
                "total_reviews": total,
                "average_rating": overall_avg,
                "categories": cats,
            },
            "message": "Anonymized peer feedback summary retrieved."
        }), 200

    except Exception as e:
        raise APIError(f"Failed to fetch feedback summary: {str(e)}", status_code=500)
