CREATE TABLE assignments (
                             id BIGSERIAL PRIMARY KEY,
                             course_id BIGINT NOT NULL,
                             title VARCHAR(255) NOT NULL,
                             description TEXT,
                             due_date TIMESTAMP,
                             created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                             updated_at TIMESTAMP,
                             CONSTRAINT fk_assignments_course
                                 FOREIGN KEY (course_id) REFERENCES courses(id)
);