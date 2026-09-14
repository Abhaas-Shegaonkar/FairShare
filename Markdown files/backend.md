# FairShare Backend Implementation Specification

This document provides a comprehensive, implementation-ready backend technical specification for **FairShare**, directly aligned with [`idea.md`](idea.md), [`architecture.md`](architecture.md), and [`frontend.md`](frontend.md).

---

## 1. Backend Tech Stack & Libraries

- **Language / Runtime:** Python 3.10+
- **Web Framework:** Flask (Modular architecture with Blueprints & Flask-CORS)
- **Database & Storage:** Supabase (PostgreSQL engine + Supabase Storage for files)
- **Database Client:** `supabase-py` (official client) or SQLAlchemy with PostgreSQL connection string
- **Authentication:** Supabase Auth JWT verification or Python `PyJWT` with `bcrypt` for secure hashing
- **Environment Management:** `python-dotenv`
- **Validation & Serialization:** `pydantic` or `marshmallow`
- **Data Calculations:** Standard Python math / statistics libraries

---

## 2. Directory Structure

```text
fairshare-backend/
├── app.py                     # App factory and entry point
├── config.py                  # App configuration & environment loading
├── requirements.txt           # Python dependencies
├── .env.example               # Template for environment variables
├── services/
│   ├── __init__.py
│   ├── supabase_service.py    # Supabase client singleton & helper methods
│   ├── scoring_engine.py      # 5-factor contribution score calculation logic
│   ├── activity_logger.py     # Automatic, immutable event logging service
│   └── report_service.py      # Project audit and report summary compilation
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py         # Login, registration, token refresh
│   ├── project_routes.py      # Project CRUD and team member management
│   ├── task_routes.py         # Task CRUD, status updates, assignments
│   ├── evidence_routes.py     # Work evidence submissions and link validation
│   ├── feedback_routes.py     # 6-dimension peer evaluation and sanitization
│   └── analytics_routes.py    # Contribution scores, breakdown, trends, and reports
├── middleware/
│   ├── __init__.py
│   ├── auth_middleware.py     # JWT token validation decorator (`@require_auth`)
│   └── error_handler.py       # Global JSON error response handler
└── utils/
    ├── __init__.py
    ├── validators.py          # Input payload validators
    └── seed_data.py           # Pre-seeds "Smart Water Management System" sample data
```

---

## 3. Database Schema & Data Models (Supabase / PostgreSQL)

### 3.1 Users (`users`)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.2 Projects (`projects`)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.3 Project Members (`project_members`)
```sql
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- e.g., "Frontend Lead", "Backend Developer"
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);
```

