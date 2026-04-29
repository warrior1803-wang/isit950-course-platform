ALTER TABLE assignments
    ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'FILE';

CREATE TABLE assignment_questions (
                                      id BIGSERIAL PRIMARY KEY,
                                      question_key VARCHAR(255) NOT NULL,
                                      type VARCHAR(20) NOT NULL,
                                      text TEXT NOT NULL,
                                      points DOUBLE PRECISION NOT NULL,
                                      options_json TEXT,
                                      correct_option INTEGER,
                                      correct_answer TEXT,
                                      assignment_id BIGINT NOT NULL,

                                      CONSTRAINT fk_assignment_questions_assignment
                                          FOREIGN KEY (assignment_id)
                                              REFERENCES assignments(id)
                                              ON DELETE CASCADE
);