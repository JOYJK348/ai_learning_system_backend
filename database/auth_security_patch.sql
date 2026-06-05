-- =============================================================
-- ZHI LEARNING APP - AUTH API SUPPORT PATCH
-- Run this after database/final.sql.
-- =============================================================

INSERT INTO lookup_user_roles (code, name, description, sort_order) VALUES
    ('parent', 'Parent', 'Parent access to own children', 5),
    ('student', 'Student', 'Student access to own learning data', 6)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS auth_attempt_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email         TEXT,
    role          TEXT,
    success       BOOLEAN NOT NULL DEFAULT FALSE,
    reason        TEXT,
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempt_logs_email
    ON auth_attempt_logs(LOWER(email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempt_logs_ip
    ON auth_attempt_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempt_logs_failures
    ON auth_attempt_logs(ip_address, LOWER(email), created_at DESC)
    WHERE success = FALSE;

CREATE TABLE IF NOT EXISTS token_blacklist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash  TEXT UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires
    ON token_blacklist(expires_at);

ALTER TABLE auth_attempt_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist   ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempt_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist   FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_full_access_auth_attempt_logs ON auth_attempt_logs;
CREATE POLICY admin_full_access_auth_attempt_logs ON auth_attempt_logs
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS admin_full_access_token_blacklist ON token_blacklist;
CREATE POLICY admin_full_access_token_blacklist ON token_blacklist
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Supabase REST/API grants for backend service-role access.
-- RLS still protects anon/authenticated users; service_role is used only server-side.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
