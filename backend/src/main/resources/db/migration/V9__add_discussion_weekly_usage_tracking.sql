ALTER TABLE users
    ADD COLUMN discussion_week_start TIMESTAMP,
    ADD COLUMN weekly_discussion_posts_used INTEGER NOT NULL DEFAULT 0;
