CREATE TABLE materials (
                           id BIGSERIAL PRIMARY KEY,
                           course_id BIGINT NOT NULL,
                           title VARCHAR(255) NOT NULL,
                           description TEXT,
                           file_name VARCHAR(255),
                           file_path VARCHAR(500),
                           material_type VARCHAR(50) NOT NULL,
                           created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                           updated_at TIMESTAMP,
                           CONSTRAINT fk_materials_course
                               FOREIGN KEY (course_id) REFERENCES courses(id)
);