-- Notice Decoder Phase 3: Coordinator Architecture, Role-Based Access, Notice Versioning,
-- Acknowledgement Tracking, In-App Notifications, and Tamper-Resistant Audit Logging
-- Migration: 002_phase3_coordinator_and_acknowledgements.sql

-- 1. USER ROLES & INSTITUTIONAL MEMBERSHIP
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'coordinator', 'admin')),
  institution_id TEXT NOT NULL DEFAULT 'eng_college_main',
  department TEXT, -- e.g. 'Computer Science & Engineering'
  batch_year TEXT, -- e.g. '2026'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Helper function to check if requesting user has coordinator or admin role
CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id AND role IN ('coordinator', 'admin')
  );
$$;

-- 2. EXTEND NOTICES FOR COORDINATOR PUBLICATION & AUDIENCE TARGETING
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published', 'archived', 'withdrawn')),
  ADD COLUMN IF NOT EXISTS target_audience_type TEXT NOT NULL DEFAULT 'all_students' CHECK (target_audience_type IN ('all_students', 'department', 'batch', 'course', 'custom_group')),
  ADD COLUMN IF NOT EXISTS target_audience_value TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_notices_publication ON public.notices(is_published, publication_status);
CREATE INDEX IF NOT EXISTS idx_notices_target_audience ON public.notices(target_audience_type, target_audience_value);

-- 3. NOTICE VERSIONS & REVISION AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.notice_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_summary TEXT NOT NULL,
  material_change BOOLEAN NOT NULL DEFAULT FALSE,
  changes_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  snapshot JSONB NOT NULL,
  CONSTRAINT uq_notice_version UNIQUE (notice_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_notice_versions_notice_id ON public.notice_versions(notice_id);

-- 4. ACKNOWLEDGEMENT TRACKING
CREATE TABLE IF NOT EXISTS public.notice_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'viewed' CHECK (status IN ('not_viewed', 'viewed', 'acknowledged', 'action_required')),
  action_items_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  notes TEXT,
  re_acknowledgement_requested BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_notice_ack UNIQUE (notice_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_acknowledgements_notice_id ON public.notice_acknowledgements(notice_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_user_id ON public.notice_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgements_status ON public.notice_acknowledgements(status);

-- 5. IN-APP NOTIFICATIONS & DEADLINE REMINDERS
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('notice_published', 'notice_revised', 'deadline_approaching', 'clash_detected', 'action_required', 'system')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'high', 'critical')),
  target_url TEXT,
  notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL,
  event_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.in_app_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.in_app_notifications(created_at DESC);

-- 6. IMMUTABLE SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT NOT NULL DEFAULT 'student',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('notice', 'user', 'acknowledgement', 'system')),
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7a. User Roles RLS:
-- Users can view their own roles; Coordinators/Admins can view roles in their institution
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coordinators and Admins can view all institution roles"
  ON public.user_roles FOR SELECT
  USING (public.is_coordinator_or_admin(auth.uid()));

-- Only Admins can insert/update roles
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 7b. Notices RLS (Updated for Publication & Audience Separation):
-- Drop previous policies to apply Phase 3 rules
DROP POLICY IF EXISTS "Users can view their own notices" ON public.notices;

CREATE POLICY "Users can view their own private notices OR published notices matching their audience"
  ON public.notices FOR SELECT
  USING (
    -- Personal notice uploaded by student
    auth.uid() = user_id
    -- OR Published coordinator notice
    OR (
      is_published = TRUE
      AND publication_status = 'published'
      AND (
        target_audience_type = 'all_students'
        OR public.is_coordinator_or_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
          AND (
            (target_audience_type = 'department' AND ur.department = notices.target_audience_value)
            OR (target_audience_type = 'batch' AND ur.batch_year = notices.target_audience_value)
          )
        )
      )
    )
  );

-- Coordinators can insert institutional notices; students can insert personal notices
CREATE POLICY "Coordinators can create published notices and students can create personal notices"
  ON public.notices FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      is_published = FALSE
      OR public.is_coordinator_or_admin(auth.uid())
    )
  );

-- Only author or coordinator can update notice
CREATE POLICY "Owners and authorized coordinators can update notice"
  ON public.notices FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (public.is_coordinator_or_admin(auth.uid()) AND is_published = TRUE)
  );

-- 7c. Notice Versions RLS:
CREATE POLICY "Users can view versions of notices they have access to"
  ON public.notice_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notices n
      WHERE n.id = notice_versions.notice_id
      AND (
        n.user_id = auth.uid()
        OR (n.is_published = TRUE AND n.publication_status != 'draft')
        OR public.is_coordinator_or_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Only coordinators can create notice versions"
  ON public.notice_versions FOR INSERT
  WITH CHECK (public.is_coordinator_or_admin(auth.uid()));

-- 7d. Notice Acknowledgements RLS:
CREATE POLICY "Students can view their own acknowledgements"
  ON public.notice_acknowledgements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coordinators can view all acknowledgements for institutional notices"
  ON public.notice_acknowledgements FOR SELECT
  USING (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Students can insert their own acknowledgement"
  ON public.notice_acknowledgements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own acknowledgement"
  ON public.notice_acknowledgements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7e. Notifications RLS:
CREATE POLICY "Users can view and manage their own notifications"
  ON public.in_app_notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7f. Audit Logs RLS:
-- Audit logs are strictly append-only. Only coordinators/admins can read audit logs.
CREATE POLICY "Coordinators and admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_coordinator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users and system can append audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Prevent UPDATE and DELETE on audit logs
CREATE POLICY "Audit logs cannot be updated"
  ON public.audit_logs FOR UPDATE
  USING (FALSE);

CREATE POLICY "Audit logs cannot be deleted"
  ON public.audit_logs FOR DELETE
  USING (FALSE);
