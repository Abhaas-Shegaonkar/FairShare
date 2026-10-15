"""
Task Management Routes (`/api/projects/<id>/tasks` & `/api/tasks/<id>`)
Handles deliverable creation, task board queries, assignments, and workflow status transitions.
"""
from flask import Blueprint, jsonify, request
from utils.validators import (
    validate_body,
    CreateTaskSchema,
    UpdateTaskSchema,
    UpdateTaskStatusSchema,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api")


@tasks_bp.route("/projects/<project_id>/tasks", methods=["GET"])
def list_project_tasks(project_id: str):
    """
    GET /api/projects/<project_id>/tasks
    Lists all tasks for a project, with optional filtering by status or assignee.
    """
    return jsonify({
        "success": True,
        "data": [],
        "message": "Tasks listing endpoint ready."
    }), 200


@tasks_bp.route("/projects/<project_id>/tasks", methods=["POST"])
@validate_body(CreateTaskSchema)
def create_task(project_id: str, validated_data: CreateTaskSchema):
    """
    POST /api/projects/<project_id>/tasks
    Creates a new task in the project workspace with deadline and priority.
    """
    return jsonify({
        "success": True,
        "data": {
            "task": {
                "id": "placeholder-task-id",
                "project_id": project_id,
                "title": validated_data.title,
                "description": validated_data.description,
                "deadline": validated_data.deadline,
                "priority": validated_data.priority,
                "status": "To Do",
                "assigned_to": validated_data.assigned_to
            }
        },
        "message": "Task creation endpoint ready."
    }), 201


@tasks_bp.route("/tasks/<task_id>", methods=["PUT"])
@validate_body(UpdateTaskSchema)
def update_task(task_id: str, validated_data: UpdateTaskSchema):
    """
    PUT /api/tasks/<task_id>
    Updates task metadata, reassigns teammates, or changes priority.
    """
    return jsonify({
        "success": True,
        "data": {
            "task": {
                "id": task_id,
                "title": validated_data.title
            }
        },
        "message": "Task update endpoint ready."
    }), 200


@tasks_bp.route("/tasks/<task_id>/status", methods=["PATCH"])
@validate_body(UpdateTaskStatusSchema)
def update_task_status(task_id: str, validated_data: UpdateTaskStatusSchema):
    """
    PATCH /api/tasks/<task_id>/status
    Transitions task workflow state. When marked 'Completed', automatically captures
    the server clock timestamp and actor to enforce timeliness calculations.
    """
    return jsonify({
        "success": True,
        "data": {
            "task": {
                "id": task_id,
                "status": validated_data.status
            }
        },
        "message": "Task status transition endpoint ready."
    }), 200
