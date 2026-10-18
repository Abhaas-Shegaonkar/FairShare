"""
FairShare Snapshot Scheduler & CLI Utility (`utils/generate_snapshots.py`)
Computes and persists weekly historical checkpoints into `contribution_snapshots` table
for project progression trend charts.

Usage:
    # Run for a specific project:
    python -m utils.generate_snapshots --project-id <UUID>

    # Run for all projects in database:
    python -m utils.generate_snapshots --all

    # Run directly:
    python utils/generate_snapshots.py --project-id <UUID>
"""

import sys
import os
import argparse
import logging

# Ensure backend root is in Python module search path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.supabase_service import get_supabase_admin_client, get_supabase_client  # noqa: E402
from services.scoring_engine import generate_weekly_snapshots  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SnapshotScheduler")


def run_snapshots_for_project(project_id: str) -> int:
    """Computes and stores weekly historical snapshots for a single project."""
    logger.info(f"Generating weekly snapshots for project: {project_id}")
    try:
        snapshots = generate_weekly_snapshots(project_id=project_id)
        logger.info(f"Successfully generated {len(snapshots)} weekly checkpoints for {project_id}.")
        for s in snapshots:
            logger.info(
                f"  -> {s.get('week_label')} | User: {s.get('user_id')} | "
                f"Score: {s.get('score')}% | Date: {s.get('snapshot_date')}"
            )
        return len(snapshots)
    except Exception as e:
        logger.error(f"Failed to generate snapshots for project {project_id}: {str(e)}")
        return 0


def run_snapshots_for_all_projects() -> int:
    """Fetches all projects from database and computes weekly checkpoints for each."""
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        logger.warning(
            "Supabase client is not configured. Running demonstration project snapshots."
        )
        return run_snapshots_for_project("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d")

    try:
        res = client.table("projects").select("id, name").execute()
        projects = res.data or []
        if not projects:
            logger.info("No projects found in database.")
            return 0

        total_generated = 0
        logger.info(f"Found {len(projects)} projects. Starting snapshot batch job...")
        for p in projects:
            p_id = p["id"]
            p_name = p.get("name", "Untitled")
            logger.info(f"Processing project: '{p_name}' ({p_id})")
            count = run_snapshots_for_project(p_id)
            total_generated += count

        logger.info(f"Batch snapshot job finished. Total snapshots generated: {total_generated}")
        return total_generated
    except Exception as e:
        logger.error(f"Error querying projects: {str(e)}")
        return 0


def main():
    parser = argparse.ArgumentParser(
        description="FairShare Weekly Contribution Snapshot Scheduler Utility"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--project-id", type=str, help="UUID of target project to compute snapshots for"
    )
    group.add_argument(
        "--all", action="store_true", help="Generate snapshots for all active projects in database"
    )

    args = parser.parse_args()

    if args.project_id:
        count = run_snapshots_for_project(args.project_id)
        sys.exit(0 if count > 0 else 1)
    elif args.all:
        count = run_snapshots_for_all_projects()
        sys.exit(0 if count >= 0 else 1)


if __name__ == "__main__":
    main()
