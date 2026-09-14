# FairShare Database Specification

This document defines the exact data architecture, schema definitions, constraints, indexes, Row-Level Security (RLS) rules, and entity relationships for **FairShare**, directly derived from [`backend.md`](backend.md), [`architecture.md`](architecture.md), and [`idea.md`](idea.md).

---

## 1. Overview & Data Philosophy

FairShare uses **Supabase (PostgreSQL 15+)** as its relational database engine. The data model is constructed around three core pillars:

1. **Objective Measurability:** Storing verifiable facts (server timestamps, file/link URLs, status transition history) rather than subjective estimates.
2. **Auditability & Immutability:** Event logs (`activity_logs`) are append-only to ensure an unalterable history of project contributions.
3. **Fairness & Privacy:** Teammate reviews in `peer_feedback` are structurally protected to ensure anonymity and prevent gaming (e.g., preventing self-reviews).

---

## 2. Entity Relationship Diagram (ERD)

```text
       +------------------+
       |      users       |
       +------------------+
         | 1            1 |
         |                |
         | N            N |
+------------------+   +----------------------+
|     projects     |---|   project_members    |
+------------------+   +----------------------+
  | 1       | 1            | 1
  |         |              |
  | N       | N            | N
  |     +------------------+   +-------------------+
  |     |  activity_logs   |   |   peer_feedback   |
  |     +------------------+   +-------------------+
  |
  | 1
  |
  | N
+------------------+
|      tasks       |
+------------------+
  | 1
  |
  | N
+------------------+
|     evidence     |
+------------------+
```

### Relationship Summary
- **Users to Projects:** Many-to-Many via `project_members`.
- **Projects to Tasks:** One-to-Many.
- **Tasks to Evidence:** One-to-Many (one task can have multiple supporting artifacts).
- **Users to Tasks:** One-to-Many (assigned user).
- **Projects to Activity Logs:** One-to-Many (chronological event stream).
- **Projects to Peer Feedback:** One-to-Many (directed evaluations between team members).

---

## 3. Detailed Table Definitions

### 3.1 `users` (Student Profiles)
Stores core student account information. Synchronized with Supabase Auth or managed locally.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Student email address |
| `name` | `VARCHAR(255)` | `NOT NULL` | Full student name |
| `avatar_url` | `TEXT` | `NULL` | Profile picture / avatar image URL |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Registration timestamp |

---

### 3.2 `projects` (Group Projects)
Stores high-level group project metadata, duration, and ownership.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique project identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Project title (e.g., "Smart Water Management System") |
| `description` | `TEXT` | `NULL` | Objective, scope, or problem statement |
| `category` | `VARCHAR(100)` | `NOT NULL` | e.g., Academic, Hackathon, Capstone, IoT |
| `start_date` | `DATE` | `NOT NULL` | Official project kickoff date |
| `deadline` | `DATE` | `NOT NULL` | Project submission deadline |
| `created_by` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Student leader who created the project |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Workspace creation timestamp |

---

### 3.3 `project_members` (Team Roster & Roles)
Maps students to projects and defines their functional roles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique membership record ID |
| `project_id` | `UUID` | `REFERENCES projects(id) ON DELETE CASCADE` | Associated project ID |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Associated student user ID |
| `role` | `VARCHAR(100)` | `NOT NULL` | Functional role (e.g., "Frontend Lead", "Backend", "Hardware") |
| `joined_at` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Timestamp when added to project |

**Composite Constraints:**
- `UNIQUE(project_id, user_id)` — A user can only join a project once.

---

### 3.4 `tasks` (Deliverables & Work Items)
Core entity for work management and the primary input for the **Task Completion (30%)** and **Timeliness (20%)** metrics.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique task identifier |
| `project_id` | `UUID` | `REFERENCES projects(id) ON DELETE CASCADE` | Parent project ID |
| `title` | `VARCHAR(255)` | `NOT NULL` | Task title (e.g., "Design Login Page") |
| `description` | `TEXT` | `NULL` | Detailed task instructions or requirements |
| `deadline` | `TIMESTAMPTZ` | `NOT NULL` | Due date & time for deadline tracking |
| `priority` | `VARCHAR(20)` | `DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High'))` | Importance level |
| `status` | `VARCHAR(20)` | `DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed'))` | Workflow state |
| `assigned_to` | `UUID` | `REFERENCES users(id) ON DELETE SET NULL` | Assignee responsible for work |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Server timestamp when status changed to 'Completed' |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Task creation timestamp |

