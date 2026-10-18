/**
 * FairShare Prototype Mock Datasets
 * High-fidelity datasets matching the API specifications in api.md & database.md.
 *
 * IMPORTANT: UUIDs, scores, project IDs, status values, evidence types, and week
 * labels in this file are kept in sync with backend stub data and the README spec.
 */

// ─── Canonical UUIDs (must match backend stubs in project_service.py & analytics_routes.py) ───
export const MOCK_USER = {
  id: "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
  email: "abhaas@college.edu",
  name: "Abhaas",
  avatar_url: null,
  role: "Frontend Lead",
}

export const MOCK_TEAM_MEMBERS = [
  {
    id: "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
    name: "Abhaas",
    email: "abhaas@college.edu",
    role: "Frontend Lead",
    tasks_assigned: 20,
    tasks_completed: 18,
    timeliness_rate: 85,
    fair_score: 82,
    avatar_color: "#C5FF4A",
  },
  {
    id: "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
    name: "Rohit",
    email: "rohit@college.edu",
    role: "Backend Developer",
    tasks_assigned: 19,
    tasks_completed: 15,
    timeliness_rate: 80,
    fair_score: 76,
    avatar_color: "#52E8D1",
  },
  {
    id: "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
    name: "Denesh",
    email: "denesh@college.edu",
    role: "Hardware Engineer",
    tasks_assigned: 16,
    tasks_completed: 11,
    timeliness_rate: 72,
    fair_score: 68,
    avatar_color: "#F59E0B",
  },
  {
    id: "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
    name: "Aditya",
    email: "aditya@college.edu",
    role: "Documentation & QA",
    tasks_assigned: 15,
    tasks_completed: 9,
    timeliness_rate: 65,
    fair_score: 61,
    avatar_color: "#FF4D4D",
  },
]

// ─── Project ID must match project_service.py fallback ───
export const MOCK_PROJECTS = [
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    name: "Smart Water Management System",
    description: "IoT-based sensor network for water distribution tracking, pressure anomaly detection, and academic capstone demonstration.",
    category: "IoT & Full-Stack",
    start_date: "2026-08-01",
    deadline: "2026-09-30",
    my_role: "Frontend Lead",
    total_tasks: 20,
    completed_tasks: 18,
    progress_percentage: 90.0,
    members_count: 4,
    fairness_score: 82,
    status: "Active",
    days_remaining: 14,
  },
  {
    id: "b2c3d4e5-0000-0000-0000-000000000002",
    name: "Autonomous Rover Telemetry",
    description: "ROS2 robotics telemetry dashboard and obstacle lidar path planning for University RoboCon 2026.",
    category: "Robotics & Embedded",
    start_date: "2026-09-10",
    deadline: "2026-11-20",
    my_role: "UI Engineer",
    total_tasks: 16,
    completed_tasks: 8,
    progress_percentage: 50.0,
    members_count: 5,
    fairness_score: 84,
    status: "Active",
    days_remaining: 35,
  },
  {
    id: "c3d4e5f6-0000-0000-0000-000000000003",
    name: "Decentralized Credential Ledger",
    description: "Tamper-proof academic transcript verification platform built for university credentialing hackathon.",
    category: "Web3 & Security",
    start_date: "2026-06-01",
    deadline: "2026-08-15",
    my_role: "Frontend Lead",
    total_tasks: 24,
    completed_tasks: 24,
    progress_percentage: 100.0,
    members_count: 4,
    fairness_score: 97,
    status: "Completed",
    days_remaining: 0,
  },
]

