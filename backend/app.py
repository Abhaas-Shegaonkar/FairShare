"""
FairShare Backend Application Entry Point & App Factory
Configures Flask, enables CORS, registers centralized error handlers,
initializes database connectivity, and binds modular API blueprints.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config
from services.supabase_service import check_database_health
from middleware.error_handler import register_error_handlers
from routes import (
    auth_bp,
    projects_bp,
    tasks_bp,
    evidence_bp,
    feedback_bp,
    analytics_bp,
)


def create_app(config_class=None):
    """
    Application factory for the FairShare REST backend.
    """
    if config_class is None:
        config_class = get_config()

    app = Flask(__name__)
    app.config.from_object(config_class)

    # 1. Enable CORS with credentials support
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"]),
        supports_credentials=True,
    )

    # 2. Register Centralized Error Handling Middleware
    register_error_handlers(app)

    # 3. System Health Check Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_health = check_database_health()
        return jsonify({
            "status": "healthy" if db_health.get("connected") else "operational",
            "service": "FairShare API",
            "version": "1.0.0",
            "database": db_health
        }), 200

    # 4. Register Modular API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(evidence_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(analytics_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
