CREATE TABLE posts (
                       id BIGSERIAL PRIMARY KEY,
                       course_id BIGINT NOT NULL,
                       user_id BIGINT NOT NULL,
                       title VARCHAR(255) NOT NULL,
                       content TEXT NOT NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMP,
                       CONSTRAINT fk_posts_course
                           FOREIGN KEY (course_id) REFERENCES courses(id),
                       CONSTRAINT fk_posts_user
                           FOREIGN KEY (user_id) REFERENCES users(id)
);