// ─── Task status values MUST use "To Do" (with space) matching validators.py ───
export const MOCK_TASKS = [
  {
    id: "task-001",
    project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    title: "Implement Real-Time Flow Rate Telemetry Dashboard",
    description: "Build reactive WebSocket chart interface for pipe flow rates using Recharts.",
    status: "Completed",
    priority: "High",
    assigned_to: "Abhaas",
    assigned_user_id: "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
    deadline: "2026-09-15T18:00:00Z",
    completed_at: "2026-09-14T18:30:00Z",
    is_on_time: true,
    evidence_count: 2,
    has_evidence: true,
    evidence: [
      {
        id: "ev-01",
        type: "github_pr",
        title: "PR #42: Telemetry WebSockets & UI",
        url: "https://github.com/fairshare/water-mgmt/pull/42",
        verified: true,
      },
    ],
  },
  {
    id: "task-002",
    project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    title: "Sensor Anomaly Notification API",
    description: "Flask REST endpoint and alerting webhooks for abnormal pressure drops.",
    status: "Completed",
    priority: "Critical",
    assigned_to: "Rohit",
    assigned_user_id: "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
    deadline: "2026-09-18T18:00:00Z",
    completed_at: "2026-09-17T22:10:00Z",
    is_on_time: true,
    evidence_count: 1,
    has_evidence: true,
    evidence: [
      {
        id: "ev-02",
        type: "github_pr",
        title: "PR #44: Anomaly Detection Engine",
        url: "https://github.com/fairshare/water-mgmt/pull/44",
        verified: true,
      },
    ],
  },
  {
    id: "task-003",
    project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    title: "ESP32 LoRa Firmware Calibration",
    description: "Flash microcontrollers with sleep-cycle algorithms to conserve battery life in remote field boxes.",
    status: "Completed",
    priority: "Medium",
    assigned_to: "Denesh",
    assigned_user_id: "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
    deadline: "2026-09-24T18:00:00Z",
    completed_at: "2026-09-25T11:00:00Z",
    is_on_time: false,
    evidence_count: 1,
    has_evidence: true,
    evidence: [
      {
        id: "ev-03",
        type: "document",
        title: "LoRa Battery Life Benchmarks.pdf",
        url: "https://storage.supabase.co/water-mgmt/benchmarks.pdf",
        verified: true,
      },
    ],
  },
  {
    id: "task-004",
    project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    title: "End-to-End Cypress Integration Tests",
    description: "Automate test suite covering login, workspace switching, and sensor data ingest.",
    status: "In Progress",
    priority: "Medium",
    assigned_to: "Aditya",
    assigned_user_id: "f6092fe7-c2d0-4f31-2727-3f4f90160c03",
    deadline: "2026-10-18T18:00:00Z",
    completed_at: null,
    is_on_time: null,
    evidence_count: 0,
    has_evidence: false,
    evidence: [],
  },
  {
    id: "task-005",
    project_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    title: "Final Capstone Presentation Deck & Architecture Diagram",
    description: "Prepare academic defense presentation and high-resolution architecture export.",
    status: "To Do",   // ← was "Todo" (missing space) — fixed to match validators.py
    priority: "High",
    assigned_to: "Abhaas",
    assigned_user_id: "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
    deadline: "2026-10-25T18:00:00Z",
    completed_at: null,
    is_on_time: null,
    evidence_count: 0,
    has_evidence: false,
    evidence: [],
  },
]

export const MOCK_UPCOMING_DEADLINES = [
  {
    id: "task-004",
    title: "End-to-End Cypress Integration Tests",
    project_name: "Smart Water Management System",
    due_date: "2026-10-18",
    priority: "High",
    status: "In Progress",
  },
  {
    id: "task-005",
    title: "Final Capstone Presentation Deck",
    project_name: "Smart Water Management System",
    due_date: "2026-10-25",
    priority: "High",
    status: "To Do",
  },
]

