"""
FairShare Backend Application Entry Point
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS
    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:5173"]))

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "FairShare API",
            "version": "1.0.0"
        }), 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
