CREATE TABLE submissions (
                             id BIGSERIAL PRIMARY KEY,
                             assignment_id BIGINT NOT NULL,
                             student_id BIGINT NOT NULL,
                             submission_text TEXT,
                             file_name VARCHAR(255),
                             file_path VARCHAR(500),
                             submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                             created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                             updated_at TIMESTAMP,
                             CONSTRAINT fk_submissions_assignment
                                 FOREIGN KEY (assignment_id) REFERENCES assignments(id),
                             CONSTRAINT fk_submissions_student
                                 FOREIGN KEY (student_id) REFERENCES users(id),
                             CONSTRAINT uk_submissions_assignment_student
                                 UNIQUE (assignment_id, student_id)
);