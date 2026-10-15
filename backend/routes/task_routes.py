"""
Task Management Routes (`/api/projects/<id>/tasks` & `/api/tasks/<id>`)
Handles deliverable creation, task board queries, assignments, and workflow status transitions.
Protected by @require_auth.
"""
from flask import Blueprint, jsonify, request, g
from utils.validators import (
    validate_body,
    CreateTaskSchema,
    UpdateTaskSchema,
    UpdateTaskStatusSchema,
)
from middleware.auth_middleware import require_auth
from services.task_service import (
    list_project_tasks,
    create_task,
    update_task_details,
    update_task_status,
)

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
