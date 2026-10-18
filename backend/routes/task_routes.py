"""
Task Management Routes (`/api/projects/<id>/tasks` & `/api/tasks/<id>`)
Handles deliverable creation, task board queries, assignments, workflow status transitions,
and upcoming deadline summaries.
Protected by @require_auth.
"""
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g
from utils.validators import (
    validate_body,
    CreateTaskSchema,
    UpdateTaskSchema,
    UpdateTaskStatusSchema,
)
from middleware.auth_middleware import require_auth
from middleware.error_handler import APIError
from services.task_service import (
    list_project_tasks,
    create_task,
    update_task_details,
    update_task_status,
)
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from services.project_service import list_user_projects

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api")


@tasks_bp.route("/projects/<project_id>/tasks", methods=["GET"])
@require_auth
def list_project_tasks_route(project_id: str):
    """
    GET /api/projects/<project_id>/tasks
    Lists all tasks for a project, with optional filtering by ?status=Completed or ?assignee=uuid.
    """
    user_id = g.current_user["id"]
    status_filter = request.args.get("status")
    assignee_filter = request.args.get("assignee")

    tasks = list_project_tasks(
        project_id=project_id,
        user_id=user_id,
        status_filter=status_filter,
        assignee_filter=assignee_filter
    )
    return jsonify({
        "success": True,
        "data": tasks
    }), 200


@tasks_bp.route("/projects/<project_id>/tasks", methods=["POST"])
@require_auth
@validate_body(CreateTaskSchema)
def create_task_route(project_id: str, validated_data: CreateTaskSchema):
    """
    POST /api/projects/<project_id>/tasks
    Creates a new deliverable task in the project workspace with deadline and priority.
    """
    user_id = g.current_user["id"]
    user_name = g.current_user.get("name", "Student")
    payload = validated_data.model_dump()

    task = create_task(
        project_id=project_id,
        creator_user_id=user_id,
        creator_name=user_name,
        data=payload
    )
    return jsonify({
        "success": True,
        "data": task,
        "message": f"Task '{task.get('title')}' created successfully."
    }), 201


@tasks_bp.route("/tasks/<task_id>", methods=["PUT"])
@require_auth
@validate_body(UpdateTaskSchema)
def update_task_route(task_id: str, validated_data: UpdateTaskSchema):
    """
    PUT /api/tasks/<task_id>
    Updates task metadata, reassigns teammates, or changes priority.
    """
    user_id = g.current_user["id"]
    payload = validated_data.model_dump(exclude_unset=True)

    updated = update_task_details(task_id=task_id, user_id=user_id, data=payload)
    return jsonify({
        "success": True,
        "data": updated,
        "message": "Task updated successfully."
    }), 200


@tasks_bp.route("/tasks/<task_id>/status", methods=["PATCH"])
@require_auth
@validate_body(UpdateTaskStatusSchema)
def update_task_status_route(task_id: str, validated_data: UpdateTaskStatusSchema):
    """
    PATCH /api/tasks/<task_id>/status
    Transitions task workflow state. When marked 'Completed', automatically captures
    server clock timestamp and actor to enforce timeliness calculations.
    """
    user_id = g.current_user["id"]
    user_name = g.current_user.get("name", "Student")

    result = update_task_status(
        task_id=task_id,
        user_id=user_id,
        user_name=user_name,
        new_status=validated_data.status
    )
    return jsonify({
        "success": True,
        "data": result,
        "message": f"Task status updated to '{validated_data.status}'."
    }), 200


@tasks_bp.route("/deadlines", methods=["GET"])
@require_auth
def get_upcoming_deadlines():
    """
    GET /api/deadlines
    Returns tasks with approaching deadlines across all projects the authenticated user belongs to.
    Optionally filtered by ?days=<N> (default: 14 days ahead).
    """
    user_id = g.current_user["id"]
    days_ahead = int(request.args.get("days", 14))
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Demo fallback — matches MOCK_UPCOMING_DEADLINES in frontend
        return jsonify({
            "success": True,
            "data": [
                {
                    "id": "task-004",
                    "title": "End-to-End Cypress Integration Tests",
                    "project_name": "Smart Water Management System",
                    "due_date": "2026-10-18",
                    "priority": "High",
                    "status": "In Progress",
                },
                {
                    "id": "task-005",
                    "title": "Final Capstone Presentation Deck",
                    "project_name": "Smart Water Management System",
                    "due_date": "2026-10-25",
                    "priority": "High",
                    "status": "To Do",
                },
            ]
        }), 200

    try:
        now = datetime.now(timezone.utc)
        # Get all projects user belongs to
        memberships_res = client.table("project_members").select("project_id").eq("user_id", user_id).execute()
        project_ids = [m["project_id"] for m in (memberships_res.data or [])]

        if not project_ids:
            return jsonify({"success": True, "data": []}), 200

        # Fetch all open tasks in those projects
        tasks_res = client.table("tasks").select(
            "id, title, deadline, priority, status, project_id, projects(name)"
        ).in_("project_id", project_ids).neq("status", "Completed").execute()

        tasks = tasks_res.data or []
        upcoming = []

        for t in tasks:
            deadline = t.get("deadline")
            if not deadline:
                continue
            try:
                d_dt = datetime.fromisoformat(str(deadline).replace("Z", "+00:00"))
                delta = (d_dt - now).total_seconds()
                if 0 <= delta <= days_ahead * 86400:
                    proj = t.get("projects") or {}
                    upcoming.append({
                        "id": t["id"],
                        "title": t["title"],
                        "project_name": proj.get("name", ""),
                        "due_date": str(deadline)[:10],
                        "priority": t.get("priority", "Medium"),
                        "status": t.get("status", "To Do"),
                    })
            except Exception:
                continue

        # Sort by due date ascending
        upcoming.sort(key=lambda x: x["due_date"])
        return jsonify({"success": True, "data": upcoming}), 200

    except Exception as e:
        raise APIError(f"Failed to fetch upcoming deadlines: {str(e)}", status_code=500)
