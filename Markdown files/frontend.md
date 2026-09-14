# FairShare Frontend Implementation Specification

This document provides a comprehensive, implementation-ready frontend design and technical specification for **FairShare**, based directly on the product requirements in [`idea.md`](idea.md) and technical foundations in [`architecture.md`](architecture.md).

---

## 1. Frontend Technology Stack & Dependencies

- **Core Framework:** React 18+ (SPA with React Router v6+)
- **Build Tool:** Vite (fast modern bundler)
- **Styling:** Modular CSS / Clean Custom Design System (CSS variables for theming, responsive flexbox & grid)
- **Visualizations & Charts:** Recharts or Chart.js (for contribution breakdowns, team comparisons, and score progression trends)
- **Icons:** Lucide React (`lucide-react`)
- **Backend / DB Integration:** Supabase Client (`@supabase/supabase-js`) & Axios / Fetch for custom endpoints
- **State Management:** React Context API (AuthContext, ProjectContext, NotificationContext)

---

## 2. Design System & Style Guide

FairShare requires a trustworthy, clean, student-friendly, and transparent UI. It avoids cluttered corporate look-and-feels in favor of clear whitespace, crisp typography, and readable visualizations.

### Color Palette

| Token | Hex / Value | Semantic Role |
|---|---|---|
| `--color-primary` | `#4F46E5` (Indigo-600) | Primary actions, brand identity, active tabs |
| `--color-primary-light` | `#EEF2FF` (Indigo-50) | Highlight backgrounds, badge fills |
| `--color-primary-hover` | `#4338CA` (Indigo-700) | Button hover states |
| `--color-accent` | `#6366F1` (Indigo-500) | Gradients, trend line markers |
| `--color-success` | `#10B981` (Emerald-500) | Completed tasks, on-time badges, high scores |
| `--color-success-bg` | `#ECFDF5` (Emerald-50) | Success badge backgrounds |
| `--color-warning` | `#F59E0B` (Amber-500) | Approaching deadlines, medium priority |
| `--color-warning-bg` | `#FFFBEB` (Amber-50) | Warning notice banners |
| `--color-danger` | `#EF4444` (Rose-500) | Overdue tasks, late badges |
| `--color-danger-bg` | `#FEF2F2` (Rose-50) | Overdue indicators |
| `--color-bg-main` | `#F8FAFC` (Slate-50) | Application body background |
| `--color-bg-card` | `#FFFFFF` | Card surfaces, modals |
| `--color-border` | `#E2E8F0` (Slate-200) | Card borders, dividers, inputs |
| `--color-text-main` | `#0F172A` (Slate-900) | Headings, primary text |
| `--color-text-muted` | `#64748B` (Slate-500) | Subtitles, labels, timestamps |

### Typography & Spacing
- **Font Family:** `'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- **Border Radii:** Rounded cards (`border-radius: 12px`), pills (`border-radius: 9999px`), inputs (`border-radius: 8px`)
- **Shadows:**
  - Card: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
  - Elevated/Modal: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`

---

## 3. Directory Structure

```text
fairshare-frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── assets/
    │   ├── logo.svg
    │   └── illustrations/
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ProjectContext.jsx
    ├── services/
    │   ├── supabaseClient.js
    │   ├── projectService.js
    │   ├── taskService.js
    │   ├── evidenceService.js
    │   ├── feedbackService.js
    │   └── scoringEngine.js       # Client-side preview/formatting of scores
    ├── hooks/
    │   ├── useProject.js
    │   └── useContributionScore.js
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Button.jsx
    │   │   ├── Badge.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ProgressBar.jsx
    │   │   └── MetricCard.jsx
    │   ├── dashboard/
    │   │   ├── ProjectCard.jsx
    │   │   ├── UpcomingDeadlines.jsx
    │   │   └── ActivityFeed.jsx
    │   ├── workspace/
    │   │   ├── TaskBoard.jsx
    │   │   ├── TaskCard.jsx
    │   │   ├── CreateTaskModal.jsx
    │   │   ├── SubmitEvidenceModal.jsx
    │   │   ├── MemberList.jsx
    │   │   └── ActivityTimeline.jsx
    │   ├── contribution/
    │   │   ├── ScoreExplainerModal.jsx
    │   │   ├── ScoreFactorBreakdown.jsx
    │   │   ├── TeamComparisonChart.jsx
    │   │   └── ContributionTrendChart.jsx
    │   ├── feedback/
    │   │   └── PeerFeedbackModal.jsx
    │   └── report/
    │       └── FinalReportTemplate.jsx
    └── pages/
        ├── LandingPage.jsx
        ├── LoginPage.jsx
        ├── SignupPage.jsx
        ├── DashboardPage.jsx
        ├── CreateProjectPage.jsx
        ├── ProjectWorkspacePage.jsx
        ├── ContributionPage.jsx
        └── FinalReportPage.jsx
```

