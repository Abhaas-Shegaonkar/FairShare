"""
Task Management Service
Handles deliverable creation, task board queries, workflow status transitions,
and automatic server-clock timeliness calculation.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from services.project_service import require_project_membership
from middleware.error_handler import NotFoundError, ForbiddenError, APIError

logger = logging.getLogger(__name__)


def list_project_tasks(
    project_id: str,
    user_id: str,
    status_filter: Optional[str] = None,
    assignee_filter: Optional[str] = None
) -> List[dict]:
    """
    Retrieves all tasks for a project with assigned user details, completion status,
    and attached work evidence counts.
    """
    require_project_membership(project_id, user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Mock demo dataset fallback
        return [
            {
                "id": "10000000-0000-0000-0000-000000000001",
                "title": "Interactive Sensor Telemetry Dashboard",
                "description": "Develop live charts for water flow rates and pressure readings.",
                "deadline": "2026-08-15T18:00:00Z",
                "priority": "High",
                "status": "Completed",
                "assigned_to": {"id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0", "name": "Abhaas"},
                "completed_by": {"id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0", "name": "Abhaas"},
                "completed_at": "2026-08-14T16:30:00Z",
                "is_on_time": True,
                "evidence_count": 1,
                "has_evidence": True
            }
        ]

    try:
        query = client.table("tasks").select(
            "*, assigned_user:assigned_to(id, name, avatar_url), completed_user:completed_by(id, name, avatar_url)"
        ).eq("project_id", project_id).order("deadline", desc=False)

        if status_filter:
            query = query.eq("status", status_filter)
        if assignee_filter:
            query = query.eq("assigned_to", assignee_filter)

        res = query.execute()
        tasks = res.data or []

        # Get evidence counts per task
        evidence_res = client.table("evidence").select("task_id").execute()
        evidence_counts = {}
        for ev in (evidence_res.data or []):
            t_id = ev.get("task_id")
            evidence_counts[t_id] = evidence_counts.get(t_id, 0) + 1

        formatted = []
        for t in tasks:
            t_id = t["id"]
            ev_count = evidence_counts.get(t_id, 0)
            completed_at = t.get("completed_at")
            deadline = t.get("deadline")

            is_on_time = None
            if completed_at and deadline:
                # Compare timestamps
                c_dt = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                d_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                is_on_time = c_dt <= d_dt

            formatted.append({
                "id": t_id,
                "title": t["title"],
                "description": t.get("description", ""),
                "deadline": deadline,
                "priority": t.get("priority", "Medium"),
                "status": t.get("status", "To Do"),
                "assigned_to": t.get("assigned_user"),
                "completed_by": t.get("completed_user"),
                "completed_at": completed_at,
                "is_on_time": is_on_time,
                "evidence_count": ev_count,
                "has_evidence": ev_count > 0,
                "created_at": t.get("created_at")
            })

        return formatted
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error listing tasks: {str(e)}")
        raise APIError(f"Failed to fetch tasks: {str(e)}", status_code=500)


def create_task(project_id: str, creator_user_id: str, creator_name: str, data: dict) -> dict:
    """
    Creates a new task within a project workspace and records the activity.
    """
    require_project_membership(project_id, creator_user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    now_iso = datetime.now(timezone.utc).isoformat()
    if not client:
        return {
            "id": "placeholder-task-id",
            "title": data["title"],
            "status": "To Do",
            "created_at": now_iso
        }

    try:
        insert_payload = {
            "project_id": project_id,
            "title": data["title"],
            "description": data.get("description", ""),
            "priority": data.get("priority", "Medium"),
            "deadline": data.get("deadline") or now_iso,
            "assigned_to": data.get("assigned_to"),
            "status": "To Do"
        }
        res = client.table("tasks").insert(insert_payload).execute()
        if not res.data:
            raise APIError("Failed to create task.", status_code=500)

        task = res.data[0]

        # Log activity
        client.table("activity_logs").insert({
            "project_id": project_id,
            "user_id": creator_user_id,
            "action_type": "TASK_CREATED",
            "description": f"{creator_name} created task '{task['title']}'."
        }).execute()

        return {
            "id": task["id"],
            "title": task["title"],
            "status": task["status"],
            "created_at": task["created_at"]
        }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise APIError(f"Failed to create task: {str(e)}", status_code=500)


def update_task_details(task_id: str, user_id: str, data: dict) -> dict:
    """
    Updates task title, description, priority, deadline, or assignee.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return {"id": task_id, "title": data.get("title", "Updated Task")}

    try:
        # Check task existence
        t_res = client.table("tasks").select("project_id").eq("id", task_id).execute()
        if not t_res.data or len(t_res.data) == 0:
            raise NotFoundError("Task not found.", code="TASK_NOT_FOUND")

        project_id = t_res.data[0]["project_id"]
        require_project_membership(project_id, user_id)

        update_fields = {}
        for k in ["title", "description", "priority", "deadline", "assigned_to", "status"]:
            if k in data and data[k] is not None:
                update_fields[k] = data[k]

        if not update_fields:
            return {"id": task_id}

        up_res = client.table("tasks").update(update_fields).eq("id", task_id).execute()
        return up_res.data[0] if up_res.data else {"id": task_id}
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        raise APIError(f"Failed to update task: {str(e)}", status_code=500)


def update_task_status(task_id: str, user_id: str, user_name: str, new_status: str) -> dict:
    """
    Transitions task workflow state. When marked 'Completed', server clock captures
    completed_at and records actor in completed_by to enforce timeliness metrics.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    if not client:
        return {
            "id": task_id,
            "status": new_status,
            "completed_by": user_id if new_status == "Completed" else None,
            "completed_at": now_iso if new_status == "Completed" else None,
            "is_on_time": True
        }

    try:
        t_res = client.table("tasks").select("*").eq("id", task_id).execute()
        if not t_res.data or len(t_res.data) == 0:
            raise NotFoundError("Task not found.", code="TASK_NOT_FOUND")

        task = t_res.data[0]
        project_id = task["project_id"]
        require_project_membership(project_id, user_id)

        update_data = {"status": new_status}
        is_on_time = None

        if new_status == "Completed":
            update_data["completed_at"] = now_iso
            update_data["completed_by"] = user_id

            deadline = task.get("deadline")
            if deadline:
                d_dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                is_on_time = now <= d_dt
            else:
                is_on_time = True

            # Log activity
            client.table("activity_logs").insert({
                "project_id": project_id,
                "user_id": user_id,
                "action_type": "TASK_COMPLETED",
                "description": f"{user_name} completed deliverable '{task['title']}'."
            }).execute()
        else:
            update_data["completed_at"] = None
            update_data["completed_by"] = None

        res = client.table("tasks").update(update_data).eq("id", task_id).execute()
        updated_task = res.data[0] if res.data else {}

        return {
            "id": task_id,
            "status": new_status,
            "completed_by": updated_task.get("completed_by"),
            "completed_at": updated_task.get("completed_at"),
            "is_on_time": is_on_time
        }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error updating task status: {str(e)}")
        raise APIError(f"Failed to update task status: {str(e)}", status_code=500)
