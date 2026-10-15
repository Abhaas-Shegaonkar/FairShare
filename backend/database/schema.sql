-- ==============================================================================
-- FairShare Database DDL Schema (Supabase / PostgreSQL 15+)
--
-- This script provisions the complete relational schema, foreign key relations,
-- check constraints, performance indexes, anonymous views, and Row-Level Security (RLS)
-- policies for the FairShare platform.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- 2.1 Users (Student Profiles & Credentials)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Projects (Group Workspaces)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Academic', 'Capstone', 'Hackathon', 'IoT & Full-Stack'
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_project_dates CHECK (deadline >= start_date)
);

-- 2.3 Project Members (Team Roster & Functional Roles)
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(100) NOT NULL, -- e.g., 'Frontend Lead', 'Backend Developer', 'Hardware Engineer'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_project_user UNIQUE (project_id, user_id)
);

-- 2.4 Project Invitations (Pending Teammate Invites)
CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_project_invite_email UNIQUE (project_id, email)
);

-- 2.5 Tasks (Deliverables & Work Items)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Completed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 Evidence (Verifiable Work Proof)
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('github', 'figma', 'document', 'image', 'url', 'file', 'link')),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    notes TEXT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.7 Activity Logs (Immutable Project Event Timeline)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'TASK_CREATED', 'TASK_COMPLETED', 'EVIDENCE_SUBMITTED'
    description TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 Peer Feedback (6-Dimension Anonymous Teammate Evaluations)
CREATE TABLE IF NOT EXISTS peer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    participation_score INT NOT NULL CHECK (participation_score BETWEEN 1 AND 5),
    responsibility_score INT NOT NULL CHECK (responsibility_score BETWEEN 1 AND 5),
    quality_score INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
    collaboration_score INT NOT NULL CHECK (collaboration_score BETWEEN 1 AND 5),
    communication_score INT NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
    timeliness_score INT NOT NULL CHECK (timeliness_score BETWEEN 1 AND 5),
    comments TEXT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_peer_review UNIQUE (project_id, reviewer_id, reviewee_id),
    CONSTRAINT check_prevent_self_review CHECK (reviewer_id <> reviewee_id)
);

-- 2.9 Contribution Snapshots (Weekly Progression Trend Data)
CREATE TABLE IF NOT EXISTS contribution_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    week_label VARCHAR(50) NOT NULL, -- e.g., 'Week 1', 'Week 2'
    score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
    snapshot_date DATE DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT uq_user_week_snapshot UNIQUE (project_id, user_id, week_label)
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- Project Memberships
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- Tasks Lookups & Filtering
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

-- Evidence Lookups
CREATE INDEX IF NOT EXISTS idx_evidence_task ON evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_evidence_user ON evidence(user_id);

-- Chronological Activity Stream
CREATE INDEX IF NOT EXISTS idx_activity_logs_timeline ON activity_logs(project_id, timestamp DESC);

-- Peer Feedback Aggregations
CREATE INDEX IF NOT EXISTS idx_peer_feedback_reviewee ON peer_feedback(project_id, reviewee_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_reviewer ON peer_feedback(project_id, reviewer_id);

-- Weekly Trends Line Chart Queries
CREATE INDEX IF NOT EXISTS idx_snapshots_trend ON contribution_snapshots(project_id, user_id, snapshot_date);

-- ==============================================================================
-- 4. ANONYMIZING VIEWS (Peer Feedback Protection)
-- ==============================================================================

CREATE OR REPLACE VIEW v_peer_feedback_summary AS
SELECT
    project_id,
    reviewee_id,
    COUNT(*)::INT as total_reviews,
    ROUND(AVG(participation_score), 2) as avg_participation,
    ROUND(AVG(responsibility_score), 2) as avg_responsibility,
    ROUND(AVG(quality_score), 2) as avg_quality,
    ROUND(AVG(collaboration_score), 2) as avg_collaboration,
    ROUND(AVG(communication_score), 2) as avg_communication,
    ROUND(AVG(timeliness_score), 2) as avg_timeliness,
    ROUND(
        AVG(
            (participation_score + responsibility_score + quality_score + collaboration_score + communication_score + timeliness_score) / 6.0
        ), 2
    ) as overall_peer_rating
FROM peer_feedback
GROUP BY project_id, reviewee_id;

-- ==============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_snapshots ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check project membership for authenticated Supabase user
CREATE OR REPLACE FUNCTION is_project_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users: Users can read all users (to see teammates), but only edit their own profile
CREATE POLICY "Users can read profiles"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Projects: Members can view projects they belong to
CREATE POLICY "Project members can view project"
ON projects FOR SELECT
TO authenticated
USING (is_project_member(id) OR created_by = auth.uid());

CREATE POLICY "Users can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Project Members: Members can view team roster
CREATE POLICY "Project members can view roster"
ON project_members FOR SELECT
TO authenticated
USING (is_project_member(project_id));

-- Tasks: Project members can view, create, and update tasks
CREATE POLICY "Project members can view tasks"
ON tasks FOR SELECT
TO authenticated
USING (is_project_member(project_id));

CREATE POLICY "Project members can create tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (is_project_member(project_id));

CREATE POLICY "Project members can update tasks"
ON tasks FOR UPDATE
TO authenticated
USING (is_project_member(project_id));

-- Evidence: Project members can view and submit evidence
CREATE POLICY "Project members can view evidence"
ON evidence FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = evidence.task_id AND is_project_member(tasks.project_id)
    )
);

CREATE POLICY "Project members can attach evidence"
ON evidence FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = evidence.task_id AND is_project_member(tasks.project_id)
    )
);

-- Activity Logs: Members can read project audit stream
CREATE POLICY "Project members can view activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (is_project_member(project_id));

CREATE POLICY "Project members can append activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (is_project_member(project_id));

-- Peer Feedback:
-- 1. Reviewer can view their own submitted reviews
CREATE POLICY "Reviewer can view own submitted reviews"
ON peer_feedback FOR SELECT
TO authenticated
USING (reviewer_id = auth.uid());

-- 2. Members can insert peer feedback (with anti-self-review constraint)
CREATE POLICY "Members can submit peer review"
ON peer_feedback FOR INSERT
TO authenticated
WITH CHECK (
    is_project_member(project_id) AND
    reviewer_id = auth.uid() AND
    reviewer_id <> reviewee_id
);

-- Contribution Snapshots: Members can view team snapshots
CREATE POLICY "Project members can view snapshots"
ON contribution_snapshots FOR SELECT
TO authenticated
USING (is_project_member(project_id));

-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET CONFIGURATION (`evidence_files`)
-- ==============================================================================

-- Create the storage bucket for deliverable evidence files if not already existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence_files',
    'evidence_files',
    true,
    10485760, -- 10 MB limit
    ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'application/zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Public read access for deliverables
CREATE POLICY "Evidence files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence_files');

-- Storage RLS: Authenticated users can upload evidence files up to 10MB
CREATE POLICY "Authenticated users can upload evidence files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'evidence_files' AND
    (storage.foldername(name))[1] IS NOT NULL
);
