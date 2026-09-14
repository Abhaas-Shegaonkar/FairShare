# FairShare System Architecture

This document outlines the technical architecture for the **FairShare** prototype, based on the requirements defined in `idea.md`.

## 1. Overview
FairShare follows a standard client-server architecture. The application is divided into a frontend web client, a backend API, and a Supabase database. It is designed to be lightweight and simple to facilitate rapid prototyping.

**Key Communication Flow:**
`[User Browser]` <--(HTTP/REST)--> `[React Frontend]` <--(JSON via Fetch/Axios)--> `[Flask Backend]` <--(Supabase Client/REST)--> `[Supabase Database]`

---

## 2. Technology Stack
As per the prototype requirements, the technology stack is kept simple and robust:
- **Frontend:** React.js, HTML, CSS, JavaScript (Visualizations via Recharts or Chart.js)
- **Backend:** Python, Flask (Flask-RESTful, Flask-CORS)
- **Database:** Supabase (PostgreSQL managed via Supabase Client)
- **Authentication:** Token-based authentication (JWT) or simple sessions

---

## 3. Frontend Architecture (React)

The frontend is a Single Page Application (SPA) structured to provide a clean, dashboard-like experience.

### Directory Structure
```text
/src
  /components     # Reusable UI elements (Buttons, Modals, Cards, Charts)
  /pages          # Full-page views (Dashboard, Workspace, Landing)
  /services       # API call wrappers (api.js, auth.js, projects.js)
  /context        # React Context for global state (User Auth Context)
  /assets         # Images, icons, global CSS
```

### Core Pages
- `LandingPage`: Public introduction, value proposition, CTA.
- `AuthPage`: Combined or separate Login / Signup forms.
- `GlobalDashboard`: Lists "My Projects", recent activity, global tasks.
- `ProjectWorkspace`: The main hub for a specific project. Includes nested tabs for Overview, Tasks, Team, Evidence, and Activity.
- `ContributionDashboard`: Displays the detailed breakdown of the user's score, charts, and team comparison.

### Key UI Components
- `TaskCard`: Displays task details, status, and assigned user.
- `ScoreBreakdown`: A visual representation (progress bars/donut charts) of the 5-factor contribution score.
- `Timeline`: Renders the project activity history sequentially.
- `FeedbackForm`: A structured 1-5 rating form for peer evaluations.

---

## 4. Backend Architecture (Flask)

The Flask backend serves purely as an API provider (JSON responses) rather than rendering HTML templates.

### Directory Structure
```text
/backend
  app.py          # Main application factory and config
  models.py       # SQLAlchemy database models
  /routes         # API endpoint definitions
    auth.py
    projects.py
    tasks.py
    feedback.py
    analytics.py
  /services       # Business logic (e.g., score calculation algorithms)
    scorer.py
```

### Key API Endpoints
- **Auth:**
  - `POST /api/auth/login`
  - `POST /api/auth/signup`
- **Projects & Team:**
  - `GET /api/projects`
  - `POST /api/projects`
  - `POST /api/projects/<id>/members`
- **Tasks:**
  - `GET /api/projects/<id>/tasks`
  - `POST /api/projects/<id>/tasks`
  - `PUT /api/tasks/<id>/status`
- **Evidence & Feedback:**
  - `POST /api/tasks/<id>/evidence`
  - `POST /api/projects/<id>/feedback`
- **Analytics:**
  - `GET /api/projects/<id>/contribution/<user_id>` (Returns the 82% calculation payload)
  - `GET /api/projects/<id>/report` (Generates JSON for final summary)

---

## 5. Database Schema (Supabase PostgreSQL)

The relational schema relies on Supabase (PostgreSQL) for managing relationships.

### Entities & Relationships

**1. User**
- `id` (Primary Key)
- `name`, `email`, `password_hash`

**2. Project**
- `id` (Primary Key)
- `name`, `description`, `category`, `start_date`, `deadline`
- `created_by` (Foreign Key -> User)

**3. ProjectMember (Mapping Table)**
- `id` (Primary Key)
- `project_id` (Foreign Key -> Project)
- `user_id` (Foreign Key -> User)
- `role` (e.g., "Frontend", "Backend")

**4. Task**
- `id` (Primary Key)
- `project_id` (Foreign Key -> Project)
- `name`, `deadline`, `priority`, `status` ("To Do", "In Progress", "Completed")
- `assignee_id` (Foreign Key -> User)
- `completion_date` (nullable)

**5. Evidence**
- `id` (Primary Key)
- `task_id` (Foreign Key -> Task)
- `user_id` (Foreign Key -> User)
- `type` (e.g., "GitHub Link", "Image")
- `url`
- `submitted_at`

**6. ActivityHistory**
- `id` (Primary Key)
- `project_id` (Foreign Key -> Project)
- `user_id` (Foreign Key -> User)
- `action` (e.g., "completed task", "added evidence")
- `description`
- `timestamp`

**7. PeerFeedback**
- `id` (Primary Key)
- `project_id` (Foreign Key -> Project)
- `reviewer_id` (Foreign Key -> User)
- `reviewee_id` (Foreign Key -> User)
- `participation_score` (1-5)
- `responsibility_score` (1-5)
- `quality_score` (1-5)
- `collaboration_score` (1-5)
- `timeliness_score` (1-5)

---

## 6. Core Business Logic: Score Calculation Engine

Located in `/backend/services/scorer.py`, this engine implements the fairness logic defined in the idea document.

**Formula Execution Flow:**
When `/api/projects/<id>/contribution/<user_id>` is called:
1. **Task Completion (30%):** Calculate `(User Completed Tasks / User Assigned Tasks) * 30`.
2. **Timeliness (20%):** Calculate `(User On-Time Tasks / User Completed Tasks) * 20`.
3. **Work Evidence (20%):** Calculate `(Tasks with Evidence / Completed Tasks) * 20`.
4. **Peer Feedback (20%):** Average the 1-5 scores from teammates, normalize to a percentage, and multiply by 20.
5. **Participation (10%):** Check `ActivityHistory` volume relative to expected baseline. Multiply by 10.
6. **Aggregate:** Sum all factors to yield the final `Overall Contribution Score` (e.g., 82%).

---

## 7. Anti-Gaming Mechanisms at the Architecture Level
- **Task Verification:** A task cannot be marked 'Completed' with evidence without generating an immutable `ActivityHistory` log.
- **Feedback Isolation:** `PeerFeedback` entries are strictly filtered so `reviewer_id` != `reviewee_id` (users cannot review themselves).
- **Time-Stamping:** Deadlines and completion dates are handled by the server clock, preventing client-side date manipulation.
