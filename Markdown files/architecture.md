# FairShare System Architecture

This document outlines the technical architecture for the **FairShare** prototype, based on the requirements defined in `idea.md`.

## 1. Overview
FairShare follows a standard client-server architecture. The application is divided into a frontend web client, a backend API, and a Supabase database. It is designed to be lightweight and simple to facilitate rapid prototyping.

**Key Communication Flow:**
`[User Browser]` <--(HTTP/REST)--> `[React Frontend (Vite)]` <--(JSON via Axios)--> `[Flask Backend]` <--(Supabase Client / psycopg2)--> `[Supabase PostgreSQL & Storage]`

---

## 2. Technology Stack
As per the prototype requirements, the technology stack is kept simple and robust:
- **Frontend:** React 18+, Vite, HTML, Vanilla CSS with custom design system, JavaScript (Visualizations via Recharts or Chart.js)
- **Backend:** Python 3.10+, Flask (Blueprints, Flask-CORS)
- **Database & Storage:** Supabase (PostgreSQL 15+ engine and Supabase Storage for files/images)
- **Authentication:** Token-based authentication (JWT with bcrypt hashing via Flask `@require_auth` middleware)

---

## 3. Frontend Architecture (React)

The frontend is a Single Page Application (SPA) structured to provide a clean, dashboard-like experience.

### Directory Structure
```text
/src
  /components     # Reusable UI elements (Buttons, Modals, Cards, Charts)
  /pages          # Full-page views (Dashboard, Workspace, Landing)
  /services       # API call wrappers (api.js, auth.js, projects.js)
  /context        # React Context for global state (User Auth Context, Project Context)
  /assets         # Images, icons, global CSS
```

### Core Pages
- `LandingPage`: Public introduction, value proposition, CTA.
- `AuthPage`: Combined or separate Login / Signup forms.
- `GlobalDashboard`: Lists "My Projects", recent activity, global tasks.
- `ProjectWorkspace`: The main hub for a specific project. Includes nested tabs for Overview, Tasks, Team, Evidence, and Activity.
- `ContributionDashboard`: Displays the detailed breakdown of the user's score, charts, and team comparison.

### Key UI Components
- `TaskCard`: Displays task details, status, assigned user, and evidence badges.
- `ScoreBreakdown`: A visual representation (progress bars/donut charts) of the 5-factor contribution score.
- `Timeline`: Renders the project activity history sequentially.
- `FeedbackForm`: A structured 1-5 rating form for peer evaluations across 6 dimensions.

---

## 4. Backend Architecture (Flask)

The Flask backend serves purely as an API provider (JSON responses) rather than rendering HTML templates.

### Directory Structure
```text
/backend
  app.py          # Main application factory and config
  models.py       # SQLAlchemy / Supabase data models
  /routes         # API endpoint definitions
    auth.py
    projects.py
    tasks.py
    evidence.py
    feedback.py
    analytics.py
    upload.py
  /services       # Business logic
    scorer.py          # 5-factor score calculation algorithms
    activity_logger.py # Immutable event logging
    report_service.py  # Report summary compilation
```

### Key API Endpoints
- **Auth:**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
- **Projects & Team:**
  - `GET /api/projects`
  - `POST /api/projects`
  - `GET /api/projects/<id>`
  - `POST /api/projects/<id>/members`
- **Tasks:**
  - `GET /api/projects/<id>/tasks`
  - `POST /api/projects/<id>/tasks`
  - `PUT /api/tasks/<id>`
  - `PATCH /api/tasks/<id>/status`
- **Evidence & Storage:**
  - `POST /api/upload` (Multipart file/image upload to Supabase Storage)
  - `POST /api/tasks/<id>/evidence`
  - `GET /api/projects/<id>/evidence`
- **Peer Feedback:**
  - `POST /api/projects/<id>/feedback`
  - `GET /api/projects/<id>/feedback/status`
  - `GET /api/projects/<id>/feedback/summary`
- **Analytics & Reports:**
  - `GET /api/projects/<id>/contribution/<user_id>` (Returns explainable breakdown payload)
  - `GET /api/projects/<id>/team-comparison`
  - `GET /api/projects/<id>/trends`
  - `GET /api/projects/<id>/report` (Generates JSON for final summary)

---

## 5. Database Schema (Supabase PostgreSQL)

