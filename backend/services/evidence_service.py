"""
Work Evidence and File Storage Service
Manages artifact submissions, file uploads to Supabase Storage, and Evidence Vault queries.
"""
import logging
from datetime import datetime, timezone
from typing import List, Optional
from config import Config
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from services.project_service import require_project_membership
from services.activity_logger import log_activity, ACTION_EVIDENCE_SUBMITTED
from utils.file_security import validate_file_upload, sanitize_filename
from middleware.error_handler import NotFoundError, ForbiddenError, APIError

logger = logging.getLogger(__name__)


def upload_evidence_file(project_id: str, user_id: str, file_obj) -> dict:
    """
    Validates and stores an evidence file in the Supabase Storage bucket (`evidence_files`).
    Enforces MIME type whitelisting, extension validation, and maximum 10MB file size.
    """
    require_project_membership(project_id, user_id)

    is_valid, error_info, sanitized_name = validate_file_upload(file_obj)
    if not is_valid:
        raise APIError(
            message=error_info.get("message", "File upload failed validation."),
            code=error_info.get("code", "INVALID_FILE"),
            status_code=400
        )

    client = get_supabase_admin_client() or get_supabase_client()
    file_bytes = file_obj.read()
    file_size = len(file_bytes)
    content_type = getattr(file_obj, "content_type", "application/octet-stream")

    # Generate isolated storage path: projects/{project_id}/{timestamp}_{filename}
    timestamp_prefix = int(datetime.now(timezone.utc).timestamp())
    storage_path = f"projects/{project_id}/{timestamp_prefix}_{sanitized_name}"

    if not client:
        # Dev fallback URL
        public_url = f"https://mock-supabase.fairshare.local/storage/v1/object/public/{Config.UPLOAD_BUCKET}/{storage_path}"
        return {
            "url": public_url,
            "file_name": sanitized_name,
            "file_size": file_size,
            "mime_type": content_type
        }

    try:
        bucket = Config.UPLOAD_BUCKET
        upload_res = client.storage.from_(bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )

        # Retrieve public URL
        public_url_res = client.storage.from_(bucket).get_public_url(storage_path)
        public_url = public_url_res if isinstance(public_url_res, str) else public_url_res.get("publicURL", "")

        return {
            "url": public_url,
            "file_name": sanitized_name,
            "file_size": file_size,
            "mime_type": content_type
        }
    except Exception as e:
        logger.error(f"Failed to upload artifact to Supabase Storage: {str(e)}")
        raise APIError(f"Storage upload failed: {str(e)}", status_code=500)


def attach_evidence_to_task(
    task_id: str,
    user_id: str,
    user_name: str,
    data: dict
) -> dict:
    """
    Attaches verifiable proof (GitHub PR, Figma link, Doc, or uploaded file) to a deliverable.
    Automatically generates an immutable activity log.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not client:
        return {
            "evidence_id": "placeholder-ev-id",
            "task_id": task_id,
            "title": data["title"],
            "type": data["type"],
            "url": data["url"],
            "submitted_at": now_iso
        }

    try:
        # 1. Fetch task to get project_id and title
        t_res = client.table("tasks").select("id, title, project_id").eq("id", task_id).execute()
        if not t_res.data or len(t_res.data) == 0:
            raise NotFoundError("Deliverable task not found.", code="TASK_NOT_FOUND")

        task = t_res.data[0]
        project_id = task["project_id"]
        require_project_membership(project_id, user_id)

        # 2. Insert into evidence table
        insert_payload = {
            "task_id": task_id,
            "user_id": user_id,
            "type": data["type"],
            "title": data["title"],
            "url": data["url"],
            "notes": data.get("notes", ""),
            "submitted_at": now_iso
        }
        res = client.table("evidence").insert(insert_payload).execute()
        if not res.data:
            raise APIError("Failed to record evidence artifact.", status_code=500)

        evidence = res.data[0]

        # 3. Log event into activity_logs
        log_activity(
            project_id=project_id,
            user_id=user_id,
            action_type=ACTION_EVIDENCE_SUBMITTED,
            description=f"{user_name} attached evidence '{data['title']}' to task '{task['title']}'."
        )

        return {
            "evidence_id": evidence["id"],
            "task_id": task_id,
            "title": evidence["title"],
            "type": evidence["type"],
            "url": evidence["url"],
            "submitted_at": evidence["submitted_at"]
        }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error attaching evidence: {str(e)}")
        raise APIError(f"Failed to record evidence: {str(e)}", status_code=500)


def get_task_evidence(task_id: str, user_id: str) -> List[dict]:
    """
    Retrieves all attached proof artifacts for a specific deliverable.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return []

    try:
        # Verify task and membership
        t_res = client.table("tasks").select("project_id").eq("id", task_id).execute()
        if not t_res.data:
            raise NotFoundError("Deliverable task not found.", code="TASK_NOT_FOUND")

        project_id = t_res.data[0]["project_id"]
        require_project_membership(project_id, user_id)

        res = client.table("evidence").select(
            "id, type, title, url, notes, submitted_at, users:user_id(id, name, avatar_url)"
        ).eq("task_id", task_id).order("submitted_at", desc=True).execute()

        return res.data or []
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error fetching task evidence: {str(e)}")
        raise APIError(f"Failed to fetch evidence: {str(e)}", status_code=500)


