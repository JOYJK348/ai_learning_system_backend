-- Subscription Plans Schema (Parent-facing)
-- Decoupled from school-admin plan_types table

-- 1. Plans
CREATE TABLE IF NOT EXISTS public.plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,             -- free, focus, premium, ultimate
    name VARCHAR(100) NOT NULL,                    -- Free, Focus, Premium, Ultimate
    description TEXT,
    amount_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_quarterly DECIMAL(10,2) DEFAULT NULL,
    amount_yearly DECIMAL(10,2) DEFAULT NULL,
    badge_label VARCHAR(50),                       -- "Popular", "Best Value", etc.
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    trial_days INT DEFAULT 14,                     -- Free trial days for paid plans
    icon VARCHAR(50),                              -- Plan icon identifier
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Features
CREATE TABLE IF NOT EXISTS public.features (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,              -- subjects_limit, quizzes, activities, games, etc.
    name VARCHAR(100) NOT NULL,                    -- "Subjects Access", "Unit Tests", etc.
    description TEXT,
    category VARCHAR(50) NOT NULL,                 -- core, fun, assessment, parent, ai, technical
    icon VARCHAR(50),                              -- Feature icon identifier
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Plan-Feature Mapping
CREATE TABLE IF NOT EXISTS public.plan_features (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id INT NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    feature_limit JSONB NOT NULL DEFAULT '"unlimited"',  -- "unlimited", "3/week", "1/day", "1", false, true
    UNIQUE(plan_id, feature_id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Parent Subscriptions (tracks current + history)
CREATE TABLE IF NOT EXISTS public.parent_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES public.plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, expired, cancelled, trial
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,                           -- NULL = unlimited
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    restrictions JSONB DEFAULT NULL,               -- Override limits if needed
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Parent Payments (transaction log)
CREATE TABLE IF NOT EXISTS public.parent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.parent_subscriptions(id),
    plan_id INT NOT NULL REFERENCES public.plans(id),
    order_id TEXT UNIQUE,                          -- Razorpay order_id
    payment_id TEXT,                               -- Razorpay payment_id
    signature TEXT,                                -- Verification signature
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    interval_type VARCHAR(20) DEFAULT 'monthly',   -- monthly, quarterly, yearly
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded, expired
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    last_polled_at TIMESTAMPTZ,
    webhook_received BOOLEAN DEFAULT FALSE,
    webhook_payload JSONB DEFAULT NULL,
    confirmed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                        -- Auto-expire unpaid orders
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parent_subscriptions_parent ON parent_subscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_subscriptions_status ON parent_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_parent_payments_parent ON parent_payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_payments_status ON parent_payments(status);
CREATE INDEX IF NOT EXISTS idx_parent_payments_order ON parent_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_payments ENABLE ROW LEVEL SECURITY;

-- Seed: Features
INSERT INTO public.features (code, name, description, category, icon, sort_order) VALUES
    ('subjects_access', 'Subjects Access', 'Number of subjects the student can access', 'core', 'book', 1),
    ('units_access', 'Units per Subject', 'Number of units available per subject', 'core', 'layers', 2),
    ('cinematic_lessons', 'Cinematic Lessons', 'Access to animated video lessons with story-based learning', 'core', 'film', 3),
    ('video_quality', 'Video Quality', 'Maximum video resolution available', 'core', 'monitor', 4),
    ('new_episodes', 'New Episodes Wait Time', 'How soon new weekly episodes are available', 'core', 'clock', 5),
    ('regional_voiceover', 'Regional Voice-over', 'Regional language voice-over support', 'core', 'languages', 6),
    ('interactive_transcript', 'Interactive Transcript', 'Clickable transcript for video lessons', 'core', 'file-text', 7),
    ('lesson_quizzes', 'Lesson Quick Quizzes', 'Quick quiz after each lesson', 'assessment', 'help-circle', 8),
    ('unit_tests', 'Chapter Unit Tests', 'End-of-chapter unit tests to unlock next chapter', 'assessment', 'check-square', 9),
    ('monthly_exams', 'Monthly Progress Exams', 'Monthly assessment to track progress', 'assessment', 'calendar', 10),
    ('weakness_detection', 'Smart Weakness Detection', 'AI-powered weak area analysis', 'assessment', 'search', 11),
    ('printable_reports', 'Printable Reports', 'Download PDF reports of performance', 'assessment', 'printer', 12),
    ('activities', 'Interactive Activities', 'Fun learning activities', 'fun', 'zap', 13),
    ('games', 'Learning Games', 'Educational games for practice', 'fun', 'gamepad-2', 14),
    ('weekly_challenges', 'Weekly Challenges', 'Competitive weekly challenges with rewards', 'fun', 'award', 15),
    ('avatar_customization', 'Avatar Customization', 'Customize profile avatar', 'fun', 'user-circle', 16),
    ('seasonal_events', 'Seasonal Events', 'Special festival and seasonal events', 'fun', 'sparkles', 17),
    ('parent_dashboard', 'Parent Dashboard', 'Live progress dashboard for parents', 'parent', 'layout-dashboard', 18),
    ('daily_feed', 'Daily Activity Feed', 'Daily text/visual activity updates', 'parent', 'activity', 19),
    ('weekly_report', 'Weekly Email Report', 'Weekly progress report via email', 'parent', 'mail', 20),
    ('screen_time', 'Screen Time Controls', 'Set daily/weekly screen time limits', 'parent', 'clock', 21),
    ('learning_planner', 'Learning Path Planner', 'Plan and schedule learning path', 'parent', 'calendar', 22),
    ('performance_alerts', 'Performance Alerts', 'SMS/WhatsApp alerts on performance drops', 'parent', 'bell', 23),
    ('ai_doubt_solver', 'AI Doubt Solver', 'AI-powered doubt resolution for students', 'ai', 'bot', 24),
    ('ai_worksheet', 'AI Worksheet Generator', 'Generate custom worksheets via AI', 'ai', 'file-plus', 25),
    ('ai_planner', 'AI Study Planner', 'AI-generated weekly study schedule', 'ai', 'calendar-check', 26),
    ('ai_parent_insights', 'AI Parent Insights', 'Deep AI insights for parents', 'ai', 'trending-up', 27),
    ('multi_profile', 'Multiple Kids', 'Number of child profiles per account', 'technical', 'users', 28),
    ('devices', 'Supported Devices', 'Devices supported for access', 'technical', 'smartphone', 29),
    ('ads', 'Advertisements', 'Shows ads in the app', 'technical', 'eye', 30);

-- Seed: Plans
INSERT INTO public.plans (code, name, description, amount_monthly, badge_label, sort_order, icon, trial_days) VALUES
    ('free', 'Free', 'Get started with basic learning', 0, NULL, 1, 'free', 14),
    ('focus', 'Focus', 'Master one subject at a time', 149, 'Popular', 2, 'focus', 14),
    ('premium', 'Premium', 'Full access to everything', 399, 'Best Value', 3, 'premium', 14),
    ('ultimate', 'Ultimate', 'Everything + AI features', 699, NULL, 4, 'ultimate', 14);

-- Seed: Plan-Feature Mapping (Free)
INSERT INTO public.plan_features (plan_id, feature_id, feature_limit) VALUES
    (1, 1, '"1"'),                     -- 1 subject
    (1, 2, '"2"'),                     -- 2 units only
    (1, 3, 'true'),                    -- Cinematic lessons
    (1, 4, '"720p"'),                  -- Video quality 720p
    (1, 5, '"2_weeks"'),               -- 2 week delay on new episodes
    (1, 30, 'true'),                   -- Ads
    (1, 28, '"1"'),                    -- 1 kid
    (1, 29, '"web_only"');             -- Web only

-- Seed: Plan-Feature Mapping (Focus)
INSERT INTO public.plan_features (plan_id, feature_id, feature_limit) VALUES
    (2, 1, '"1"'),                     -- 1 subject
    (2, 2, '"unlimited"'),             -- All units
    (2, 3, 'true'),                    -- Cinematic lessons
    (2, 4, '"720p"'),                  -- Video quality 720p
    (2, 5, '"1_week"'),                -- 1 week delay
    (2, 8, 'true'),                    -- Lesson quizzes
    (2, 9, 'true'),                    -- Unit tests
    (2, 13, '"3/week"'),               -- 3 activities/week
    (2, 14, '"1/day"'),                -- 1 game/day
    (2, 16, '"basic"'),                -- Basic avatar
    (2, 18, '"basic"'),                -- Basic parent dashboard
    (2, 19, '"text"'),                 -- Text daily feed
    (2, 20, 'true'),                   -- Weekly email report
    (2, 28, '"1"'),                    -- 1 kid
    (2, 29, '"web_mobile"'),           -- Web + mobile
    (2, 30, 'false');                  -- No ads

-- Seed: Plan-Feature Mapping (Premium)
INSERT INTO public.plan_features (plan_id, feature_id, feature_limit) VALUES
    (3, 1, '"all"'),                   -- All subjects
    (3, 2, '"unlimited"'),             -- All units
    (3, 3, 'true'),                    -- Cinematic lessons
    (3, 4, '"1080p"'),                 -- Video quality 1080p
    (3, 5, '"same_week"'),             -- Same week episodes
    (3, 7, 'true'),                    -- Interactive transcript
    (3, 8, 'true'),                    -- Lesson quizzes
    (3, 9, 'true'),                    -- Unit tests
    (3, 10, 'true'),                   -- Monthly exams
    (3, 11, 'true'),                   -- Weakness detection
    (3, 12, 'true'),                   -- Printable reports
    (3, 13, '"unlimited"'),            -- Unlimited activities
    (3, 14, '"unlimited"'),            -- Unlimited games
    (3, 15, 'true'),                   -- Weekly challenges
    (3, 16, '"premium"'),              -- Premium avatar
    (3, 17, 'true'),                   -- Seasonal events
    (3, 18, '"smart"'),                -- Smart parent dashboard
    (3, 19, '"visual"'),               -- Visual daily feed
    (3, 20, 'true'),                   -- Weekly email report
    (3, 21, 'true'),                   -- Screen time controls
    (3, 22, '"manual"'),               -- Manual learning planner
    (3, 23, '"sms"'),                  -- SMS alerts
    (3, 27, '"basic"'),                -- Basic AI insights
    (3, 28, '"3"'),                    -- Up to 3 kids
    (3, 29, '"all"'),                  -- All devices
    (3, 30, 'false');                  -- No ads

-- Seed: Plan-Feature Mapping (Ultimate)
INSERT INTO public.plan_features (plan_id, feature_id, feature_limit) VALUES
    (4, 1, '"all"'),                   -- All subjects
    (4, 2, '"unlimited"'),             -- All units
    (4, 3, 'true'),                    -- Cinematic lessons
    (4, 4, '"4k"'),                    -- 4K HDR
    (4, 5, '"early_access"'),          -- Early access episodes
    (4, 6, 'true'),                    -- Regional voice-over
    (4, 7, 'true'),                    -- Interactive transcript
    (4, 8, 'true'),                    -- Lesson quizzes
    (4, 9, 'true'),                    -- Unit tests
    (4, 10, 'true'),                   -- Monthly exams
    (4, 11, 'true'),                   -- Weakness detection
    (4, 12, 'true'),                   -- Printable reports
    (4, 13, '"unlimited"'),            -- Unlimited activities
    (4, 14, '"unlimited"'),            -- Unlimited games
    (4, 15, 'true'),                   -- Weekly challenges
    (4, 16, '"ultimate"'),             -- Ultimate avatar
    (4, 17, '"exclusive"'),            -- Exclusive events
    (4, 18, '"smart"'),                -- Smart parent dashboard
    (4, 19, '"visual"'),               -- Visual daily feed
    (4, 20, 'true'),                   -- Weekly email report
    (4, 21, '"full"'),                 -- Full screen time controls
    (4, 22, '"ai"'),                   -- AI planner
    (4, 23, '"whatsapp"'),             -- WhatsApp alerts
    (4, 24, 'true'),                   -- AI doubt solver
    (4, 25, 'true'),                   -- AI worksheet generator
    (4, 26, 'true'),                   -- AI study planner
    (4, 27, '"deep"'),                 -- Deep AI insights
    (4, 28, '"5"'),                    -- Up to 5 kids
    (4, 29, '"all"'),                  -- All devices
    (4, 30, 'false');                  -- No ads
