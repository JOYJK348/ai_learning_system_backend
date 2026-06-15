-- Add email and mobile columns to students table for login credential generation
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT;

-- Add index for unique email lookups (nullable)
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email ON students(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
