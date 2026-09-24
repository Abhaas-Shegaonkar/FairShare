# FairShare API Specification

This document defines the interface contracts, communication protocols, request/response formats, error codes, and service integrations between the React frontend and Flask/Supabase backend, referencing [`frontend.md`](frontend.md) and [`backend.md`](backend.md).

---

## 1. Protocol & Communication Standards

- **Base URL:**
  - Local Development: `http://localhost:5000/api`
  - Production: `https://api.fairshare.app/api` (or custom Supabase edge proxy)
- **Data Format:** JSON (`application/json; charset=utf-8`)
- **Authentication Scheme:** HTTP Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)
- **CORS Configuration:** Allows frontend origin (`http://localhost:5173` in development) with credentials enabled.

### Standard Response Envelopes

#### Success Envelope
All successful requests return HTTP `200 OK` (or `201 Created`) with a consistent structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

#### Error Envelope
Errors return standard HTTP 4xx/5xx codes with an error descriptor:
```json
{
  "success": false,
  "error": {
    "code": "TASK_ALREADY_COMPLETED",
    "message": "This task has already been finalized.",
    "details": null
  }
}
```

---

## 2. Authentication & Student Profile (`/api/auth`)

### 2.1 Register Student
Creates student profile, automatically claims any pending project invitations, and returns session token.

- **Endpoint:** `POST /api/auth/register`
- **Frontend Trigger:** `SignupPage.jsx`
- **Request Body:**
```json
{
  "email": "abhaas@college.edu",
  "password": "StrongPassword123!",
  "name": "Abhaas"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
      "email": "abhaas@college.edu",
      "name": "Abhaas",
      "avatar_url": null
    },
    "claimed_invitations": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2.2 Student Login
- **Endpoint:** `POST /api/auth/login`
- **Frontend Trigger:** `LoginPage.jsx`
- **Request Body:**
```json
{
  "email": "abhaas@college.edu",
  "password": "StrongPassword123!"
}
```
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
      "email": "abhaas@college.edu",
      "name": "Abhaas",
      "avatar_url": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2.3 Get Current Profile
- **Endpoint:** `GET /api/auth/me`
- **Frontend Trigger:** `AuthContext.jsx` initialization on page reload
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
      "email": "abhaas@college.edu",
      "name": "Abhaas",
      "avatar_url": null
    }
  }
}
```

---

## 3. Projects & Team Workspace (`/api/projects`)

### 3.1 List User Projects
- **Endpoint:** `GET /api/projects`
- **Frontend Trigger:** `DashboardPage.jsx` (Global dashboard cards)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "name": "Smart Water Management System",
      "description": "IoT-based sensor network for water leak detection and tracking.",
      "category": "IoT & Full-Stack",
      "start_date": "2026-08-01",
      "deadline": "2026-09-30",
      "my_role": "Frontend Lead",
      "total_tasks": 20,
      "completed_tasks": 18,
      "progress_percentage": 90.0,
      "members_count": 4
    }
  ]
}
```

---

### 3.2 Create Project & Team
Creates project workspace. Members who already possess FairShare accounts are immediately mapped to `project_members`; unregistered emails are queued in `project_invitations`.

- **Endpoint:** `POST /api/projects`
- **Frontend Trigger:** `CreateProjectPage.jsx`
- **Request Body:**
```json
{
  "name": "Smart Water Management System",
  "description": "IoT-based sensor network for water distribution.",
  "category": "IoT & Full-Stack",
  "start_date": "2026-08-01",
  "deadline": "2026-09-30",
  "members": [
    { "email": "abhaas@college.edu", "role": "Frontend Lead" },
    { "email": "rohit@college.edu", "role": "Backend Developer" },
    { "email": "denesh@college.edu", "role": "Hardware Engineer" },
    { "email": "aditya@college.edu", "role": "Documentation & QA" }
  ]
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "project_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "name": "Smart Water Management System",
    "active_members_count": 4,
    "pending_invitations_count": 0,
    "created_at": "2026-08-01T10:00:00Z"
  }
}
```

---

### 3.3 Get Project Workspace Details
- **Endpoint:** `GET /api/projects/:id`
- **Frontend Trigger:** `ProjectWorkspacePage.jsx`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "name": "Smart Water Management System",
    "description": "IoT-based sensor network for water distribution.",
    "category": "IoT & Full-Stack",
    "start_date": "2026-08-01",
    "deadline": "2026-09-30",
    "members": [
      { "user_id": "u1", "name": "Abhaas", "email": "abhaas@college.edu", "role": "Frontend Lead" },
      { "user_id": "u2", "name": "Rohit", "email": "rohit@college.edu", "role": "Backend Developer" },
      { "user_id": "u3", "name": "Denesh", "email": "denesh@college.edu", "role": "Hardware Engineer" },
      { "user_id": "u4", "name": "Aditya", "email": "aditya@college.edu", "role": "Documentation & QA" }
    ],
    "stats": {
      "total_tasks": 20,
      "completed_tasks": 18,
      "days_remaining": 16
    }
  }
}
```

