# Backend - Learning Platform

##  Project Overview

This is the backend server for the Learning Platform project.
It is built using **Spring Boot** and provides RESTful APIs for authentication and future course management features.

---

##  Tech Stack

* Java 17
* Spring Boot 4
* Spring Web
* Spring Data JPA (Hibernate)
* PostgreSQL
* Spring Security
* JWT (jjwt)

---

##  Requirements

Before running the project, make sure you have:

* Java 17 installed
* Maven installed
* PostgreSQL installed and running

---

##  Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE backend_db;
```

2. Ensure your PostgreSQL user matches the config (or update it in `application.yml`):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/backend_db?currentSchema=public
    username: mac
    password: YOUR_PASSWORD
```

---

##  Environment Variables

For CORS configuration, set:

```bash
export CORS_ALLOWED_ORIGIN=http://localhost:5173
```

If not set, default will be used.

---

##  Run the Application

In project root:

```bash
mvn clean install
mvn spring-boot:run
```

Server will start at:

```text
http://localhost:8080
```

---

##  API Endpoints

###  Authentication

#### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "test user",
  "email": "user@example.com",
  "password": "123456",
  "role": "STUDENT"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "JWT_TOKEN"
  }
}
```

---

#### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

---

##  Authentication Usage

All protected endpoints require a JWT token:

```http
Authorization: Bearer YOUR_TOKEN
```

---

##  Security

* Stateless authentication using JWT
* Role-based authorization supported

 * `STUDENT`
 * `INSTRUCTOR`

---

##  Project Structure

```text
controller/     → REST APIs
service/        → Interfaces
service/impl/   → Business logic implementation
repository/     → Database access (JPA)
model/          → Entity classes
dto/            → Request/Response objects
security/       → JWT & Spring Security config
common/         → Shared classes (ApiResponse, Exception)
config/         → Configuration classes (CORS, etc.)
```

---

##  Database Behavior

* Tables are auto-created on startup using:

```yaml
spring.jpa.hibernate.ddl-auto=update
```

---

##  Current Features

* User registration
* User login
* JWT authentication
* Role-based authorization (foundation)

---

##  Notes

* Register endpoint returns a JWT token (auto-login)
* Passwords are securely stored using BCrypt
* Role is stored as ENUM (`STUDENT`, `INSTRUCTOR`)

---

##  Next Steps

* Course management APIs
* Enrolment system
* Assignment & submission features
