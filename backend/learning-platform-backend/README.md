# Learning Platform Backend

##  Project Overview

This project is a backend system for a Learning Management Platform (similar to Moodle).
It is developed using **Spring Boot**, **PostgreSQL**, and follows a **modular architecture**.

The system supports core features such as:

* User registration and login
* Role-based users (Student / Instructor / Admin)
* Course and learning content management (in progress)
* JWT-based authentication

---

##  Tech Stack

* Java 17
* Spring Boot
* Spring Security
* JWT (JSON Web Token)
* PostgreSQL
* Flyway (Database Migration)
* Maven

---

##  Project Structure

```
com.learningplatform.lms
├── auth            # Authentication module (login/register)
├── user            # User domain
├── course          # Course domain
├── enrolment       # Enrollment domain
├── material        # Learning materials
├── assignment      # Assignment management
├── submission      # Assignment submission
├── discussion      # Forum (Post / Reply)
├── common          # Shared classes (BaseEntity, enums, etc.)
├── config          # Configuration (CORS, etc.)
├── security        # Security (JWT, filters)
```

---

##  Setup Instructions

### 1. Clone the repository

```
git clone <your-repo-url>
cd learning-platform-backend
```

---

### 2. Configure Database

Make sure PostgreSQL is running.

Create a database:

```
CREATE DATABASE lms_db;
```

Update your `application.yml`:

```
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/lms_db
    username: your_username
    password: your_password
```

---

### 3. Run the project

```
mvn spring-boot:run
```

Or run `LearningPlatformBackendApplication` in IntelliJ.

---

### 4. Flyway Migration

The database schema will be automatically created using Flyway on startup.

---

##  Authentication (JWT)

### Register

```
POST /api/auth/register
```

Example request:

```
{
  "name": "Tom",
  "email": "tom@example.com",
  "password": "123456",
  "role": "STUDENT"
}
```

---

### Login

```
POST /api/auth/login
```

Response:

```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "your_jwt_token"
  }
}
```

---

### Access Protected APIs

Add header:

```
Authorization: Bearer <your_token>
```

---

##  Test Endpoint

```
GET /api/secure/test
```

* Without token → 401 Unauthorized
* With token → Success

---

##  Development Notes

* Passwords are encrypted using BCrypt
* Database schema is managed via Flyway
* Project follows modular package structure
* Exception handling and API responses are standardized

---

##  Current Status

✔ Authentication system completed
✔ Database schema designed
✔ JWT security implemented
 Course & business APIs (in progress)

---

##  Notes

This project is developed for learning and academic purposes, but follows real-world backend design principles.
