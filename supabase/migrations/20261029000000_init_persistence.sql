-- Migration: 20261029000000_init_persistence.sql
-- Description: Core tables, cascading foreign keys, and Row-Level Security (RLS) policies for RepoPilot

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Developer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  title TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id for fast session listing and RLS evaluation
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON public.sessions(updated_at DESC);

-- 3. Repo Snapshots Table (Cached architectural summary & selected file excerpts)
CREATE TABLE IF NOT EXISTS public.repo_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  default_branch TEXT NOT NULL DEFAULT 'main',
  selected_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis_json JSONB NOT NULL,
  coverage_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repo_snapshots_session_id ON public.repo_snapshots(session_id);

-- 4. Messages Table (Chat history per session)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id, created_at ASC);

-- 5. Documents Table (Generated PRD, TRD, TDD, and Agent Prompts)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('prd', 'trd', 'tdd', 'prompt', 'all')),
  content_md TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_session_id ON public.documents(session_id, kind);

-- 6. Blueprints Table (Innovation opportunities and selected implementation plan)
CREATE TABLE IF NOT EXISTS public.blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  opportunities_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_index INT NOT NULL DEFAULT 0,
  plan_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_session_id ON public.blueprints(session_id);

-- 7. Usage Events Table (Tracking request counts against plan limits)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id, created_at DESC);

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repo_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sessions: Users have full CRUD only on sessions they own
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Repo Snapshots: Scoped to owner of the session
DROP POLICY IF EXISTS "Users can manage snapshots for own sessions" ON public.repo_snapshots;
CREATE POLICY "Users can manage snapshots for own sessions"
  ON public.repo_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = repo_snapshots.session_id
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = repo_snapshots.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Messages: Scoped to owner of the session
DROP POLICY IF EXISTS "Users can manage messages for own sessions" ON public.messages;
CREATE POLICY "Users can manage messages for own sessions"
  ON public.messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = messages.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Documents: Scoped to owner of the session
DROP POLICY IF EXISTS "Users can manage documents for own sessions" ON public.documents;
CREATE POLICY "Users can manage documents for own sessions"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = documents.session_id
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = documents.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Blueprints: Scoped to owner of the session
DROP POLICY IF EXISTS "Users can manage blueprints for own sessions" ON public.blueprints;
CREATE POLICY "Users can manage blueprints for own sessions"
  ON public.blueprints FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = blueprints.session_id
      AND sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = blueprints.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Usage Events: Users can insert and read their own usage
DROP POLICY IF EXISTS "Users can manage own usage events" ON public.usage_events;
CREATE POLICY "Users can manage own usage events"
  ON public.usage_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Developer'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