def get_project_evidence_vault(
    project_id: str,
    user_id: str,
    type_filter: Optional[str] = None,
    member_filter: Optional[str] = None
) -> List[dict]:
    """
    Retrieves the complete evidence manifest across all deliverables in a project workspace,
    supporting filtering by artifact type and submitter.
    """
    require_project_membership(project_id, user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Reference demo evidence manifest
        return [
            {
                "id": "50000000-0000-0000-0000-000000000001",
                "task_title": "Interactive Sensor Telemetry Dashboard",
                "member_name": "Abhaas",
                "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
                "type": "github",
                "title": "PR #24: Live Recharts telemetry dashboard with WebSocket streaming",
                "url": "https://github.com/campus-iot/water-system/pull/24",
                "submitted_at": "2026-08-14T16:30:00Z"
            },
            {
                "id": "50000000-0000-0000-0000-000000000002",
                "task_title": "Tank Capacity Visualizer Component",
                "member_name": "Abhaas",
                "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
                "type": "figma",
                "title": "Figma Canvas: Tank capacity widgets and alert color tokens",
                "url": "https://www.figma.com/design/sample-water-ui",
                "submitted_at": "2026-08-21T14:15:00Z"
            },
            {
                "id": "50000000-0000-0000-0000-000000000003",
                "task_title": "Sensor Ingestion Timescale Pipeline",
                "member_name": "Rohit",
                "user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
                "type": "github",
                "title": "PR #12: Async MQTT broker to PostgreSQL ingestion pipeline",
                "url": "https://github.com/campus-iot/water-system/pull/12",
                "submitted_at": "2026-08-15T19:20:00Z"
            }
        ]

    try:
        # Get tasks in project
        tasks_res = client.table("tasks").select("id, title").eq("project_id", project_id).execute()
        tasks_map = {t["id"]: t["title"] for t in (tasks_res.data or [])}

        if not tasks_map:
            return []

        task_ids = list(tasks_map.keys())
        query = client.table("evidence").select(
            "id, task_id, user_id, type, title, url, notes, submitted_at, users:user_id(id, name, avatar_url)"
        ).in_("task_id", task_ids).order("submitted_at", desc=True)

        if type_filter:
            query = query.eq("type", type_filter)
        if member_filter:
            query = query.eq("user_id", member_filter)

        res = query.execute()
        raw_evidence = res.data or []

        vault_items = []
        for ev in raw_evidence:
            u = ev.get("users") or {}
            t_id = ev.get("task_id")
            vault_items.append({
                "id": ev["id"],
                "task_id": t_id,
                "task_title": tasks_map.get(t_id, "Deliverable"),
                "member_name": u.get("name", "Student"),
                "user_id": ev.get("user_id"),
                "type": ev["type"],
                "title": ev["title"],
                "url": ev["url"],
                "notes": ev.get("notes"),
                "submitted_at": ev["submitted_at"]
            })

        return vault_items
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error fetching project evidence vault: {str(e)}")
        raise APIError(f"Failed to fetch evidence vault: {str(e)}", status_code=500)
