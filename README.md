# Course Collaboration Platform

A full-stack web application for course management, forum discussions, and assignment submissions.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, React Router v6, Axios, React Hook Form |
| Backend  | Node.js + Express, Prisma ORM, PostgreSQL, JWT, Multer |

---

## Project Structure

```
isit950-course-platform/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── materialController.js
│   │   ├── announcementController.js
│   │   ├── forumController.js
│   │   ├── assignmentController.js
│   │   └── progressController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js        # All course-nested routes live here
│   │   └── index.js          # Route aggregator
│   ├── uploads/
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js
    │   │   └── index.js
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Modal.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── CourseList.jsx
    │   │   ├── CourseDetail.jsx
    │   │   ├── Forum.jsx
    │   │   ├── AssignmentSubmission.jsx
    │   │   ├── InstructorDashboard.jsx
    │   │   └── MySubmissions.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Database Schema

| Model        | Key Fields |
|--------------|-----------|
| User         | id, name, email, password, role (student\|instructor), createdAt |
| Course       | id, name, code, description, instructorId, createdAt |
| Enrolment    | id, studentId, courseId, enrolledAt |
| Material     | id, courseId, filename, url, size, section, uploadedAt |
| Announcement | id, courseId, title, body, authorId, createdAt |
| Post         | id, courseId, title, body, authorId, createdAt |
| Reply        | id, postId, body, authorId, createdAt |
| Assignment   | id, courseId, title, description, dueDate, maxScore, createdAt |
| Submission   | id, assignmentId, studentId, filename, submittedAt, score, feedback, status |

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database
- npm

---

### 1. Clone the repository

```bash
git clone <repo-url>
cd isit950-course-platform
```

---

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=uploads
```

> ⚠️ Never hardcode `localhost:5173` in source code — always use `FRONTEND_URL` from `.env`.

```bash
mkdir -p uploads
npm run db:generate
npm run db:migrate
npm run dev
```

Backend runs at **http://localhost:5000**.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies all `/api` requests to the backend.

---

## API Endpoints

> All routes except Auth require a valid JWT token in the `Authorization: Bearer <token>` header.
> All course-related routes are nested under `/api/courses/:id` to reflect resource ownership.

---

### Auth

| Method | Endpoint            | Description        | Auth |
|--------|---------------------|--------------------|------|
| POST   | /api/auth/register  | Register new user  | No   |
| POST   | /api/auth/login     | Login              | No   |
| GET    | /api/auth/me        | Get current user   | Yes  |
| PUT    | /api/auth/me        | Update profile     | Yes  |

---

### Courses

| Method | Endpoint          | Description        | Role       |
|--------|-------------------|--------------------|------------|
| GET    | /api/courses      | List all courses   | Any        |
| POST   | /api/courses      | Create course      | Instructor |
| GET    | /api/courses/:id  | Get course details | Any        |
| PUT    | /api/courses/:id  | Update course      | Instructor |
| DELETE | /api/courses/:id  | Delete course      | Instructor |
| POST   | /api/courses/:id/enrol   | Enrol in course   | Student |
| DELETE | /api/courses/:id/enrol   | Unenrol from course | Student |
| GET    | /api/courses/:id/students | List enrolled students | Instructor |

---

### Materials

| Method | Endpoint                              | Description      | Role       |
|--------|---------------------------------------|------------------|------------|
| GET    | /api/courses/:id/materials            | List materials   | Any        |
| POST   | /api/courses/:id/materials            | Upload material  | Instructor |
| DELETE | /api/courses/:id/materials/:materialId | Delete material | Instructor |

---

### Announcements

| Method | Endpoint                                  | Description         | Role       |
|--------|-------------------------------------------|---------------------|------------|
| GET    | /api/courses/:id/announcements            | List announcements  | Any        |
| POST   | /api/courses/:id/announcements            | Create announcement | Instructor |
| DELETE | /api/courses/:id/announcements/:annId     | Delete announcement | Instructor |

---

### Forum (Posts & Replies)

| Method | Endpoint                                              | Description          | Role       |
|--------|-------------------------------------------------------|----------------------|------------|
| GET    | /api/courses/:id/posts                                | List all posts       | Any        |
| POST   | /api/courses/:id/posts                                | Create post          | Any        |
| GET    | /api/courses/:id/posts/:postId                        | Get post + replies   | Any        |
| DELETE | /api/courses/:id/posts/:postId                        | Delete post          | Author / Instructor |
| POST   | /api/courses/:id/posts/:postId/replies                | Reply to post        | Any        |
| DELETE | /api/courses/:id/posts/:postId/replies/:replyId       | Delete reply         | Author / Instructor |

