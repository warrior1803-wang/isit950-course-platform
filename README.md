# Course Collaboration Platform

A full-stack web application for course management, forum discussions, and assignment submissions.

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, React Router v6, Axios, React Hook Form |
| Backend  | Java + Spring Boot, Spring Data JPA + Hibernate, PostgreSQL, Spring Security + JWT, Maven |

---

## Live Deployment

| Layer    | Platform | URL |
|----------|----------|-----|
| Frontend | Vercel   | https://isit950-course-platform.vercel.app |
| Backend  | AWS EC2  | *(to be updated by Leon once EC2 is live)* |

---

## Project Structure

```
isit950-course-platform/
├── backend/                          # Java Spring Boot
│   ├── src/main/java/.../
│   │   ├── controller/               # REST controllers (@RestController)
│   │   │   ├── AuthController.java
│   │   │   ├── CourseController.java
│   │   │   ├── MaterialController.java
│   │   │   ├── AnnouncementController.java
│   │   │   ├── ForumController.java
│   │   │   ├── AssignmentController.java
│   │   │   └── ProgressController.java
│   │   ├── service/                  # Business logic
│   │   ├── repository/               # JpaRepository interfaces
│   │   ├── model/                    # JPA @Entity classes
│   │   │   ├── User.java
│   │   │   ├── Course.java
│   │   │   ├── Enrolment.java
│   │   │   ├── Material.java
│   │   │   ├── Announcement.java
│   │   │   ├── Post.java
│   │   │   ├── Reply.java
│   │   │   ├── Assignment.java
│   │   │   └── Submission.java
│   │   ├── security/                 # Spring Security + JWT filter
│   │   └── dto/                      # Request/Response DTOs
│   ├── src/main/resources/
│   │   └── application.properties    # DB, JWT, CORS config
│   └── pom.xml                       # Maven dependencies
│
└── frontend/                         # React + Vite
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

| Entity       | Key Fields |
|--------------|-----------|
| User         | id, name, email, password, role (STUDENT\|INSTRUCTOR), createdAt |
| Course       | id, name, code, description, instructor (User), createdAt |
| Enrolment    | id, student (User), course (Course), enrolledAt |
| Material     | id, course (Course), filename, url, size, section, uploadedAt |
| Announcement | id, course (Course), title, body, author (User), createdAt |
| Post         | id, course (Course), title, body, author (User), createdAt |
| Reply        | id, post (Post), body, author (User), createdAt |
| Assignment   | id, course (Course), title, description, dueDate, maxScore, createdAt |
| Submission   | id, assignment (Assignment), student (User), filename, submittedAt, score, feedback, status |

Relationships managed via JPA annotations. Tables auto-created via `spring.jpa.hibernate.ddl-auto=update`.

---

## Setup Instructions

### Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL
- Node.js 18+ and npm

---

### 1. Clone the repository

```bash
git clone https://github.com/warrior1803-wang/isit950-course-platform.git
cd isit950-course-platform
```

---

### 2. Backend Setup (Spring Boot + Maven)

```bash
cd backend/src/main/resources
cp application.properties.example application.properties
```

Edit `application.properties`:

```properties
# Server
server.port=8080

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/isit950
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT
jwt.secret=your_super_secret_jwt_key
jwt.expiration=604800000

