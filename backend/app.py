"""
FairShare Backend Application Entry Point
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config
from services.supabase_service import check_database_health


def create_app(config_class=None):
    if config_class is None:
        config_class = get_config()

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS with credentials support
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173", "http://127.0.0.1:5173"]),
        supports_credentials=True,
    )

    # Health check endpoint with database status
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_health = check_database_health()
        return jsonify({
            "status": "healthy" if db_health.get("connected") else "operational",
            "service": "FairShare API",
            "version": "1.0.0",
            "database": db_health
        }), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