---

## 4. Task Management (`/api/projects/:id/tasks`, `/api/tasks/:id`)

### 4.1 List Project Tasks
- **Endpoint:** `GET /api/projects/:id/tasks`
- **Query Parameters (Optional):** `?status=Completed&assignee=u1`
- **Frontend Trigger:** `TaskBoard.jsx` (Kanban and Table views)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "t1",
      "title": "Design Login Page",
      "description": "Implement authentication screen using Figma mockups.",
      "deadline": "2026-09-20T23:59:59Z",
      "priority": "High",
      "status": "Completed",
      "assigned_to": {
        "id": "u1",
        "name": "Abhaas"
      },
      "completed_by": {
        "id": "u1",
        "name": "Abhaas"
      },
      "completed_at": "2026-09-19T14:30:00Z",
      "is_on_time": true,
      "evidence_count": 2,
      "has_evidence": true
    }
  ]
}
```

---

### 4.2 Create Task
- **Endpoint:** `POST /api/projects/:id/tasks`
- **Frontend Trigger:** `CreateTaskModal.jsx`
- **Request Body:**
```json
{
  "title": "Build Sensor API Endpoints",
  "description": "REST endpoints for ingesting water flow readings.",
  "deadline": "2026-09-25T18:00:00Z",
  "priority": "High",
  "assigned_to": "u2"
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "t21",
    "title": "Build Sensor API Endpoints",
    "status": "To Do",
    "created_at": "2026-09-14T09:00:00Z"
  }
}
```

---

### 4.3 Update Task Status
- **Endpoint:** `PATCH /api/tasks/:id/status`
- **Frontend Trigger:** Dragging Kanban card or clicking status pill
- **Request Body:**
```json
{
  "status": "Completed"
}
```
- **Server Behavior:** When set to `Completed`, server automatically records `completed_at = now()`, sets `completed_by = current_user_id`, determines `is_on_time` against `deadline`, and generates an immutable record in `activity_logs`.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "t21",
    "status": "Completed",
    "completed_by": "u2",
    "completed_at": "2026-09-14T09:15:22Z",
    "is_on_time": true
  }
}
```

---

## 5. File Storage & Work Evidence Submissions (`/api/upload`, `/api/evidence`)

### 5.1 Upload File / Artifact
Uploads a binary artifact (image, document, PDF) to the project's Supabase Storage bucket.

- **Endpoint:** `POST /api/upload`
- **Frontend Trigger:** File input in `SubmitEvidenceModal.jsx`
- **Headers:** `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
- **Request Form Data:**
  - `file`: Binary file data
  - `project_id`: Project UUID
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "url": "https://xyzcompany.supabase.co/storage/v1/object/public/evidence/proj-1/auth_flow.png",
    "file_name": "auth_flow.png",
    "file_size": 245100,
    "mime_type": "image/png"
  }
}
```

