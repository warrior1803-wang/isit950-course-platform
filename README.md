# ISIT950 Course Collaboration Platform

A full-stack course management platform for students and instructors. The platform supports course enrolment, announcements, materials, discussion forums, assignments, grading, progress analytics, and student membership limits.

Built with:

- React + Vite frontend
- Java Spring Boot backend
- PostgreSQL database
- Flyway database migrations

## Prerequisites

- Node.js 18+
- Java 17
- Maven 3.8+
- PostgreSQL 14+

## Project Structure

```text
frontend/   React application
backend/    Spring Boot REST API
```

## Database Setup

Create a PostgreSQL database and user for local development:

```bash
psql -U postgres
```

```sql
CREATE DATABASE backend_db;
CREATE USER backend_user WITH PASSWORD 'Backend123!';
GRANT ALL PRIVILEGES ON DATABASE backend_db TO backend_user;
\q
```

The backend uses Flyway migrations from `backend/src/main/resources/db/migration`.
Hibernate is configured with `ddl-auto: validate`, so the database schema must match the migration files.

## Backend Setup

From the backend directory:

```bash
cd backend
```

Set the required JWT secret. Optional variables are shown with their local defaults:

```bash
export JWT_SECRET=change-this-to-a-long-random-secret
export DATABASE_URL=jdbc:postgresql://localhost:5432/backend_db
export DB_USERNAME=backend_user
export DB_PASSWORD=Backend123!
export CORS_ALLOWED_ORIGIN=http://localhost:5173
```

Run the backend:

```bash
./mvnw spring-boot:run
```

The API runs at:

```text
http://localhost:8080
```

## Frontend Setup

From the frontend directory:

```bash
cd frontend
npm install
```

For local development, the frontend defaults to `/api`. If the backend is running separately on port 8080, create `frontend/.env.local`:

```text
VITE_API_BASE_URL=http://localhost:8080/api
```

Run the frontend:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

## Test Accounts

Use the registration page to create accounts for both roles:

- Student
- Instructor

Instructor accounts can create and manage courses, materials, announcements, assignments, grading, and student analytics. Student accounts can enrol in courses, participate in discussions, submit assignments, view progress, and manage membership.

## Useful Commands

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
./mvnw test
```

## Key Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend | Backend API URL, for example `http://localhost:8080/api` |
| `JWT_SECRET` | Backend | Required JWT signing secret |
| `DATABASE_URL` | Backend | PostgreSQL JDBC URL |
| `DB_USERNAME` | Backend | PostgreSQL username |
| `DB_PASSWORD` | Backend | PostgreSQL password |
| `CORS_ALLOWED_ORIGIN` | Backend | Allowed frontend origin |
| `UPLOAD_DIR` | Backend | Directory for uploaded materials and submissions |

## Production

- Frontend: https://isit950-course-platform.vercel.app

## Course

University of Wollongong - ISIT950 Systems Development Methodologies - Autumn 2026
