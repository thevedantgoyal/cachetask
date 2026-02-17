
-- Add parent_task_id for subtasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON public.tasks(parent_task_id);

-- Task dependencies table
CREATE TABLE public.task_dependencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks', -- blocks, related
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  UNIQUE(task_id, depends_on),
  CHECK (task_id != depends_on)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view task dependencies"
  ON public.task_dependencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and admins can manage task dependencies"
  ON public.task_dependencies FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

CREATE POLICY "Managers and admins can update task dependencies"
  ON public.task_dependencies FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

CREATE POLICY "Managers and admins can delete task dependencies"
  ON public.task_dependencies FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

-- Tags table
CREATE TABLE public.task_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags"
  ON public.task_tags FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and admins can manage tags"
  ON public.task_tags FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

CREATE POLICY "Managers and admins can update tags"
  ON public.task_tags FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

CREATE POLICY "Managers and admins can delete tags"
  ON public.task_tags FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

-- Tag assignments (many-to-many)
CREATE TABLE public.task_tag_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.task_tags(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.profiles(id),
  UNIQUE(task_id, tag_id)
);

ALTER TABLE public.task_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tag assignments"
  ON public.task_tag_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and admins can assign tags"
  ON public.task_tag_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );

CREATE POLICY "Managers and admins can remove tag assignments"
  ON public.task_tag_assignments FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'team_lead')
  );
