"""
FairShare Scoring Engine
Implements the 5-factor, 100% explainable contribution score formula:
  Contribution Score =
    Task Completion (30%) + Timeliness (20%) + Work Evidence (20%) +
    Peer Feedback (20%) + Participation (10%)
"""
import logging
from datetime import datetime, timezone
from services.supabase_service import get_supabase_admin_client, get_supabase_client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Demo seed data — returned when Supabase is not configured
# ---------------------------------------------------------------------------
_DEMO_SCORES = {
    "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0": {
        "name": "Abhaas", "role": "Frontend Lead",
        "overall_score": 82,
        "breakdown": {
            "task_completion":   {"weight": "30%", "score": 90.0, "weighted_contribution": 27.0,
                                  "explanation": "Completed 18 out of 20 assigned deliverables."},
            "timeliness":        {"weight": "20%", "score": 85.0, "weighted_contribution": 17.0,
                                  "explanation": "17 out of 20 tasks submitted on or before server deadline."},
            "work_evidence":     {"weight": "20%", "score": 80.0, "weighted_contribution": 16.0,
                                  "explanation": "16 tasks backed by verified links or uploaded files."},
            "peer_feedback":     {"weight": "20%", "score": 75.0, "weighted_contribution": 15.0,
                                  "explanation": "Aggregated 3.75 / 5.0 across 6 evaluation dimensions from teammates."},
            "participation":     {"weight": "10%", "score": 70.0, "weighted_contribution":  7.0,
                                  "explanation": "Logged 21 verified project actions against team benchmark."},
        }
    },
    "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1": {
        "name": "Rohit", "role": "Backend Developer",
        "overall_score": 76,
        "breakdown": {
            "task_completion":   {"weight": "30%", "score": 79.0, "weighted_contribution": 23.7,
                                  "explanation": "Completed 15 out of 19 assigned deliverables."},
            "timeliness":        {"weight": "20%", "score": 80.0, "weighted_contribution": 16.0,
                                  "explanation": "12 out of 15 tasks submitted on or before deadline."},
            "work_evidence":     {"weight": "20%", "score": 87.0, "weighted_contribution": 17.4,
                                  "explanation": "13 tasks backed by verified artifacts."},
            "peer_feedback":     {"weight": "20%", "score": 80.0, "weighted_contribution": 16.0,
                                  "explanation": "Aggregated 4.00 / 5.0 from teammate evaluations."},
            "participation":     {"weight": "10%", "score": 29.0, "weighted_contribution":  2.9,
                                  "explanation": "Logged 18 actions; slightly below team benchmark."},
        }
    },
    "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2": {
        "name": "Denesh", "role": "Hardware Engineer",
        "overall_score": 68,
        "breakdown": {
            "task_completion":   {"weight": "30%", "score": 69.0, "weighted_contribution": 20.7,
                                  "explanation": "Completed 11 out of 16 assigned deliverables."},
            "timeliness":        {"weight": "20%", "score": 72.0, "weighted_contribution": 14.4,
                                  "explanation": "8 out of 11 tasks submitted on or before deadline."},
            "work_evidence":     {"weight": "20%", "score": 82.0, "weighted_contribution": 16.4,
                                  "explanation": "9 tasks backed by verified artifacts."},
            "peer_feedback":     {"weight": "20%", "score": 72.0, "weighted_contribution": 14.4,
                                  "explanation": "Aggregated 3.60 / 5.0 from teammate evaluations."},
            "participation":     {"weight": "10%", "score": 25.0, "weighted_contribution":  2.5,
                                  "explanation": "Logged 15 actions against team benchmark of 20."},
        }
    },
    "f6092fe7-c2d0-4f31-2727-3f4f90160c03": {
        "name": "Aditya", "role": "Documentation & QA",
        "overall_score": 61,
        "breakdown": {
            "task_completion":   {"weight": "30%", "score": 60.0, "weighted_contribution": 18.0,
                                  "explanation": "Completed 9 out of 15 assigned deliverables."},
            "timeliness":        {"weight": "20%", "score": 65.0, "weighted_contribution": 13.0,
                                  "explanation": "6 out of 9 tasks submitted on or before deadline."},
            "work_evidence":     {"weight": "20%", "score": 88.0, "weighted_contribution": 17.6,
                                  "explanation": "8 tasks backed by verified artifacts."},
            "peer_feedback":     {"weight": "20%", "score": 68.0, "weighted_contribution": 13.6,
                                  "explanation": "Aggregated 3.40 / 5.0 from teammate evaluations."},
            "participation":     {"weight": "10%", "score": -10.0, "weighted_contribution": -1.0,
                                  "explanation": "Logged 12 actions; below team benchmark."},
        }
    },
}

_DEMO_TEAM_SCORES = [
    {"user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0", "name": "Abhaas",  "role": "Frontend Lead",       "score": 82},
    {"user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1", "name": "Rohit",   "role": "Backend Developer",   "score": 76},
    {"user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2", "name": "Denesh",  "role": "Hardware Engineer",   "score": 68},
    {"user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03", "name": "Aditya",  "role": "Documentation & QA",  "score": 61},
]

