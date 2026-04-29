ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS answers_json TEXT;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS breakdown_json TEXT;