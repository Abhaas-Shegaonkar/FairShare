# FairShare
### Making Every Contribution Count

## Problem Statement

Group projects can become unfair when contribution levels differ but are difficult to measure objectively.

In many college group projects, one or two students may do most of the actual work while other members contribute less. However, everyone may still receive the same marks or recognition because there is no clear, transparent way to measure individual contribution.

FairShare aims to make individual contribution **visible, measurable, evidence-based, and fair**.

---

## 1. Product Overview

FairShare is a web-based group project management and contribution tracking platform.

It allows students to:
- Create and manage group projects
- Add team members
- Assign and track tasks
- Submit evidence of completed work
- Track project activity
- Give structured peer feedback
- Calculate a transparent contribution score
- View individual and team contribution dashboards
- Generate a final contribution report

The goal is NOT to judge a student's overall ability.

The goal is to provide a **transparent indication of contribution during a group project**.

---

## 2. Target Users

Primary users:
- College students
- Project teams
- Hackathon teams
- Design Thinking teams
- Academic group-project teams

Potential future users:
- Teachers / faculty
- Project mentors
- Club/team coordinators

For the prototype, focus mainly on **students**.

---

## 3. Core User Flow

The main FairShare workflow should be:

Create Project
→ Add Team Members
→ Create Tasks
→ Assign Tasks
→ Members Work
→ Submit Work Evidence
→ Track Activity
→ Complete Tasks
→ Peer Feedback
→ Calculate Contribution Score
→ View Dashboard
→ Generate Final Report

---

## 4. Detailed Features

### Feature 1 — Project & Team Creation

The user can create a project with:
- Project name
- Project description
- Project category
- Start date
- Deadline
- Team members
- Member roles

Example:
**Project:** "Smart Water Management System"
**Members:**
- Abhaas — Frontend
- Rohit — Backend
- Denesh — Hardware
- Aditya — Documentation

The project creator becomes the team leader.

---

### Feature 2 — Task Management

Each project should have a task management section.

Users can:
- Create tasks
- Assign tasks to specific members
- Set deadlines
- Set priority
- Update task status
- View completed and pending tasks

Task statuses:
- To Do
- In Progress
- Completed

Task priorities:
- Low
- Medium
- High

Each task should display:
- Task name
- Assigned member
- Deadline
- Priority
- Status
- Completion date
- Evidence
- Activity history

Example:
**Task:** "Design Login Page"
**Assigned to:** Abhaas
**Deadline:** 20 September
**Status:** Completed

---

### Feature 3 — Contribution Tracking

FairShare should automatically track measurable contribution indicators.

Track:

**Task Completion**
- Number of assigned tasks
- Number of completed tasks
- Completion percentage

**Timeliness**
- Tasks completed on time
- Tasks completed late
- On-time completion percentage

**Work Evidence**
- Number of evidence submissions
- Files/links attached to completed tasks

**Participation**
- Project activity
- Updates/comments
- Participation in project tasks

The system should maintain an activity history for each member.

---

### Feature 4 — Work Evidence

Every completed task should allow the member to attach evidence.

Possible evidence:
- Documents
- Images
- Screenshots
- Project files
- GitHub links
- Figma links
- Presentation slides
- Other relevant URLs

Example:
**Task:** "Create Database Schema"
**Evidence:**
- `database_schema.png`
- GitHub repository link

The purpose is to make contribution **verifiable instead of purely self-reported**.

For the prototype, actual file storage can be simplified or simulated.

---

### Feature 5 — Activity Timeline

Create a project activity timeline.

Example:
**Today:**
- Abhaas completed "Login UI"
- Rohit uploaded "API Documentation"
- Denesh completed "Sensor Testing"

**Yesterday:**
- Aditya created "Final Presentation" task
- Abhaas updated "Dashboard UI"

This allows users to see how the project progressed and who contributed to it.

---

### Feature 6 — Peer Feedback

At suitable stages or near project completion, team members can provide structured feedback about teammates.

Feedback categories:
- Participation
- Responsibility
- Quality of Work
- Collaboration
- Communication
- Timeliness

Use a simple rating system such as:
1 — Poor
2 — Needs Improvement
3 — Average
4 — Good
5 — Excellent

Peer feedback should NOT be the only factor used for calculating contribution.

For the prototype, feedback can be anonymous to other team members.

---

### Feature 7 — Fair Contribution Score

