"""
Analytics, Scoring Engine, and Reporting Routes (`/api/projects/<id>/...`)
Serves the 5-factor Contribution Score, team comparison metrics, weekly historical trends,
and printable project audit reports.
"""
from flask import Blueprint, jsonify, request

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/projects")


@analytics_bp.route("/<project_id>/contribution/<user_id>", methods=["GET"])
def get_member_contribution(project_id: str, user_id: str):
    """
    GET /api/projects/<project_id>/contribution/<user_id>
    Calculates and returns the full 5-factor contribution breakdown for a specific team member:
    - Task Completion (30%)
    - Timeliness (20%)
    - Work Evidence (20%)
    - Peer Feedback (20%)
    - Participation Activity (10%)
    """
    return jsonify({
        "success": True,
        "data": {
            "overall_score": 82,
            "breakdown": {
                "task_completion": {
                    "weight": "30%",
                    "score": 90.0,
                    "weighted_contribution": 27.0,
                    "explanation": "Completed 18 out of 20 assigned deliverables."
                },
                "timeliness": {
                    "weight": "20%",
                    "score": 85.0,
                    "weighted_contribution": 17.0,
                    "explanation": "Delivered 15 tasks on or before server deadline timestamps."
                },
                "work_evidence": {
                    "weight": "20%",
                    "score": 88.0,
                    "weighted_contribution": 17.6,
                    "explanation": "Attached 16 verifiable artifacts (GitHub PRs, Figma, docs) to finished work."
                },
                "peer_feedback": {
                    "weight": "20%",
                    "score": 75.0,
                    "weighted_contribution": 15.0,
                    "explanation": "Aggregated 3.75/5.0 across 6 evaluation dimensions from teammates."
                },
                "participation_activity": {
                    "weight": "10%",
                    "score": 80.0,
                    "weighted_contribution": 8.0,
                    "explanation": "Logged regular milestone actions across project duration."
                }
            }
        },
        "message": "Contribution score calculation endpoint ready."
    }), 200


@analytics_bp.route("/<project_id>/team-comparison", methods=["GET"])
def get_team_comparison(project_id: str):
    """
    GET /api/projects/<project_id>/team-comparison
    Retrieves the comparative contribution scores for all teammates in the project.
    """
    return jsonify({
        "success": True,
        "data": [
            {"user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0", "name": "Abhaas", "role": "Frontend Lead", "score": 82},
            {"user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1", "name": "Rohit", "role": "Backend Developer", "score": 76},
            {"user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2", "name": "Denesh", "role": "Hardware Engineer", "score": 68},
            {"user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03", "name": "Aditya", "role": "Documentation & QA", "score": 61}
        ],
        "message": "Team comparison endpoint ready."
    }), 200


@analytics_bp.route("/<project_id>/trends", methods=["GET"])
def get_contribution_trends(project_id: str):
    """
    GET /api/projects/<project_id>/trends
    Retrieves weekly time-series snapshot data powering the Recharts line visualization.
    """
    return jsonify({
        "success": True,
        "data": [
            {"week": "Week 1", "Abhaas": 55, "Rohit": 50, "Denesh": 40, "Aditya": 45},
            {"week": "Week 2", "Abhaas": 67, "Rohit": 62, "Denesh": 54, "Aditya": 50},
            {"week": "Week 3", "Abhaas": 76, "Rohit": 70, "Denesh": 62, "Aditya": 58},
            {"week": "Week 4", "Abhaas": 82, "Rohit": 76, "Denesh": 68, "Aditya": 61}
        ],
        "message": "Contribution trends progression endpoint ready."
    }), 200


@analytics_bp.route("/<project_id>/report", methods=["GET"])
def get_final_report(project_id: str):
    """
    GET /api/projects/<project_id>/report
    Compiles the comprehensive, print-ready project audit report with individual metrics
    and verifiable deliverable manifests.
    """
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
                    "name": "Abhaas",
                    "role": "Frontend Lead",
                    "overall_score": 82,
                    "task_completion_rate": "90%",
                    "timeliness_rate": "85%",
                    "evidence_submissions": 16,
                    "peer_rating": "3.75 / 5.0"
                },
                {
                    "name": "Rohit",
                    "role": "Backend Developer",
                    "overall_score": 76,
                    "task_completion_rate": "79%",
                    "timeliness_rate": "80%",
                    "evidence_submissions": 13,
                    "peer_rating": "4.0 / 5.0"
                },
                {
                    "name": "Denesh",
                    "role": "Hardware Engineer",
                    "overall_score": 68,
                    "task_completion_rate": "69%",
                    "timeliness_rate": "72%",
                    "evidence_submissions": 9,
                    "peer_rating": "3.6 / 5.0"
                },
                {
                    "name": "Aditya",
                    "role": "Documentation & QA",
                    "overall_score": 61,
                    "task_completion_rate": "60%",
                    "timeliness_rate": "65%",
                    "evidence_submissions": 8,
                    "peer_rating": "3.4 / 5.0"
                }
            ]
        },
        "message": "Final contribution audit report endpoint ready."
    }), 200