**Business Logic Note on `completed_at`:**
- If `completed_at <= deadline`, the task is flagged as **On Time**.
- If `completed_at > deadline`, the task is marked as **Late** (reducing the Timeliness score factor).

---

### 3.5 `evidence` (Verifiable Work Proof)
Stores attached proof of work (links, files, PRs), powering the **Work Evidence (20%)** score factor.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique evidence record ID |
| `task_id` | `UUID` | `REFERENCES tasks(id) ON DELETE CASCADE` | Task this evidence verifies |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Uploader/submitter ID |
| `type` | `VARCHAR(50)` | `CHECK (type IN ('github', 'figma', 'document', 'image', 'url'))` | Type of artifact |
| `title` | `VARCHAR(255)` | `NOT NULL` | Description of evidence (e.g., "PR #14: Auth Service") |
| `url` | `TEXT` | `NOT NULL` | Direct hyperlink or Supabase Storage URL |
| `notes` | `TEXT` | `NULL` | Clarifications or submission comments |
| `submitted_at`| `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Upload/link timestamp |

---

### 3.6 `activity_logs` (Immutable Project Audit Trail)
Chronological stream of all project events, powering the **Activity Timeline** and **Participation (10%)** score factor.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique log event ID |
| `project_id` | `UUID` | `REFERENCES projects(id) ON DELETE CASCADE` | Project where event occurred |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE SET NULL` | Actor who performed the action |
| `action_type` | `VARCHAR(50)` | `NOT NULL` | Action code (e.g., `TASK_CREATED`, `TASK_COMPLETED`, `EVIDENCE_SUBMITTED`, `FEEDBACK_GIVEN`) |
| `description` | `TEXT` | `NOT NULL` | Human-readable log (e.g., "Abhaas completed 'Login UI'") |
| `timestamp` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Exact time of event |

---

### 3.7 `peer_feedback` (Teammate Evaluations)
Structured feedback across 6 dimensions, powering the **Peer Feedback (20%)** score factor.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique feedback record ID |
| `project_id` | `UUID` | `REFERENCES projects(id) ON DELETE CASCADE` | Associated project ID |
| `reviewer_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Student submitting the evaluation |
| `reviewee_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Student being evaluated |
| `participation_score` | `INT` | `CHECK (participation_score BETWEEN 1 AND 5)` | Active presence in project (1-5) |
| `responsibility_score` | `INT` | `CHECK (responsibility_score BETWEEN 1 AND 5)` | Accountability for assigned tasks (1-5) |
| `quality_score` | `INT` | `CHECK (quality_score BETWEEN 1 AND 5)` | Standard and thoroughness of output (1-5) |
| `collaboration_score` | `INT` | `CHECK (collaboration_score BETWEEN 1 AND 5)` | Teamwork and cooperative attitude (1-5) |
| `communication_score` | `INT` | `CHECK (communication_score BETWEEN 1 AND 5)` | Responsiveness and clear messaging (1-5) |
| `timeliness_score` | `INT` | `CHECK (timeliness_score BETWEEN 1 AND 5)` | Meeting internal deadlines (1-5) |
| `comments` | `TEXT` | `NULL` | Constructive qualitative feedback |
| `submitted_at` | `TIMESTAMPTZ` | `DEFAULT now(), NOT NULL` | Evaluation timestamp |

**Anti-Gaming Constraints:**
- `UNIQUE(project_id, reviewer_id, reviewee_id)` — Prevents duplicate reviews from the same reviewer.
- `CHECK (reviewer_id <> reviewee_id)` — **Self-review prevention:** Students cannot evaluate themselves.

---

### 3.8 `contribution_snapshots` (Weekly Progression Trend Data)
Stores point-in-time calculation snapshots powering the **Contribution Trend Line Chart** (e.g., Week 1: 55%, Week 2: 67%, etc.).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique snapshot ID |
| `project_id` | `UUID` | `REFERENCES projects(id) ON DELETE CASCADE` | Project ID |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Student user ID |
| `week_label` | `VARCHAR(50)` | `NOT NULL` | Label (e.g., "Week 1", "Week 2") |
| `score` | `NUMERIC(5,2)`| `NOT NULL CHECK (score BETWEEN 0 AND 100)`| Calculated score snapshot |
| `snapshot_date`| `DATE` | `DEFAULT CURRENT_DATE, NOT NULL` | Date when snapshot was recorded |

