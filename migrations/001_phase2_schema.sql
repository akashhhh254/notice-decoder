-- Notice Decoder Phase 2: PostgreSQL Schema & Row Level Security (RLS)
-- Version: 001_phase2_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USER PREFERENCES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  preferences JSONB NOT NULL DEFAULT '{"weekStartsOn": 1, "deadlineReminderDays": 2}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. NOTICES
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_title TEXT NOT NULL,
  notice_type TEXT NOT NULL DEFAULT 'general' CHECK (notice_type IN ('exam', 'circular', 'event', 'deadline', 'scholarship', 'administrative', 'general')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'high', 'critical')),
  institution TEXT,
  department TEXT,
  reference_number TEXT,
  publication_date TEXT,
  plain_language_summary TEXT NOT NULL,
  raw_text TEXT NOT NULL DEFAULT '',
  source_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  extraction_source TEXT NOT NULL DEFAULT 'gemini_multimodal' CHECK (extraction_source IN ('gemini_multimodal', 'gemini_text', 'deterministic_parser', 'sample_fixture')),
  status TEXT NOT NULL DEFAULT 'reviewed' CHECK (status IN ('draft', 'reviewed', 'confirmed', 'archived')),
  storage_object_path TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_user_id ON public.notices(user_id);
CREATE INDEX IF NOT EXISTS idx_notices_status ON public.notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON public.notices(created_at DESC);

-- 3. NOTICE EVENTS
CREATE TABLE IF NOT EXISTS public.notice_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL, -- Stored as ISO YYYY-MM-DD or academic string
  start_time TEXT,          -- Format HH:MM AM/PM or HH:MM
  end_time TEXT,
  venue TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
  target_audience TEXT,
  evidence_snippet TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notice_events_user_id ON public.notice_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notice_events_notice_id ON public.notice_events(notice_id);
CREATE INDEX IF NOT EXISTS idx_notice_events_date ON public.notice_events(event_date);

-- 4. ACTION CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  deadline TEXT,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  submission_location TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON public.action_items(user_id);
CREATE INDEX IF NOT EXISTS idx_action_items_notice_id ON public.action_items(notice_id);

-- 5. UNCERTAINTY WARNINGS
CREATE TABLE IF NOT EXISTS public.uncertainty_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('missing_time', 'ambiguous_date', 'unclear_venue', 'contradictory_info', 'low_confidence', 'missing_deadline')),
  explanation TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  user_correction TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uncertainties_user_id ON public.uncertainty_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_uncertainties_notice_id ON public.uncertainty_warnings(notice_id);

-- 6. TIMETABLE ENTRIES (RECURRING PERSONAL CLASSES)
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_title TEXT NOT NULL,
  weekday INT NOT NULL CHECK (weekday >= 1 AND weekday <= 7), -- 1 = Monday ... 7 = Sunday
  start_time TEXT NOT NULL, -- 24-hr format HH:MM
  end_time TEXT NOT NULL,   -- 24-hr format HH:MM
  venue TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  semester_start_date DATE,
  semester_end_date DATE,
  recurrence_rule TEXT DEFAULT 'FREQ=WEEKLY',
  color TEXT DEFAULT '#0369a1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON public.timetable_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_weekday ON public.timetable_entries(weekday);

-- 7. CONFLICT REVIEWS (USER OVERRIDES & FALSE POSITIVES)
CREATE TABLE IF NOT EXISTS public.conflict_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  timetable_entry_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reviewed' CHECK (status IN ('active', 'dismissed', 'resolved')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id, timetable_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_conflict_reviews_user ON public.conflict_reviews(user_id);

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uncertainty_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only select and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Notices: strict user ownership
CREATE POLICY "Users can view own notices"
  ON public.notices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notices"
  ON public.notices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notices"
  ON public.notices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notices"
  ON public.notices FOR DELETE
  USING (auth.uid() = user_id);

-- Notice Events
CREATE POLICY "Users can view own notice events"
  ON public.notice_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notice events"
  ON public.notice_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notice events"
  ON public.notice_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notice events"
  ON public.notice_events FOR DELETE
  USING (auth.uid() = user_id);

-- Action Items
CREATE POLICY "Users can view own action items"
  ON public.action_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action items"
  ON public.action_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action items"
  ON public.action_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own action items"
  ON public.action_items FOR DELETE
  USING (auth.uid() = user_id);

-- Uncertainty Warnings
CREATE POLICY "Users can view own uncertainties"
  ON public.uncertainty_warnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uncertainties"
  ON public.uncertainty_warnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uncertainties"
  ON public.uncertainty_warnings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uncertainties"
  ON public.uncertainty_warnings FOR DELETE
  USING (auth.uid() = user_id);

-- Timetable Entries
CREATE POLICY "Users can view own timetable entries"
  ON public.timetable_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timetable entries"
  ON public.timetable_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timetable entries"
  ON public.timetable_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timetable entries"
  ON public.timetable_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Conflict Reviews
CREATE POLICY "Users can view own conflict reviews"
  ON public.conflict_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conflict reviews"
  ON public.conflict_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conflict reviews"
  ON public.conflict_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conflict reviews"
  ON public.conflict_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- STORAGE POLICIES (Supabase Storage: bucket 'notices-private')
-- ----------------------------------------------------
-- Object path format: {user_id}/{notice_id}_{timestamp}.{ext}
-- CREATE POLICY "Private notice upload for authenticated owner"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'notices-private' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Private notice download for authenticated owner"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'notices-private' AND (storage.foldername(name))[1] = auth.uid()::text);
-- 
-- CREATE POLICY "Private notice delete for authenticated owner"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'notices-private' AND (storage.foldername(name))[1] = auth.uid()::text);