// ─── Evidence types match expanded AttachEvidenceSchema ───
export const MOCK_EVIDENCE_ITEMS = [
  {
    id: "ev-01",
    task_id: "task-001",
    task_title: "Implement Real-Time Flow Rate Telemetry Dashboard",
    member_name: "Abhaas",
    user_id: "c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0",
    type: "github_pr",
    title: "Pull Request #42: Telemetry WebSockets & UI",
    url: "https://github.com/fairshare/water-mgmt/pull/42",
    submitted_at: "2026-09-14T18:25:00Z",
  },
  {
    id: "ev-02",
    task_id: "task-002",
    task_title: "Sensor Anomaly Notification API",
    member_name: "Rohit",
    user_id: "d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1",
    type: "github_pr",
    title: "Pull Request #44: Anomaly Detection Engine",
    url: "https://github.com/fairshare/water-mgmt/pull/44",
    submitted_at: "2026-09-17T22:05:00Z",
  },
  {
    id: "ev-03",
    task_id: "task-003",
    task_title: "ESP32 LoRa Firmware Calibration",
    member_name: "Denesh",
    user_id: "e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2",
    type: "document",
    title: "LoRa Battery Life Benchmarks.pdf",
    url: "https://storage.supabase.co/water-mgmt/benchmarks.pdf",
    submitted_at: "2026-09-25T10:45:00Z",
  },
]

/**
 * MOCK_CONTRIBUTION_BREAKDOWN
 * 5 factors matching the README specification exactly:
 *   Task Completion (30%) + Timeliness (20%) + Work Evidence (20%) +
 *   Peer Feedback (20%) + Participation (10%) = 100%
 *
 * Scores match README benchmark: Abhaas = 82%
 */
export const MOCK_CONTRIBUTION_BREAKDOWN = {
  overall_score: 82,
  breakdown: {
    task_completion: {
      weight: "30%",
      score: 90.0,
      weighted_contribution: 27.0,
      explanation: "Completed 18 out of 20 assigned deliverables.",
    },
    timeliness: {
      weight: "20%",
      score: 85.0,
      weighted_contribution: 17.0,
      explanation: "17 out of 20 tasks submitted on or before server deadline.",
    },
    work_evidence: {
      weight: "20%",
      score: 80.0,
      weighted_contribution: 16.0,
      explanation: "16 tasks backed by verified links or uploaded files.",
    },
    peer_feedback: {
      weight: "20%",
      score: 75.0,
      weighted_contribution: 15.0,
      explanation: "Aggregated 3.75 / 5.0 across 6 evaluation dimensions from teammates.",
    },
    participation: {
      weight: "10%",
      score: 70.0,
      weighted_contribution: 7.0,
      explanation: "Logged 21 verified project actions against team benchmark.",
    },
  },
  // ─── Trend data: week labels match analytics_routes.py ("Week N" format) ───
  trend_data: [
    { week: "Week 1", Abhaas: 55, Rohit: 50, Denesh: 40, Aditya: 45 },
    { week: "Week 2", Abhaas: 67, Rohit: 62, Denesh: 54, Aditya: 50 },
    { week: "Week 3", Abhaas: 76, Rohit: 70, Denesh: 62, Aditya: 58 },
    { week: "Week 4", Abhaas: 82, Rohit: 76, Denesh: 68, Aditya: 61 },
  ],
}

export const MOCK_ACTIVITY_LOGS = [
  {
    id: "act-01",
    timestamp: "12 minutes ago",
    user: "Abhaas",
    action: "verified pull request",
    detail: "PR #42 merged into main branch",
    category: "evidence",
  },
  {
    id: "act-02",
    timestamp: "2 hours ago",
    user: "Rohit",
    action: "completed task",
    detail: "Sensor Anomaly Notification API",
    category: "task",
  },
  {
    id: "act-03",
    timestamp: "5 hours ago",
    user: "Denesh",
    action: "uploaded artifact",
    detail: "LoRa Battery Life Benchmarks.pdf",
    category: "evidence",
  },
  {
    id: "act-04",
    timestamp: "1 day ago",
    user: "Aditya",
    action: "updated deliverable status",
    detail: "End-to-End Cypress Tests moved to In Progress",
    category: "task",
  },
]