---

## 4. Application Routes & Flow

| Route | Page Component | Access | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Product overview, problem statement, core value props, CTA |
| `/login` | `LoginPage` | Public | Student email/password login |
| `/signup` | `SignupPage` | Public | Student onboarding with role & college info |
| `/dashboard` | `DashboardPage` | Protected | Global overview: student's projects, quick stats, pending tasks |
| `/projects/new` | `CreateProjectPage` | Protected | Multi-step form to create project & invite teammates |
| `/projects/:id` | `ProjectWorkspacePage` | Protected | Main project workspace (Tabs: Tasks, Team, Evidence, Activity) |
| `/projects/:id/contribution` | `ContributionPage` | Protected | Detailed contribution breakdown, metrics, and team comparison |
| `/projects/:id/feedback` | `ProjectWorkspacePage` (Modal) | Protected | Peer feedback submission form |
| `/projects/:id/report` | `FinalReportPage` | Protected | Final contribution summary & printable/exportable report |

---

## 5. Detailed Page Specifications & Component Breakdowns

### 5.1 Landing Page (`LandingPage.jsx`)
- **Hero Section:**
  - Headline: *"Making Every Contribution Count"*
  - Subtitle: *"Transparent, evidence-based project management for student groups. Say goodbye to unequal group project grades."*
  - CTAs: `[Get Started Free]` and `[Explore Sample Project]`
- **The Problem Section:**
  - Side-by-side comparison: *Traditional Group Projects (Subjective grading, free-rider problem)* vs *FairShare (Transparent score, verifiable evidence, peer validation)*.
- **How It Works (4 Steps):**
  1. *Create & Assign:* Break down the project into prioritized tasks.
  2. *Submit Work Evidence:* Attach GitHub PRs, Figma links, or documents to completed tasks.
  3. *Continuous Tracking:* Transparent activity logging and structured peer reviews.
  4. *Fair Score & Report:* Objective calculation with a 5-factor breakdown.
- **Sample Metrics Demo Widget:**
  - Interactive preview showing a dummy profile with `82% Contribution Score` and an expandable breakdown slider.

---

### 5.2 Global Dashboard (`DashboardPage.jsx`)
- **Header:** Welcome greeting, current active projects count, overall tasks completed.
- **Active Projects Grid (`ProjectCard.jsx`):**
  - Project Title & Category (e.g. *Smart Water Management System - Hardware/IoT*)
  - Deadline countdown pill
  - Progress bar (Tasks Completed / Total Tasks)
  - Team member avatars
  - Quick link to Workspace and Contribution Dashboard
- **Upcoming Deadlines Panel:**
  - List of user-assigned tasks due within the next 48-72 hours.
- **Recent Activity Stream:**
  - Real-time updates on team submissions across all user projects.

---

### 5.3 Project Creation Flow (`CreateProjectPage.jsx`)
- **Step 1: Project Information:**
  - Name, Description, Category (e.g., Academic, Hackathon, Capstone), Start Date, and Final Deadline.
- **Step 2: Team Members & Roles:**
  - Dynamic member input fields: Name / Email + Role (e.g., `Abhaas - Frontend`, `Rohit - Backend`).
  - System flags the creator as Team Leader.
