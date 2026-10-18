"""
Contribution Scoring Engine & Analytics Unit Tests (`tests/test_scoring_engine.py`)
Validates the 5-factor mathematical weighting model, explainable score breakdowns,
anti-gaming protections, snapshot generators, and REST analytics endpoints.
"""

import unittest
from datetime import datetime, timezone, timedelta
from app import create_app
from config import TestingConfig
from services.auth_service import generate_jwt_token
from services.scoring_engine import (
    calculate_task_completion,
    calculate_timeliness,
    calculate_work_evidence,
    calculate_peer_feedback,
    calculate_participation_activity,
    get_tier_and_grade,
)


class ScoringEngineUnitTestCase(unittest.TestCase):
    """Direct unit tests for the mathematical scoring formulas."""

    def test_task_completion_normal(self):
        """Task completion computes correct percentage."""
        tasks = [
            {"id": "t1", "status": "Completed"},
            {"id": "t2", "status": "Completed"},
            {"id": "t3", "status": "Completed"},
            {"id": "t4", "status": "In Progress"},
        ]
        score, comp, total, label, expl = calculate_task_completion(tasks)
        self.assertEqual(comp, 3)
        self.assertEqual(total, 4)
        self.assertEqual(score, 75.0)
        self.assertIn("3 of 4 tasks completed", label)

    def test_task_completion_zero_assigned_fallback(self):
        """Zero assigned deliverables defaults to 100% baseline."""
        score, comp, total, label, expl = calculate_task_completion([])
        self.assertEqual(score, 100.0)
        self.assertEqual(comp, 0)
        self.assertEqual(total, 0)
        self.assertIn("baseline", label.lower())

    def test_timeliness_on_time_and_late(self):
        """Timeliness properly audits completion timestamps against deadlines."""
        now = datetime.now(timezone.utc)
        completed_tasks = [
            # On-time
            {
                "id": "t1",
                "completed_at": (now - timedelta(hours=2)).isoformat(),
                "deadline": now.isoformat(),
            },
            # Late
            {
                "id": "t2",
                "completed_at": (now + timedelta(hours=2)).isoformat(),
                "deadline": now.isoformat(),
            },
            # On-time via flag
            {"id": "t3", "is_on_time": True, "deadline": now.isoformat()},
            # No deadline -> on-time
            {"id": "t4", "completed_at": now.isoformat(), "deadline": None},
        ]
        score, on_time, total_comp, label, expl = calculate_timeliness(
            completed_tasks, total_assigned=4
        )
        self.assertEqual(on_time, 3)
        self.assertEqual(total_comp, 4)
        self.assertEqual(score, 75.0)

    def test_timeliness_zero_completed_fallback(self):
        """Zero completed deliverables produces 0% if tasks assigned, or 100% if 0 assigned."""
        score_assigned, _, _, _, _ = calculate_timeliness([], total_assigned=5)
        self.assertEqual(score_assigned, 0.0)

        score_none_assigned, _, _, _, _ = calculate_timeliness([], total_assigned=0)
        self.assertEqual(score_none_assigned, 100.0)

    def test_work_evidence_ratio(self):
        """Work evidence audits attached artifacts per completed deliverable."""
        completed_tasks = [
            {"id": "t1", "evidence_count": 1},
            {"id": "t2", "has_evidence": True},
            {"id": "t3", "evidence_count": 0},
            {"id": "t4", "evidence_count": 0},
        ]
        counts = {"t4": 2}  # t4 has 2 external evidence rows
        score, verified, total_comp, label, expl = calculate_work_evidence(
            completed_tasks, total_assigned=4, task_evidence_counts=counts
        )
        self.assertEqual(verified, 3)  # t1, t2, t4
        self.assertEqual(total_comp, 4)
        self.assertEqual(score, 75.0)

    def test_peer_feedback_6_dimensions(self):
        """Peer feedback normalizes 6-dimension ratings to 0-100% scale."""
        reviews = [
            {
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5,
            },
            {
                "participation_score": 4,
                "responsibility_score": 4,
                "quality_score": 4,
                "collaboration_score": 4,
                "communication_score": 4,
                "timeliness_score": 4,
            },
        ]
        # Review 1 avg = 5.0, Review 2 avg = 4.0 -> Total avg = 4.5 -> (4.5 / 5.0) * 100 = 90.0%
        score, avg_rating, count, label, expl = calculate_peer_feedback(reviews)
        self.assertEqual(avg_rating, 4.5)
        self.assertEqual(count, 2)
        self.assertEqual(score, 90.0)

    def test_peer_feedback_outlier_moderation(self):
        """Peer feedback moderates extreme malicious low review when other teammates rate high."""
        reviews = [
            {
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5,
            },
            {
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5,
            },
            # Malicious 1-star outlier
            {
                "participation_score": 1,
                "responsibility_score": 1,
                "quality_score": 1,
                "collaboration_score": 1,
                "communication_score": 1,
                "timeliness_score": 1,
            },
        ]
        score, avg_rating, count, label, expl = calculate_peer_feedback(reviews)
        # Without moderation, (5+5+1)/3 = 3.67 (73.3%).
        # With moderation, min is moderated towards (5.0 - 1.0) = 4.0 -> (5+5+4)/3 = 4.67 (93.3%)
        self.assertGreater(score, 80.0)

    def test_peer_feedback_empty_fallback(self):
        """Empty peer reviews default to 100% baseline."""
        score, avg_rating, count, label, expl = calculate_peer_feedback([])
        self.assertEqual(score, 100.0)
        self.assertEqual(count, 0)

    def test_participation_benchmark(self):
        """Participation benchmarks against team average and minimum target."""
        # Target = max(avg(10, 30), 20) = max(20, 20) = 20
        # User count = 15 -> (15 / 20) * 100 = 75.0%
        score, user_cnt, target_cnt, label, expl = calculate_participation_activity(15, [10, 30])
        self.assertEqual(target_cnt, 20)
        self.assertEqual(score, 75.0)

        # Capped at 100%
        score_high, _, _, _, _ = calculate_participation_activity(45, [10, 30])
        self.assertEqual(score_high, 100.0)

    def test_tier_and_grade_projection(self):
        """Helper returns expected qualitative tier and grade projection."""
        tier95, grade95 = get_tier_and_grade(95.0)
        self.assertEqual(tier95, "High Contributor")
        self.assertEqual(grade95, "A+")

        tier85, grade85 = get_tier_and_grade(85.0)
        self.assertEqual(tier85, "Core Contributor")
        self.assertEqual(grade85, "A")

        tier75, grade75 = get_tier_and_grade(75.0)
        self.assertEqual(tier75, "Standard Contributor")
        self.assertEqual(grade75, "B+")


