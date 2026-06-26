-- Migration: child_link_requests table + grants + RLS
-- Run this in Supabase SQL editor or psql

CREATE TABLE IF NOT EXISTS child_link_requests (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id          UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    child_name         TEXT NOT NULL,
    child_grade_id     UUID REFERENCES grades(id),
    child_gender       TEXT CHECK (child_gender IN ('boy', 'girl')),
    child_dob          DATE,
    status             TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason   TEXT,
    approved_by        UUID REFERENCES admins(id) ON DELETE SET NULL,
    approved_at        TIMESTAMPTZ,
    rejected_by        UUID REFERENCES admins(id) ON DELETE SET NULL,
    rejected_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_child_link_parent ON child_link_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_link_status ON child_link_requests(status);

-- ── GRANTS (required because ALTER DEFAULT PRIVILEGES doesn't apply retroactively) ──
GRANT ALL ON TABLE child_link_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE child_link_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;

-- ── ROW LEVEL SECURITY ──
ALTER TABLE child_link_requests ENABLE ROW LEVEL SECURITY;

-- Admins can see and manage all requests
DROP POLICY IF EXISTS admin_full_access_child_link_requests ON child_link_requests;
CREATE POLICY admin_full_access_child_link_requests ON child_link_requests
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- Parents can only see their own requests
DROP POLICY IF EXISTS parent_own_child_link_requests ON child_link_requests;
CREATE POLICY parent_own_child_link_requests ON child_link_requests
    FOR ALL
    USING (parent_id = get_parent_id())
    WITH CHECK (parent_id = get_parent_id());

-- service_role bypasses RLS (used by backend API)
-- No policy needed — service_role always bypasses RLS in Supabase
