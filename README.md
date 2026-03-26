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
│   ├── controllers/        # Route handler logic
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── enrolmentController.js
│   │   ├── materialController.js
│   │   ├── announcementController.js
│   │   ├── forumController.js
│   │   └── assignmentController.js
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── routes/             # Express routers
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrolments.js
│   │   ├── materials.js
│   │   ├── announcements.js
│   │   ├── forum.js
│   │   └── assignments.js
│   ├── uploads/            # Uploaded files (auto-created)
│   ├── server.js           # Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js    # Axios instance
    │   │   └── index.js    # API helper functions
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── CourseList.jsx
    │   │   ├── CourseDetail.jsx
    │   │   ├── Forum.jsx
    │   │   └── AssignmentSubmission.jsx
    │   ├── index.css
    │   └── main.jsx        # App entry point with React Router
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
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
```

Create the uploads directory:

```bash
mkdir -p uploads
```

Generate the Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

Start the backend server:

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The backend API will be available at **http://localhost:5000**.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start the frontend dev server:

```bash
npm run dev
```

The frontend will be available at **http://localhost:3000** and proxies `/api` requests to the backend at port 5000.

---

## API Endpoints

### Auth

| Method | Endpoint          | Description           | Auth |
|--------|-------------------|-----------------------|------|
| POST   | /api/auth/register | Register new user    | No   |
| POST   | /api/auth/login    | Login                | No   |
| GET    | /api/auth/me       | Get current user     | Yes  |

### Courses

| Method | Endpoint          | Description             | Role       |
|--------|-------------------|-------------------------|------------|
| GET    | /api/courses      | List all courses        | Any        |
| GET    | /api/courses/:id  | Get course details      | Any        |
| POST   | /api/courses      | Create course           | Instructor |
| PUT    | /api/courses/:id  | Update course           | Instructor |
| DELETE | /api/courses/:id  | Delete course           | Instructor |

### Enrolments

| Method | Endpoint                  | Description          | Role    |
|--------|---------------------------|----------------------|---------|
| GET    | /api/enrolments/me        | My enrolments        | Student |
| POST   | /api/enrolments           | Enrol in course      | Student |
| DELETE | /api/enrolments/:courseId | Unenrol from course  | Student |

### Materials

| Method | Endpoint                  | Description          | Role       |
|--------|---------------------------|----------------------|------------|
| GET    | /api/materials/:courseId  | List materials       | Any        |
| POST   | /api/materials/:courseId  | Upload material      | Instructor |
| DELETE | /api/materials/:id        | Delete material      | Instructor |

### Announcements

| Method | Endpoint                        | Description             | Role       |
|--------|---------------------------------|-------------------------|------------|
| GET    | /api/announcements/:courseId    | List announcements      | Any        |
| POST   | /api/announcements/:courseId    | Create announcement     | Instructor |
| DELETE | /api/announcements/:id          | Delete announcement     | Instructor |

### Forum

| Method | Endpoint                              | Description       | Role |
|--------|---------------------------------------|-------------------|------|
| GET    | /api/forum/:courseId                  | List posts        | Any  |
| POST   | /api/forum/:courseId                  | Create post       | Any  |
| POST   | /api/forum/posts/:postId/replies      | Reply to post     | Any  |
| DELETE | /api/forum/posts/:id                  | Delete post       | Any  |

### Assignments

| Method | Endpoint                                       | Description          | Role       |
|--------|------------------------------------------------|----------------------|------------|
| GET    | /api/assignments/:courseId                     | List assignments     | Any        |
| POST   | /api/assignments/:courseId                     | Create assignment    | Instructor |
| POST   | /api/assignments/:id/submit                    | Submit assignment    | Student    |
| GET    | /api/assignments/:id/submissions               | List submissions     | Instructor |
| PATCH  | /api/assignments/submissions/:submissionId/grade | Grade submission   | Instructor |

---

## Frontend Routes

| Path                                          | Page                 | Auth Required |
|-----------------------------------------------|----------------------|---------------|
| /login                                        | Login                | No            |
| /register                                     | Register             | No            |
| /courses                                      | Course List          | Yes           |
| /courses/:id                                  | Course Detail        | Yes           |
| /courses/:id/forum                            | Forum                | Yes           |
| /courses/:courseId/assignments/:assignmentId  | Assignment Submission | Yes          |

---

## Development Notes

- File uploads are stored in `backend/uploads/` and served at `/uploads/<filename>`.
- Prisma Studio (`npm run db:studio` in backend/) provides a GUI for the database.
- The Vite dev server proxies all `/api` requests to `http://localhost:5000`.
