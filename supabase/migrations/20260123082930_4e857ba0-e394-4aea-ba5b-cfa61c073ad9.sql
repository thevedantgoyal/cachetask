-- Update RLS policies to allow 'organization' role read access to all data

-- Profiles: Organization can view all profiles
CREATE POLICY "Organization can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));

-- Tasks: Organization can view all tasks
CREATE POLICY "Organization can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));

-- Contributions: Organization can view all contributions
CREATE POLICY "Organization can view all contributions"
ON public.contributions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));

-- Performance metrics: Organization can view all metrics
CREATE POLICY "Organization can view all metrics"
ON public.performance_metrics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));

-- Skills: Organization can view all skills
CREATE POLICY "Organization can view all skills"
ON public.skills
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));

-- User roles: Organization can view all roles (for reports)
CREATE POLICY "Organization can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'organization'::app_role));