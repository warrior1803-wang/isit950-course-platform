ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS overridden_score INTEGER;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS overridden_by VARCHAR(255);

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS override_reason TEXT;