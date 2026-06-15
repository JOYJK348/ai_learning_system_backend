-- Parent Registrations (pre-auth, pending approval)
-- Parent fills form -> record created here -> admin approves -> auth users created

CREATE TABLE IF NOT EXISTS parent_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_name     TEXT NOT NULL,
    parent_email    TEXT NOT NULL,
    parent_phone    TEXT,
    child_name      TEXT NOT NULL,
    child_grade_id  UUID REFERENCES grades(id),
    school_id       UUID REFERENCES schools(id),
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_reg_email_active ON parent_registrations(LOWER(parent_email)) WHERE deleted_at IS NULL AND status = 'pending';
CREATE INDEX IF NOT EXISTS idx_parent_reg_status ON parent_registrations(status, created_at DESC);
