"""
Project and Team Management Service
Handles workspace creation, membership validation, roster management,
and project activity metrics.
"""
import logging
from datetime import datetime, timezone, date
from typing import List, Optional
from services.supabase_service import get_supabase_admin_client, get_supabase_client
from middleware.error_handler import NotFoundError, ForbiddenError, ConflictError, APIError

logger = logging.getLogger(__name__)


def is_user_project_member(project_id: str, user_id: str) -> bool:
    """
    Checks if a student is an authorized member or creator of a project workspace.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return True  # Permissive dev mode when DB is unconfigured

    try:
        # Check project_members table
        res = client.table("project_members").select("id").eq("project_id", project_id).eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            return True

        # Check projects created_by
        proj = client.table("projects").select("created_by").eq("id", project_id).execute()
        if proj.data and len(proj.data) > 0 and proj.data[0].get("created_by") == user_id:
            return True

        return False
    except Exception as e:
        logger.error(f"Error checking project membership: {str(e)}")
        return False


def require_project_membership(project_id: str, user_id: str):
    """
    Asserts that the user belongs to the project; raises ForbiddenError if unauthorized.
    """
    if not is_user_project_member(project_id, user_id):
        raise ForbiddenError(
            message="You do not have permission to access or modify this project workspace.",
            code="NOT_A_PROJECT_MEMBER"
        )


def list_user_projects(user_id: str) -> List[dict]:
    """
    Retrieves all projects the user is a member of, along with progress calculations
    and team size metrics for the global dashboard.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        # Reference demo project fallback
        return [{
            "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": "Smart Water Management System",
            "description": "An IoT and full-stack cloud platform for real-time monitoring and autonomous conservation of campus water networks.",
            "category": "IoT & Full-Stack",
            "start_date": "2026-08-01",
            "deadline": "2026-09-30",
            "my_role": "Member",
            "total_tasks": 20,
            "completed_tasks": 18,
            "progress_percentage": 90.0,
            "members_count": 4
        }]

    try:
        # Get memberships for user
        memberships_res = client.table("project_members").select("project_id, role").eq("user_id", user_id).execute()
        memberships = memberships_res.data or []
        project_ids = [m["project_id"] for m in memberships]

        if not project_ids:
            return []

        # Get projects
        projects_res = client.table("projects").select("*").in_("id", project_ids).execute()
        projects = projects_res.data or []

        # Build map of user's role
        roles_by_proj = {m["project_id"]: m.get("role", "Member") for m in memberships}

        results = []
        for p in projects:
            p_id = p["id"]
            # Fetch tasks stats
            tasks_res = client.table("tasks").select("id, status").eq("project_id", p_id).execute()
            tasks = tasks_res.data or []
            total_tasks = len(tasks)
            completed_tasks = sum(1 for t in tasks if t.get("status") == "Completed")
            progress = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

            # Fetch members count
            members_count_res = client.table("project_members").select("id", count="exact").eq("project_id", p_id).execute()
            members_count = members_count_res.count if members_count_res.count is not None else 1

            results.append({
                "id": p_id,
                "name": p["name"],
                "description": p.get("description", ""),
                "category": p.get("category", "General"),
                "start_date": p["start_date"],
                "deadline": p["deadline"],
                "my_role": roles_by_proj.get(p_id, "Member"),
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "progress_percentage": progress,
                "members_count": members_count
            })

        return results
    except Exception as e:
        logger.error(f"Error listing user projects: {str(e)}")
        raise APIError(f"Failed to fetch projects: {str(e)}", status_code=500)


