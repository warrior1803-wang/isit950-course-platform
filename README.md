# ISIT950 Course Collaboration Platform

A full-stack course management platform supporting enrolments, forum discussions, assignments, and instructor analytics. Built with React + Vite (frontend), Java Spring Boot (backend), and PostgreSQL (database).

> To test the platform, register users via the `/register` page. Create at least one **Instructor** and one **Student** account to explore all features.

---

## Prerequisites

- Node.js 18+
- Java 17
- PostgreSQL 14+
- Maven 3.8+

---

## Local Setup — Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE isit950;
CREATE USER <your_db_user> WITH PASSWORD '<your_db_password>';
GRANT ALL PRIVILEGES ON DATABASE isit950 TO <your_db_user>;
\q
```

> Tables are auto-created by Hibernate on first backend run — no migration scripts needed.

---

## Local Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env        # set VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

Runs at **http://localhost:5173**.

---

## Local Setup — Backend

```bash
cd backend
mvn spring-boot:run
```

Before running, edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/isit950
spring.datasource.username=<your_db_user>
spring.datasource.password=<your_db_password>
jwt.secret=<any_long_random_string>
```

Runs at **http://localhost:8080**. Tables are auto-created on first run.

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `frontend/.env` | Backend base URL (local: `http://localhost:8080`, prod: EC2 URL) |
| `spring.datasource.url` | `application.properties` | PostgreSQL JDBC URL |
| `spring.datasource.username` | `application.properties` | DB username |
| `spring.datasource.password` | `application.properties` | DB password |
| `jwt.secret` | `application.properties` | JWT signing secret (any long string) |

---

## Production

- Frontend: https://isit950-course-platform.vercel.app
- Backend: coming soon

---

*University of Wollongong — ISIT950 Systems Development Methodologies — Autumn 2026*

