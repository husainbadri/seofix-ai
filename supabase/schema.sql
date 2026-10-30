-- ========================================================
-- SEOFix AI - Supabase PostgreSQL Schema & Security Policies
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- Custom Enums
-- --------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('active', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_type AS ENUM (
        'missing_title',
        'broken_link',
        'slow_lcp',
        'high_cls',
        'missing_meta_description',
        'missing_h1',
        'multiple_h1',
        'missing_canonical',
        'thin_content',
        'missing_alt',
        'duplicate_title',
        'noindex_detected',
        'mixed_content',
        'oversized_dom'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_severity AS ENUM ('critical', 'warning', 'info');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_status AS ENUM ('open', 'fixed', 'ignored');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------
-- 1. profiles
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 2. projects
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status project_status DEFAULT 'active' NOT NULL,
    last_audit_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 3. pages
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    word_count INTEGER DEFAULT 0,
    is_indexed BOOLEAN DEFAULT true,
    last_crawled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_project_page_url UNIQUE (project_id, url)
);

-- --------------------------------------------------------
-- 4. audits
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    score_overall INTEGER NOT NULL CHECK (score_overall BETWEEN 0 AND 100),
    score_technical INTEGER NOT NULL CHECK (score_technical BETWEEN 0 AND 100),
    score_content INTEGER NOT NULL CHECK (score_content BETWEEN 0 AND 100),
    score_performance INTEGER NOT NULL CHECK (score_performance BETWEEN 0 AND 100),
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 5. issues
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    type issue_type NOT NULL,
    severity issue_severity NOT NULL,
    description TEXT NOT NULL,
    status issue_status DEFAULT 'open' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- 6. recommendations
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    suggested_fix TEXT NOT NULL,
    ai_model TEXT DEFAULT 'gpt-4o-mini' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- --------------------------------------------------------
-- Indexes for High Performance Queries
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON public.pages(project_id);
CREATE INDEX IF NOT EXISTS idx_audits_project_id ON public.audits(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_audit_id ON public.issues(audit_id);
CREATE INDEX IF NOT EXISTS idx_issues_page_id ON public.issues(page_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON public.issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_issue_id ON public.recommendations(issue_id);

-- --------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view & update their own profile
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Projects: Users can manage projects they own
CREATE POLICY "Users can manage own projects" 
    ON public.projects FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Pages: Accessible if user owns parent project
CREATE POLICY "Users can manage pages of own projects" 
    ON public.pages FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = pages.project_id AND projects.user_id = auth.uid()
        )
    );

-- Audits: Accessible if user owns parent project
CREATE POLICY "Users can manage audits of own projects" 
    ON public.audits FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = audits.project_id AND projects.user_id = auth.uid()
        )
    );

-- Issues: Accessible if user owns the project that the audit belongs to
CREATE POLICY "Users can manage issues of own audits" 
    ON public.issues FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.audits
            JOIN public.projects ON projects.id = audits.project_id
            WHERE audits.id = issues.audit_id AND projects.user_id = auth.uid()
        )
    );

-- Recommendations: Accessible if user owns the project of the issue
CREATE POLICY "Users can manage recommendations of own issues" 
    ON public.recommendations FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.issues
            JOIN public.audits ON audits.id = issues.audit_id
            JOIN public.projects ON projects.id = audits.project_id
            WHERE issues.id = recommendations.issue_id AND projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------
-- Auto-create profile trigger on Supabase Auth Signup
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