### 3.4 Tasks (`tasks`)
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.5 Evidence (`evidence`)
```sql
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'github', 'figma', 'document', 'image', 'url'
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.6 Activity History (`activity_logs`)
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'TASK_CREATED', 'TASK_COMPLETED', 'EVIDENCE_SUBMITTED', 'FEEDBACK_SUBMITTED'
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3.7 Peer Feedback (`peer_feedback`)
```sql
CREATE TABLE peer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participation_score INT CHECK (participation_score BETWEEN 1 AND 5),
    responsibility_score INT CHECK (responsibility_score BETWEEN 1 AND 5),
    quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
    collaboration_score INT CHECK (collaboration_score BETWEEN 1 AND 5),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
    timeliness_score INT CHECK (timeliness_score BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, reviewer_id, reviewee_id),
    CHECK (reviewer_id <> reviewee_id) -- Anti-gaming: Cannot self-review
);
```

---

## 4. Core Scoring Engine Logic (`services/scoring_engine.py`)

The FairShare scoring model calculates a transparent contribution index based on 5 verifiable indicators.

### 4.1 Scoring Formula

$$\text{Total Contribution Score} = (S_{\text{completion}} \times 0.30) + (S_{\text{timeliness}} \times 0.20) + (S_{\text{evidence}} \times 0.20) + (S_{\text{feedback}} \times 0.20) + (S_{\text{participation}} \times 0.10)$$

Where:

1. **Task Completion ($S_{\text{completion}}$, 30%):**
   $$S_{\text{completion}} = \min\left(100, \frac{\text{Completed Tasks Assigned to User}}{\max(1, \text{Total Tasks Assigned to User})} \times 100\right)$$
   *Fallback:* If zero tasks are assigned to the member, defaults to peer team baseline (100% until tasks exist).

2. **Timeliness ($S_{\text{timeliness}}$, 20%):**
   $$S_{\text{timeliness}} = \frac{\text{Completed Tasks where } (\text{completed\_at} \le \text{deadline})}{\max(1, \text{Total Completed Tasks})} \times 100$$

3. **Work Evidence ($S_{\text{evidence}}$, 20%):**
   $$S_{\text{evidence}} = \frac{\text{Completed Tasks with }\ge 1\text{ Evidence Items Attached}}{\max(1, \text{Total Completed Tasks})} \times 100$$

4. **Peer Feedback ($S_{\text{feedback}}$, 20%):**
   For all reviews where `reviewee_id == user_id`:
   $$\text{AvgRating} = \frac{1}{6} \left(\overline{\text{Participation}} + \overline{\text{Responsibility}} + \overline{\text{Quality}} + \overline{\text{Collaboration}} + \overline{\text{Communication}} + \overline{\text{Timeliness}}\right)$$
   Normalized to percentage:
   $$S_{\text{feedback}} = \left(\frac{\text{AvgRating}}{5.0}\right) \times 100$$
   *(If no peer reviews have been submitted yet, this component defaults to 100% or is proportionally redistributed to avoid penalizing early stage progress).*

5. **Participation Activity ($S_{\text{participation}}$, 10%):**
   Calculates user's verified actions logged in `activity_logs` relative to the team's average activity count:
   $$S_{\text{participation}} = \min\left(100, \frac{\text{User Activity Count}}{\max(1, \text{Team Average Activity Count})} \times 80 + 20\right)$$

### 4.2 Explainability Output Structure
The scoring engine returns not just the aggregate number, but the exact explanation payload powering the frontend's *"Why did I get this score?"* modal:

```json
{
  "user_id": "u1",
  "name": "Abhaas",
  "overall_score": 82,
  "breakdown": {
    "task_completion": {
      "score": 90.0,
      "weight": 30,
      "contribution_points": 27.0,
      "details": "Completed 18 out of 20 assigned tasks."
    },
    "timeliness": {
      "score": 85.0,
      "weight": 20,
      "contribution_points": 17.0,
      "details": "15 out of 18 completed tasks were submitted on or before the deadline."
    },
    "work_evidence": {
      "score": 80.0,
      "weight": 20,
      "contribution_points": 16.0,
      "details": "16 tasks have verified links or files attached."
    },
    "peer_feedback": {
      "score": 78.0,
      "weight": 20,
      "contribution_points": 15.6,
      "details": "Received an average peer rating of 3.9 / 5.0 across 3 teammate reviews."
    },
    "participation": {
      "score": 75.0,
      "weight": 10,
      "contribution_points": 7.5,
      "details": "Logged 24 project actions, representing active engagement."
    }
  }
}
```

---

## 5. REST API Specification

### 5.1 Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/api/auth/register` | POST | Register student | `{ email, password, name }` | `{ user, token }` |
| `/api/auth/login` | POST | Authenticate student | `{ email, password }` | `{ user, token }` |
| `/api/auth/me` | GET | Retrieve authenticated profile | *Header: Bearer Token* | `{ user }` |

---

