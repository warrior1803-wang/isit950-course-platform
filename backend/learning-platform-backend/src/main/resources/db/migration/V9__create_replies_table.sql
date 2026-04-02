CREATE TABLE replies (
                         id BIGSERIAL PRIMARY KEY,
                         post_id BIGINT NOT NULL,
                         user_id BIGINT NOT NULL,
                         content TEXT NOT NULL,
                         created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                         updated_at TIMESTAMP,
                         CONSTRAINT fk_replies_post
                             FOREIGN KEY (post_id) REFERENCES posts(id),
                         CONSTRAINT fk_replies_user
                             FOREIGN KEY (user_id) REFERENCES users(id)
);