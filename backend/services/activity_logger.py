"""
Immutable Activity Logger Service
Records tamper-proof events into `activity_logs` whenever project milestones,
task completions, or evidence submissions occur. Provides chronological event streams.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from services.project_service import require_project_membership
from middleware.error_handler import APIError

logger = logging.getLogger(__name__)

# Standard action codes matching FairShare specification
ACTION_PROJECT_CREATED = "PROJECT_CREATED"
ACTION_MEMBER_JOINED = "MEMBER_JOINED"
ACTION_TASK_CREATED = "TASK_CREATED"
ACTION_TASK_UPDATED = "TASK_UPDATED"
ACTION_TASK_COMPLETED = "TASK_COMPLETED"
ACTION_EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
ACTION_FEEDBACK_GIVEN = "FEEDBACK_GIVEN"


def log_activity(
    project_id: str,
    user_id: Optional[str],
    action_type: str,
    description: str
) -> Optional[dict]:
    """
    Appends an immutable audit event to `activity_logs`.
    Uses server clock authority for exact timestamping.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not client:
        logger.info(f"[ActivityLog Mock] Project: {project_id} | Action: {action_type} | {description}")
        return {
            "id": "mock-activity-id",
            "project_id": project_id,
            "user_id": user_id,
            "action_type": action_type,
            "description": description,
            "timestamp": now_iso
        }

    try:
        payload = {
            "project_id": project_id,
            "user_id": user_id,
            "action_type": action_type,
            "description": description,
            "timestamp": now_iso
        }
        res = client.table("activity_logs").insert(payload).execute()
        return res.data[0] if res.data else payload
    except Exception as e:
        logger.error(f"Failed to append activity log: {str(e)}")
        # Do not fail user transactions if logging fails, but log the error
        return None


def get_project_activity_timeline(
    project_id: str,
    user_id: str,
    limit: int = 50
) -> List[dict]:
    """
    Retrieves the chronological audit stream for a project workspace.
    Enforces project membership authorization.
    """
    require_project_membership(project_id, user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Reference prototype sample activity timeline
        return [
            {
                "id": "mock-act-001",
                "action_type": "TASK_COMPLETED",
                "description": "Abhaas completed 'Interactive Sensor Telemetry Dashboard'.",
                "timestamp": "2026-08-14T16:30:00Z",
                "user": {"name": "Abhaas", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhaas"}
            },
            {
                "id": "mock-act-002",
                "action_type": "EVIDENCE_SUBMITTED",
                "description": "Abhaas attached PR #24 as work proof.",
                "timestamp": "2026-08-14T16:32:00Z",
                "user": {"name": "Abhaas", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhaas"}
            },
            {
                "id": "mock-act-003",
                "action_type": "TASK_COMPLETED",
                "description": "Rohit completed 'Sensor Ingestion Timescale Pipeline'.",
                "timestamp": "2026-08-15T19:20:00Z",
                "user": {"name": "Rohit", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit"}
            }
        ]

    try:
        res = client.table("activity_logs").select(
            "id, action_type, description, timestamp, users:user_id(id, name, avatar_url)"
        ).eq("project_id", project_id).order("timestamp", desc=True).limit(limit).execute()

        activities = []
        for row in (res.data or []):
            activities.append({
                "id": row.get("id"),
                "action_type": row.get("action_type"),
                "description": row.get("description"),
                "timestamp": row.get("timestamp"),
                "user": row.get("users")
            })

        return activities
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error fetching activity timeline: {str(e)}")
        raise APIError(f"Failed to fetch activity stream: {str(e)}", status_code=500)
