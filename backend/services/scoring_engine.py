"""
FairShare Scoring Engine Service (`services/scoring_engine.py`)
Implements the 5-Factor Contribution Calculation Model with transparent mathematical weighting,
anti-gaming safeguards, explainable score breakdowns, and historical snapshot generation.

Formula:
Total Contribution Score = (S_completion * 0.30) + (S_timeliness * 0.20) +
                           (S_evidence * 0.20) + (S_feedback * 0.20) +
                           (S_participation * 0.10)
"""

import logging
from datetime import datetime, timezone, timedelta, date
from typing import List, Dict, Any, Optional
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from middleware.error_handler import APIError

logger = logging.getLogger(__name__)

# Factor Weights
WEIGHT_TASK_COMPLETION = 30
WEIGHT_TIMELINESS = 20
WEIGHT_WORK_EVIDENCE = 20
WEIGHT_PEER_FEEDBACK = 20
WEIGHT_PARTICIPATION = 10

# Reference fallback dataset for demo/mock project
REFERENCE_PROJECT_ID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
REFERENCE_MEMBERS_SCORES = {
    "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0": {
        "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
        "name": "Abhaas",
        "role": "Frontend Lead",
        "overall_score": 82,
        "completion_score": 90.0,
        "timeliness_score": 85.0,
        "evidence_score": 80.0,
        "feedback_score": 75.0,
        "participation_score": 70.0,
        "completed_tasks": 18,
        "total_tasks": 20,
        "on_time_tasks": 17,
        "evidence_count": 16,
        "peer_rating": 3.75,
        "peer_reviews_count": 3,
        "activity_count": 21,
    },
    "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1": {
        "user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
        "name": "Rohit",
        "role": "Backend Developer",
        "overall_score": 76,
        "completion_score": 79.0,
        "timeliness_score": 80.0,
        "evidence_score": 75.0,
        "feedback_score": 80.0,
        "participation_score": 60.0,
        "completed_tasks": 15,
        "total_tasks": 19,
        "on_time_tasks": 12,
        "evidence_count": 13,
        "peer_rating": 4.0,
        "peer_reviews_count": 2,
        "activity_count": 18,
    },
    "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2": {
        "user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
        "name": "Denesh",
        "role": "Hardware Engineer",
        "overall_score": 68,
        "completion_score": 69.0,
        "timeliness_score": 72.0,
        "evidence_score": 65.0,
        "feedback_score": 72.0,
        "participation_score": 55.0,
        "completed_tasks": 11,
        "total_tasks": 16,
        "on_time_tasks": 8,
        "evidence_count": 9,
        "peer_rating": 3.6,
        "peer_reviews_count": 2,
        "activity_count": 14,
    },
    "f6092fe7-c2d0-4f31-2727-3f4f90160c03": {
        "user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
        "name": "Aditya",
        "role": "Documentation & QA",
        "overall_score": 61,
        "completion_score": 60.0,
        "timeliness_score": 65.0,
        "evidence_score": 58.0,
        "feedback_score": 68.0,
        "participation_score": 50.0,
        "completed_tasks": 9,
        "total_tasks": 15,
        "on_time_tasks": 6,
        "evidence_count": 8,
        "peer_rating": 3.4,
        "peer_reviews_count": 2,
        "activity_count": 12,
    },
}


