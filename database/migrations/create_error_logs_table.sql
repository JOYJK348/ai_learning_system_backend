-- Create error_logs table for central cloud-native error auditing
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  error_code TEXT NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index on created_at and error_code for auditing queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs (error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_route ON error_logs (route);
