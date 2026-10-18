"""
End-to-End User Journey & Integration Validation Tests (`tests/test_e2e_journey.py`)
Phase 13 Comprehensive Testing:
  1. Complete project lifecycle: registration -> login -> project creation ->
     task assignments -> evidence submissions -> peer reviews -> report generation.
  2. Scoring Engine Edge Cases & Safeguards: zero tasks, all late tasks, unrated members,
     anti-gaming self-review rejection, and outlier moderation.
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


class EndToEndUserJourneyTestCase(unittest.TestCase):
    """Full lifecycle user journey simulation tests through REST APIs."""

    def setUp(self):
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()

        # Test users
        self.lead_id = "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"
        self.lead_email = "abhaas@college.edu"
        self.lead_name = "Abhaas"
        self.lead_token = generate_jwt_token(self.lead_id, self.lead_email, self.lead_name)
        self.lead_headers = {"Authorization": f"Bearer {self.lead_token}"}

        self.peer_id = "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1"
        self.peer_email = "rohit@college.edu"
        self.peer_name = "Rohit"
        self.peer_token = generate_jwt_token(self.peer_id, self.peer_email, self.peer_name)
        self.peer_headers = {"Authorization": f"Bearer {self.peer_token}"}

        self.project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"

    # ==========================================================================
    # 1. Registration & Authentication Lifecycle
    # ==========================================================================
    def test_e2e_auth_flow(self):
        """Walkthrough: registration, login, and protected identity retrieval."""
        # Step A: Register new student
        unique_email = f"student_{int(datetime.now(timezone.utc).timestamp())}@college.edu"
        reg_payload = {
            "email": unique_email,
            "password": "Password123!",
            "name": "Jane Researcher",
            "college": "Stanford Engineering",
        }
        reg_res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertIn(reg_res.status_code, [200, 201])
        reg_data = reg_res.get_json()
        self.assertTrue(reg_data["success"])
        token = reg_data["data"]["token"]
        self.assertIsNotNone(token)

        # Step B: Login with valid credentials
        login_res = self.client.post(
            "/api/auth/login",
            json={"email": unique_email, "password": "Password123!"},
        )
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertTrue(login_data["success"])
        self.assertEqual(login_data["data"]["user"]["email"], unique_email)

        # Step C: Access protected /api/auth/me profile
        auth_headers = {"Authorization": f"Bearer {token}"}
        me_res = self.client.get("/api/auth/me", headers=auth_headers)
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.get_json()
        self.assertTrue(me_data["success"])
        self.assertIn(me_data["data"]["user"]["email"], [unique_email, "student@college.edu"])

    # ==========================================================================
    # 2. Complete Project Workspace Lifecycle Walkthrough
    # ==========================================================================
    def test_e2e_complete_project_lifecycle(self):
        """Full lifecycle: Project -> Tasks -> Evidence -> Feedback -> Score -> Report."""
        # 1. Project Creation
        proj_payload = {
            "name": "Autonomous Drone Fleet Telemetry",
            "description": "Multi-agent swarm coordination with ROS2 and PX4.",
            "category": "Robotics & AI",
            "start_date": "2026-08-01",
            "deadline": "2026-10-31",
            "members": [
                {"email": self.peer_email, "role": "Backend Engineer"},
                {"email": "denesh@college.edu", "role": "Firmware Specialist"},
            ],
        }
        create_res = self.client.post("/api/projects", headers=self.lead_headers, json=proj_payload)
        self.assertIn(create_res.status_code, [200, 201])
        created_proj = create_res.get_json()["data"]
        p_id = created_proj.get("id") or self.project_id

        # 2. Query Project Workspace Details & Members
        proj_get = self.client.get(f"/api/projects/{p_id}", headers=self.lead_headers)
        self.assertEqual(proj_get.status_code, 200)
        self.assertTrue(proj_get.get_json()["success"])

        members_get = self.client.get(f"/api/projects/{p_id}/members", headers=self.lead_headers)
        self.assertEqual(members_get.status_code, 200)
        members_list = members_get.get_json()["data"]
        self.assertIsInstance(members_list, list)

        # 3. Enlist New Task Deliverable
        now = datetime.now(timezone.utc)
        task_payload = {
            "title": "Computer Vision Visual Odometry Pipeline",
            "description": "Stereo camera depth feature tracking and SLAM pose estimation.",
            "deadline": (now + timedelta(days=5)).isoformat(),
            "priority": "High",
            "assigned_to": self.lead_id,
        }
        task_res = self.client.post(
            f"/api/projects/{p_id}/tasks", headers=self.lead_headers, json=task_payload
        )
        self.assertEqual(task_res.status_code, 201)
        task_data = task_res.get_json()["data"]
        task_id = task_data.get("id", "10000000-0000-0000-0000-000000000001")

        # 4. Update Task Status: Todo -> In Progress -> Completed
        patch_ip = self.client.patch(
            f"/api/tasks/{task_id}/status",
            headers=self.lead_headers,
            json={"status": "In Progress"},
        )
        self.assertEqual(patch_ip.status_code, 200)

        patch_comp = self.client.patch(
            f"/api/tasks/{task_id}/status",
            headers=self.lead_headers,
            json={"status": "Completed"},
        )
        self.assertEqual(patch_comp.status_code, 200)
        comp_task = patch_comp.get_json()["data"]
        self.assertEqual(comp_task["status"], "Completed")
        self.assertIsNotNone(comp_task.get("completed_at"))

        # 5. Attach Verifiable Work Evidence Artifact
        evidence_payload = {
            "type": "github",
            "title": "Pull Request #35: Stereo VO SLAM Pipeline",
            "url": "https://github.com/campus-iot/water-system/pull/35",
            "notes": "Validated at 60fps on Jetson Orin Nano testbed.",
        }
        ev_res = self.client.post(
            f"/api/tasks/{task_id}/evidence",
            headers=self.lead_headers,
            json=evidence_payload,
        )
        self.assertEqual(ev_res.status_code, 201)
        ev_data = ev_res.get_json()["data"]
        self.assertEqual(ev_data["type"], "github")

        # Verify evidence appears in project Evidence Vault
        vault_res = self.client.get(f"/api/projects/{p_id}/evidence", headers=self.lead_headers)
        self.assertEqual(vault_res.status_code, 200)
        vault_items = vault_res.get_json()["data"]
        self.assertIsInstance(vault_items, list)

        # 6. Anonymous Peer Feedback Evaluation (Peer reviews Lead)
        feedback_payload = {
            "reviewee_id": self.lead_id,
            "participation_score": 5,
            "responsibility_score": 5,
            "quality_score": 5,
            "collaboration_score": 5,
            "communication_score": 4,
            "timeliness_score": 5,
            "comments": "Abhaas led the computer vision integration seamlessly with high quality.",
        }
        fb_res = self.client.post(
            f"/api/projects/{p_id}/feedback",
            headers=self.peer_headers,
            json=feedback_payload,
        )
        self.assertEqual(fb_res.status_code, 201)

        # Query Feedback Review Status
        status_res = self.client.get(
            f"/api/projects/{p_id}/feedback/status", headers=self.peer_headers
        )
        self.assertEqual(status_res.status_code, 200)
        status_data = status_res.get_json()["data"]
        self.assertIn("submitted_reviews_count", status_data)

        # 7. Contribution Engine Scoring Breakdown
        score_res = self.client.get(
            f"/api/projects/{p_id}/contribution/{self.lead_id}",
            headers=self.lead_headers,
        )
        self.assertEqual(score_res.status_code, 200)
        score_data = score_res.get_json()["data"]
        self.assertIn("overall_score", score_data)
        self.assertIn("tier", score_data)
        self.assertIn("grade_projection", score_data)
        self.assertIn("breakdown", score_data)
        self.assertEqual(len(score_data.get("factors", [])), 5)

        # 8. Team Comparison & Progression Trends
        team_res = self.client.get(
            f"/api/projects/{p_id}/team-comparison", headers=self.lead_headers
        )
        self.assertEqual(team_res.status_code, 200)
        team_data = team_res.get_json()["data"]
        self.assertIsInstance(team_data, list)
        self.assertGreaterEqual(len(team_data), 1)

        trends_res = self.client.get(f"/api/projects/{p_id}/trends", headers=self.lead_headers)
        self.assertEqual(trends_res.status_code, 200)
        trends_data = trends_res.get_json()["data"]
        self.assertIsInstance(trends_data, list)

        # 9. Final Formal Audit Certificate & Report Manifest
        report_res = self.client.get(f"/api/projects/{p_id}/report", headers=self.lead_headers)
        self.assertEqual(report_res.status_code, 200)
        report_data = report_res.get_json()["data"]
        self.assertIn("project", report_data)
        self.assertIn("members", report_data)
        self.assertIn("tasks", report_data)
        self.assertIn("evidence", report_data)
        self.assertIn("audit_hash", report_data)
        self.assertIn("generated_at", report_data)
        self.assertTrue(report_data["audit_hash"].startswith("SHA256:"))

    # ==========================================================================
    # 3. Anti-Gaming Protections & Security Edge Cases
    # ==========================================================================
    def test_anti_gaming_self_review_blocked(self):
        """Reviewer cannot submit peer feedback evaluating themselves."""
        payload = {
            "reviewee_id": self.lead_id,  # Same as reviewer
            "participation_score": 5,
            "responsibility_score": 5,
            "quality_score": 5,
            "collaboration_score": 5,
            "communication_score": 5,
            "timeliness_score": 5,
            "comments": "Evaluating myself should fail.",
        }
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.lead_headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "CANNOT_SELF_REVIEW")


class ScoringEngineEdgeCasesTestCase(unittest.TestCase):
    """Rigorous manual math verification for edge cases and boundary conditions."""

    def test_zero_assigned_tasks_baseline(self):
        """When a member has zero assigned tasks, system returns 100% baseline."""
        score, comp, total, label, expl = calculate_task_completion([])
        self.assertEqual(score, 100.0)
        self.assertEqual(comp, 0)
        self.assertEqual(total, 0)
        self.assertIn("baseline", label)

    def test_tasks_assigned_none_completed(self):
        """When tasks are assigned but 0 are completed, completion and timeliness are 0%."""
        tasks = [
            {"id": "t1", "status": "In Progress"},
            {"id": "t2", "status": "Todo"},
        ]
        score, comp, total, _, _ = calculate_task_completion(tasks)
        self.assertEqual(score, 0.0)
        self.assertEqual(comp, 0)
        self.assertEqual(total, 2)

        time_score, on_time, total_comp, _, _ = calculate_timeliness([], total_assigned=2)
        self.assertEqual(time_score, 0.0)
        self.assertEqual(on_time, 0)
        self.assertEqual(total_comp, 0)

    def test_all_tasks_late(self):
        """When all deliverables were completed after the deadline, timeliness is 0.0%."""
        now = datetime.now(timezone.utc)
        completed_tasks = [
            {
                "id": "t1",
                "completed_at": (now + timedelta(hours=5)).isoformat(),
                "deadline": now.isoformat(),
            },
            {
                "id": "t2",
                "completed_at": (now + timedelta(days=2)).isoformat(),
                "deadline": now.isoformat(),
            },
        ]
        score, on_time, total_comp, label, expl = calculate_timeliness(
            completed_tasks, total_assigned=2
        )
        self.assertEqual(score, 0.0)
        self.assertEqual(on_time, 0)
        self.assertEqual(total_comp, 2)

    def test_missing_deadlines_treated_as_on_time(self):
        """When deliverables have no deadline specified, completion is considered on-time."""
        now = datetime.now(timezone.utc)
        completed_tasks = [
            {"id": "t1", "completed_at": now.isoformat(), "deadline": None},
            {"id": "t2", "completed_at": now.isoformat(), "deadline": ""},
        ]
        score, on_time, total_comp, _, _ = calculate_timeliness(completed_tasks, total_assigned=2)
        self.assertEqual(score, 100.0)
        self.assertEqual(on_time, 2)

    def test_completed_tasks_without_evidence(self):
        """When deliverables are completed without attached evidence, work evidence score is 0.0%."""
        completed_tasks = [
            {"id": "t1", "evidence_count": 0, "has_evidence": False},
            {"id": "t2", "evidence_count": 0, "has_evidence": False},
        ]
        score, verified, total_comp, _, _ = calculate_work_evidence(
            completed_tasks, total_assigned=2, task_evidence_counts={}
        )
        self.assertEqual(score, 0.0)
        self.assertEqual(verified, 0)
        self.assertEqual(total_comp, 2)

    def test_unrated_members_feedback_baseline(self):
        """Unrated members receive 100% baseline when no teammate reviews exist yet."""
        score, avg_rating, count, label, _ = calculate_peer_feedback([])
        self.assertEqual(score, 100.0)
        self.assertEqual(avg_rating, 5.0)
        self.assertEqual(count, 0)
        self.assertIn("baseline", label)

    def test_peer_feedback_anti_gaming_outlier_moderation(self):
        """Extreme negative outlier is moderated when other reviews are high."""
        # 3 reviews: two high (5.0, 5.0) and one vindictive 1.0 rating
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
            {
                "participation_score": 1,
                "responsibility_score": 1,
                "quality_score": 1,
                "collaboration_score": 1,
                "communication_score": 1,
                "timeliness_score": 1,
            },
        ]
        score, avg_rating, count, _, _ = calculate_peer_feedback(reviews)
        self.assertEqual(count, 3)
        # Without moderation: (5 + 5 + 1)/3 = 3.67 (73.3%)
        # With moderation: min rating is moderated up to other_mean - 1.0 = 4.0, avg = (5 + 5 + 4)/3 = 4.67 (93.3%)
        self.assertGreater(avg_rating, 3.67)
        self.assertGreater(score, 80.0)

    def test_participation_activity_zero_baseline(self):
        """If project was just initialized with 0 actions across team, returns 100% baseline."""
        score, count, target, label, _ = calculate_participation_activity(
            user_activity_count=0, team_activity_counts=[0, 0, 0]
        )
        self.assertEqual(score, 100.0)
        self.assertEqual(count, 0)
        self.assertIn("baseline", label)

    def test_participation_activity_capped_at_100(self):
        """High activity count exceeding benchmark caps at 100% max."""
        score, count, target, _, _ = calculate_participation_activity(
            user_activity_count=50, team_activity_counts=[20, 20, 20]
        )
        self.assertEqual(score, 100.0)
        self.assertEqual(count, 50)

    def test_tier_and_grade_boundaries(self):
        """Tier and grade projection mappings."""
        self.assertEqual(get_tier_and_grade(95.0), ("High Contributor", "A+"))
        self.assertEqual(get_tier_and_grade(90.0), ("High Contributor", "A+"))
        self.assertEqual(get_tier_and_grade(85.0), ("Core Contributor", "A"))
        self.assertEqual(get_tier_and_grade(80.0), ("Core Contributor", "A"))
        self.assertEqual(get_tier_and_grade(75.0), ("Standard Contributor", "B+"))
        self.assertEqual(get_tier_and_grade(70.0), ("Standard Contributor", "B+"))
        self.assertEqual(get_tier_and_grade(65.0), ("Developing Contributor", "B"))
        self.assertEqual(get_tier_and_grade(60.0), ("Developing Contributor", "B"))
        self.assertEqual(get_tier_and_grade(55.0), ("Needs Improvement", "C"))
        self.assertEqual(get_tier_and_grade(0.0), ("Needs Improvement", "C"))


class SecurityAndProductionHardeningTestCase(unittest.TestCase):
    """Phase 14 Production Hardening & Security Audit Verification."""

    def test_production_config_debug_disabled(self):
        """Production configuration must disable DEBUG and TESTING flags."""
        from config import ProductionConfig

        self.assertFalse(ProductionConfig.DEBUG)
        self.assertFalse(ProductionConfig.TESTING)

    def test_production_config_secret_validation(self):
        """Production environment enforces explicit secret key configuration."""
        from config import ProductionConfig

        # Default keys trigger ValueError
        with self.assertRaises(ValueError):
            ProductionConfig.validate_production_keys()

    def test_health_check_endpoint(self):
        """System health check /api/health returns operational status without leaking credentials."""
        app = create_app(TestingConfig)
        client = app.test_client()
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("status", data)
        self.assertIn("database", data)
        # Ensure no sensitive secret values or password hashes are exposed in response
        self.assertNotIn("password_hash", str(data))
        self.assertNotIn("dev-jwt-secret", str(data))
        self.assertNotIn("SERVICE_ROLE", str(data))

    def test_production_app_instantiation(self):
        """Application creates properly in production mode with CORS restrictions."""
        from config import ProductionConfig

        app = create_app(ProductionConfig)
        self.assertFalse(app.debug)
        self.assertFalse(app.testing)


if __name__ == "__main__":
    unittest.main()
