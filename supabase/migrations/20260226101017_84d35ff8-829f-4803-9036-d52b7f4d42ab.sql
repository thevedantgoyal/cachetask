
-- Add new columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'inhouse',
  ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Create project_members junction table
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Managers can manage members of projects they created
CREATE POLICY "Managers can manage own project members"
ON public.project_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_members.project_id
    AND p.created_by = public.get_user_profile_id(auth.uid())
  )
);

-- Employees can view their own memberships
CREATE POLICY "Employees can view their memberships"
ON public.project_members FOR SELECT
TO authenticated
USING (employee_id = public.get_user_profile_id(auth.uid()));

-- Admins and HR can manage all project members
CREATE POLICY "Admins can manage all project members"
ON public.project_members FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'hr'::app_role)
);

-- Organization can view all project members
CREATE POLICY "Organization can view all project members"
ON public.project_members FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'organization'::app_role));

-- Add is_seen column to tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS is_seen boolean NOT NULL DEFAULT false;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_employee_id ON public.project_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_seen ON public.tasks(is_seen);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status ON public.tasks(assigned_to, status) WHERE is_deleted = false;