---

## 4. Performance Indexes

To ensure snappy queries on the dashboards, the following indexes are required:

```sql
-- Project Memberships
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- Task Lookups & Filtering
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(project_id, status);

-- Evidence by Task
CREATE INDEX idx_evidence_task ON evidence(task_id);

-- Chronological Activity Stream
CREATE INDEX idx_activity_logs_timeline ON activity_logs(project_id, timestamp DESC);

-- Peer Feedback Aggregations
CREATE INDEX idx_peer_feedback_reviewee ON peer_feedback(project_id, reviewee_id);

-- Weekly Trends
CREATE INDEX idx_snapshots_trend ON contribution_snapshots(project_id, user_id, snapshot_date);
```

---

## 5. Row-Level Security (RLS) & Anonymity Policies

Supabase Row-Level Security ensures data is accessible only by authorized team members, while strictly protecting peer review anonymity.

### 5.1 Project Access Control
```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is a member of project
CREATE OR REPLACE FUNCTION is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Projects Policy: Members can view projects they belong to
CREATE POLICY "Project members can view project"
ON projects FOR SELECT
USING (is_project_member(id));

-- Tasks Policy: Members can view and update tasks
CREATE POLICY "Project members can view tasks"
ON tasks FOR SELECT
USING (is_project_member(project_id));

CREATE POLICY "Project members can create tasks"
ON tasks FOR INSERT
WITH CHECK (is_project_member(project_id));
```

### 5.2 Peer Feedback Anonymity Protection
To maintain trust, students must never be able to inspect `reviewer_id` in teammate ratings:

```sql
-- Only the reviewer can read their own un-anonymized submission
CREATE POLICY "Reviewer can read own submitted review"
ON peer_feedback FOR SELECT
USING (reviewer_id = auth.uid());

-- Insertion allowed only if user is in project and not self-reviewing
CREATE POLICY "Members can submit peer review"
ON peer_feedback FOR INSERT
WITH CHECK (
  is_project_member(project_id) AND
  reviewer_id = auth.uid() AND
  reviewer_id <> reviewee_id
);

-- Aggregated peer feedback is accessed through an anonymizing SQL View:
CREATE OR REPLACE VIEW v_peer_feedback_summary AS
SELECT
    project_id,
    reviewee_id,
    COUNT(*) as total_reviews,
    ROUND(AVG(participation_score), 2) as avg_participation,
    ROUND(AVG(responsibility_score), 2) as avg_responsibility,
    ROUND(AVG(quality_score), 2) as avg_quality,
    ROUND(AVG(collaboration_score), 2) as avg_collaboration,
    ROUND(AVG(communication_score), 2) as avg_communication,
    ROUND(AVG(timeliness_score), 2) as avg_timeliness,
    ROUND(AVG((participation_score + responsibility_score + quality_score + collaboration_score + communication_score + timeliness_score) / 6.0), 2) as overall_peer_rating
FROM peer_feedback
GROUP BY project_id, reviewee_id;
```

---

## 6. Seed Dataset Definition (Sample Project)

Initial data setup for the reference prototype:

### Project
- **Name:** `"Smart Water Management System"`
- **Category:** `"IoT & Full-Stack"`
- **Duration:** August 1, 2026 – September 30, 2026

### Members & Scores
| User | Role | Score Target | Tasks Completed | Evidence Count | Avg Peer Rating |
|---|---|---|---|---|---|
| **Abhaas** | Frontend Lead | `82%` | 18 / 20 | 16 | 4.2 / 5.0 |
| **Rohit** | Backend Developer | `76%` | 15 / 19 | 13 | 4.0 / 5.0 |
| **Denesh** | Hardware Engineer | `68%` | 11 / 16 | 9 | 3.6 / 5.0 |
| **Aditya** | Documentation & QA | `61%` | 9 / 15 | 8 | 3.4 / 5.0 |

### Trend History (Snapshots)
| Week | Abhaas | Rohit | Denesh | Aditya |
|---|---|---|---|---|
| **Week 1** | 55% | 50% | 40% | 45% |
| **Week 2** | 67% | 62% | 54% | 50% |
| **Week 3** | 76% | 70% | 62% | 58% |
| **Week 4** | 82% | 76% | 68% | 61% |
