-- Migration: Add Child Gender and DOB
-- Add child_gender and child_dob to parent_registrations
ALTER TABLE parent_registrations
  ADD COLUMN IF NOT EXISTS child_gender TEXT,
  ADD COLUMN IF NOT EXISTS child_dob DATE;

-- Add gender to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS gender TEXT;