def create_project(creator_user_id: str, creator_name: str, data: dict) -> dict:
    """
    Creates a new project workspace, adds creator as project lead, and queues invites.
    """
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        return {
            "project_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
            "name": data.get("name"),
            "active_members_count": 1,
            "pending_invitations_count": len(data.get("members", [])),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

    try:
        # 1. Insert Project
        proj_insert = client.table("projects").insert({
            "name": data["name"],
            "description": data.get("description", ""),
            "category": data["category"],
            "start_date": data["start_date"],
            "deadline": data["deadline"],
            "created_by": creator_user_id
        }).execute()

        if not proj_insert.data:
            raise APIError("Failed to create project workspace.", status_code=500)

        project = proj_insert.data[0]
        project_id = project["id"]

        # 2. Add creator to project_members as Project Creator
        client.table("project_members").insert({
            "project_id": project_id,
            "user_id": creator_user_id,
            "role": "Project Lead"
        }).execute()

        active_count = 1
        pending_count = 0

        # 3. Process invited members
        invited_members = data.get("members", [])
        for item in invited_members:
            email = item.get("email", "").strip().lower()
            role = item.get("role", "Member").strip()
            if not email:
                continue

            # Check if user already exists
            user_res = client.table("users").select("id, name").eq("email", email).execute()
            if user_res.data and len(user_res.data) > 0:
                invited_user_id = user_res.data[0]["id"]
                if invited_user_id != creator_user_id:
                    client.table("project_members").insert({
                        "project_id": project_id,
                        "user_id": invited_user_id,
                        "role": role
                    }).execute()
                    active_count += 1
            else:
                client.table("project_invitations").insert({
                    "project_id": project_id,
                    "email": email,
                    "role": role,
                    "invited_by": creator_user_id,
                    "status": "pending"
                }).execute()
                pending_count += 1

        # 4. Log in activity_logs
        client.table("activity_logs").insert({
            "project_id": project_id,
            "user_id": creator_user_id,
            "action_type": "PROJECT_CREATED",
            "description": f"{creator_name} created project workspace '{data['name']}'."
        }).execute()

        return {
            "project_id": project_id,
            "name": project["name"],
            "active_members_count": active_count,
            "pending_invitations_count": pending_count,
            "created_at": project["created_at"]
        }
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise APIError(f"Failed to create project: {str(e)}", status_code=500)


def get_project_details(project_id: str, user_id: str) -> dict:
    """
    Retrieves full project workspace details, member list, and overall stats.
    Enforces authorization check.
    """
    require_project_membership(project_id, user_id)
    client = get_supabase_admin_client() or get_supabase_client()

    if not client:
        return {
            "id": project_id,
            "name": "Smart Water Management System",
            "description": "IoT-based sensor network for water distribution.",
            "category": "IoT & Full-Stack",
            "start_date": "2026-08-01",
            "deadline": "2026-09-30",
            "members": [
                {"user_id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0", "name": "Abhaas", "email": "abhaas@college.edu", "role": "Frontend Lead"},
                {"user_id": "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1", "name": "Rohit", "email": "rohit@college.edu", "role": "Backend Developer"},
                {"user_id": "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2", "name": "Denesh", "email": "denesh@college.edu", "role": "Hardware Engineer"},
                {"user_id": "f6092fe7-c2d0-4f31-2727-3f4f90160c03", "name": "Aditya", "email": "aditya@college.edu", "role": "Documentation & QA"}
            ],
            "stats": {
                "total_tasks": 20,
                "completed_tasks": 18,
                "progress": "90%",
                "days_remaining": 16
            }
        }

    try:
        # Get project
        proj_res = client.table("projects").select("*").eq("id", project_id).execute()
        if not proj_res.data or len(proj_res.data) == 0:
            raise NotFoundError("Project workspace not found.", code="PROJECT_NOT_FOUND")

        project = proj_res.data[0]

        # Get members with user details
        members_res = client.table("project_members").select("role, joined_at, users(id, name, email, avatar_url)").eq("project_id", project_id).execute()
        members_data = []
        for m in (members_res.data or []):
            u = m.get("users") or {}
            members_data.append({
                "user_id": u.get("id"),
                "name": u.get("name"),
                "email": u.get("email"),
                "avatar_url": u.get("avatar_url"),
                "role": m.get("role"),
                "joined_at": m.get("joined_at")
            })

        # Get tasks stats
        tasks_res = client.table("tasks").select("id, status").eq("project_id", project_id).execute()
        tasks = tasks_res.data or []
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.get("status") == "Completed")
        progress = f"{round((completed_tasks / total_tasks * 100))}%" if total_tasks > 0 else "0%"

        # Days remaining
        deadline_str = project.get("deadline")
        days_rem = 0
        if deadline_str:
            deadline_date = datetime.strptime(str(deadline_str)[:10], "%Y-%m-%d").date()
            days_rem = max(0, (deadline_date - date.today()).days)

        return {
            "id": project["id"],
            "name": project["name"],
            "description": project.get("description", ""),
            "category": project.get("category", "General"),
            "start_date": project["start_date"],
            "deadline": project["deadline"],
            "created_by": project.get("created_by"),
            "members": members_data,
            "stats": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "progress": progress,
                "days_remaining": days_rem
            }
        }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error fetching project workspace details: {str(e)}")
        raise APIError(f"Failed to fetch project workspace: {str(e)}", status_code=500)


def add_project_member(project_id: str, inviter_user_id: str, inviter_name: str, email: str, role: str) -> dict:
    """
    Invites or adds a member to the project workspace.
    """
    require_project_membership(project_id, inviter_user_id)
    client = get_supabase_admin_client() or get_supabase_client()
    clean_email = email.strip().lower()

    if not client:
        return {
            "email": clean_email,
            "role": role,
            "status": "added"
        }

    try:
        # Check if email is already a member
        user_res = client.table("users").select("id, name").eq("email", clean_email).execute()
        if user_res.data and len(user_res.data) > 0:
            existing_user = user_res.data[0]
            existing_user_id = existing_user["id"]

            member_check = client.table("project_members").select("id").eq("project_id", project_id).eq("user_id", existing_user_id).execute()
            if member_check.data and len(member_check.data) > 0:
                raise ConflictError("This student is already a member of this project.", code="MEMBER_ALREADY_EXISTS")

            # Add to project_members
            client.table("project_members").insert({
                "project_id": project_id,
                "user_id": existing_user_id,
                "role": role
            }).execute()

            # Log activity
            client.table("activity_logs").insert({
                "project_id": project_id,
                "user_id": inviter_user_id,
                "action_type": "MEMBER_JOINED",
                "description": f"{inviter_name} added {existing_user.get('name', clean_email)} to the team as {role}."
            }).execute()

            return {
                "email": clean_email,
                "role": role,
                "status": "added"
            }
        else:
            # Create or update pending invitation
            client.table("project_invitations").upsert({
                "project_id": project_id,
                "email": clean_email,
                "role": role,
                "invited_by": inviter_user_id,
                "status": "pending"
            }, on_conflict="project_id,email").execute()

            return {
                "email": clean_email,
                "role": role,
                "status": "invited"
            }
    except APIError:
        raise
    except Exception as e:
        logger.error(f"Error adding project member: {str(e)}")
        raise APIError(f"Failed to add project member: {str(e)}", status_code=500)
