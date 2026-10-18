"""
FairShare Reference Seed Dataset Utility (`utils/seed_data.py`)
Populates and verifies the canonical "Smart Water Management System" project:
  - Abhaas (Frontend Lead): 82%
  - Rohit (Backend Developer): 76%
  - Denesh (Hardware Engineer): 68%
  - Aditya (Documentation & QA): 61%

Usage:
    python utils/seed_data.py
    python -m utils.seed_data
    python utils/seed_data.py --verify-only
"""

import sys
import os
import argparse
import logging

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.supabase_service import get_supabase_admin_client, get_supabase_client  # noqa: E402
from services.scoring_engine import (  # noqa: E402
    calculate_team_contributions,
    calculate_member_contribution,
)  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SeedData")

# Canonical IDs
PROJECT_ID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"
USER_ABHAAS = "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0"
USER_ROHIT = "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1"
USER_DENESH = "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2"
USER_ADITYA = "f6092fe7-c2d0-4f31-2727-3f4f90160c03"

SEED_USERS = [
    {
        "id": USER_ABHAAS,
        "email": "abhaas@college.edu",
        "name": "Abhaas",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Abhaas",
        "password_hash": "$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy",
    },
    {
        "id": USER_ROHIT,
        "email": "rohit@college.edu",
        "name": "Rohit",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit",
        "password_hash": "$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy",
    },
    {
        "id": USER_DENESH,
        "email": "denesh@college.edu",
        "name": "Denesh",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Denesh",
        "password_hash": "$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy",
    },
    {
        "id": USER_ADITYA,
        "email": "aditya@college.edu",
        "name": "Aditya",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
        "password_hash": "$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy",
    },
]

SEED_PROJECT = {
    "id": PROJECT_ID,
    "name": "Smart Water Management System",
    "description": (
        "An IoT and full-stack cloud platform for real-time monitoring and autonomous "
        "conservation of campus water distribution networks."
    ),
    "category": "IoT & Full-Stack",
    "start_date": "2026-08-01",
    "deadline": "2026-09-30",
    "created_by": USER_ABHAAS,
}

SEED_MEMBERS = [
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ABHAAS,
        "role": "Frontend Lead",
        "joined_at": "2026-08-01 09:00:00+00",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ROHIT,
        "role": "Backend Developer",
        "joined_at": "2026-08-01 09:30:00+00",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_DENESH,
        "role": "Hardware Engineer",
        "joined_at": "2026-08-01 10:00:00+00",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ADITYA,
        "role": "Documentation & QA",
        "joined_at": "2026-08-01 10:15:00+00",
    },
]

SEED_SNAPSHOTS = [
    # Week 1
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ABHAAS,
        "week_label": "Week 1",
        "score": 55.0,
        "snapshot_date": "2026-08-07",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ROHIT,
        "week_label": "Week 1",
        "score": 50.0,
        "snapshot_date": "2026-08-07",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_DENESH,
        "week_label": "Week 1",
        "score": 40.0,
        "snapshot_date": "2026-08-07",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ADITYA,
        "week_label": "Week 1",
        "score": 45.0,
        "snapshot_date": "2026-08-07",
    },
    # Week 2
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ABHAAS,
        "week_label": "Week 2",
        "score": 67.0,
        "snapshot_date": "2026-08-14",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ROHIT,
        "week_label": "Week 2",
        "score": 62.0,
        "snapshot_date": "2026-08-14",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_DENESH,
        "week_label": "Week 2",
        "score": 54.0,
        "snapshot_date": "2026-08-14",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ADITYA,
        "week_label": "Week 2",
        "score": 50.0,
        "snapshot_date": "2026-08-14",
    },
    # Week 3
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ABHAAS,
        "week_label": "Week 3",
        "score": 76.0,
        "snapshot_date": "2026-08-21",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ROHIT,
        "week_label": "Week 3",
        "score": 70.0,
        "snapshot_date": "2026-08-21",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_DENESH,
        "week_label": "Week 3",
        "score": 62.0,
        "snapshot_date": "2026-08-21",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ADITYA,
        "week_label": "Week 3",
        "score": 58.0,
        "snapshot_date": "2026-08-21",
    },
    # Week 4: Benchmark targets
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ABHAAS,
        "week_label": "Week 4",
        "score": 82.0,
        "snapshot_date": "2026-08-28",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ROHIT,
        "week_label": "Week 4",
        "score": 76.0,
        "snapshot_date": "2026-08-28",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_DENESH,
        "week_label": "Week 4",
        "score": 68.0,
        "snapshot_date": "2026-08-28",
    },
    {
        "project_id": PROJECT_ID,
        "user_id": USER_ADITYA,
        "week_label": "Week 4",
        "score": 61.0,
        "snapshot_date": "2026-08-28",
    },
]

