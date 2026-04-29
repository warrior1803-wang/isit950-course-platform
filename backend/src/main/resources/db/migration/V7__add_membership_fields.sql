ALTER TABLE users
    ADD COLUMN membership_type VARCHAR(20),
    ADD COLUMN membership_since TIMESTAMP,
    ADD COLUMN membership_expires_at TIMESTAMP,
    ADD COLUMN membership_plan VARCHAR(20);