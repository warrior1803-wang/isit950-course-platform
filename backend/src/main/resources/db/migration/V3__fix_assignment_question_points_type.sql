ALTER TABLE assignment_questions
    ALTER COLUMN points TYPE INTEGER USING points::INTEGER;