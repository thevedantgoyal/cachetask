
-- ============================================
-- Phase 1: Task Management Enterprise Upgrade
-- ============================================

-- 1. Alter tasks table with new columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'project_task',
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reassigned_from uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reassignment_reason text,
  ADD COLUMN IF NOT EXISTS reassignment_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

-- 2. Create task_activity_logs table
CREATE TABLE public.task_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  performed_by uuid NOT NULL REFERENCES public.profiles(id),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity_logs ENABLE ROW LEVEL SECURITY;

-- Assignee can view logs for their tasks
CREATE POLICY "Assignees can view task activity logs"
  ON public.task_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_activity_logs.task_id
        AND t.assigned_to = get_user_profile_id(auth.uid())
    )
  );

-- Managers can view logs for team tasks
CREATE POLICY "Managers can view team task activity logs"
  ON public.task_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = t.assigned_to
      WHERE t.id = task_activity_logs.task_id
        AND is_manager_of(auth.uid(), p.user_id)
    )
  );

-- Admins/HR can view all logs
CREATE POLICY "Admins and HR can view all task activity logs"
  ON public.task_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Organization can view all logs
CREATE POLICY "Organization can view all task activity logs"
  ON public.task_activity_logs FOR SELECT
  USING (has_role(auth.uid(), 'organization'::app_role));

-- Authenticated users can insert logs (controlled by app logic)
CREATE POLICY "Authenticated users can insert task activity logs"
  ON public.task_activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Create task_evidence table
CREATE TABLE public.task_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id),
  file_url text NOT NULL,
  evidence_type text NOT NULL DEFAULT 'other',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_evidence ENABLE ROW LEVEL SECURITY;

-- Assignee can view evidence for their tasks
CREATE POLICY "Assignees can view task evidence"
  ON public.task_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_evidence.task_id
        AND t.assigned_to = get_user_profile_id(auth.uid())
    )
  );

-- Managers can view team task evidence
CREATE POLICY "Managers can view team task evidence"
  ON public.task_evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = t.assigned_to
      WHERE t.id = task_evidence.task_id
        AND is_manager_of(auth.uid(), p.user_id)
    )
  );

-- Admins/HR can view all evidence
CREATE POLICY "Admins and HR can view all task evidence"
  ON public.task_evidence FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Organization can view all evidence
CREATE POLICY "Organization can view all task evidence"
  ON public.task_evidence FOR SELECT
  USING (has_role(auth.uid(), 'organization'::app_role));

-- Assignees can upload evidence to their tasks
CREATE POLICY "Assignees can upload task evidence"
  ON public.task_evidence FOR INSERT
  WITH CHECK (
    uploaded_by = get_user_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_evidence.task_id
        AND t.assigned_to = get_user_profile_id(auth.uid())
    )
  );

-- Managers can also upload evidence
CREATE POLICY "Managers can upload task evidence"
  ON public.task_evidence FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'team_lead'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Create task_comments table
CREATE TABLE public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Assignee can view comments on their tasks
CREATE POLICY "Assignees can view task comments"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_comments.task_id
        AND t.assigned_to = get_user_profile_id(auth.uid())
    )
  );

-- Managers can view team task comments
CREATE POLICY "Managers can view team task comments"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.profiles p ON p.id = t.assigned_to
      WHERE t.id = task_comments.task_id
        AND is_manager_of(auth.uid(), p.user_id)
    )
  );

-- Admins/HR can view all comments
CREATE POLICY "Admins and HR can view all task comments"
  ON public.task_comments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Organization can view all comments
CREATE POLICY "Organization can view all task comments"
  ON public.task_comments FOR SELECT
  USING (has_role(auth.uid(), 'organization'::app_role));

-- Authenticated users can insert comments on tasks they can view
CREATE POLICY "Authenticated users can add task comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    author_id = get_user_profile_id(auth.uid())
    AND auth.uid() IS NOT NULL
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.task_comments FOR UPDATE
  USING (author_id = get_user_profile_id(auth.uid()));

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.task_comments FOR DELETE
  USING (author_id = get_user_profile_id(auth.uid()));

-- Trigger for updated_at on task_comments
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
