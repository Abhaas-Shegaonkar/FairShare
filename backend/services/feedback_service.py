"""
Peer Feedback Service (`services/feedback_service.py`)
Handles structured, 6-dimension teammate evaluations with anti-gaming protections (preventing self-reviews),
review completion tracking, and anonymized rating aggregation views.
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from services.project_service import require_project_membership, is_user_project_member
from services.activity_logger import log_activity, ACTION_FEEDBACK_GIVEN
from middleware.error_handler import APIError

logger = logging.getLogger(__name__)

# In-memory store for test/mock environments when Supabase is not configured
_MOCK_FEEDBACK_STORE: List[Dict[str, Any]] = [
    # Seed reviews from seed.sql
    {
        "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "reviewer_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
        "reviewee_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "participation_score": 5,
        "responsibility_score": 5,
        "quality_score": 5,
        "collaboration_score": 4,
        "communication_score": 4,
        "timeliness_score": 5,
        "comments": "Abhaas stepped up to coordinate the entire front-end and delivered all charts well before deadlines.",
        "submitted_at": "2026-09-25T10:00:00Z"
    },
    {
        "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "reviewer_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
        "reviewee_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "participation_score": 5,
        "responsibility_score": 4,
        "quality_score": 5,
        "collaboration_score": 5,
        "communication_score": 4,
        "timeliness_score": 4,
        "comments": "Great collaboration with the hardware team to integrate sensor payload fields smoothly.",
        "submitted_at": "2026-09-25T11:30:00Z"
    },
    {
        "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "reviewer_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "reviewee_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
        "participation_score": 4,
        "responsibility_score": 5,
        "quality_score": 5,
        "collaboration_score": 4,
        "communication_score": 4,
        "timeliness_score": 4,
        "comments": "Rohit designed rock-solid REST endpoints and documentation.",
        "submitted_at": "2026-09-25T14:00:00Z"
    },
    {
        "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "reviewer_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "reviewee_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
        "participation_score": 4,
        "responsibility_score": 4,
        "quality_score": 4,
        "collaboration_score": 3,
        "communication_score": 3,
        "timeliness_score": 3,
        "comments": "Solid electronics work, but communication in Discord was occasional.",
        "submitted_at": "2026-09-25T16:30:00Z"
    },
    {
        "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "reviewer_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "reviewee_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
        "participation_score": 3,
        "responsibility_score": 3,
        "quality_score": 4,
        "collaboration_score": 3,
        "communication_score": 4,
        "timeliness_score": 3,
        "comments": "Helpful writeup, but missed couple team sync meetings.",
        "submitted_at": "2026-09-25T18:00:00Z"
    }
]


def submit_peer_review(project_id: str, reviewer_id: str, data: dict) -> dict:
    """
    Submits a structured 6-dimension evaluation for a teammate.
    Enforces anti-gaming checks (blocks self-review) and project membership validation.
    """
    reviewee_id = data.get("reviewee_id")
    if not reviewee_id:
        raise APIError("Target teammate 'reviewee_id' is required.", code="MISSING_REVIEWEE_ID", status_code=400)

    # 1. Anti-Gaming Guard: Self-Review Check
    if reviewer_id == reviewee_id:
        raise APIError(
            "Students cannot submit peer evaluations for themselves.",
            code="CANNOT_SELF_REVIEW",
            status_code=400
        )

    # 2. Authorization Guard: Both must be project members
    require_project_membership(project_id, reviewer_id)
    if not is_user_project_member(project_id, reviewee_id):
        raise APIError(
            "Target student is not a registered member of this project.",
            code="NOT_A_PROJECT_MEMBER",
            status_code=400
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "project_id": project_id,
        "reviewer_id": reviewer_id,
        "reviewee_id": reviewee_id,
        "participation_score": int(data["participation_score"]),
        "responsibility_score": int(data["responsibility_score"]),
        "quality_score": int(data["quality_score"]),
        "collaboration_score": int(data["collaboration_score"]),
        "communication_score": int(data["communication_score"]),
        "timeliness_score": int(data["timeliness_score"]),
        "comments": data.get("comments", "").strip(),
        "submitted_at": now_iso
    }

    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Update or append in mock store
        existing_idx = None
        for idx, item in enumerate(_MOCK_FEEDBACK_STORE):
            if (
                item["project_id"] == project_id
                and item["reviewer_id"] == reviewer_id
                and item["reviewee_id"] == reviewee_id
            ):
                existing_idx = idx
                break

        if existing_idx is not None:
            _MOCK_FEEDBACK_STORE[existing_idx] = record
        else:
            _MOCK_FEEDBACK_STORE.append(record)

        # Log anonymous activity event
        log_activity(
            project_id=project_id,
            user_id=reviewer_id,
            action_type=ACTION_FEEDBACK_GIVEN,
            description="A team member submitted anonymous peer feedback."
        )

        return {
            "success": True,
            "message": "Feedback submitted successfully and anonymously."
        }

    try:
        # Upsert into peer_feedback table
        client.table("peer_feedback").upsert(
            record,
            on_conflict="project_id,reviewer_id,reviewee_id"
        ).execute()

        # Log activity anonymously (do not reveal scores or reviewer identity in public activity feed)
        log_activity(
            project_id=project_id,
            user_id=reviewer_id,
            action_type=ACTION_FEEDBACK_GIVEN,
            description="A team member submitted anonymous peer feedback."
        )

        return {
            "success": True,
            "message": "Feedback submitted successfully and anonymously."
        }
    except Exception as e:
        logger.error(f"Failed to persist peer feedback: {str(e)}")
        raise APIError(f"Database error while recording peer review: {str(e)}", status_code=500)


def get_peer_feedback_status(project_id: str, reviewer_id: str) -> dict:
    """
    Identifies which teammates the authenticated user has already evaluated in this project.
    """
    require_project_membership(project_id, reviewer_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        reviewed_ids = [
            item["reviewee_id"]
            for item in _MOCK_FEEDBACK_STORE
            if item["project_id"] == project_id and item["reviewer_id"] == reviewer_id
        ]
        return {
            "submitted_reviews_count": len(reviewed_ids),
            "reviewed_member_ids": reviewed_ids,
            "reviewed_members": reviewed_ids
        }

    try:
        res = (
            client.table("peer_feedback")
            .select("reviewee_id")
            .eq("project_id", project_id)
            .eq("reviewer_id", reviewer_id)
            .execute()
        )
        reviewed_ids = [r["reviewee_id"] for r in (res.data or [])]

        return {
            "submitted_reviews_count": len(reviewed_ids),
            "reviewed_member_ids": reviewed_ids,
            "reviewed_members": reviewed_ids
        }
    except Exception as e:
        logger.error(f"Failed to fetch feedback status: {str(e)}")
        raise APIError(f"Could not retrieve peer review status: {str(e)}", status_code=500)


def get_peer_feedback_summary(project_id: str, user_id: str) -> dict:
    """
    Returns anonymized, aggregated category averages for a team member.
    Direct reviewer identities and individual ratings are strictly stripped.
    """
    require_project_membership(project_id, user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Compute from mock store
        user_reviews = [
            item for item in _MOCK_FEEDBACK_STORE
            if item["project_id"] == project_id and item["reviewee_id"] == user_id
        ]

        if not user_reviews:
            return {
                "average_rating": 5.0,
                "total_reviews": 0,
                "categories": {
                    "participation": 5.0,
                    "responsibility": 5.0,
                    "quality": 5.0,
                    "collaboration": 5.0,
                    "communication": 5.0,
                    "timeliness": 5.0
                }
            }

        n = len(user_reviews)
        avg_part = round(sum(r["participation_score"] for r in user_reviews) / n, 2)
        avg_resp = round(sum(r["responsibility_score"] for r in user_reviews) / n, 2)
        avg_qual = round(sum(r["quality_score"] for r in user_reviews) / n, 2)
        avg_coll = round(sum(r["collaboration_score"] for r in user_reviews) / n, 2)
        avg_comm = round(sum(r["communication_score"] for r in user_reviews) / n, 2)
        avg_time = round(sum(r["timeliness_score"] for r in user_reviews) / n, 2)

        overall = round((avg_part + avg_resp + avg_qual + avg_coll + avg_comm + avg_time) / 6.0, 2)

        return {
            "average_rating": overall,
            "total_reviews": n,
            "categories": {
                "participation": avg_part,
                "responsibility": avg_resp,
                "quality": avg_qual,
                "collaboration": avg_coll,
                "communication": avg_comm,
                "timeliness": avg_time
            }
        }

    try:
        # Query v_peer_feedback_summary view
        res = (
            client.table("v_peer_feedback_summary")
            .select("*")
            .eq("project_id", project_id)
            .eq("reviewee_id", user_id)
            .execute()
        )
        if res.data and len(res.data) > 0:
            row = res.data[0]
            return {
                "average_rating": float(row.get("overall_peer_rating") or 5.0),
                "total_reviews": int(row.get("total_reviews") or 0),
                "categories": {
                    "participation": float(row.get("avg_participation") or 5.0),
                    "responsibility": float(row.get("avg_responsibility") or 5.0),
                    "quality": float(row.get("avg_quality") or 5.0),
                    "collaboration": float(row.get("avg_collaboration") or 5.0),
                    "communication": float(row.get("avg_communication") or 5.0),
                    "timeliness": float(row.get("avg_timeliness") or 5.0)
                }
            }

        # If view returned no rows, query peer_feedback table directly
        direct_res = client.table("peer_feedback").select(
            "participation_score, responsibility_score, quality_score, collaboration_score, communication_score, timeliness_score"
        ).eq("project_id", project_id).eq("reviewee_id", user_id).execute()

        rows = direct_res.data or []
        if not rows:
            return {
                "average_rating": 5.0,
                "total_reviews": 0,
                "categories": {
                    "participation": 5.0,
                    "responsibility": 5.0,
                    "quality": 5.0,
                    "collaboration": 5.0,
                    "communication": 5.0,
                    "timeliness": 5.0
                }
            }

        n = len(rows)
        avg_part = round(sum(r["participation_score"] for r in rows) / n, 2)
        avg_resp = round(sum(r["responsibility_score"] for r in rows) / n, 2)
        avg_qual = round(sum(r["quality_score"] for r in rows) / n, 2)
        avg_coll = round(sum(r["collaboration_score"] for r in rows) / n, 2)
        avg_comm = round(sum(r["communication_score"] for r in rows) / n, 2)
        avg_time = round(sum(r["timeliness_score"] for r in rows) / n, 2)
        overall = round((avg_part + avg_resp + avg_qual + avg_coll + avg_comm + avg_time) / 6.0, 2)

        return {
            "average_rating": overall,
            "total_reviews": n,
            "categories": {
                "participation": avg_part,
                "responsibility": avg_resp,
                "quality": avg_qual,
                "collaboration": avg_coll,
                "communication": avg_comm,
                "timeliness": avg_time
            }
        }

    except Exception as e:
        logger.error(f"Error fetching feedback summary: {str(e)}")
        raise APIError(f"Could not retrieve anonymized feedback summary: {str(e)}", status_code=500)
