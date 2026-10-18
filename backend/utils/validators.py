"""
Request Body Validators
Defines strongly-typed Pydantic schemas for all API payloads and provides
a reusable Flask decorator for centralized input validation and sanitization.
"""
from functools import wraps
from typing import Any, List, Literal, Optional
from datetime import date
from flask import request, jsonify
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ==============================================================================
# 1. Validation Decorator
# ==============================================================================

def validate_body(schema_cls):
    """
    Decorator for Flask route handlers. Validates incoming JSON request payload
    against the provided Pydantic model.
    
    If valid:
      Passes the parsed Pydantic model instance as `validated_data` to the route.
    If invalid:
      Returns standard 400 Bad Request error envelope matching FairShare API spec.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "INVALID_CONTENT_TYPE",
                        "message": "Content-Type must be application/json.",
                        "details": None
                    }
                }), 400

            json_data = request.get_json(silent=True)
            if json_data is None:
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "MALFORMED_JSON",
                        "message": "The request body could not be parsed as valid JSON.",
                        "details": None
                    }
                }), 400

            try:
                validated_instance = schema_cls.model_validate(json_data)
            except Exception as e:
                # Format Pydantic errors into readable structure
                errors = []
                if hasattr(e, "errors"):
                    for err in e.errors():
                        loc = " -> ".join(str(item) for item in err.get("loc", []))
                        errors.append({
                            "field": loc,
                            "issue": err.get("msg")
                        })
                else:
                    errors.append({"issue": str(e)})

                return jsonify({
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "One or more required fields are missing or invalid.",
                        "details": errors
                    }
                }), 400

            kwargs["validated_data"] = validated_instance
            return fn(*args, **kwargs)

        return wrapper
    return decorator


# ==============================================================================
# 2. Authentication Schemas
# ==============================================================================

class RegisterSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("A valid email address is required.")
        return v


class LoginSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        return v.lower()


# ==============================================================================
# 3. Project Schemas
# ==============================================================================

class MemberInviteItem(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=5, max_length=255)
    role: str = Field(..., min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        return v.lower()


class CreateProjectSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(default="", max_length=2000)
    category: str = Field(..., min_length=1, max_length=100)
    start_date: str = Field(..., description="Project start date (YYYY-MM-DD)")
    deadline: str = Field(..., description="Project delivery deadline (YYYY-MM-DD)")
    members: Optional[List[MemberInviteItem]] = Field(default_factory=list)

    @model_validator(mode="after")
    def check_dates(self):
        if self.start_date and self.deadline and self.deadline < self.start_date:
            raise ValueError("Project deadline must not be earlier than start_date.")
        return self


class AddMemberSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: str = Field(..., min_length=5, max_length=255)
    role: str = Field(..., min_length=1, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        return v.lower()


# ==============================================================================
# 4. Task Schemas
# ==============================================================================

class CreateTaskSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default="", max_length=2000)
    priority: Literal["Low", "Medium", "High", "Critical"] = Field(default="Medium")
    deadline: Optional[str] = Field(default=None, description="Task deadline (YYYY-MM-DD)")
    assigned_to: Optional[str] = Field(default=None, description="UUID of assigned team member")


class UpdateTaskSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    priority: Optional[Literal["Low", "Medium", "High", "Critical"]] = None
    deadline: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[Literal["To Do", "In Progress", "Completed"]] = None


class UpdateTaskStatusSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    status: Literal["To Do", "In Progress", "Completed"] = Field(...)


# ==============================================================================
# 5. Work Evidence Schemas
# ==============================================================================

class AttachEvidenceSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: Literal["link", "file", "github", "github_pr", "figma", "document"] = Field(
        ...,
        description="Evidence subtype: 'github'/'github_pr' for PRs, 'figma' for design boards, 'document' for PDFs/docs, 'link' for general URLs, 'file' for uploaded storage artifacts"
    )
    title: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=3, max_length=2048)
    notes: Optional[str] = Field(default="", max_length=1000)


# ==============================================================================
# 6. Peer Feedback Schemas
# ==============================================================================

class SubmitFeedbackSchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    reviewee_id: str = Field(..., min_length=1, description="UUID of the student being reviewed")
    participation_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    responsibility_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    quality_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    collaboration_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    communication_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    timeliness_score: int = Field(..., ge=1, le=5, description="1 to 5 rating scale")
    comments: Optional[str] = Field(default="", max_length=2000)
