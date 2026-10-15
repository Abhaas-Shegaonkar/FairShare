-- ==============================================================================
-- FairShare Reference Seed Data Script
--
-- Populates the prototype "Smart Water Management System" project with:
-- 1. 4 Students (Abhaas, Rohit, Denesh, Aditya)
-- 2. Project workspace ("Smart Water Management System")
-- 3. Team memberships with distinct roles
-- 4. Tasks across various priorities and completion statuses
-- 5. Verifiable evidence links and artifacts
-- 6. Structured 6-dimension peer reviews
-- 7. Audit activity logs
-- 8. Historical weekly contribution snapshots (Weeks 1 to 4)
-- ==============================================================================

-- 1. Insert Reference Users
-- Password for all sample users: "Password123!"
-- Bcrypt hash generated with 12 rounds: $2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy
INSERT INTO users (id, email, password_hash, name, avatar_url) VALUES
('c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'abhaas@college.edu', '$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy', 'Abhaas', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abhaas'),
('d4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'rohit@college.edu', '$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy', 'Rohit', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit'),
('e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'denesh@college.edu', '$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy', 'Denesh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Denesh'),
('f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'aditya@college.edu', '$2b$12$e8gJq4s4g/cQhZfQ1vXgpe2uYlK6sD8fI1lGqX8aB2k9vP5lQ6wUy', 'Aditya', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Reference Project
INSERT INTO projects (id, name, description, category, start_date, deadline, created_by) VALUES
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Smart Water Management System',
    'An IoT and full-stack cloud platform for real-time monitoring and autonomous conservation of campus water distribution networks.',
    'IoT & Full-Stack',
    '2026-08-01',
    '2026-09-30',
    'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Team Members & Roles
INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'Frontend Lead', '2026-08-01 09:00:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'Backend Developer', '2026-08-01 09:30:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'Hardware Engineer', '2026-08-01 10:00:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'Documentation & QA', '2026-08-01 10:15:00+00')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 4. Insert Sample Tasks
INSERT INTO tasks (id, project_id, title, description, deadline, priority, status, assigned_to, completed_by, completed_at, created_at) VALUES
-- Abhaas's Tasks (Frontend)
('10000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Interactive Sensor Telemetry Dashboard', 'Develop live charts for water flow rates and pressure readings.', '2026-08-15 18:00:00+00', 'High', 'Completed', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', '2026-08-14 16:30:00+00', '2026-08-02 10:00:00+00'),
('10000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Tank Capacity Visualizer Component', 'Dynamic SVG water level animation with warning state badges.', '2026-08-22 18:00:00+00', 'Medium', 'Completed', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', '2026-08-21 14:15:00+00', '2026-08-05 11:00:00+00'),
('10000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Mobile-Responsive Shell & Navigation', 'Ensure mobile breakpoint adapts for field technician tablets.', '2026-09-05 18:00:00+00', 'High', 'Completed', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', '2026-09-04 17:00:00+00', '2026-08-18 09:00:00+00'),
('10000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Automated Leak Alert Notification Banner', 'Real-time WebSocket banner trigger for critical leak events.', '2026-09-20 18:00:00+00', 'Critical', 'In Progress', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', NULL, NULL, '2026-09-01 10:00:00+00'),

-- Rohit's Tasks (Backend)
('20000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Sensor Ingestion Timescale Pipeline', 'High-throughput REST and MQTT ingestion for ultrasonic sensor nodes.', '2026-08-16 18:00:00+00', 'Critical', 'Completed', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', '2026-08-15 19:20:00+00', '2026-08-02 10:30:00+00'),
('20000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Anomaly Detection Model for Pipe Bursts', 'Statistical threshold pipeline identifying sudden pressure drops.', '2026-08-28 18:00:00+00', 'High', 'Completed', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', '2026-08-29 11:00:00+00', '2026-08-10 14:00:00+00'), -- Late delivery example
('20000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Supabase Database Partitioning & Archiving', 'Partition telemetry by month for sub-second query performance.', '2026-09-15 18:00:00+00', 'Medium', 'Completed', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', '2026-09-14 15:45:00+00', '2026-08-25 11:30:00+00'),

-- Denesh's Tasks (Hardware)
('30000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ESP32 Firmware for Ultrasonic Sensor', 'C++ firmware with deep sleep mode for battery operation.', '2026-08-18 18:00:00+00', 'High', 'Completed', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', '2026-08-18 12:00:00+00', '2026-08-03 09:00:00+00'),
('30000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Solar Power Battery Regulator Circuit PCB', 'Custom KiCad schematic for 5V solar charging and power management.', '2026-09-01 18:00:00+00', 'Medium', 'Completed', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', '2026-09-03 16:30:00+00', '2026-08-15 10:00:00+00'), -- Late delivery example
('30000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Weatherproof Outdoor Enclosure 3D Print', 'Design IP65 enclosure for valve control node.', '2026-09-22 18:00:00+00', 'Low', 'To Do', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', NULL, NULL, '2026-09-02 14:00:00+00'),

-- Aditya's Tasks (QA & Documentation)
('40000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Comprehensive System Architecture Whitepaper', 'IEEE format technical report detailing end-to-end telemetry specs.', '2026-08-25 18:00:00+00', 'Medium', 'Completed', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', '2026-08-24 16:00:00+00', '2026-08-04 10:00:00+00'),
('40000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Automated Postman API Test Suite', 'End-to-end integration test collection covering auth and ingestion.', '2026-09-10 18:00:00+00', 'High', 'Completed', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', '2026-09-12 11:30:00+00', '2026-08-20 15:00:00+00') -- Late delivery example
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Work Evidence Artifacts
INSERT INTO evidence (id, task_id, user_id, type, title, url, notes, submitted_at) VALUES
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'github', 'PR #24: Live Recharts telemetry dashboard with WebSocket streaming', 'https://github.com/campus-iot/water-system/pull/24', 'Integrated live data poll and latency under 120ms.', '2026-08-14 16:30:00+00'),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'figma', 'Figma Canvas: Tank capacity widgets and alert color tokens', 'https://www.figma.com/design/sample-water-ui', 'Approved by faculty advisor.', '2026-08-21 14:15:00+00'),
('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'github', 'PR #12: Async MQTT broker to PostgreSQL ingestion pipeline', 'https://github.com/campus-iot/water-system/pull/12', 'Handles up to 500 requests/sec with zero drops.', '2026-08-15 19:20:00+00'),
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'github', 'PR #8: ESP32 deep-sleep firmware code & calibration script', 'https://github.com/campus-iot/water-system/pull/8', 'Validated on breadboard prototype.', '2026-08-18 12:00:00+00'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'document', 'System Architecture Whitepaper PDF v1.0', 'https://storage.fairshare.app/evidence_files/architecture_whitepaper_v1.pdf', 'Complete with block diagrams and math formulas.', '2026-08-24 16:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Peer Feedback (Evaluating Teammates Across 6 Dimensions)
INSERT INTO peer_feedback (project_id, reviewer_id, reviewee_id, participation_score, responsibility_score, quality_score, collaboration_score, communication_score, timeliness_score, comments, submitted_at) VALUES
-- Rohit reviews Abhaas
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 5, 5, 5, 4, 4, 5, 'Abhaas stepped up to coordinate the entire front-end and delivered all charts well before deadlines.', '2026-09-25 10:00:00+00'),
-- Denesh reviews Abhaas
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 5, 4, 5, 5, 4, 4, 'Great collaboration with the hardware team to integrate sensor payload fields smoothly.', '2026-09-25 11:30:00+00'),
-- Abhaas reviews Rohit
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 4, 5, 5, 4, 4, 4, 'Rohit designed rock-solid REST endpoints and documentation. One slight delay on anomaly model but solved properly.', '2026-09-25 14:00:00+00'),
-- Denesh reviews Rohit
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 4, 4, 4, 4, 4, 4, 'Reliable backend partner, made hardware testing simple.', '2026-09-25 15:00:00+00'),
-- Abhaas reviews Denesh
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 4, 4, 4, 3, 3, 3, 'Solid electronics work, but communication in Discord was occasional.', '2026-09-25 16:30:00+00'),
-- Rohit reviews Denesh
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 4, 3, 4, 4, 3, 4, 'Delivered the ESP32 firmware on time. PCB fabrication had some delays.', '2026-09-25 17:00:00+00'),
-- Abhaas reviews Aditya
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 3, 3, 4, 3, 4, 3, 'Helpful writeup, but missed couple team sync meetings.', '2026-09-25 18:00:00+00'),
-- Rohit reviews Aditya
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 4, 3, 3, 4, 4, 3, 'Completed testing suite eventually, needs to take more initiative.', '2026-09-25 19:00:00+00')
ON CONFLICT (project_id, reviewer_id, reviewee_id) DO NOTHING;

-- 7. Insert Activity Logs
INSERT INTO activity_logs (project_id, user_id, action_type, description, timestamp) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'PROJECT_CREATED', 'Abhaas created workspace for Smart Water Management System.', '2026-08-01 09:00:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'MEMBER_JOINED', 'Rohit joined the project as Backend Developer.', '2026-08-01 09:30:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'TASK_COMPLETED', 'Abhaas completed "Interactive Sensor Telemetry Dashboard".', '2026-08-14 16:30:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'EVIDENCE_SUBMITTED', 'Abhaas attached PR #24 as work proof.', '2026-08-14 16:32:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'TASK_COMPLETED', 'Rohit completed "Sensor Ingestion Timescale Pipeline".', '2026-08-15 19:20:00+00'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'TASK_COMPLETED', 'Denesh completed "ESP32 Firmware for Ultrasonic Sensor".', '2026-08-18 12:00:00+00');

-- 8. Insert Weekly Contribution Snapshots (Trend History)
-- Matches:
-- Week 1: Abhaas (55), Rohit (50), Denesh (40), Aditya (45)
-- Week 2: Abhaas (67), Rohit (62), Denesh (54), Aditya (50)
-- Week 3: Abhaas (76), Rohit (70), Denesh (62), Aditya (58)
-- Week 4: Abhaas (82), Rohit (76), Denesh (68), Aditya (61)
INSERT INTO contribution_snapshots (project_id, user_id, week_label, score, snapshot_date) VALUES
-- Week 1
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'Week 1', 55.00, '2026-08-07'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'Week 1', 50.00, '2026-08-07'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'Week 1', 40.00, '2026-08-07'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'Week 1', 45.00, '2026-08-07'),

-- Week 2
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'Week 2', 67.00, '2026-08-14'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'Week 2', 62.00, '2026-08-14'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'Week 2', 54.00, '2026-08-14'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'Week 2', 50.00, '2026-08-14'),

-- Week 3
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'Week 3', 76.00, '2026-08-21'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'Week 3', 70.00, '2026-08-21'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'Week 3', 62.00, '2026-08-21'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'Week 3', 58.00, '2026-08-21'),

-- Week 4 (Final prototype benchmarks: Abhaas 82%, Rohit 76%, Denesh 68%, Aditya 61%)
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c3d69cb4-9fae-4f0e-9494-0f1e67e3dfd0', 'Week 4', 82.00, '2026-08-28'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'd4e70dc5-a0bf-4f1f-0505-1f2f78f4eae1', 'Week 4', 76.00, '2026-08-28'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'e5f81ed6-b1cf-4f20-1616-2f3f8905fbf2', 'Week 4', 68.00, '2026-08-28'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'f6092fe7-c2d0-4f31-2727-3f4f90160c03', 'Week 4', 61.00, '2026-08-28')
ON CONFLICT (project_id, user_id, week_label) DO NOTHING;