FairShare should calculate a contribution score using multiple measurable factors.

Prototype scoring model:
- **Task Completion (30%):** Measures how many assigned tasks were completed.
- **Timeliness (20%):** Measures whether tasks were completed within deadlines.
- **Work Evidence (20%):** Measures whether completed work has supporting evidence.
- **Peer Feedback (20%):** Measures structured feedback from teammates.
- **Participation (10%):** Measures meaningful project activity and participation.

Example (Abhaas):
- Task Completion: 90%
- Timeliness: 85%
- Work Evidence: 80%
- Peer Feedback: 78%
- Participation: 75%
**Overall Contribution Score: 82%**

The exact formula and weights should be clearly visible to users.

The system should NEVER present the score as an absolute measure of a person's worth, intelligence, or skill. It is only a project contribution indicator.

---

### Feature 8 — Contribution Breakdown

This should be one of the main features of FairShare.

Instead of only showing "Abhaas — 82%", show:

**Contribution Score: 82%**
Breakdown:
- Task Completion: 90%
- Timeliness: 85%
- Work Evidence: 80%
- Peer Feedback: 78%
- Participation: 75%

Use progress bars or simple charts.
This makes the score transparent and helps answer: **"Why did I receive this contribution score?"**

---

### Feature 9 — Individual Dashboard

Each member should have a personal contribution dashboard.

Display:
- Overall contribution score
- Tasks assigned
- Tasks completed
- Pending tasks
- Completion rate
- On-time completion rate
- Evidence submitted
- Peer feedback score
- Recent activities
- Contribution trend

Use simple charts and cards.

Example dashboard:
- **Contribution Score:** 82%
- **Tasks:** 18 / 20 Completed
- **On-Time:** 85%
- **Evidence:** 16 Submissions
- **Peer Feedback:** 4.2 / 5

---

### Feature 10 — Team Dashboard

The team dashboard should provide an overview of the entire project.

Display:
- Overall project progress
- Total tasks
- Completed tasks
- Pending tasks
- Team contribution comparison
- Recent activity
- Upcoming deadlines

Example:
- Abhaas — 82%
- Rohit — 76%
- Denesh — 68%
- Aditya — 61%

Use a bar chart or similar simple visualization. The comparison should be informative, not competitive or gamified.

---

### Feature 11 — Contribution Trend

Show how contribution changes throughout the project.

Example:
- Week 1 → 55%
- Week 2 → 67%
- Week 3 → 76%
- Week 4 → 82%

Use a simple line chart.
This helps show that contribution is tracked throughout the project rather than judged only at the end.

---

### Feature 12 — Final Contribution Report

At the end of the project, FairShare should generate a contribution summary.

Report should contain:

**Project Information**
- Project name
- Team members
- Project duration
- Completion status

**Individual Contribution (For each member)**
- Overall contribution score
- Tasks completed
- Completion rate
- Timeliness
- Evidence submitted
- Peer feedback
- Contribution breakdown

**Project Summary**
- Total tasks
- Completed tasks
- Pending tasks
- Overall project progress

The prototype can provide a "Download Report" button, even if actual PDF generation is simulated.

---

## 5. Website Structure

Create the following main pages:

### 1. Landing Page
Explain:
- What is FairShare?
- Problem
- How it works
- Key benefits
- CTA: "Create a Project"

### 2. Login / Signup
Simple student authentication.

### 3. Dashboard
Show:
- My projects
- Active projects
- Upcoming deadlines
- Recent activity

### 4. Create Project
Form for:
- Project details
- Team members
- Roles

### 5. Project Workspace
Tabs/sections:
- Overview
- Tasks
- Activity
- Team
- Evidence

### 6. Contribution Dashboard
Show:
- Individual scores
- Team comparison
- Contribution breakdown
- Contribution trends

### 7. Peer Feedback
Feedback form and submitted feedback summary.

### 8. Final Report
Project contribution summary with download option.

---

## 6. UI/UX Design

The design should be:
- Modern, Clean, Minimal
- Student-friendly
- Professional
- Easy to understand

Use a trustworthy visual identity representing:
**Fairness + Collaboration + Transparency**

Suggested visual style:
- White/light background
- Blue or blue-purple primary color
- Green for positive/completed states
- Orange/yellow for warnings
- Red only for overdue/negative states
- Rounded cards
- Clean dashboard
- Simple charts
- Clear typography
- Plenty of whitespace

