"""
FairShare API Route Blueprints
"""
from .auth_routes import auth_bp
from .project_routes import projects_bp
from .task_routes import tasks_bp
from .evidence_routes import evidence_bp
from .feedback_routes import feedback_bp
from .analytics_routes import analytics_bp

__all__ = [
    "auth_bp",
    "projects_bp",
    "tasks_bp",
    "evidence_bp",
    "feedback_bp",
    "analytics_bp",
]