The relational schema relies on Supabase (PostgreSQL) for managing relationships.

### Entities & Relationships

**1. User**
- `id` (Primary Key, UUID)
- `email`, `name`, `password_hash`, `avatar_url`, `created_at`

**2. Project**
- `id` (Primary Key, UUID)
- `name`, `description`, `category`, `start_date`, `deadline`
- `created_by` (Foreign Key -> User)
- `created_at`

**3. ProjectMember (Mapping Table)**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `user_id` (Foreign Key -> User)
- `role` (e.g., "Frontend Lead", "Backend Developer")
- `joined_at`
- `UNIQUE(project_id, user_id)`

**4. ProjectInvitation**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `email` (Invited student's email)
- `role`
- `invited_by` (Foreign Key -> User)
- `status` ('pending', 'accepted', 'declined')
- `created_at`
- `UNIQUE(project_id, email)`

**5. Task**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `title`, `description`, `deadline`, `priority` ("Low", "Medium", "High"), `status` ("To Do", "In Progress", "Completed")
- `assigned_to` (Foreign Key -> User, nullable)
- `completed_by` (Foreign Key -> User, nullable)
- `completed_at` (nullable)
- `created_at`

**6. Evidence**
- `id` (Primary Key, UUID)
- `task_id` (Foreign Key -> Task)
- `user_id` (Foreign Key -> User)
- `type` ("github", "figma", "document", "image", "url")
- `title`, `url`, `notes`
- `submitted_at`

**7. ActivityLog**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `user_id` (Foreign Key -> User)
- `action_type` ("TASK_CREATED", "TASK_COMPLETED", "EVIDENCE_SUBMITTED", "FEEDBACK_SUBMITTED")
- `description`
- `timestamp`

**8. PeerFeedback**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `reviewer_id` (Foreign Key -> User)
- `reviewee_id` (Foreign Key -> User)
- `participation_score` (1-5)
- `responsibility_score` (1-5)
- `quality_score` (1-5)
- `collaboration_score` (1-5)
- `communication_score` (1-5)
- `timeliness_score` (1-5)
- `comments`
- `submitted_at`
- `UNIQUE(project_id, reviewer_id, reviewee_id)`
- `CHECK(reviewer_id <> reviewee_id)`

**9. ContributionSnapshot**
- `id` (Primary Key, UUID)
- `project_id` (Foreign Key -> Project)
- `user_id` (Foreign Key -> User)
- `week_label` (e.g., "Week 1", "Week 2")
- `score` (Numeric 0-100)
- `snapshot_date`

---

## 6. Core Business Logic: Score Calculation Engine

Located in `/backend/services/scorer.py`, this engine implements the fairness logic defined in the product specification.

**Formula Execution Flow:**
When `/api/projects/<id>/contribution/<user_id>` is called:
1. **Task Completion (30%):** Calculate `(User Completed Tasks / User Assigned Tasks) * 30`.
2. **Timeliness (20%):** Calculate `(User On-Time Tasks / User Completed Tasks) * 20`.
3. **Work Evidence (20%):** Calculate `(Tasks with Evidence / Completed Tasks) * 20`.
4. **Peer Feedback (20%):** Average the 1-5 scores across 6 categories from teammates, normalize to a percentage, and multiply by 20.
5. **Participation (10%):** Measure user logged actions against project benchmark activity. Multiply by 10.
6. **Aggregate:** Sum all factors to yield the final `Overall Contribution Score` (e.g., 82.0%).

---

## 7. Anti-Gaming Mechanisms at the Architecture Level
- **Task Verification:** A task cannot be marked 'Completed' without generating an immutable `activity_logs` entry.
- **Feedback Isolation:** `PeerFeedback` entries are strictly filtered so `reviewer_id` != `reviewee_id` (users cannot review themselves).
- **Time-Stamping:** Deadlines and completion dates are handled by the server clock, preventing client-side date manipulation.
- **Audit Trails:** Status changes and reassignments are permanently logged in `activity_logs`.

---

## 8. Role-Based Permissions
- **Team Leader (Project Creator):** Can edit project metadata, modify deadlines, invite new members, remove members, and archive/delete the project.
- **Team Members:** Can create tasks, self-assign or reassign tasks, submit evidence for their tasks, update task status, submit peer evaluations, and download the final project report.