EXPECTED_BENCHMARKS = {
    USER_ABHAAS: {"name": "Abhaas", "role": "Frontend Lead", "expected_score": 82},
    USER_ROHIT: {"name": "Rohit", "role": "Backend Developer", "expected_score": 76},
    USER_DENESH: {"name": "Denesh", "role": "Hardware Engineer", "expected_score": 68},
    USER_ADITYA: {"name": "Aditya", "role": "Documentation & QA", "expected_score": 61},
}


def seed_database(client=None) -> bool:
    """Inserts or upserts reference seed records into Supabase if configured."""
    client = client or get_supabase_admin_client() or get_supabase_client()
    if not client:
        logger.info("Supabase client is not configured; running in standalone verification mode.")
        return True

    try:
        logger.info("Connecting to Supabase to seed database...")

        # 1. Users
        for u in SEED_USERS:
            client.table("users").upsert(u, on_conflict="email").execute()
        logger.info(f"Upserted {len(SEED_USERS)} reference users.")

        # 2. Project
        client.table("projects").upsert(SEED_PROJECT, on_conflict="id").execute()
        logger.info(f"Upserted project: '{SEED_PROJECT['name']}' ({PROJECT_ID})")

        # 3. Members
        for m in SEED_MEMBERS:
            client.table("project_members").upsert(m, on_conflict="project_id,user_id").execute()
        logger.info(f"Upserted {len(SEED_MEMBERS)} project memberships.")

        # 4. Snapshots
        for s in SEED_SNAPSHOTS:
            client.table("contribution_snapshots").upsert(
                s, on_conflict="project_id,user_id,week_label"
            ).execute()
        logger.info(f"Upserted {len(SEED_SNAPSHOTS)} weekly trend checkpoints.")

        return True
    except Exception as e:
        logger.error(f"Error seeding Supabase database: {str(e)}")
        return False


def verify_seed_dataset() -> bool:
    """Verifies that the reference Smart Water Management System produces the expected benchmark scores."""
    logger.info("=" * 68)
    logger.info("FAIRSHARE REFERENCE BENCHMARK VERIFICATION (Phase 12)")
    logger.info("=" * 68)

    team_contributions = calculate_team_contributions(PROJECT_ID)
    score_by_user = {}

    for member in team_contributions:
        u_id = member.get("user_id") or member.get("id")
        score = member.get("overall_score") or member.get("fair_score") or member.get("score")
        score_by_user[u_id] = score

    all_passed = True
    print("\n+--------------------+----------------------+----------------+----------------+")
    print("| Member             | Role                 | Target Score   | Computed Score |")
    print("+--------------------+----------------------+----------------+----------------+")

    for u_id, expected in EXPECTED_BENCHMARKS.items():
        name = expected["name"]
        role = expected["role"]
        target = expected["expected_score"]
        computed = score_by_user.get(u_id)

        # In fallback mode, compute individual score
        if computed is None:
            detail = calculate_member_contribution(PROJECT_ID, u_id)
            computed = detail.get("overall_score", 0)

        match = computed == target
        if not match:
            all_passed = False

        status = "MATCH" if match else "MISMATCH"
        print(f"| {name:<18} | {role:<20} | {target}%           | {computed}% ({status})   |")

    print("+--------------------+----------------------+----------------+----------------+\n")

    if all_passed:
        logger.info("All 4 teammate contribution targets verified successfully!")
    else:
        logger.warning("Some scores differed from the exact benchmark targets.")

    return all_passed


def main():
    parser = argparse.ArgumentParser(
        description="FairShare Seed Data Initializer & Benchmark Verifier"
    )
    parser.add_argument(
        "--verify-only", action="store_true", help="Only verify benchmark scores without writing"
    )
    args = parser.parse_args()

    if not args.verify_only:
        seed_database()

    success = verify_seed_dataset()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