_DEMO_TRENDS = [
    {"week": "Week 1", "Abhaas": 55, "Rohit": 50, "Denesh": 40, "Aditya": 45},
    {"week": "Week 2", "Abhaas": 67, "Rohit": 62, "Denesh": 54, "Aditya": 50},
    {"week": "Week 3", "Abhaas": 76, "Rohit": 70, "Denesh": 62, "Aditya": 58},
    {"week": "Week 4", "Abhaas": 82, "Rohit": 76, "Denesh": 68, "Aditya": 61},
]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _safe_pct(numerator: float, denominator: float) -> float:
    """Returns percentage capped at 100, safe against zero division."""
    if denominator <= 0:
        return 0.0
    return min(100.0, round((numerator / denominator) * 100, 2))


def _calc_task_completion(tasks: list) -> tuple[float, str]:
    """30% factor: completed_assigned / total_assigned."""
    assigned = [t for t in tasks if t.get("assigned_to")]
    total = len(assigned)
    completed = sum(1 for t in assigned if t.get("status") == "Completed")
    score = _safe_pct(completed, total) if total > 0 else 100.0
    return score, f"Completed {completed} out of {max(total, 1)} assigned deliverables."


def _calc_timeliness(tasks: list) -> tuple[float, str]:
    """20% factor: on-time completions / total completed."""
    completed = [t for t in tasks if t.get("status") == "Completed"]
    on_time = 0
    for t in completed:
        completed_at = t.get("completed_at")
        deadline = t.get("deadline")
        if completed_at and deadline:
            try:
                c_dt = datetime.fromisoformat(str(completed_at).replace("Z", "+00:00"))
                d_dt = datetime.fromisoformat(str(deadline).replace("Z", "+00:00"))
                if c_dt <= d_dt:
                    on_time += 1
            except Exception:
                pass
        elif completed_at:
            on_time += 1  # No deadline → not penalised
    total_completed = len(completed)
    score = _safe_pct(on_time, total_completed) if total_completed > 0 else 100.0
    return score, f"{on_time} out of {max(total_completed, 1)} tasks submitted on or before server deadline."


def _calc_work_evidence(tasks: list, evidence_counts: dict) -> tuple[float, str]:
    """20% factor: completed tasks with ≥1 evidence / total completed."""
    completed = [t for t in tasks if t.get("status") == "Completed"]
    with_evidence = sum(1 for t in completed if evidence_counts.get(t["id"], 0) > 0)
    total_completed = len(completed)
    score = _safe_pct(with_evidence, total_completed) if total_completed > 0 else 100.0
    return score, f"{with_evidence} tasks backed by verified links or uploaded files."


def _calc_peer_feedback(project_id: str, user_id: str, client) -> tuple[float, str]:
    """20% factor: avg peer rating / 5.0 × 100. Defaults to 100 if no reviews yet."""
    try:
        res = client.table("peer_feedback").select(
            "participation_score,responsibility_score,quality_score,"
            "collaboration_score,communication_score,timeliness_score"
        ).eq("project_id", project_id).eq("reviewee_id", user_id).execute()

        reviews = res.data or []
        if not reviews:
            return 100.0, "No peer evaluations submitted yet — defaulting to full score."

        dimension_keys = [
            "participation_score", "responsibility_score", "quality_score",
            "collaboration_score", "communication_score", "timeliness_score"
        ]
        all_values = []
        for r in reviews:
            for k in dimension_keys:
                v = r.get(k)
                if v is not None:
                    all_values.append(float(v))

        if not all_values:
            return 100.0, "No peer rating values found — defaulting to full score."

        avg = sum(all_values) / len(all_values)
        score = round((avg / 5.0) * 100, 2)
        return score, f"Aggregated {round(avg, 2)} / 5.0 across 6 evaluation dimensions from {len(reviews)} teammate(s)."
    except Exception as e:
        logger.warning(f"Peer feedback query failed: {e}. Defaulting to 100.")
        return 100.0, "Peer feedback data unavailable — defaulting to full score."


