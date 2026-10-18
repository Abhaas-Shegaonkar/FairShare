"""
Peer Feedback System Unit Tests (`tests/test_feedback.py`)
Validates structured 6-dimension teammate evaluations, anti-gaming guards (blocking self-reviews),
review completion status tracking, and anonymized rating summary aggregations.
"""
import unittest
from app import create_app
from config import TestingConfig
from services.auth_service import generate_jwt_token
from services.scoring_engine import calculate_member_contribution


class PeerFeedbackTestCase(unittest.TestCase):
    """End-to-end unit tests for Peer Feedback endpoints and service logic."""

    def setUp(self):
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()

        # Reviewer: Abhaas
        self.reviewer_id = "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"
        self.reviewer_email = "abhaas@college.edu"
        self.reviewer_name = "Abhaas"
        self.token = generate_jwt_token(self.reviewer_id, self.reviewer_email, self.reviewer_name)
        self.auth_headers = {
            "Authorization": f"Bearer {self.token}"
        }

        # Reviewee: Rohit
        self.reviewee_id = "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1"
        self.project_id = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"

    def test_submit_feedback_unauthorized(self):
        """POST /api/projects/<id>/feedback without token returns 401."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            json={
                "reviewee_id": self.reviewee_id,
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5
            }
        )
        self.assertEqual(response.status_code, 401)

    def test_submit_feedback_success_flat(self):
        """POST /api/projects/<id>/feedback records 6-dimension review with flat fields."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.auth_headers,
            json={
                "reviewee_id": self.reviewee_id,
                "participation_score": 5,
                "responsibility_score": 4,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 4,
                "timeliness_score": 4,
                "comments": "Great collaboration during backend sprint."
            }
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("message", data)

    def test_submit_feedback_success_nested_ratings(self):
        """POST /api/projects/<id>/feedback supports nested ratings dictionary and feedback alias."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.auth_headers,
            json={
                "reviewee_id": self.reviewee_id,
                "ratings": {
                    "participation": 5,
                    "responsibility": 5,
                    "quality": 4,
                    "collaboration": 5,
                    "communication": 4,
                    "timeliness": 5
                },
                "feedback": "Outstanding work on the sensor pipeline."
            }
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])

    def test_anti_gaming_blocks_self_review(self):
        """POST /api/projects/<id>/feedback rejects self-review with 400 CANNOT_SELF_REVIEW."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.auth_headers,
            json={
                "reviewee_id": self.reviewer_id,  # Self review!
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5,
                "comments": "Self assessment."
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "CANNOT_SELF_REVIEW")

    def test_submit_feedback_invalid_score_range(self):
        """POST /api/projects/<id>/feedback rejects scores outside 1-5 range."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.auth_headers,
            json={
                "reviewee_id": self.reviewee_id,
                "participation_score": 6,  # Invalid: > 5
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 0   # Invalid: < 1
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_submit_feedback_non_member(self):
        """POST /api/projects/<id>/feedback rejects reviewing a non-project member."""
        response = self.client.post(
            f"/api/projects/{self.project_id}/feedback",
            headers=self.auth_headers,
            json={
                "reviewee_id": "00000000-0000-0000-0000-000000009999",
                "participation_score": 5,
                "responsibility_score": 5,
                "quality_score": 5,
                "collaboration_score": 5,
                "communication_score": 5,
                "timeliness_score": 5
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertEqual(data["error"]["code"], "NOT_A_PROJECT_MEMBER")

    def test_get_feedback_status(self):
        """GET /api/projects/<id>/feedback/status returns list of reviewed teammates."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/feedback/status",
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("reviewed_member_ids", data["data"])
        self.assertIn("submitted_reviews_count", data["data"])

    def test_get_feedback_summary(self):
        """GET /api/projects/<id>/feedback/summary returns anonymized category averages."""
        response = self.client.get(
            f"/api/projects/{self.project_id}/feedback/summary",
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        res_data = data["data"]
        self.assertIn("average_rating", res_data)
        self.assertIn("total_reviews", res_data)
        self.assertIn("categories", res_data)

        cats = res_data["categories"]
        for dim in ["participation", "responsibility", "quality", "collaboration", "communication", "timeliness"]:
            self.assertIn(dim, cats)
            self.assertGreaterEqual(cats[dim], 1.0)
            self.assertLessEqual(cats[dim], 5.0)

    def test_scoring_integration_recomputes_score(self):
        """Contribution scoring engine recomputes peer feedback component after review."""
        contrib = calculate_member_contribution(self.project_id, self.reviewee_id)
        self.assertIn("peer_feedback", contrib["breakdown"])
        fb_factor = contrib["breakdown"]["peer_feedback"]
        self.assertGreater(fb_factor["score"], 0)
        self.assertEqual(fb_factor["weight"], 20)


if __name__ == "__main__":
    unittest.main()
