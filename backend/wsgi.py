"""
FairShare WSGI Production Entry Point (`wsgi.py`)
Production runner supporting:
  - Linux: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
  - Windows/Cross-platform: waitress-serve --port=5000 --call wsgi:create_app
  - Direct execution: python wsgi.py
"""

import os
import sys
import logging
from app import create_app
from config import get_config, ProductionConfig

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FairShareWSGI")

# Determine active configuration
config_cls = get_config()

# Validate production environment credentials if running in production mode
if config_cls == ProductionConfig:
    try:
        ProductionConfig.validate_production_keys()
        logger.info("Production configuration validated successfully. Debug mode disabled.")
    except ValueError as e:
        logger.warning(f"Production credentials warning: {str(e)}")

# Initialize application instance for WSGI servers
app = create_app(config_cls)


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 5000))
    env_name = os.getenv("FLASK_ENV", os.getenv("APP_ENV", "production")).lower()

    logger.info(f"Starting FairShare WSGI server in '{env_name}' mode on {host}:{port}...")

    # Platform-adaptive production server execution
    try:
        import waitress

        logger.info("Serving via Waitress production WSGI server...")
        waitress.serve(app, host=host, port=port, threads=8)
    except ImportError:
        logger.info("Waitress not available; falling back to standard server.")
        app.run(host=host, port=port, debug=False)