---

### 5.2 Submit Evidence for Task
- **Endpoint:** `POST /api/tasks/:id/evidence`
- **Frontend Trigger:** `SubmitEvidenceModal.jsx`
- **Request Body:**
```json
{
  "type": "github",
  "title": "PR #42: Add MQTT Listener Service",
  "url": "https://github.com/org/smart-water/pull/42",
  "notes": "Includes automated test coverage for packet drops."
}
```
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "ev-101",
    "task_id": "t21",
    "type": "github",
    "title": "PR #42: Add MQTT Listener Service",
    "url": "https://github.com/org/smart-water/pull/42",
    "submitted_at": "2026-09-14T09:20:00Z"
  }
}
```

---

### 5.3 Get Evidence Vault for Project
- **Endpoint:** `GET /api/projects/:id/evidence`
- **Frontend Trigger:** `EvidenceList.jsx` (Project Evidence Tab)
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ev-101",
      "task_title": "Design Login Page",
      "submitted_by": "Abhaas",
      "type": "figma",
      "title": "Figma Screen Designs",
      "url": "https://figma.com/file/...",
      "submitted_at": "2026-09-19T14:40:00Z"
    }
  ]
}
```

---

## 6. Activity Timeline Feed (`/api/projects/:id/activity`)

- **Endpoint:** `GET /api/projects/:id/activity`
- **Frontend Trigger:** `ActivityTimeline.jsx`
- **Query Parameters:** `?limit=20&offset=0`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "act-1",
      "action_type": "TASK_COMPLETED",
      "actor_name": "Abhaas",
      "description": "Abhaas completed 'Login UI' and attached Figma design link.",
      "timestamp": "2026-09-14T08:45:00Z"
    },
    {
      "id": "act-2",
      "action_type": "EVIDENCE_SUBMITTED",
      "actor_name": "Rohit",
      "description": "Rohit uploaded 'API Documentation' schema.",
      "timestamp": "2026-09-14T06:10:00Z"
    }
  ]
}
```

---

## 7. Peer Feedback System (`/api/projects/:id/feedback`)

### 7.1 Submit Peer Review
- **Endpoint:** `POST /api/projects/:id/feedback`
- **Frontend Trigger:** `PeerFeedbackModal.jsx`
- **Request Body:**
```json
{
  "reviewee_id": "u2",
  "participation_score": 5,
  "responsibility_score": 4,
  "quality_score": 4,
  "collaboration_score": 5,
  "communication_score": 4,
  "timeliness_score": 4,
  "comments": "Great work establishing the database schema on short notice."
}
```
- **Validation Rules:**
  - `reviewer_id !== reviewee_id` (Throws `400 CANNOT_SELF_REVIEW` if identical).
  - All scores must be integers between 1 and 5.
- **Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully and anonymously."
}
```

---

### 7.2 Get Member Review Status
- **Endpoint:** `GET /api/projects/:id/feedback/status`
- **Frontend Trigger:** Enables/disables review buttons on teammates' cards.
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "submitted_reviews_count": 3,
    "reviewed_member_ids": ["u2", "u3"]
  }
}
```

---

## 8. Analytics, Contribution Scores & Reports (`/api/analytics`)

### 8.1 Get Member Contribution Breakdown (Explainable Score)
- **Endpoint:** `GET /api/projects/:id/contribution/:userId`
- **Frontend Trigger:** `ContributionPage.jsx` & `ScoreExplainerModal.jsx`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "user_id": "u1",
    "name": "Abhaas",
    "role": "Frontend Lead",
    "overall_score": 82,
    "breakdown": {
      "task_completion": {
        "score": 90.0,
        "weight": 30,
        "points": 27.0,
        "label": "18 of 20 tasks completed",
        "explanation": "You completed 90% of all tasks specifically assigned to your role."
      },
      "timeliness": {
        "score": 85.0,
        "weight": 20,
        "points": 17.0,
        "label": "17 of 20 tasks on time",
        "explanation": "85% of your completed tasks were finalized prior to the set deadline."
      },
      "work_evidence": {
        "score": 80.0,
        "weight": 20,
        "points": 16.0,
        "label": "16 evidence artifacts attached",
        "explanation": "80% of your completed deliverables contain verifiable links or documents."
      },
      "peer_feedback": {
        "score": 75.0,
        "weight": 20,
        "points": 15.0,
        "label": "Average 3.75 / 5.0 peer rating",
        "explanation": "Calculated across 3 anonymous teammate evaluations across all 6 core categories."
      },
      "participation": {
        "score": 70.0,
        "weight": 10,
        "points": 7.0,
        "label": "21 verified project actions",
        "explanation": "Consistently logged activity records showing steady participation throughout the project relative to team benchmark."
      }
    }
  }
}
```