- **Step 3: Confirmation:**
  - Summary review and `[Create Workspace]` trigger.

---

### 5.4 Project Workspace (`ProjectWorkspacePage.jsx`)
The heart of FairShare. Organized into 5 clean tabs:

#### Tab 1: Overview
- High-level project progress bar and days remaining.
- Team member cards with their assigned roles and task completion counts.
- Notice banner: *Peer Feedback opens 3 days before project deadline.*

#### Tab 2: Tasks (`TaskBoard.jsx`)
- View Toggle: Column/Kanban view (`To Do`, `In Progress`, `Completed`) and Table list view.
- **Task Card (`TaskCard.jsx`):**
  - Title, Assigned Member avatar, Due date badge (green/amber/red).
  - Priority badge: `Low` (Gray), `Medium` (Amber), `High` (Red).
  - Evidence status indicator:
    - If Completed with Evidence: Green checkmark + Link icon.
    - If Completed without Evidence: Amber alert badge *"Evidence Missing"*.
  - Action buttons: `[Change Status]`, `[Submit Evidence]`, `[Task History]`.

#### Tab 3: Work Evidence Vault (`EvidenceList.jsx`)
- Repository of all proof of work uploaded by team members.
- Filters: By Member, by Task, by Type (GitHub, Figma, Image, Docs).
- Each card displays: Task name, Member, Link/Preview, and Timestamp.

#### Tab 4: Activity Timeline (`ActivityTimeline.jsx`)
- Chronological, immutable feed of project events:
  - *"Abhaas completed 'Login UI' and attached Figma link"* (Today, 2:15 PM)
  - *"Rohit marked 'API Documentation' as In Progress"* (Today, 11:30 AM)
  - *"Aditya created task 'Final Presentation'"* (Yesterday)

#### Tab 5: Team Directory & Roles
- List of members, roles, contact info, and overall involvement status.

---

### 5.5 Contribution Dashboard (`ContributionPage.jsx`)

Designed around the **Transparency & Explainability Principle**: No black-box scores.

#### Top Metric Cards
1. **Overall Contribution Score:** Prominently displays score (e.g., `82%`) with a *"How is this calculated?"* information button.
2. **Task Completion:** `18 / 20 Tasks (90%)`
3. **On-Time Rate:** `85% on-time delivery`
4. **Evidence Submissions:** `16 verified artifacts`
5. **Peer Review Average:** `4.2 / 5.0`

#### Component: Score Breakdown (`ScoreFactorBreakdown.jsx`)
Displays visual progress bars for each of the 5 weighted factors:
- **Task Completion (30% weight):** `90%` -> Contributes `27.0%`
- **Timeliness (20% weight):** `85%` -> Contributes `17.0%`
- **Work Evidence (20% weight):** `80%` -> Contributes `16.0%`
- **Peer Feedback (20% weight):** `78%` (3.9/5) -> Contributes `15.6%`
- **Participation (10% weight):** `75%` -> Contributes `7.5%`
- **Total Combined:** **83.1% (Rounded to 83%)**

#### Component: Score Explainer Modal (`ScoreExplainerModal.jsx`)
- Triggered when clicking any factor or the info button.
- Shows the exact formula and reason:
  - *"Why did I get 85% in Timeliness? You completed 17 out of 20 tasks before the specified deadline. 3 tasks were marked complete after the deadline."*
  - Includes anti-gaming disclaimer: *"Scores reflect verifiable tasks and peer reviews, not subjective judgements or total task counts."*

#### Component: Team Contribution Comparison (`TeamComparisonChart.jsx`)
- Horizontal Bar Chart (Recharts):
  - `Abhaas (Frontend): 82%`
  - `Rohit (Backend): 76%`
  - `Denesh (Hardware): 68%`
  - `Aditya (Documentation): 61%`
- Formatted informatively and respectfully (avoiding toxic gamification/leaderboard tropes).

