-- Migration: Add verified_by column to parent_payments
-- This tracks whether payment was verified via frontend, webhook, or manual override

ALTER TABLE public.parent_payments 
  ADD COLUMN IF NOT EXISTS verified_by VARCHAR(20) DEFAULT NULL;
  -- Values: 'frontend' | 'webhook' | 'manual'

COMMENT ON COLUMN public.parent_payments.verified_by IS 'Who verified this payment: frontend, webhook, or manual (super admin)';