---

### 8.2 Get Team Contribution Comparison
- **Endpoint:** `GET /api/projects/:id/team-comparison`
- **Frontend Trigger:** `TeamComparisonChart.jsx`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    { "user_id": "u1", "name": "Abhaas", "role": "Frontend", "score": 82 },
    { "user_id": "u2", "name": "Rohit", "role": "Backend", "score": 76 },
    { "user_id": "u3", "name": "Denesh", "role": "Hardware", "score": 68 },
    { "user_id": "u4", "name": "Aditya", "role": "Documentation", "score": 61 }
  ]
}
```

---

### 8.3 Get Contribution Progression Trends
- **Endpoint:** `GET /api/projects/:id/trends`
- **Frontend Trigger:** `ContributionTrendChart.jsx`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    { "week": "Week 1", "Abhaas": 55, "Rohit": 50, "Denesh": 40, "Aditya": 45 },
    { "week": "Week 2", "Abhaas": 67, "Rohit": 62, "Denesh": 54, "Aditya": 50 },
    { "week": "Week 3", "Abhaas": 76, "Rohit": 70, "Denesh": 62, "Aditya": 58 },
    { "week": "Week 4", "Abhaas": 82, "Rohit": 76, "Denesh": 68, "Aditya": 61 }
  ]
}
```

---

### 8.4 Generate Final Project Report
- **Endpoint:** `GET /api/projects/:id/report`
- **Frontend Trigger:** `FinalReportPage.jsx`
- **Success Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "project": {
      "name": "Smart Water Management System",
      "category": "IoT & Full-Stack",
      "duration": "2026-08-01 to 2026-09-30",
      "total_tasks": 20,
      "completed_tasks": 18,
      "progress": "90%"
    },
    "members": [
      {
        "name": "Abhaas",
        "role": "Frontend Lead",
        "overall_score": 82,
        "task_completion_rate": "90%",
        "timeliness_rate": "85%",
        "evidence_submissions": 16,
        "peer_rating": "3.75 / 5.0"
      },
      {
        "name": "Rohit",
        "role": "Backend Developer",
        "overall_score": 76,
        "task_completion_rate": "79%",
        "timeliness_rate": "80%",
        "evidence_submissions": 13,
        "peer_rating": "4.0 / 5.0"
      },
      {
        "name": "Denesh",
        "role": "Hardware Engineer",
        "overall_score": 68,
        "task_completion_rate": "69%",
        "timeliness_rate": "72%",
        "evidence_submissions": 9,
        "peer_rating": "3.6 / 5.0"
      },
      {
        "name": "Aditya",
        "role": "Documentation & QA",
        "overall_score": 61,
        "task_completion_rate": "60%",
        "timeliness_rate": "65%",
        "evidence_submissions": 8,
        "peer_rating": "3.4 / 5.0"
      }
    ]
  }
}
```

---

## 9. Frontend Service Implementation Pattern

Example client service implementation for `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fairshare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response / error unwrapping
api.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const errorPayload = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: 'Failed to communicate with FairShare backend.',
    };
    return Promise.reject(errorPayload);
  }
);

export default api;
```
