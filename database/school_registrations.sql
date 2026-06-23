-- Create school_registrations table for school onboarding requests
CREATE TABLE IF NOT EXISTS school_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name     TEXT NOT NULL,
    admin_name      TEXT NOT NULL,
    admin_email     TEXT NOT NULL,
    admin_phone     TEXT,
    address         TEXT,
    city            TEXT,
    board_name      TEXT,
    status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by     UUID REFERENCES admins(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    rejected_by     UUID REFERENCES admins(id) ON DELETE SET NULL,
    rejected_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_reg_email_active ON school_registrations(LOWER(admin_email)) WHERE deleted_at IS NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_school_reg_status ON school_registrations(status, created_at DESC);
