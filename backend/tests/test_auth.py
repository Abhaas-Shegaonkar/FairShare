"""
Authentication & Authorization Unit Tests
Validates student registration, password hashing, JWT token issuance,
login verification, and @require_auth protected route behavior.
"""
import unittest
from app import create_app
from config import TestingConfig
from services.auth_service import hash_password, verify_password, generate_jwt_token, decode_jwt_token


class AuthTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test Flask client with TestingConfig."""
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()

    def test_password_hashing_and_verification(self):
        """Ensure bcrypt securely hashes and verifies passwords."""
        plain = "SecurePassword123!"
        hashed = hash_password(plain)
        self.assertNotEqual(plain, hashed)
        self.assertTrue(verify_password(plain, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_jwt_token_generation_and_decoding(self):
        """Ensure JWT tokens are signed, contain required claims, and decode correctly."""
        user_id = "test-uuid-1234"
        email = "test@college.edu"
        name = "Test Student"
        token = generate_jwt_token(user_id, email, name)
        
        self.assertIsInstance(token, str)
        payload = decode_jwt_token(token)
        self.assertEqual(payload["sub"], user_id)
        self.assertEqual(payload["email"], email)
        self.assertEqual(payload["name"], name)
        self.assertEqual(payload["iss"], "fairshare-auth")

    def test_register_validation_error_on_short_password(self):
        """Ensure registration rejects passwords shorter than 8 characters."""
        response = self.client.post("/api/auth/register", json={
            "email": "student@college.edu",
            "password": "short",
            "name": "Student"
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_register_validation_error_on_invalid_email(self):
        """Ensure registration rejects malformed email addresses."""
        response = self.client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "ValidPassword123!",
            "name": "Student"
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    def test_register_success(self):
        """Ensure valid registration returns 201 Created and JWT token."""
        response = self.client.post("/api/auth/register", json={
            "email": "fresh_student@college.edu",
            "password": "SecurePassword123!",
            "name": "Fresh Student"
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])
        self.assertEqual(data["data"]["user"]["email"], "fresh_student@college.edu")
        # Ensure password_hash is not exposed in response
        self.assertNotIn("password_hash", data["data"]["user"])

    def test_login_success(self):
        """Ensure valid login returns 200 OK and JWT token."""
        response = self.client.post("/api/auth/login", json={
            "email": "student@college.edu",
            "password": "Password123!"
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("token", data["data"])

    def test_protected_route_missing_token(self):
        """Ensure GET /api/auth/me returns 401 Unauthorized when token is absent."""
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "UNAUTHORIZED")

    def test_protected_route_malformed_header(self):
        """Ensure GET /api/auth/me returns 401 when Authorization header does not use Bearer format."""
        response = self.client.get("/api/auth/me", headers={
            "Authorization": "Basic some_basic_token"
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "INVALID_HEADER_FORMAT")

    def test_protected_route_valid_token(self):
        """Ensure GET /api/auth/me succeeds with a valid Bearer token."""
        token = generate_jwt_token("test-user-uuid", "verified@college.edu", "Verified Student")
        response = self.client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("user", data["data"])
        self.assertNotIn("password_hash", data["data"]["user"])


if __name__ == "__main__":
    unittest.main()
