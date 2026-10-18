"""
Analytics, Scoring Engine, and Reporting Routes (`/api/projects/<id>/...`)
Serves the 5-factor Contribution Score, team comparison metrics, weekly historical trends,
and printable project audit reports.
All endpoints require Bearer JWT authentication.
"""
from flask import Blueprint, jsonify, request, g
from middleware.auth_middleware import require_auth
from services.scoring_engine import (
    calculate_contribution,
    get_team_comparison,
    get_contribution_trends,
)
from services.project_service import require_project_membership

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/projects")


@analytics_bp.route("/<project_id>/contribution/<user_id>", methods=["GET"])
@require_auth
def get_member_contribution(project_id: str, user_id: str):
    """
    GET /api/projects/<project_id>/contribution/<user_id>
    Calculates and returns the full 5-factor contribution breakdown for a specific team member:
    - Task Completion (30%)
    - Timeliness (20%)
    - Work Evidence (20%)
    - Peer Feedback (20%)
    - Participation Activity (10%)
    Requires the requesting user to be a project member.
    """
    require_project_membership(project_id, g.current_user["id"])
    score_data = calculate_contribution(project_id, user_id)
    return jsonify({
        "success": True,
        "data": score_data,
        "message": "Contribution score calculated successfully."
    }), 200


@analytics_bp.route("/<project_id>/team-comparison", methods=["GET"])
@require_auth
def get_team_comparison_route(project_id: str):
    """
    GET /api/projects/<project_id>/team-comparison
    Retrieves the comparative contribution scores for all teammates in the project.
    Requires the requesting user to be a project member.
    """
    require_project_membership(project_id, g.current_user["id"])
    comparison = get_team_comparison(project_id)
    return jsonify({
        "success": True,
        "data": comparison,
        "message": "Team comparison scores calculated successfully."
    }), 200


@analytics_bp.route("/<project_id>/trends", methods=["GET"])
@require_auth
def get_contribution_trends_route(project_id: str):
    """
    GET /api/projects/<project_id>/trends
    Retrieves weekly time-series snapshot data powering the Recharts line visualization.
    Requires the requesting user to be a project member.
    """
    require_project_membership(project_id, g.current_user["id"])
    trends = get_contribution_trends(project_id)
    return jsonify({
        "success": True,
        "data": trends,
        "message": "Contribution trends retrieved successfully."
    }), 200


@analytics_bp.route("/<project_id>/report", methods=["GET"])
@require_auth
def get_final_report(project_id: str):
    """
    GET /api/projects/<project_id>/report
    Compiles the comprehensive, print-ready project audit report with individual metrics
    and verifiable deliverable manifests.
    Requires the requesting user to be a project member.
    """
    from services.supabase_service import get_supabase_admin_client, get_supabase_client
    from datetime import date

    require_project_membership(project_id, g.current_user["id"])
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Demo fallback
        team = get_team_comparison(project_id)
        return jsonify({
            "success": True,
            "data": {
                "project": {
                    "name": "Smart Water Management System",
                    "category": "IoT & Full-Stack",
                    "duration": "2026-08-01 to 2026-09-30",
                    "total_tasks": 20,
                    "completed_tasks": 18,
                    "progress": "90%"
                },
                "members": [
                    {
                        "name": m["name"],
                        "role": m["role"],
                        "overall_score": m["score"],
                    }
                    for m in team
                ]
            },
            "message": "Final contribution audit report compiled successfully."
        }), 200

    try:
        proj_res = client.table("projects").select("*").eq("id", project_id).execute()
        project = proj_res.data[0] if proj_res.data else {}

        tasks_res = client.table("tasks").select("id, status").eq("project_id", project_id).execute()
        tasks = tasks_res.data or []
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get("status") == "Completed")
        progress = f"{round((completed_tasks / total_tasks * 100))}%" if total_tasks > 0 else "0%"

        # Per-member detailed report
        members_res = client.table("project_members").select(
            "user_id, role, users(id, name)"
        ).eq("project_id", project_id).execute()

        report_members = []
        for m in (members_res.data or []):
            u = m.get("users") or {}
            uid = u.get("id") or m.get("user_id")
            score_data = calculate_contribution(project_id, uid)
            bd = score_data.get("breakdown", {})
            report_members.append({
                "name": u.get("name", "Unknown"),
                "role": m.get("role", "Member"),
                "overall_score": score_data["overall_score"],
                "task_completion_rate": f"{bd.get('task_completion', {}).get('score', 0):.0f}%",
                "timeliness_rate": f"{bd.get('timeliness', {}).get('score', 0):.0f}%",
                "evidence_rate": f"{bd.get('work_evidence', {}).get('score', 0):.0f}%",
                "peer_rating": f"{bd.get('peer_feedback', {}).get('score', 0) / 20:.2f} / 5.0",
            })

        deadline_str = project.get("deadline", "")
        start_str = project.get("start_date", "")
        duration = f"{start_str} to {deadline_str}" if start_str and deadline_str else "N/A"

        return jsonify({
            "success": True,
            "data": {
                "project": {
                    "name": project.get("name", ""),
                    "category": project.get("category", ""),
                    "duration": duration,
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                    "progress": progress,
                },
                "members": report_members,
            },
            "message": "Final contribution audit report compiled successfully."
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": {"code": "REPORT_ERROR", "message": str(e), "details": None}
        }), 500