#### Component: Contribution Trend Line (`ContributionTrendChart.jsx`)
- Line chart displaying weekly progression:
  - Week 1: 55%
  - Week 2: 67%
  - Week 3: 76%
  - Week 4: 82%
- Demonstrates continuous consistency over last-minute sprints.

---

### 5.6 Peer Feedback Interface (`PeerFeedbackModal.jsx`)
- Triggered at project milestones or final phase.
- Anonymous peer evaluation form per teammate across 6 dimensions:
  1. **Participation:** *Active involvement in discussions and planning.* (Rating 1 - 5)
  2. **Responsibility:** *Took ownership of assigned deliverables.* (Rating 1 - 5)
  3. **Quality of Work:** *Standard and thoroughness of output.* (Rating 1 - 5)
  4. **Collaboration:** *Willingness to support and work with others.* (Rating 1 - 5)
  5. **Communication:** *Prompt updates and clear messaging.* (Rating 1 - 5)
  6. **Timeliness:** *Respected internal commitments and dates.* (Rating 1 - 5)
- Optional qualitative notes (Constructive feedback).
- Peer feedback is strictly sanitized so team members only see aggregated averages.

---

### 5.7 Final Contribution Report (`FinalReportPage.jsx`)
- Print-friendly and downloadable summary:
  - Project Title, Duration, Team Roster.
  - Comprehensive member breakdown table with individual percentages and task count.
  - Evidence audit log (links to all verified deliverables).
  - Formal disclaimer explaining the methodology and intended academic support use.
- CTA: `[Download PDF / Print]` (Triggering `window.print()` with `@media print` styling).

---

## 6. Sample Prototype Data & Mock State

Pre-populated mock dataset for instant prototype demonstration:

```javascript
export const SAMPLE_PROJECT = {
  id: "proj-101",
  name: "Smart Water Management System",
  category: "IoT & Full-Stack",
  startDate: "2026-08-01",
  deadline: "2026-09-30",
  status: "In Progress",
  members: [
    { id: "u1", name: "Abhaas", role: "Frontend Lead", score: 82, completedTasks: 18, totalTasks: 20 },
    { id: "u2", name: "Rohit", role: "Backend Developer", score: 76, completedTasks: 15, totalTasks: 19 },
    { id: "u3", name: "Denesh", role: "Hardware Engineer", score: 68, completedTasks: 11, totalTasks: 16 },
    { id: "u4", name: "Aditya", role: "Documentation & QA", score: 61, completedTasks: 9, totalTasks: 15 },
  ],
  scoreBreakdownAbhaas: {
    taskCompletion: { score: 90, weight: 30, value: 27.0, label: "18 of 20 tasks completed" },
    timeliness: { score: 85, weight: 20, value: 17.0, label: "15 of 18 tasks on schedule" },
    workEvidence: { score: 80, weight: 20, value: 16.0, label: "16 evidence links attached" },
    peerFeedback: { score: 78, weight: 20, value: 15.6, label: "Average 3.9 / 5.0 rating" },
    participation: { score: 75, weight: 10, value: 7.5, label: "Regular activity updates logged" },
    total: 82
  },
  trendData: [
    { week: "Week 1", Abhaas: 55, Rohit: 50, Denesh: 40, Aditya: 45 },
    { week: "Week 2", Abhaas: 67, Rohit: 62, Denesh: 54, Aditya: 50 },
    { week: "Week 3", Abhaas: 76, Rohit: 70, Denesh: 62, Aditya: 58 },
    { week: "Week 4", Abhaas: 82, Rohit: 76, Denesh: 68, Aditya: 61 },
  ]
};
```

---

## 7. Next Implementation Steps

1. **Scaffold Vite React App:** Run project initialization with modern styling.
2. **Setup Global Design System:** Create base CSS variables, reset, and shared component primitives.
3. **Build Core Navigation & Views:** Implement App Router, Navbar, and Dashboard layouts.
4. **Integrate Visualizations:** Build the Score Breakdown progress bars and Recharts comparisons.
5. **Connect Backend/Supabase Services:** Connect task management, evidence uploads, and scoring engine.