class AnalyticsRoutesTestCase(unittest.TestCase):
    """End-to-end unit tests for the analytics API blueprint."""

    def setUp(self):
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()
        self.user_id = "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"  # Abhaas
        self.user_email = "abhaas@college.edu"
        self.user_name = "Abhaas"
        self.token = generate_jwt_token(self.user_id, self.user_email, self.user_name)
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}
        self.project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"

    def test_contribution_score_unauthorized(self):
        """GET /api/projects/<id>/contribution/<user_id> without token returns 401."""
        response = self.client.get(f"/api/projects/{self.project_id}/contribution/{self.user_id}")
        self.assertEqual(response.status_code, 401)

    def test_contribution_score_authorized(self):
        """GET /api/projects/<id>/contribution/<user_id> returns 200 and full 5-factor breakdown."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/contribution/{self.user_id}",
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        res_data = data["data"]
        self.assertEqual(res_data["user_id"], self.user_id)
        self.assertEqual(res_data["name"], "Abhaas")
        self.assertEqual(res_data["overall_score"], 82)

        # Validate 5 factor breakdown keys
        bk = res_data["breakdown"]
        self.assertIn("task_completion", bk)
        self.assertIn("timeliness", bk)
        self.assertIn("work_evidence", bk)
        self.assertIn("peer_feedback", bk)
        self.assertIn("participation", bk)

        self.assertEqual(bk["task_completion"]["weight"], 30)
        self.assertEqual(bk["timeliness"]["weight"], 20)
        self.assertEqual(bk["work_evidence"]["weight"], 20)
        self.assertEqual(bk["peer_feedback"]["weight"], 20)
        self.assertEqual(bk["participation"]["weight"], 10)

        # Validate factors list
        factors = res_data.get("factors")
        self.assertIsInstance(factors, list)
        self.assertEqual(len(factors), 5)

    def test_team_comparison_authorized(self):
        """GET /api/projects/<id>/team-comparison returns comparative scores for all members."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/team-comparison", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        members = data["data"]
        self.assertIsInstance(members, list)
        self.assertGreaterEqual(len(members), 4)

        # Check expected members
        names = [m["name"] for m in members]
        self.assertIn("Abhaas", names)
        self.assertIn("Rohit", names)
        self.assertIn("Denesh", names)
        self.assertIn("Aditya", names)

    def test_trends_authorized(self):
        """GET /api/projects/<id>/trends returns historical progression data."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/trends", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        trends = data["data"]
        self.assertIsInstance(trends, list)
        self.assertGreaterEqual(len(trends), 1)
        self.assertIn("week", trends[0])

    def test_manual_snapshot_generation(self):
        """POST /api/projects/<id>/snapshots/generate triggers snapshot computation."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/snapshots/generate", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("generated_snapshots_count", data["data"])

    def test_report_endpoint_unauthorized(self):
        """GET /api/projects/<id>/report without token returns 401."""
        response = self.client.get(f"/api/projects/{self.project_id}/report")
        self.assertEqual(response.status_code, 401)

    def test_report_endpoint_authorized(self):
        """GET /api/projects/<id>/report returns final printable project report with full manifest."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/report", headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        report = data["data"]

        # Validate core sections
        self.assertIn("project", report)
        self.assertIn("members", report)
        self.assertIn("tasks", report)
        self.assertIn("evidence", report)
        self.assertIn("audit_hash", report)
        self.assertIn("generated_at", report)

        # Validate audit hash and timestamp
        self.assertTrue(report["audit_hash"].startswith("SHA256:"))
        self.assertTrue(len(report["generated_at"]) > 0)

        # Validate member details
        members = report["members"]
        self.assertIsInstance(members, list)
        self.assertGreaterEqual(len(members), 1)
        for m in members:
            self.assertIn("name", m)
            self.assertIn("fair_score", m)
            self.assertIn("overall_score", m)
            self.assertIn("task_completion_rate", m)
            self.assertIn("timeliness_rate", m)
            self.assertIn("evidence_submissions", m)
            self.assertIn("peer_rating", m)


if __name__ == "__main__":
    unittest.main()