### 5.2 Project Endpoints (`/api/projects`)

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/api/projects` | GET | List user's projects | None | `[{ id, name, category, deadline, progress, members_count }]` |
| `/api/projects` | POST | Create project & team | `{ name, description, category, start_date, deadline, members: [{ email, role }] }` | `{ project, members }` |
| `/api/projects/<id>` | GET | Get project details | None | `{ project, members, stats }` |
| `/api/projects/<id>/members` | POST | Add member to team | `{ email, role }` | `{ member }` |

---

### 5.3 Task Management Endpoints (`/api/tasks`)

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/api/projects/<id>/tasks` | GET | List all tasks for project | *Query: status, assignee* | `[{ id, title, priority, status, deadline, assigned_to, evidence_count }]` |
| `/api/projects/<id>/tasks` | POST | Create a new task | `{ title, description, deadline, priority, assigned_to }` | `{ task }` |
| `/api/tasks/<id>` | PUT | Update task details | `{ title, deadline, priority, assigned_to }` | `{ task }` |
| `/api/tasks/<id>/status` | PATCH | Update task status | `{ status: "In Progress" \| "Completed" }` | `{ task }` *(Auto-logs completed_at & activity)* |

---

### 5.4 Work Evidence Endpoints (`/api/evidence`)

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/api/tasks/<id>/evidence` | POST | Attach evidence to task | `{ type, title, url, notes }` | `{ evidence }` *(Logs activity)* |
| `/api/tasks/<id>/evidence` | GET | Get evidence for task | None | `[{ id, type, title, url, submitted_at }]` |
| `/api/projects/<id>/evidence`| GET | Get all evidence in project | None | `[{ id, task_title, member_name, type, url }]` |

---

### 5.5 Peer Feedback Endpoints (`/api/feedback`)

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/api/projects/<id>/feedback` | POST | Submit teammate review | `{ reviewee_id, participation_score, responsibility_score, quality_score, collaboration_score, communication_score, timeliness_score, comments }` | `{ message: "Feedback submitted anonymously" }` |
| `/api/projects/<id>/feedback/status`| GET | Check which teammates user has reviewed | None | `{ reviewed_members: [uuid] }` |
| `/api/projects/<id>/feedback/summary`| GET | Anonymized average ratings for user | None | `{ average_rating: 4.2, categories: { ... } }` |

---

### 5.6 Analytics & Contribution Endpoints (`/api/analytics`)

| Endpoint | Method | Description | Response |
|---|---|---|---|
| `/api/projects/<id>/contribution/<user_id>` | GET | Get full 5-factor breakdown for member | `{ overall_score: 82, breakdown: { ... } }` |
| `/api/projects/<id>/team-comparison` | GET | List scores of all team members | `[{ user_id, name, role, score }]` |
| `/api/projects/<id>/trends` | GET | Weekly progression history for line chart | `[{ week: "Week 1", scores: { "u1": 55, "u2": 50 } }, ...]` |
| `/api/projects/<id>/report` | GET | Compile final project contribution report | `{ project, team_summary, members_detail, evidence_manifest }` |

---

## 6. Anti-Gaming & Fairness Safeguards

To prevent score manipulation:
1. **Server Clock Authority:** Deadlines and completion timestamps are set by the server, not the client request.
2. **Self-Review Prevention:** A database check constraint (`CHECK (reviewer_id <> reviewee_id)`) and route validation reject any self-evaluations.
3. **Evidence Linkage:** Completed tasks without attached evidence are flagged as `Evidence Missing` and cap the evidence metric at $0\%$ for that task.
4. **Immutable Audit Trail:** Actions such as task reassignments, deletion, and status changes are permanently recorded in `activity_logs`.
5. **No Negative Outliers:** Peer reviews are trimmed to prevent malicious low ratings (e.g. single 1-star reviews among all 5-stars are moderated in average calculations).

---

## 7. Sample Initializer & Seed Script (`utils/seed_data.py`)

A pre-built script creates the sample **Smart Water Management System** project:
- Users: Abhaas (Frontend), Rohit (Backend), Denesh (Hardware), Aditya (Documentation)
- 20 Tasks across various statuses (To Do, In Progress, Completed)
- Sample Evidence URLs (GitHub pull requests, circuit schematics, Figma mockups)
- Pre-calculated scores producing the expected demonstration output:
  - Abhaas: `82%`
  - Rohit: `76%`
  - Denesh: `68%`
  - Aditya: `61%`