Do NOT make it look overly corporate or like a complex enterprise application.
Do NOT overload the interface with too many charts.

---

## 7. Important UX Principle — Transparency

Every contribution score should be explainable.

If the system displays: **"82% Contribution"**, the user should be able to click on it and understand: **"How was this score calculated?"**

Show the individual factors and their weights. Avoid black-box scoring.

---

## 8. Fairness & Limitations

FairShare should acknowledge that not every contribution can be perfectly measured.

Some valuable contributions are difficult to quantify:
- Brainstorming
- Helping teammates
- Mentoring
- Leadership
- Debugging
- Creative ideas
- Communication
- Problem solving

Therefore: **FairShare does not claim to measure contribution with 100% accuracy.**

It combines measurable activity, evidence, and structured feedback to create a more transparent assessment than simply giving everyone the same score.

---

## 9. Anti-Gaming Considerations

The prototype should include basic safeguards against artificially increasing contribution scores.

Examples:
- Completing many tiny tasks should not automatically mean higher contribution.
- Evidence should be linked to actual tasks.
- Peer feedback should be only one part of the score.
- Team members should not be able to arbitrarily edit their own contribution score.
- Task reassignment should be recorded in activity history.

The goal is to reward **meaningful contribution**, not simply activity quantity.

---

## 10. Prototype Technology Stack

Keep the prototype simple.

**Frontend:**
- React
- HTML
- CSS
- JavaScript

**Backend:**
- Python
- Flask

**Database:**
- SQLite for prototype

**Charts:**
- Recharts or Chart.js

**Authentication:**
- Simple login/signup

The project should prioritize a working prototype and clear user experience over complex architecture.

---

## 11. Prototype Data

Use realistic sample data so the interface looks functional.

**Example project:** "Smart Water Management System"

**Team:**
| Member | Role |
|---|---|
| Abhaas | Frontend |
| Rohit | Backend |
| Denesh | Hardware |
| Aditya | Documentation |

**Example contribution scores:**
| Member | Score |
|---|---:|
| Abhaas | 82% |
| Rohit | 76% |
| Denesh | 68% |
| Aditya | 61% |

Use this sample data throughout the prototype where appropriate.

---

## 12. Design Thinking Connection

Explain how FairShare follows Design Thinking.

**Empathize:** Understand the experiences of students in group projects, especially students who feel their work is not recognized.
**Define:** Identify the core problem: "Students lack a transparent and objective way to demonstrate individual contribution in group projects."
**Ideate:** Explore ways to make contribution visible through task tracking, evidence, activity history, peer feedback, and contribution analytics.
**Prototype:** Build FairShare as a web platform demonstrating the complete contribution tracking workflow.
**Test:** Ask students to use the prototype and evaluate ease of use, perceived fairness, transparency, accuracy of contribution representation, and usefulness of the dashboard.

---

## 13. Future Scope

Possible future improvements:
- Faculty dashboard
- Integration with GitHub
- Integration with Google Drive
- Automatic activity tracking
- Advanced analytics
- Mobile application
- AI-assisted contribution insights
- Project performance predictions
- Custom scoring rules for different project types
- Exportable official assessment reports

Do not include these as mandatory features in the initial prototype.

---

## 14. What Makes FairShare Different

Clearly communicate these differentiators:
- **Evidence-Based:** Contribution can be supported with actual work evidence.
- **Transparent:** Users can see how the score is calculated.
- **Multi-Factor:** Contribution is not based on only one metric.
- **Continuous:** Contribution is tracked throughout the project.
- **Fairness-Oriented:** The system is designed to recognize differences in contribution without encouraging unhealthy competition.

---

## 15. Prototype Priority

Prioritize these features for the first working prototype:
1. Project creation
2. Team management
3. Task creation and assignment
4. Task status tracking
5. Work evidence
6. Activity timeline
7. Peer feedback
8. Contribution score
9. Contribution breakdown
10. Individual/team dashboard
11. Final contribution report

Everything else should be secondary.

---

## Final Product Vision

FairShare should answer one simple question:
**"Who contributed what to the project, and can we show it fairly?"**

The prototype should demonstrate that instead of waiting until the end of a project and relying on opinions, contribution can be tracked continuously using:
**Tasks + Timeliness + Evidence + Activity + Peer Feedback**