# CORS — set to Vercel URL in production
cors.allowed-origin=${FRONTEND_URL:http://localhost:5173}

# File upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

> ⚠️ Never hardcode URLs — always use the `FRONTEND_URL` environment variable.
> In production (AWS EC2), set `FRONTEND_URL=https://isit950-course-platform.vercel.app`

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs at **http://localhost:8080**.

---

### 3. Frontend Setup (Local Development)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies all `/api` requests to the backend at port 8080.

> Make sure `vite.config.js` proxy target points to `http://localhost:8080`.

#### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```
VITE_API_BASE_URL=http://localhost:8080
```

In production (Vercel), this is set via the Vercel dashboard environment variables — do not commit `.env` files.

---

## CI/CD & Deployment

### Frontend — Vercel (Automatic)

The frontend is deployed automatically on every merge to `main` via Vercel.

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_BASE_URL` → AWS EC2 backend public URL |

No manual deployment steps required — merging a PR to `main` triggers a new build automatically.

### Backend — AWS EC2 (Manual / GitHub Actions)

*(To be documented by Leon once EC2 deployment is configured)*

---

## API Endpoints

> All routes except Auth require `Authorization: Bearer <token>` header.
> All course-related routes are nested under `/api/courses/{id}`.

### Auth

| Method | Endpoint            | Description       | Auth |
|--------|---------------------|-------------------|------|
| POST   | /api/auth/register  | Register new user | No   |
| POST   | /api/auth/login     | Login             | No   |
| GET    | /api/auth/me        | Get current user  | Yes  |
| PUT    | /api/auth/me        | Update profile    | Yes  |

### Courses

| Method | Endpoint                   | Description            | Role       |
|--------|----------------------------|------------------------|------------|
| GET    | /api/courses               | List all courses       | Any        |
| POST   | /api/courses               | Create course          | Instructor |
| GET    | /api/courses/{id}          | Get course details     | Any        |
| PUT    | /api/courses/{id}          | Update course          | Instructor |
| DELETE | /api/courses/{id}          | Delete course          | Instructor |
| POST   | /api/courses/{id}/enrol    | Enrol in course        | Student    |
| DELETE | /api/courses/{id}/enrol    | Unenrol from course    | Student    |
| GET    | /api/courses/{id}/students | List enrolled students | Instructor |

### Materials

| Method | Endpoint                                 | Description     | Role       |
|--------|------------------------------------------|-----------------|------------|
| GET    | /api/courses/{id}/materials              | List materials  | Any        |
| POST   | /api/courses/{id}/materials              | Upload material | Instructor |
| DELETE | /api/courses/{id}/materials/{materialId} | Delete material | Instructor |

### Announcements

| Method | Endpoint                                  | Description         | Role       |
|--------|-------------------------------------------|---------------------|------------|
| GET    | /api/courses/{id}/announcements           | List announcements  | Any        |
| POST   | /api/courses/{id}/announcements           | Post announcement   | Instructor |
| DELETE | /api/courses/{id}/announcements/{annId}   | Delete announcement | Instructor |

### Forum

| Method | Endpoint                                           | Description        | Role                |
|--------|----------------------------------------------------|--------------------|---------------------|
| GET    | /api/courses/{id}/posts                            | List posts         | Any                 |
| POST   | /api/courses/{id}/posts                            | Create post        | Any                 |
| GET    | /api/courses/{id}/posts/{postId}                   | Get post + replies | Any                 |
| DELETE | /api/courses/{id}/posts/{postId}                   | Delete post        | Author / Instructor |
| POST   | /api/courses/{id}/posts/{postId}/replies           | Reply to post      | Any                 |
| DELETE | /api/courses/{id}/posts/{postId}/replies/{replyId} | Delete reply       | Author / Instructor |

### Assignments

| Method | Endpoint                                                        | Description        | Role       |
|--------|-----------------------------------------------------------------|--------------------|------------|
| GET    | /api/courses/{id}/assignments                                   | List assignments   | Any        |
| POST   | /api/courses/{id}/assignments                                   | Create assignment  | Instructor |
| GET    | /api/courses/{id}/assignments/{asgId}                           | Get detail         | Any        |
| PUT    | /api/courses/{id}/assignments/{asgId}                           | Update assignment  | Instructor |
| DELETE | /api/courses/{id}/assignments/{asgId}                           | Delete assignment  | Instructor |
| POST   | /api/courses/{id}/assignments/{asgId}/submit                    | Submit assignment  | Student    |
| GET    | /api/courses/{id}/assignments/{asgId}/submissions               | List submissions   | Instructor |
| GET    | /api/courses/{id}/assignments/{asgId}/submissions/me            | Own submission     | Student    |
| PUT    | /api/courses/{id}/assignments/{asgId}/submissions/{subId}/grade | Grade submission   | Instructor |

### Progress & Analytics

| Method | Endpoint                      | Description                   | Role       |
|--------|-------------------------------|-------------------------------|------------|
| GET    | /api/courses/{id}/progress    | All students' engagement      | Instructor |
| GET    | /api/courses/{id}/progress/me | Own progress summary          | Student    |

---

## Frontend Routes

| Path                                                      | Page                      | Auth Required |
|-----------------------------------------------------------|---------------------------|---------------|
| /login                                                    | Login / Register          | No            |
| /courses                                                  | My Courses                | Student       |
| /browsecourses                                            | Browse & Enrol            | Student       |
| /courses/:id                                              | Course Detail (4 tabs)    | Yes           |
| /courses/:id/assignments/:asgId/submit                    | Assignment Submission      | Student       |
| /courses/:id/assignments/:asgId/quiz                      | Auto-mark Quiz            | Student       |
| /courses/:id/assignments/:asgId/review                    | Assignment Review          | Student       |
| /assignments                                              | Global Assignments        | Student       |
| /announcements                                            | Global Announcements      | Student       |
| /discussions                                              | Global Discussions        | Student       |
| /profile                                                  | Student Profile           | Student       |
| /membership                                               | Membership                | Student       |
| /dashboard                                                | Instructor Dashboard      | Instructor    |
| /instructor/courses                                       | Course Management         | Instructor    |
| /instructor/grading                                       | Grading Dashboard         | Instructor    |
| /instructor/announcements                                 | Announcements Management  | Instructor    |
| /instructor/analytics                                     | Student Analytics         | Instructor    |
| /instructor/profile                                       | Instructor Profile        | Instructor    |

---

## Development Notes

- Backend runs on port **8080**. Update `vite.config.js` proxy target to `http://localhost:8080`.
- File uploads handled via Spring `MultipartFile`, stored in `/uploads` directory.
- CORS configured via `FRONTEND_URL` environment variable — never hardcode URLs.
- All course-related API routes nested under `/api/courses/{id}/` — do not use flat routes.
- Progress & Analytics module must be implemented manually — not auto-scaffolded.
- Use `mvn spring-boot:run` for development, `mvn clean install` to build JAR for production.

---

## Scrum Process

Weekly Sprints (Friday to Thursday), managed via GitHub Projects.

| Sprint    | Dates           | Focus |
|-----------|-----------------|-------|
| Sprint 1  | Mar 27 – Apr 3  | Design & architecture setup |
| Sprint 2  | Apr 3 – Apr 10  | Auth + core pages (mock data) |
| Sprint 3  | Apr 10 – Apr 17 | Core features live + 1st submission due Apr 17 |
| Sprint 4  | Apr 17 – Apr 24 | Bug fixes (Recess week) |
| Sprint 5  | Apr 24 – May 1  | Requirement change absorption + Forum & Assignment live |
| Sprint 6  | May 1 – May 7   | Full integration + QA starts |
| Sprint 7  | May 8 – May 14  | CI/CD + UI polish + integration tests |
| Sprint 8  | May 15 – May 21 | Bug fixes + report writing |
| Sprint 9  | May 22 – May 28 | Code freeze + report draft |
| Sprint 10 | May 29 – Jun 5  | Final QA + submission (Jun 5, 5pm) |

---

## Team

| Name | GitHub | Role | Responsibility |
|------|--------|------|---------------|
| Bingyan Wang | warrior1803-wang | Team Lead + Scrum Master | UI/UX design, frontend architecture, report compilation |
| Xiaoliang Chen (Leon) | Leon-Chen03 | Backend Lead | Java Spring Boot, JPA + Hibernate, Spring Security + JWT |
| Mingcan Yang | MingcanYang | Forum Full Stack | Course Detail UI, Discussion Forum (frontend + backend), Membership |
| Muhammad Sahim Bhaur (Sahim) | MuhammadSahimBhaur | QA + Full Stack | Profile pages, QA testing, integration tests, README, CI/CD docs |

---

*University of Wollongong — ISIT950 Systems Development Methodologies — Autumn Session 2026*
