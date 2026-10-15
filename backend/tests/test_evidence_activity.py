"""
Work Evidence & Activity Tracking Unit Tests
Validates file upload restrictions, MIME/extension security validation,
deliverable proof attachment, and chronological activity stream retrieval.
"""
import io
import unittest
from app import create_app
from config import TestingConfig
from services.auth_service import generate_jwt_token


class EvidenceActivityTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test client with authenticated Bearer token."""
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()
        self.user_id = "test-user-uuid-1001"
        self.user_email = "student@college.edu"
        self.user_name = "Abhaas"
        self.token = generate_jwt_token(self.user_id, self.user_email, self.user_name)
        self.auth_headers = {
            "Authorization": f"Bearer {self.token}"
        }
        self.project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
        self.task_id = "10000000-0000-0000-0000-000000000001"

    def test_upload_missing_file_field(self):
        """POST /api/upload returns 400 when 'file' is not present in form data."""
        response = self.client.post("/api/upload", headers=self.auth_headers, data={
            "project_id": self.project_id
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "MISSING_FILE")

    def test_upload_missing_project_id(self):
        """POST /api/upload returns 400 when 'project_id' is omitted."""
        file_content = io.BytesIO(b"Sample PDF deliverable content")
        response = self.client.post(
            "/api/upload",
            headers=self.auth_headers,
            content_type="multipart/form-data",
            data={
                "file": (file_content, "deliverable.pdf")
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "MISSING_PROJECT_ID")

    def test_upload_blocks_dangerous_executable(self):
        """POST /api/upload rejects executable files (.exe) with security error."""
        file_content = io.BytesIO(b"echo Malicious Executable")
        response = self.client.post(
            "/api/upload",
            headers=self.auth_headers,
            content_type="multipart/form-data",
            data={
                "file": (file_content, "malicious_script.exe"),
                "project_id": self.project_id
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "DANGEROUS_FILE_TYPE")

    def test_upload_valid_document_success(self):
        """POST /api/upload accepts valid PDF document."""
        file_content = io.BytesIO(b"%PDF-1.4 sample pdf content")
        response = self.client.post(
            "/api/upload",
            headers=self.auth_headers,
            content_type="multipart/form-data",
            data={
                "file": (file_content, "whitepaper.pdf"),
                "project_id": self.project_id
            }
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("url", data["data"])
        self.assertEqual(data["data"]["file_name"], "whitepaper.pdf")

    def test_attach_evidence_validation_error(self):
        """POST /api/tasks/<id>/evidence rejects payloads with missing fields."""
        response = self.client.post(f"/api/tasks/{self.task_id}/evidence", headers=self.auth_headers, json={
            "notes": "Missing type, title, url"
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_attach_evidence_success(self):
        """POST /api/tasks/<id>/evidence records proof artifact."""
        response = self.client.post(f"/api/tasks/{self.task_id}/evidence", headers=self.auth_headers, json={
            "type": "github",
            "title": "PR #42: Ingestion Queue",
            "url": "https://github.com/campus-iot/water/pull/42",
            "notes": "Tested on local broker."
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("evidence_id", data["data"])
        self.assertEqual(data["data"]["type"], "github")

    def test_get_task_evidence(self):
        """GET /api/tasks/<id>/evidence returns deliverables for task."""
        response = self.client.get(f"/api/tasks/{self.task_id}/evidence", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_get_project_evidence_vault(self):
        """GET /api/projects/<id>/evidence returns full project evidence vault."""
        response = self.client.get(f"/api/projects/{self.project_id}/evidence", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)

    def test_get_project_activity_stream(self):
        """GET /api/projects/<id>/activity returns chronological audit stream."""
        response = self.client.get(f"/api/projects/{self.project_id}/activity", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIsInstance(data["data"], list)


if __name__ == "__main__":
    unittest.main()