---

### Assignments

| Method | Endpoint                                                        | Description           | Role       |
|--------|-----------------------------------------------------------------|-----------------------|------------|
| GET    | /api/courses/:id/assignments                                    | List assignments      | Any        |
| POST   | /api/courses/:id/assignments                                    | Create assignment     | Instructor |
| GET    | /api/courses/:id/assignments/:asgId                             | Get assignment detail | Any        |
| PUT    | /api/courses/:id/assignments/:asgId                             | Update assignment     | Instructor |
| DELETE | /api/courses/:id/assignments/:asgId                             | Delete assignment     | Instructor |
| POST   | /api/courses/:id/assignments/:asgId/submit                      | Submit assignment     | Student    |
| GET    | /api/courses/:id/assignments/:asgId/submissions                 | List submissions      | Instructor |
| GET    | /api/courses/:id/assignments/:asgId/submissions/me              | Get own submission    | Student    |
| PUT    | /api/courses/:id/assignments/:asgId/submissions/:subId/grade    | Grade submission      | Instructor |

---

### Progress & Analytics

| Method | Endpoint                        | Description                        | Role       |
|--------|---------------------------------|------------------------------------|------------|
| GET    | /api/courses/:id/progress       | All students' engagement (instructor view) | Instructor |
| GET    | /api/courses/:id/progress/me    | Own progress summary (student view) | Student   |

**Instructor response fields:** student (id, name), postsCount, repliesCount, assignmentsSubmitted, assignmentsPending, lastActive

**Student response fields:** postsCount, repliesCount, assignmentsSubmitted, assignmentsPending, averageScore

---

## Frontend Routes

| Path                                         | Page                      | Auth Required |
|----------------------------------------------|---------------------------|---------------|
| /login                                       | Login                     | No            |
| /register                                    | Register                  | No            |
| /courses                                     | Course List               | Yes           |
| /courses/:id                                 | Course Detail             | Yes           |
| /courses/:id/forum                           | Forum                     | Yes           |
| /courses/:courseId/assignments/:assignmentId | Assignment Submission      | Yes           |
| /instructor/dashboard                        | Instructor Dashboard      | Instructor    |
| /submissions/me                              | My Submissions (Student)  | Student       |

---

## Development Notes

- File uploads are stored in `backend/uploads/` and served at `/uploads/<filename>`.
- Run `npm run db:studio` inside `backend/` to open Prisma Studio (database GUI).
- The Vite dev server proxies all `/api` requests to `http://localhost:5000`.
- All course-related API routes are nested under `/api/courses/:id/` — do **not** use flat routes like `/api/materials/:courseId`.
- The Progress & Analytics module must be built manually — it was not scaffolded by Copilot.
- CORS origin is configured via `FRONTEND_URL` environment variable — never hardcode URLs.

---

## Scrum Process

This project follows the Scrum framework with weekly Sprints (Friday to Thursday).

| Sprint | Dates | Focus |
|--------|-------|-------|
| Sprint 1 | Mar 28 – Apr 03 | Design & architecture setup |
| Sprint 2 | Apr 04 – Apr 10 | Auth + core pages (mock data) |
| Sprint 3 | Apr 11 – Apr 17 | Core features live + Progress Report due Apr 17 |
| Sprint 4 | Apr 18 – Apr 24 | Requirement change response |
| Sprint 5 | Apr 25 – May 01 | Full integration |
| Sprint 6 | May 02 – May 08 | Testing & polish |
| Sprint 7 | May 09 – May 15 | Integration tests |
| Sprint 8 | May 16 – May 22 | Final report writing |
| Sprint 9 | May 23 – Jun 05 | Final submission (Jun 05 5pm) |

Sprint Board: GitHub Projects — ISIT950 Sprint Board

---

## Team

| Role | Responsibility |
|------|---------------|
| Team Lead + Scrum Master | UI/UX design, frontend architecture, report compilation |
| Member A — Backend Lead | Express API, PostgreSQL, Prisma schema, Auth |
| Member B — Forum Full Stack | Course Detail UI, Discussion Forum (frontend + backend) |
| Member C — Assignment Full Stack | Assignment module (frontend + backend), testing, README |

---

*University of Wollongong — ISIT950 Systems Development Methodologies — Autumn Session 2026*
