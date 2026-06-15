-- Add missing columns to schools table for frontend feature parity
ALTER TABLE schools 
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS plan_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 14,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{"videos":true,"quizzes":true,"activities":true,"reports":true,"ai_tutor":false,"bulk_import":false}',
  ADD COLUMN IF NOT EXISTS revenue_this_month DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Modify payments table to support direct school payments (making parent_id nullable)
ALTER TABLE payments ALTER COLUMN parent_id DROP NOT NULL;

-- Add check constraint so that either parent_id or school_id is provided
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_owner'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT check_payment_owner CHECK (parent_id IS NOT NULL OR school_id IS NOT NULL);
  END IF;
END $$;
