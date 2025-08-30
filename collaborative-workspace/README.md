Collaborative Workspace for Projects
A full-stack MERN (MongoDB, Express, React, Node.js) application enabling teams to manage projects collaboratively—featuring task boards, real-time updates, integrated scheduling, feedback cycles, and automated reports.

Features
Task Management

Kanban-style task boards with drag-and-drop columns: Backlog | In Progress | Review | Done
Subtasks, labels, due dates, priorities, and assignees
Real-Time Collaboration

Live board updates powered by Socket.IO
In-task activity feed captures text notes, attachments, voice notes, GitHub PRs/commits, and linked docs
Meeting Scheduling & Calendar Integration

Automatic scheduling of daily standups, weekly reviews, milestones
Google Calendar integration (if configured), with ICS fallback
Attendance tracking on meeting join
Weekly Timesheets & Reports

Auto-generated timesheets combining task activity and meeting attendance
Exportable in Markdown and PDF formats
Feedback System

Mentor feedback and peer reviews with ratings (clarity, quality, timeliness)
Visible summaries in timesheets and project dashboards
Tool Integrations

GitHub: Connect repo, webhook events integrated into activity feed
Notion & Google Docs: Attach links with metadata previews
Tech Stack
Frontend: React (TypeScript), Vite, Tailwind CSS, Zustand, React Query
Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO
Authentication: JWT (email/password; optional Google OAuth)
State & UI: Optimistic UI updates, real-time data synchronization
Testing: Jest (backend), Vitest (frontend)
Dev Tools: Docker + docker-compose, ESLint, Prettier, Makefile, OpenAPI (Swagger)
PDF Generation: Puppeteer (HTML → PDF) fallback
Getting Started (Local Setup)
Clone and install dependencies
git clone https://github.com/Ramasaikiran/Collaborative-Workspace.git
cd Collaborative_Workspace_for_Project
pnpm install
Copy example environment file

bash Copy Edit cp server/.env.example server/.env Run development servers

bash Copy Edit pnpm dev This starts:

Frontend: http://localhost:3000 (or designated port)

Backend: http://localhost:5000 (or configured port)

Seed demo data (if available in server/seed.ts)

bash Copy Edit pnpm run seed Explore the app

Login with seeded credentials

Switch between Task Board, Calendar, Feedback, Weekly Report views

Drag tasks, add updates, simulate meetings, generate timesheets