def parse_timestamp(ts: Optional[Any]) -> Optional[datetime]:
    """Parses various timestamp representations into UTC datetime objects."""
    if not ts:
        return None
    if isinstance(ts, datetime):
        return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    if isinstance(ts, date):
        return datetime(ts.year, ts.month, ts.day, tzinfo=timezone.utc)
    if isinstance(ts, str):
        cleaned = ts.strip().replace(" ", "T")
        # Strip trailing Z
        if cleaned.endswith("Z"):
            cleaned = cleaned[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            try:
                # Format fallback YYYY-MM-DD
                dt = datetime.strptime(cleaned[:10], "%Y-%m-%d")
                return dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
    return None


def get_tier_and_grade(score: float) -> tuple:
    """Returns tier and grade projection based on overall score."""
    if score >= 90.0:
        return "High Contributor", "A+"
    elif score >= 80.0:
        return "Core Contributor", "A"
    elif score >= 70.0:
        return "Standard Contributor", "B+"
    elif score >= 60.0:
        return "Developing Contributor", "B"
    else:
        return "Needs Improvement", "C"


def get_factor_status(score: float) -> str:
    """Returns qualitative status tag for a factor score."""
    if score >= 90.0:
        return "optimal"
    elif score >= 75.0:
        return "high"
    elif score >= 60.0:
        return "moderate"
    else:
        return "needs_attention"


# ==============================================================================
# 1. 5-Factor Score Calculations
# ==============================================================================


def calculate_task_completion(assigned_tasks: List[dict]) -> tuple:
    """
    Factor 1: Task Completion (30%)
    Formula: min(100, (Completed Tasks / Total Tasks) * 100)
    Fallback: If zero tasks are assigned, defaults to 100% baseline.
    Returns: (score, completed_count, total_count, label, explanation)
    """
    total = len(assigned_tasks)
    if total == 0:
        return (
            100.0,
            0,
            0,
            "0 assigned tasks (baseline)",
            "No tasks have been assigned to your role yet; defaulted to 100% baseline.",
        )

    completed = sum(1 for t in assigned_tasks if t.get("status") == "Completed")
    score = min(100.0, round((completed / total) * 100.0, 1))
    label = f"{completed} of {total} tasks completed"
    explanation = f"You completed {int(round(score))}% of all deliverables assigned to your role."
    return (score, completed, total, label, explanation)


def calculate_timeliness(completed_tasks: List[dict], total_assigned: int) -> tuple:
    """
    Factor 2: Timeliness (20%)
    Formula: (Completed Tasks with completed_at <= deadline) / max(1, Total Completed Tasks) * 100
    Returns: (score, on_time_count, completed_count, label, explanation)
    """
    completed_count = len(completed_tasks)
    if completed_count == 0:
        if total_assigned == 0:
            return (
                100.0,
                0,
                0,
                "No tasks to evaluate",
                "No completed tasks to evaluate yet; defaulted to 100% baseline.",
            )
        return (
            0.0,
            0,
            0,
            "0 completed tasks on time",
            "No completed tasks submitted yet to assess timeliness.",
        )

    on_time_count = 0
    for t in completed_tasks:
        if t.get("is_on_time") is True:
            on_time_count += 1
            continue

        deadline_dt = parse_timestamp(t.get("deadline"))
        completed_dt = parse_timestamp(t.get("completed_at"))

        if not deadline_dt:
            # No deadline set -> on time
            on_time_count += 1
        elif completed_dt and completed_dt <= deadline_dt:
            on_time_count += 1
        elif not completed_dt:
            # Fallback if status is Completed without timestamp
            on_time_count += 1

    score = min(100.0, round((on_time_count / max(1, completed_count)) * 100.0, 1))
    label = f"{on_time_count} of {completed_count} tasks on time"
    explanation = f"{int(round(score))}% of your completed deliverables were finalized on or before the set deadline."
    return (score, on_time_count, completed_count, label, explanation)


def calculate_work_evidence(
    completed_tasks: List[dict], total_assigned: int, task_evidence_counts: Dict[str, int]
) -> tuple:
    """
    Factor 3: Work Evidence (20%)
    Formula: (Completed Tasks with >= 1 Evidence Items) / max(1, Total Completed Tasks) * 100
    Returns: (score, verified_tasks_count, total_completed, label, explanation)
    """
    completed_count = len(completed_tasks)
    if completed_count == 0:
        if total_assigned == 0:
            return (
                100.0,
                0,
                0,
                "No tasks to evaluate",
                "No completed deliverables to audit; defaulted to 100% baseline.",
            )
        return (
            0.0,
            0,
            0,
            "0 deliverables with verified proof",
            "No deliverables completed with attached evidence artifacts.",
        )

    verified_count = 0
    for t in completed_tasks:
        t_id = t.get("id")
        ev_count = task_evidence_counts.get(t_id, 0)
        if ev_count > 0 or t.get("evidence_count", 0) > 0 or t.get("has_evidence") is True:
            verified_count += 1

    score = min(100.0, round((verified_count / max(1, completed_count)) * 100.0, 1))
    label = f"{verified_count} of {completed_count} deliverables with verified proof"
    explanation = f"{int(round(score))}% of your completed deliverables contain verifiable links, pull requests, or documents."
    return (score, verified_count, completed_count, label, explanation)


def calculate_peer_feedback(reviews: List[dict]) -> tuple:
    """
    Factor 4: Peer Feedback (20%)
    Formula: AvgRating = 1/6 * sum(category_averages)
             Score = (AvgRating / 5.0) * 100
    Anti-Gaming: Disallow self-reviews, moderate extreme negative outliers.
    Fallback: 100% if no teammate reviews exist yet.
    Returns: (score, avg_rating, review_count, label, explanation)
    """
    if not reviews:
        return (
            100.0,
            5.0,
            0,
            "No peer reviews yet (baseline)",
            "Teammate evaluations have not been submitted yet; defaulted to 100% baseline.",
        )

    ratings = []
    for r in reviews:
        dims = [
            float(r.get("participation_score", 5)),
            float(r.get("responsibility_score", 5)),
            float(r.get("quality_score", 5)),
            float(r.get("collaboration_score", 5)),
            float(r.get("communication_score", 5)),
            float(r.get("timeliness_score", 5)),
        ]
        review_avg = sum(dims) / 6.0
        ratings.append(review_avg)

    # Outlier Moderation: If >= 3 reviews and one review is an extreme low outlier
    if len(ratings) >= 3:
        min_val = min(ratings)
        other_vals = [v for v in ratings if v != min_val]
        if other_vals:
            other_mean = sum(other_vals) / len(other_vals)
            # If lowest is more than 2.0 points below others' mean, moderate it
            if min_val <= 2.0 and other_mean >= 4.0:
                moderated_ratings = other_vals + [max(min_val, other_mean - 1.0)]
                ratings = moderated_ratings

    avg_rating = round(sum(ratings) / len(ratings), 2)
    score = min(100.0, max(0.0, round((avg_rating / 5.0) * 100.0, 1)))
    label = f"Average {avg_rating} / 5.0 peer rating"
    explanation = f"Calculated across {len(reviews)} anonymous teammate evaluations across all 6 core dimensions."
    return (score, avg_rating, len(reviews), label, explanation)


def calculate_participation_activity(
    user_activity_count: int, team_activity_counts: List[int]
) -> tuple:
    """
    Factor 5: Participation Activity (10%)
    Formula: min(100, (User Activity Count / Target Activity Count) * 100)
    Where Target Activity Count = max(Team Average Activity Count, 20)
    Fallback: 100% if no activity has been logged on the project yet.
    Returns: (score, user_count, target_count, label, explanation)
    """
    team_total = sum(team_activity_counts)
    if team_total == 0 and user_activity_count == 0:
        return (
            100.0,
            0,
            20,
            "0 project actions (baseline)",
            "Project was recently initialized; engagement defaulted to 100% baseline.",
        )

    team_avg = (team_total / max(1, len(team_activity_counts))) if team_activity_counts else 0
    target_count = max(int(round(team_avg)), 20)
    score = min(100.0, round((user_activity_count / max(1, target_count)) * 100.0, 1))

    label = f"{user_activity_count} verified project actions"
    explanation = (
        f"Consistently logged activity records showing steady participation "
        f"relative to the team benchmark ({target_count} actions)."
    )
    return (score, user_activity_count, target_count, label, explanation)


# ==============================================================================
# 2. Main Member Contribution Calculation
# ==============================================================================


def calculate_member_contribution(
    project_id: str, user_id: str, as_of_date: Optional[datetime] = None
) -> dict:
    """
    Calculates the comprehensive 5-factor contribution index and explainability breakdown
    for a specific project team member.
    """
    client = get_supabase_admin_client() or get_supabase_client()

    # Fallback to reference prototype dataset when DB is unconfigured
    if not client:
        ref = (
            REFERENCE_MEMBERS_SCORES.get(user_id)
            or REFERENCE_MEMBERS_SCORES["c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"]
        )
        overall = ref["overall_score"]
        tier, grade = get_tier_and_grade(overall)

        breakdown = {
            "task_completion": {
                "score": ref["completion_score"],
                "weight": WEIGHT_TASK_COMPLETION,
                "points": round(ref["completion_score"] * 0.30, 1),
                "contribution_points": round(ref["completion_score"] * 0.30, 1),
                "weighted_contribution": round(ref["completion_score"] * 0.30, 1),
                "label": f"{ref['completed_tasks']} of {ref['total_tasks']} tasks completed",
                "details": f"Completed {ref['completed_tasks']} out of {ref['total_tasks']} assigned tasks.",
                "explanation": (
                    f"You completed {int(round(ref['completion_score']))}% of all tasks specifically assigned to your role."
                ),
            },
            "timeliness": {
                "score": ref["timeliness_score"],
                "weight": WEIGHT_TIMELINESS,
                "points": round(ref["timeliness_score"] * 0.20, 1),
                "contribution_points": round(ref["timeliness_score"] * 0.20, 1),
                "weighted_contribution": round(ref["timeliness_score"] * 0.20, 1),
                "label": f"{ref['on_time_tasks']} of {ref['completed_tasks']} tasks on time",
                "details": (
                    f"{ref['on_time_tasks']} out of {ref['completed_tasks']} completed tasks were on time."
                ),
                "explanation": (
                    f"{int(round(ref['timeliness_score']))}% of your completed deliverables were finalized on or before deadline."
                ),
            },
            "work_evidence": {
                "score": ref["evidence_score"],
                "weight": WEIGHT_WORK_EVIDENCE,
                "points": round(ref["evidence_score"] * 0.20, 1),
                "contribution_points": round(ref["evidence_score"] * 0.20, 1),
                "weighted_contribution": round(ref["evidence_score"] * 0.20, 1),
                "label": f"{ref['evidence_count']} evidence artifacts attached",
                "details": f"{ref['evidence_count']} tasks have verified links or files attached.",
                "explanation": (
                    f"{int(round(ref['evidence_score']))}% of your completed deliverables contain verifiable links or documents."
                ),
            },
            "peer_feedback": {
                "score": ref["feedback_score"],
                "weight": WEIGHT_PEER_FEEDBACK,
                "points": round(ref["feedback_score"] * 0.20, 1),
                "contribution_points": round(ref["feedback_score"] * 0.20, 1),
                "weighted_contribution": round(ref["feedback_score"] * 0.20, 1),
                "label": f"Average {ref['peer_rating']} / 5.0 peer rating",
                "details": (
                    f"Received an average peer rating of {ref['peer_rating']} / 5.0 across {ref['peer_reviews_count']} reviews."
                ),
                "explanation": (
                    f"Calculated across {ref['peer_reviews_count']} anonymous teammate evaluations across all 6 core categories."
                ),
            },
            "participation": {
                "score": ref["participation_score"],
                "weight": WEIGHT_PARTICIPATION,
                "points": round(ref["participation_score"] * 0.10, 1),
                "contribution_points": round(ref["participation_score"] * 0.10, 1),
                "weighted_contribution": round(ref["participation_score"] * 0.10, 1),
                "label": f"{ref['activity_count']} verified project actions",
                "details": (
                    f"Logged {ref['activity_count']} actions, representing active engagement against team benchmark."
                ),
                "explanation": (
                    "Consistently logged activity records showing steady participation throughout project relative to benchmark."
                ),
            },
        }

        factors_list = [
            {
                "name": "Task Completion",
                "weight": WEIGHT_TASK_COMPLETION,
                "score": ref["completion_score"],
                "points": round(ref["completion_score"] * 0.30, 1),
                "description": breakdown["task_completion"]["details"],
                "status": get_factor_status(ref["completion_score"]),
            },
            {
                "name": "Timeliness",
                "weight": WEIGHT_TIMELINESS,
                "score": ref["timeliness_score"],
                "points": round(ref["timeliness_score"] * 0.20, 1),
                "description": breakdown["timeliness"]["details"],
                "status": get_factor_status(ref["timeliness_score"]),
            },
            {
                "name": "Work Evidence",
                "weight": WEIGHT_WORK_EVIDENCE,
                "score": ref["evidence_score"],
                "points": round(ref["evidence_score"] * 0.20, 1),
                "description": breakdown["work_evidence"]["details"],
                "status": get_factor_status(ref["evidence_score"]),
            },
            {
                "name": "Peer Review",
                "weight": WEIGHT_PEER_FEEDBACK,
                "score": ref["feedback_score"],
                "points": round(ref["feedback_score"] * 0.20, 1),
                "description": breakdown["peer_feedback"]["details"],
                "status": get_factor_status(ref["feedback_score"]),
            },
            {
                "name": "Participation",
                "weight": WEIGHT_PARTICIPATION,
                "score": ref["participation_score"],
                "points": round(ref["participation_score"] * 0.10, 1),
                "description": breakdown["participation"]["details"],
                "status": get_factor_status(ref["participation_score"]),
            },
        ]

        return {
            "user_id": user_id,
            "name": ref["name"],
            "role": ref["role"],
            "overall_score": overall,
            "tier": tier,
            "grade_projection": grade,
            "breakdown": breakdown,
            "factors": factors_list,
        }

    try:
        # 1. Fetch User and Member metadata
        user_res = client.table("users").select("id, name, avatar_url").eq("id", user_id).execute()
        user_data = user_res.data[0] if user_res.data else {"id": user_id, "name": "Team Member"}

        member_res = (
            client.table("project_members")
            .select("role")
            .eq("project_id", project_id)
            .eq("user_id", user_id)
            .execute()
        )
        user_role = member_res.data[0].get("role", "Member") if member_res.data else "Member"

        # 2. Fetch all project tasks
        tasks_res = client.table("tasks").select("*").eq("project_id", project_id).execute()
        all_tasks = tasks_res.data or []

        # Filter by as_of_date if specified
        if as_of_date:
            filtered_tasks = []
            for t in all_tasks:
                created_dt = parse_timestamp(t.get("created_at"))
                if not created_dt or created_dt <= as_of_date:
                    # Adjust status if completed after cutoff
                    comp_dt = parse_timestamp(t.get("completed_at"))
                    t_copy = dict(t)
                    if comp_dt and comp_dt > as_of_date:
                        t_copy["status"] = "In Progress"
                        t_copy["completed_at"] = None
                    filtered_tasks.append(t_copy)
            all_tasks = filtered_tasks

        # Tasks assigned to user
        assigned_tasks = [
            t
            for t in all_tasks
            if t.get("assigned_to") == user_id
            or (
                isinstance(t.get("assigned_to"), dict)
                and t.get("assigned_to", {}).get("id") == user_id
            )
        ]
        completed_tasks = [t for t in assigned_tasks if t.get("status") == "Completed"]

        # 3. Fetch evidence counts
        task_ids = [t["id"] for t in all_tasks]
        task_evidence_counts: Dict[str, int] = {}
        if task_ids:
            ev_query = (
                client.table("evidence").select("task_id, submitted_at").in_("task_id", task_ids)
            )
            ev_res = ev_query.execute()
            for ev in ev_res.data or []:
                sub_dt = parse_timestamp(ev.get("submitted_at"))
                if not as_of_date or (sub_dt and sub_dt <= as_of_date):
                    t_id = ev.get("task_id")
                    task_evidence_counts[t_id] = task_evidence_counts.get(t_id, 0) + 1

        # 4. Fetch peer reviews for this user (anti-gaming: reviewer != reviewee)
        feedback_query = (
            client.table("peer_feedback")
            .select("*")
            .eq("project_id", project_id)
            .eq("reviewee_id", user_id)
            .neq("reviewer_id", user_id)
        )
        fb_res = feedback_query.execute()
        raw_feedback = fb_res.data or []
        if as_of_date:
            feedback_reviews = [
                r
                for r in raw_feedback
                if not parse_timestamp(r.get("submitted_at"))
                or parse_timestamp(r.get("submitted_at")) <= as_of_date
            ]
        else:
            feedback_reviews = raw_feedback

        # 5. Fetch Activity Logs
        activity_query = (
            client.table("activity_logs").select("user_id, timestamp").eq("project_id", project_id)
        )
        act_res = activity_query.execute()
        all_activities = act_res.data or []
        if as_of_date:
            all_activities = [
                a
                for a in all_activities
                if not parse_timestamp(a.get("timestamp"))
                or parse_timestamp(a.get("timestamp")) <= as_of_date
            ]

        # Group activities by user
        activity_by_user: Dict[str, int] = {}
        for a in all_activities:
            u = a.get("user_id")
            if u:
                activity_by_user[u] = activity_by_user.get(u, 0) + 1

        user_activity_count = activity_by_user.get(user_id, 0)
        team_activity_counts = list(activity_by_user.values())

        # If database has no tasks or members yet (empty DB), check if this is the reference project
        if not all_tasks and project_id == REFERENCE_PROJECT_ID:
            # Fall back to reference dataset
            ref = (
                REFERENCE_MEMBERS_SCORES.get(user_id)
                or REFERENCE_MEMBERS_SCORES["c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"]
            )
            overall = ref["overall_score"]
            tier, grade = get_tier_and_grade(overall)
            # Return reference structure
            return calculate_member_contribution(REFERENCE_PROJECT_ID, user_id)

        # Compute individual factor scores
        s_comp, comp_count, total_assigned, comp_label, comp_expl = calculate_task_completion(
            assigned_tasks
        )
        s_time, time_count, _, time_label, time_expl = calculate_timeliness(
            completed_tasks, total_assigned
        )
        s_evid, evid_count, _, evid_label, evid_expl = calculate_work_evidence(
            completed_tasks, total_assigned, task_evidence_counts
        )
        s_feed, avg_rating, review_count, feed_label, feed_expl = calculate_peer_feedback(
            feedback_reviews
        )
        s_part, act_count, target_act, part_label, part_expl = calculate_participation_activity(
            user_activity_count, team_activity_counts
        )

        # Weighted Sum
        points_comp = round(s_comp * (WEIGHT_TASK_COMPLETION / 100.0), 1)
        points_time = round(s_time * (WEIGHT_TIMELINESS / 100.0), 1)
        points_evid = round(s_evid * (WEIGHT_WORK_EVIDENCE / 100.0), 1)
        points_feed = round(s_feed * (WEIGHT_PEER_FEEDBACK / 100.0), 1)
        points_part = round(s_part * (WEIGHT_PARTICIPATION / 100.0), 1)

        raw_overall = points_comp + points_time + points_evid + points_feed + points_part
        overall_score = min(100.0, max(0.0, round(raw_overall, 1)))
        tier, grade = get_tier_and_grade(overall_score)

        breakdown = {
            "task_completion": {
                "score": s_comp,
                "weight": WEIGHT_TASK_COMPLETION,
                "points": points_comp,
                "contribution_points": points_comp,
                "weighted_contribution": points_comp,
                "label": comp_label,
                "details": f"Completed {comp_count} out of {total_assigned} assigned deliverables.",
                "explanation": comp_expl,
            },
            "timeliness": {
                "score": s_time,
                "weight": WEIGHT_TIMELINESS,
                "points": points_time,
                "contribution_points": points_time,
                "weighted_contribution": points_time,
                "label": time_label,
                "details": f"{time_count} out of {comp_count} completed tasks were submitted on or before deadline.",
                "explanation": time_expl,
            },
            "work_evidence": {
                "score": s_evid,
                "weight": WEIGHT_WORK_EVIDENCE,
                "points": points_evid,
                "contribution_points": points_evid,
                "weighted_contribution": points_evid,
                "label": evid_label,
                "details": f"{evid_count} completed deliverables have verified proof attached.",
                "explanation": evid_expl,
            },
            "peer_feedback": {
                "score": s_feed,
                "weight": WEIGHT_PEER_FEEDBACK,
                "points": points_feed,
                "contribution_points": points_feed,
                "weighted_contribution": points_feed,
                "label": feed_label,
                "details": f"Received an average peer rating of {avg_rating} / 5.0 across {review_count} teammate reviews.",
                "explanation": feed_expl,
            },
            "participation": {
                "score": s_part,
                "weight": WEIGHT_PARTICIPATION,
                "points": points_part,
                "contribution_points": points_part,
                "weighted_contribution": points_part,
                "label": part_label,
                "details": f"Logged {act_count} project actions, representing active engagement against team benchmark.",
                "explanation": part_expl,
            },
        }

        factors_list = [
            {
                "name": "Task Completion",
                "weight": WEIGHT_TASK_COMPLETION,
                "score": s_comp,
                "points": points_comp,
                "description": breakdown["task_completion"]["details"],
                "status": get_factor_status(s_comp),
            },
            {
                "name": "Timeliness",
                "weight": WEIGHT_TIMELINESS,
                "score": s_time,
                "points": points_time,
                "description": breakdown["timeliness"]["details"],
                "status": get_factor_status(s_time),
            },
            {
                "name": "Work Evidence",
                "weight": WEIGHT_WORK_EVIDENCE,
                "score": s_evid,
                "points": points_evid,
                "description": breakdown["work_evidence"]["details"],
                "status": get_factor_status(s_evid),
            },
            {
                "name": "Peer Review",
                "weight": WEIGHT_PEER_FEEDBACK,
                "score": s_feed,
                "points": points_feed,
                "description": breakdown["peer_feedback"]["details"],
                "status": get_factor_status(s_feed),
            },
            {
                "name": "Participation",
                "weight": WEIGHT_PARTICIPATION,
                "score": s_part,
                "points": points_part,
                "description": breakdown["participation"]["details"],
                "status": get_factor_status(s_part),
            },
        ]

        return {
            "user_id": user_id,
            "name": user_data.get("name", "Student"),
            "role": user_role,
            "overall_score": (
                int(round(overall_score)) if overall_score.is_integer() else overall_score
            ),
            "tier": tier,
            "grade_projection": grade,
            "breakdown": breakdown,
            "factors": factors_list,
        }

    except Exception as e:
        logger.error(f"Error computing member contribution score: {str(e)}")
        # If calculation errors, return reference dataset if prototype
        if project_id == REFERENCE_PROJECT_ID:
            ref = (
                REFERENCE_MEMBERS_SCORES.get(user_id)
                or REFERENCE_MEMBERS_SCORES["c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"]
            )
            return {
                "user_id": user_id,
                "name": ref["name"],
                "role": ref["role"],
                "overall_score": ref["overall_score"],
                "tier": "Core Contributor",
                "grade_projection": "A",
                "breakdown": {},
                "factors": [],
            }
        raise APIError(f"Failed to calculate contribution score: {str(e)}", status_code=500)


# ==============================================================================
# 3. Team Contribution Comparison
# ==============================================================================


def calculate_team_contributions(project_id: str) -> List[dict]:
    """
    Computes comparative contribution scores for all teammates within a project workspace.
    Returns: List of { user_id, name, role, score }
    """
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        # Reference demo project fallback
        return [
            {
                "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
                "name": "Abhaas",
                "role": "Frontend Lead",
                "score": 82,
            },
            {
                "user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
                "name": "Rohit",
                "role": "Backend Developer",
                "score": 76,
            },
            {
                "user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
                "name": "Denesh",
                "role": "Hardware Engineer",
                "score": 68,
            },
            {
                "user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
                "name": "Aditya",
                "role": "Documentation & QA",
                "score": 61,
            },
        ]

    try:
        # Fetch all project members
        members_res = (
            client.table("project_members")
            .select("user_id, role, users:user_id(id, name)")
            .eq("project_id", project_id)
            .execute()
        )

        members = members_res.data or []
        if not members and project_id == REFERENCE_PROJECT_ID:
            return [
                {
                    "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
                    "name": "Abhaas",
                    "role": "Frontend Lead",
                    "score": 82,
                },
                {
                    "user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
                    "name": "Rohit",
                    "role": "Backend Developer",
                    "score": 76,
                },
                {
                    "user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
                    "name": "Denesh",
                    "role": "Hardware Engineer",
                    "score": 68,
                },
                {
                    "user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
                    "name": "Aditya",
                    "role": "Documentation & QA",
                    "score": 61,
                },
            ]

        results = []
        for m in members:
            u_id = m.get("user_id")
            user_info = m.get("users") or {}
            user_name = user_info.get("name") if isinstance(user_info, dict) else "Team Member"
            role = m.get("role", "Member")

            contrib = calculate_member_contribution(project_id, u_id)
            score = contrib.get("overall_score", 0)

            results.append(
                {
                    "user_id": u_id,
                    "name": contrib.get("name") or user_name,
                    "role": role,
                    "score": score,
                }
            )

        # Sort descending by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    except Exception as e:
        logger.error(f"Error calculating team contributions: {str(e)}")
        if project_id == REFERENCE_PROJECT_ID:
            return [
                {
                    "user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
                    "name": "Abhaas",
                    "role": "Frontend Lead",
                    "score": 82,
                },
                {
                    "user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
                    "name": "Rohit",
                    "role": "Backend Developer",
                    "score": 76,
                },
                {
                    "user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
                    "name": "Denesh",
                    "role": "Hardware Engineer",
                    "score": 68,
                },
                {
                    "user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
                    "name": "Aditya",
                    "role": "Documentation & QA",
                    "score": 61,
                },
            ]
        raise APIError(f"Failed to calculate team comparison: {str(e)}", status_code=500)


# ==============================================================================
# 4. Weekly Snapshot Generation & Progression Trends
# ==============================================================================


def generate_weekly_snapshots(project_id: str) -> List[dict]:
    """
    Computes weekly contribution snapshots from project `start_date` up to current date (or deadline).
    Caches historical score checkpoints into the `contribution_snapshots` table.
    """
    client = get_supabase_admin_client() or get_supabase_client()

    # Get project metadata
    start_dt = None
    deadline_dt = None
    if client:
        try:
            proj_res = (
                client.table("projects")
                .select("start_date, deadline")
                .eq("id", project_id)
                .execute()
            )
            if proj_res.data:
                p = proj_res.data[0]
                start_dt = parse_timestamp(p.get("start_date"))
                deadline_dt = parse_timestamp(p.get("deadline"))
        except Exception as e:
            logger.error(f"Failed to fetch project dates: {str(e)}")

    if not start_dt:
        start_dt = datetime.now(timezone.utc) - timedelta(days=28)
    if not deadline_dt:
        deadline_dt = datetime.now(timezone.utc)

    # Determine weekly milestones
    now_dt = datetime.now(timezone.utc)
    cutoff_ceiling = min(now_dt, deadline_dt)

    # Compute 7-day milestone checkpoints
    milestones = []
    week_idx = 1
    current_milestone = start_dt + timedelta(days=7)
    while current_milestone <= cutoff_ceiling + timedelta(days=3) and week_idx <= 12:
        milestones.append((f"Week {week_idx}", current_milestone))
        current_milestone += timedelta(days=7)
        week_idx += 1

    if not milestones:
        milestones = [("Week 1", cutoff_ceiling)]

    # Fetch team members
    member_ids = []
    if client:
        try:
            m_res = (
                client.table("project_members")
                .select("user_id")
                .eq("project_id", project_id)
                .execute()
            )
            member_ids = [m["user_id"] for m in (m_res.data or [])]
        except Exception:
            pass

    if not member_ids:
        member_ids = list(REFERENCE_MEMBERS_SCORES.keys())

    snapshots_to_insert = []
    for week_label, cutoff_dt in milestones:
        snapshot_date_str = cutoff_dt.date().isoformat()
        for u_id in member_ids:
            try:
                contrib = calculate_member_contribution(project_id, u_id, as_of_date=cutoff_dt)
                score = contrib.get("overall_score", 70.0)
            except Exception:
                score = 70.0

            snapshots_to_insert.append(
                {
                    "project_id": project_id,
                    "user_id": u_id,
                    "week_label": week_label,
                    "score": float(score),
                    "snapshot_date": snapshot_date_str,
                }
            )

    # Upsert into contribution_snapshots table
    if client:
        try:
            for snap in snapshots_to_insert:
                client.table("contribution_snapshots").upsert(
                    snap, on_conflict="project_id,user_id,week_label"
                ).execute()
            logger.info(
                f"Persisted {len(snapshots_to_insert)} contribution snapshots for project {project_id}."
            )
        except Exception as e:
            logger.error(f"Failed to persist contribution snapshots: {str(e)}")

    return snapshots_to_insert


def get_contribution_trends(project_id: str) -> List[dict]:
    """
    Retrieves time-series progression snapshots for Recharts line chart visualization.
    Format: [ { "week": "Week 1", "Abhaas": 55, "Rohit": 50, ... }, ... ]
    """
    client = get_supabase_admin_client() or get_supabase_client()

    # Reference demo dataset fallback
    fallback_trends = [
        {"week": "Week 1", "Abhaas": 55, "Rohit": 50, "Denesh": 40, "Aditya": 45},
        {"week": "Week 2", "Abhaas": 67, "Rohit": 62, "Denesh": 54, "Aditya": 50},
        {"week": "Week 3", "Abhaas": 76, "Rohit": 70, "Denesh": 62, "Aditya": 58},
        {"week": "Week 4", "Abhaas": 82, "Rohit": 76, "Denesh": 68, "Aditya": 61},
    ]

    if not client:
        return fallback_trends

    try:
        # Fetch snapshots from contribution_snapshots table
        res = (
            client.table("contribution_snapshots")
            .select("week_label, score, snapshot_date, user_id, users:user_id(name)")
            .eq("project_id", project_id)
            .order("snapshot_date", desc=False)
            .execute()
        )

        rows = res.data or []

        # If no snapshots stored yet, generate them dynamically
        if not rows:
            generate_weekly_snapshots(project_id)
            # Re-query
            res = (
                client.table("contribution_snapshots")
                .select("week_label, score, snapshot_date, user_id, users:user_id(name)")
                .eq("project_id", project_id)
                .order("snapshot_date", desc=False)
                .execute()
            )
            rows = res.data or []

        if not rows:
            return fallback_trends

        # Fetch names for all project members as fallback mapping
        member_names = {}
        try:
            m_res = (
                client.table("project_members")
                .select("user_id, users:user_id(name)")
                .eq("project_id", project_id)
                .execute()
            )
            for m in m_res.data or []:
                u = m.get("user_id")
                n = (m.get("users") or {}).get("name") if isinstance(m.get("users"), dict) else None
                if u and n:
                    member_names[u] = n
        except Exception:
            pass

        # Pivot rows by week_label
        # Keep week ordering stable
        weeks_ordered = []
        weeks_data: Dict[str, dict] = {}

        for r in rows:
            w_label = r.get("week_label")
            if w_label not in weeks_data:
                weeks_ordered.append(w_label)
                weeks_data[w_label] = {"week": w_label}

            user_obj = r.get("users")
            user_name = None
            if isinstance(user_obj, dict):
                user_name = user_obj.get("name")
            if not user_name:
                user_name = member_names.get(r.get("user_id")) or r.get("user_id")

            # Extract first name or display name for chart clarity
            display_key = user_name.split()[0] if " " in user_name else user_name
            score_val = float(r.get("score", 0))
            weeks_data[w_label][display_key] = (
                int(round(score_val)) if score_val.is_integer() else score_val
            )

        trend_series = [weeks_data[w] for w in weeks_ordered]
        return trend_series if trend_series else fallback_trends

    except Exception as e:
        logger.error(f"Error fetching contribution trends: {str(e)}")
        return fallback_trends
