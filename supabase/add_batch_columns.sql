-- Add batch assignment columns to the students table
-- These columns are nullable to avoid breaking existing data.
-- batch_id is used as a unique identifier for Teacher Portal queries.

ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_time TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_label TEXT;
