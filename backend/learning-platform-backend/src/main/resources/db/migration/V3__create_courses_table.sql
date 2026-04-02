CREATE TABLE courses (
                         id BIGSERIAL PRIMARY KEY,
                         title VARCHAR(255) NOT NULL,
                         code VARCHAR(100) NOT NULL UNIQUE,
                         description TEXT,
                         instructor_id BIGINT NOT NULL,
                         created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                         updated_at TIMESTAMP,
                         CONSTRAINT fk_courses_instructor
                             FOREIGN KEY (instructor_id) REFERENCES users(id)
);