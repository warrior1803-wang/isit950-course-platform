CREATE TABLE IF NOT EXISTS user_skills (
                                           user_id BIGINT NOT NULL,
                                           skill VARCHAR(255),
                                           CONSTRAINT fk_user_skills_user
                                               FOREIGN KEY (user_id)
                                                   REFERENCES users(id)
                                                   ON DELETE CASCADE
);

ALTER TABLE users DROP COLUMN IF EXISTS skills;