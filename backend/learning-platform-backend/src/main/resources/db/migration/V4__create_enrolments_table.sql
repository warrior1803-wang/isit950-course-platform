CREATE TABLE enrolments (
                            id BIGSERIAL PRIMARY KEY,
                            student_id BIGINT NOT NULL,
                            course_id BIGINT NOT NULL,
                            enrolment_status VARCHAR(50) NOT NULL,
                            enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
                            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                            updated_at TIMESTAMP,
                            CONSTRAINT fk_enrolments_student
                                FOREIGN KEY (student_id) REFERENCES users(id),
                            CONSTRAINT fk_enrolments_course
                                FOREIGN KEY (course_id) REFERENCES courses(id),
                            CONSTRAINT uk_enrolments_student_course
                                UNIQUE (student_id, course_id)
);