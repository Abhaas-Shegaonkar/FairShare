# FairShare
### *Making Every Contribution Count*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](Markdown%20files/frontend.md)
[![Backend](https://img.shields.io/badge/Backend-Python%20%7C%20Flask-3776AB?logo=python&logoColor=white)](Markdown%20files/backend.md)
[![Database](https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](Markdown%20files/database.md)

---

## 📌 Problem Statement

In academic and hackathon group projects, **contribution levels often differ significantly, but measuring them objectively is challenging**. 

Often, one or two students carry the majority of the technical work while others contribute less, yet everyone receives identical grades or credit. FairShare bridges this gap by making individual contribution **visible, measurable, verifiable, and fair**—without promoting toxic competition.

---

## 💡 What is FairShare?

**FairShare** is a web-based group project management and contribution tracking platform tailored specifically for student teams.

Unlike conventional task managers, FairShare links completed tasks with verifiable proof of work and evaluates team dynamics through structured peer reviews, calculating a transparent, explainable **Contribution Score**.

> **Important Note:** FairShare is an educational indicator designed to illuminate project involvement. It is *not* an absolute measure of a student's intelligence, skill, or worth.

---

## 🚀 Key Features

- 👥 **Team & Role Setup:** Create projects, designate responsibilities (e.g., Frontend Lead, Backend, Hardware, QA), and assign roles.
- 📋 **Evidence-Based Task Management:** Tasks require verifiable artifacts (GitHub PRs, Figma designs, docs, code snippets) before being marked complete.
- ⏱️ **Automated Timeliness Tracking:** Transparent tracking of on-time versus late submissions based on server timestamps.
- 📜 **Immutable Activity Timeline:** Chronological, tamper-proof activity logs documenting every milestone and update.
- 🤝 **Anonymous 6-Dimension Peer Feedback:** Teammates review each other on Participation, Responsibility, Quality, Collaboration, Communication, and Timeliness.
- 📊 **Transparent 5-Factor Scoring Model:** Explainable formula showing exactly why a score was awarded.
- 📈 **Weekly Progression Trends:** Track consistent involvement throughout project lifecycles rather than last-minute rushes.
- 📄 **Final Contribution Report:** Downloadable and printable audit summary for academic grading and portfolio presentation.

---

## 🧮 The FairShare Scoring Model

Every contribution score is 100% explainable and accessible to students via an interactive breakdown modal:

$$\text{Contribution Score} = (S_{\text{completion}} \times 30\%) + (S_{\text{timeliness}} \times 20\%) + (S_{\text{evidence}} \times 20\%) + (S_{\text{feedback}} \times 20\%) + (S_{\text{participation}} \times 10\%)$$

| Metric | Weight | Description |
|---|:---:|---|
| **Task Completion** | **30%** | Ratio of assigned deliverables successfully completed. |
| **Timeliness** | **20%** | Deliverables submitted on or before the deadline. |
| **Work Evidence** | **20%** | Completed tasks validated with attached links or files. |
| **Peer Feedback** | **20%** | Teammate evaluations across 6 structured categories. |
| **Participation** | **10%** | Consistency and frequency in project activity stream. |

---

## 📚 Detailed Project Documentation

Detailed architecture specifications, schemas, design systems, and endpoint contracts are available in the [`Markdown files/`](Markdown%20files/) folder:

| Document | Description |
|---|---|
| 📖 [**`idea.md`**](Markdown%20files/idea.md) | Full product conceptualization, user journeys, UX principles, and anti-gaming guidelines. |
| 🏗️ [**`architecture.md`**](Markdown%20files/architecture.md) | High-level system architecture, client-server topology, and component mapping. |
| 🎨 [**`frontend.md`**](Markdown%20files/frontend.md) | Complete React UI/UX design system, color tokens, routing table, and component specs. |
| ⚙️ [**`backend.md`**](Markdown%20files/backend.md) | Flask REST architecture, scoring engine formulas, middleware, and business logic. |
| 🗄️ [**`database.md`**](Markdown%20files/database.md) | PostgreSQL / Supabase schema, table constraints, indexes, and Row-Level Security (RLS). |
| 🔌 [**`api.md`**](Markdown%20files/api.md) | Standardized API request/response contracts, schemas, headers, and error codes. |

---

## 🛠️ Technology Stack

- **Frontend:** React 18+, Vite, Custom CSS Design System, Recharts / Chart.js, Lucide Icons
- **Backend:** Python 3.10+, Flask, Flask-CORS, Supabase Python Client
- **Database & Storage:** Supabase (PostgreSQL 15+) with Row-Level Security
- **Authentication:** Supabase Auth / JWT Tokens

---

## 📁 Repository Structure

```text
FairShare/
├── README.md                 # Project introduction and overview (you are here)
└── Markdown files/           # Complete engineering & product specifications
    ├── idea.md               # Product overview and user requirements
    ├── architecture.md       # High-level technical architecture
    ├── frontend.md           # React design system and UI specification
    ├── backend.md            # Flask services and scoring algorithms
    ├── database.md           # Database DDL, RLS policies, and ERD
    └── api.md                # REST API endpoints and data contracts
```

---

## 🛡️ Anti-Gaming Safeguards

FairShare protects against artificial score inflation:
1. **Server-Clock Authority:** Deadlines and completion dates rely on server timestamps, preventing client-side spoofing.
2. **Self-Review Prevention:** Database constraints strictly block team members from rating themselves.
3. **No Unverified Claims:** Completed tasks without attached evidence receive 0% in the Work Evidence dimension.
4. **Immutable Audit Trail:** Activity entries cannot be edited or deleted once recorded.

---

## 👥 Reference Team & Sample Data

For prototype demonstration, the project uses the **Smart Water Management System**:
- **Abhaas** — Frontend Lead (`82% Contribution Score`)
- **Rohit** — Backend Developer (`76% Contribution Score`)
- **Denesh** — Hardware Engineer (`68% Contribution Score`)
- **Aditya** — Documentation & QA (`61% Contribution Score`)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