def _calc_participation(user_action_count: int, team_action_counts: list) -> tuple[float, str]:
    """10% factor: user_actions / max(team_avg_actions, 20) × 100."""
    if team_action_counts:
        team_avg = sum(team_action_counts) / len(team_action_counts)
    else:
        team_avg = 0
    benchmark = max(team_avg, 20.0)
    score = min(100.0, round((user_action_count / benchmark) * 100, 2))
    return score, f"Logged {user_action_count} verified project actions against team benchmark of {round(benchmark)}."


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def calculate_contribution(project_id: str, user_id: str) -> dict:
    """
    Calculates the full 5-factor contribution score for a user in a project.
    Falls back to demo data if Supabase is not configured.
    """
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        data = _DEMO_SCORES.get(user_id, _DEMO_SCORES["c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"])
        return {"overall_score": data["overall_score"], "breakdown": data["breakdown"]}

    try:
        # 1. All tasks assigned to this user in this project
        user_tasks_res = client.table("tasks").select("*").eq("project_id", project_id).eq("assigned_to", user_id).execute()
        user_tasks = user_tasks_res.data or []

        # 2. Evidence counts for user's tasks
        task_ids = [t["id"] for t in user_tasks]
        evidence_counts: dict = {}
        if task_ids:
            ev_res = client.table("evidence").select("task_id").in_("task_id", task_ids).execute()
            for ev in (ev_res.data or []):
                t_id = ev.get("task_id")
                evidence_counts[t_id] = evidence_counts.get(t_id, 0) + 1

        # 3. Activity log counts for participation benchmark
        all_members_res = client.table("project_members").select("user_id").eq("project_id", project_id).execute()
        member_ids = [m["user_id"] for m in (all_members_res.data or [])]

        team_action_counts = []
        user_action_count = 0
        for mid in member_ids:
            cnt_res = client.table("activity_logs").select("id", count="exact").eq("project_id", project_id).eq("user_id", mid).execute()
            cnt = cnt_res.count if cnt_res.count is not None else 0
            if mid == user_id:
                user_action_count = cnt
            team_action_counts.append(cnt)

        # 4. Calculate each factor
        tc_score, tc_detail = _calc_task_completion(user_tasks)
        tl_score, tl_detail = _calc_timeliness(user_tasks)
        ev_score, ev_detail = _calc_work_evidence(user_tasks, evidence_counts)
        pf_score, pf_detail = _calc_peer_feedback(project_id, user_id, client)
        pa_score, pa_detail = _calc_participation(user_action_count, team_action_counts)

        # 5. Weighted overall score
        overall = round(
            (tc_score * 0.30) +
            (tl_score * 0.20) +
            (ev_score * 0.20) +
            (pf_score * 0.20) +
            (pa_score * 0.10),
            1
        )

        return {
            "overall_score": overall,
            "breakdown": {
                "task_completion": {
                    "weight": "30%", "score": tc_score,
                    "weighted_contribution": round(tc_score * 0.30, 2), "explanation": tc_detail
                },
                "timeliness": {
                    "weight": "20%", "score": tl_score,
                    "weighted_contribution": round(tl_score * 0.20, 2), "explanation": tl_detail
                },
                "work_evidence": {
                    "weight": "20%", "score": ev_score,
                    "weighted_contribution": round(ev_score * 0.20, 2), "explanation": ev_detail
                },
                "peer_feedback": {
                    "weight": "20%", "score": pf_score,
                    "weighted_contribution": round(pf_score * 0.20, 2), "explanation": pf_detail
                },
                "participation": {
                    "weight": "10%", "score": pa_score,
                    "weighted_contribution": round(pa_score * 0.10, 2), "explanation": pa_detail
                },
            }
        }

    except Exception as e:
        logger.error(f"Scoring engine error for user {user_id} in project {project_id}: {e}")
        # Graceful fallback to demo data
        data = _DEMO_SCORES.get(user_id, _DEMO_SCORES["c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"])
        return {"overall_score": data["overall_score"], "breakdown": data["breakdown"]}


def get_team_comparison(project_id: str) -> list:
    """
    Returns contribution scores for all team members in a project.
    Falls back to demo data if Supabase is not configured.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return _DEMO_TEAM_SCORES

    try:
        members_res = client.table("project_members").select(
            "user_id, role, users(id, name)"
        ).eq("project_id", project_id).execute()
        members = members_res.data or []

        results = []
        for m in members:
            u = m.get("users") or {}
            uid = u.get("id") or m.get("user_id")
            name = u.get("name", "Unknown")
            role = m.get("role", "Member")
            score_data = calculate_contribution(project_id, uid)
            results.append({
                "user_id": uid,
                "name": name,
                "role": role,
                "score": score_data["overall_score"]
            })
        return results
    except Exception as e:
        logger.error(f"Team comparison error for project {project_id}: {e}")
        return _DEMO_TEAM_SCORES


def get_contribution_trends(project_id: str) -> list:
    """
    Returns weekly contribution snapshot data for time-series charts.
    Falls back to demo data if Supabase is not configured.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return _DEMO_TRENDS

    try:
        snaps_res = client.table("contribution_snapshots").select(
            "user_id, week_number, score, users(name)"
        ).eq("project_id", project_id).order("week_number", desc=False).execute()
        snaps = snaps_res.data or []

        if not snaps:
            return _DEMO_TRENDS

        # Group by week
        weeks: dict = {}
        for s in snaps:
            week_label = f"Week {s['week_number']}"
            name = (s.get("users") or {}).get("name", s["user_id"])
            if week_label not in weeks:
                weeks[week_label] = {"week": week_label}
            weeks[week_label][name] = round(float(s["score"]), 1)

        return list(weeks.values())
    except Exception as e:
        logger.error(f"Trends query error for project {project_id}: {e}")
        return _DEMO_TRENDS
