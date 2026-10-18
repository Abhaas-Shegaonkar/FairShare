"""
Project & Task Management Unit Tests
Validates project workspace creation, roster management, task board queries,
status transitions, and @require_auth authorization enforcement.
"""

import unittest
from app import create_app
from config import TestingConfig
from services.auth_service import generate_jwt_token


class ProjectTaskTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test Flask client with authenticated token."""
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()
        self.user_id = "test-user-uuid-1001"
        self.user_email = "lead@college.edu"
        self.user_name = "Team Lead"
        self.token = generate_jwt_token(self.user_id, self.user_email, self.user_name)
        self.auth_headers = {"Authorization": f"Bearer {self.token}"}

    def test_list_projects_unauthorized(self):
        """GET /api/projects without token returns 401."""
        response = self.client.get("/api/projects")
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_list_projects_authorized(self):
        """GET /api/projects with token returns 200."""
        response = self.client.get("/api/projects", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_create_project_invalid_dates(self):
        """POST /api/projects rejects deadline earlier than start_date."""
        response = self.client.post(
            "/api/projects",
            headers=self.auth_headers,
            json={
                "name": "Invalid Date Project",
                "category": "Academic",
                "start_date": "2026-09-30",
                "deadline": "2026-08-01",
            },
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_create_project_success(self):
        """POST /api/projects creates workspace and queues invites."""
        response = self.client.post(
            "/api/projects",
            headers=self.auth_headers,
            json={
                "name": "Autonomous Drone Navigation",
                "description": "Vision-based drone tracking.",
                "category": "Robotics",
                "start_date": "2026-08-01",
                "deadline": "2026-10-31",
                "members": [
                    {"email": "peer1@college.edu", "role": "CV Engineer"},
                    {"email": "peer2@college.edu", "role": "Flight Dynamics"},
                ],
            },
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("project_id", data["data"])

    def test_get_project_workspace_details(self):
        """GET /api/projects/<id> returns project workspace metadata and roster."""
        project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        response = self.client.get(f"/api/projects/{project_id}", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("members", data["data"])
        self.assertIn("stats", data["data"])

    def test_add_project_member(self):
        """POST /api/projects/<id>/members adds or invites team member."""
        project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        response = self.client.post(
            f"/api/projects/{project_id}/members",
            headers=self.auth_headers,
            json={"email": "new_member@college.edu", "role": "QA Specialist"},
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("status", data["data"])

    def test_list_tasks(self):
        """GET /api/projects/<id>/tasks returns task deliverables."""
        project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        response = self.client.get(f"/api/projects/{project_id}/tasks", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_create_task_validation_error(self):
        """POST /api/projects/<id>/tasks rejects payloads missing required title."""
        project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        response = self.client.post(
            f"/api/projects/{project_id}/tasks",
            headers=self.auth_headers,
            json={"description": "Missing title", "priority": "High"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_create_task_success(self):
        """POST /api/projects/<id>/tasks creates deliverable."""
        project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        response = self.client.post(
            f"/api/projects/{project_id}/tasks",
            headers=self.auth_headers,
            json={
                "title": "Calibrate Sonar Sensors",
                "description": "Hardware testing with breadboard.",
                "deadline": "2026-09-15T18:00:00Z",
                "priority": "High",
            },
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["title"], "Calibrate Sonar Sensors")

    def test_update_task_status_completed(self):
        """PATCH /api/tasks/<id>/status records completed_at server timestamp."""
        task_id = "10000000-0000-0000-0000-000000000001"
        response = self.client.patch(
            f"/api/tasks/{task_id}/status", headers=self.auth_headers, json={"status": "Completed"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "Completed")
        self.assertIsNotNone(data["data"]["completed_at"])
        self.assertIsNotNone(data["data"]["completed_by"])

    def test_seed_dataset_benchmarks(self):
        """Verifies utils.seed_data benchmarks match target 4-student prototype scores."""
        from utils.seed_data import verify_seed_dataset

        self.assertTrue(verify_seed_dataset())


if __name__ == "__main__":
    unittest.main()
