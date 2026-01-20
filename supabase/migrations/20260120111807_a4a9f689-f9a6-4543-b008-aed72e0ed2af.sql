-- Create role enum for the application
CREATE TYPE public.app_role AS ENUM ('employee', 'team_lead', 'manager', 'hr', 'admin');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  job_title TEXT,
  department TEXT,
  location TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'available',
  work_hours TEXT DEFAULT '9:00 AM - 6:00 PM',
  linkedin_url TEXT,
  manager_id UUID REFERENCES public.profiles(id),
  team_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (CRITICAL: roles must be separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key to profiles for team_id
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_team FOREIGN KEY (team_id) REFERENCES public.teams(id);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id),
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contributions table (work updates with evidence)
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  evidence_type TEXT,
  evidence_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create metric_categories table
CREATE TABLE public.metric_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default metric categories
INSERT INTO public.metric_categories (name, description, icon) VALUES
  ('Collaboration', 'Ability to work effectively with team members', 'users'),
  ('Communication', 'Clear and effective communication skills', 'message-square'),
  ('Problem Solving', 'Analytical and creative problem resolution', 'lightbulb'),
  ('Time Management', 'Efficient use of time and meeting deadlines', 'clock'),
  ('Project Management', 'Planning and executing projects effectively', 'folder-kanban');

-- Create performance_metrics table
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.metric_categories(id) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  evaluated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, period_start, period_end)
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  proficiency_level INTEGER DEFAULT 50 CHECK (proficiency_level >= 0 AND proficiency_level <= 100),
  goal_level INTEGER DEFAULT 100 CHECK (goal_level >= 0 AND goal_level <= 100),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's profile id
CREATE OR REPLACE FUNCTION public.get_user_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create function to check if user is manager of another user
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_user_id UUID, _employee_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _employee_user_id
      AND p.manager_id = public.get_user_profile_id(_manager_user_id)
  )
$$;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default employee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON public.performance_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view their team members" ON public.profiles FOR SELECT USING (public.is_manager_of(auth.uid(), user_id));
CREATE POLICY "HR and Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_ROLES POLICIES (only admins can modify roles)
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert default role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'employee');

-- TEAMS POLICIES
CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and Managers can manage teams" ON public.teams FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- PROJECTS POLICIES
CREATE POLICY "Authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and Admins can manage projects" ON public.projects FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- TASKS POLICIES
CREATE POLICY "Users can view their assigned tasks" ON public.tasks FOR SELECT USING (assigned_to = public.get_user_profile_id(auth.uid()));
CREATE POLICY "Managers can view team tasks" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = tasks.assigned_to 
    AND public.is_manager_of(auth.uid(), p.user_id)
  )
);
CREATE POLICY "Admins and HR can view all tasks" ON public.tasks FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Users can update their assigned tasks" ON public.tasks FOR UPDATE USING (assigned_to = public.get_user_profile_id(auth.uid()));
CREATE POLICY "Managers can manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'team_lead') OR public.has_role(auth.uid(), 'admin'));

-- CONTRIBUTIONS POLICIES
CREATE POLICY "Users can view their own contributions" ON public.contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team contributions" ON public.contributions FOR SELECT USING (public.is_manager_of(auth.uid(), user_id) OR public.has_role(auth.uid(), 'team_lead'));
CREATE POLICY "HR and Admins can view all contributions" ON public.contributions FOR SELECT USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own contributions" ON public.contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their pending contributions" ON public.contributions FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Team leads and Managers can review contributions" ON public.contributions FOR UPDATE USING (
  public.has_role(auth.uid(), 'team_lead') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')
);

-- METRIC_CATEGORIES POLICIES
CREATE POLICY "Authenticated users can view metric categories" ON public.metric_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage metric categories" ON public.metric_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- PERFORMANCE_METRICS POLICIES
CREATE POLICY "Users can view their own metrics" ON public.performance_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team metrics" ON public.performance_metrics FOR SELECT USING (public.is_manager_of(auth.uid(), user_id));
CREATE POLICY "HR and Admins can view all metrics" ON public.performance_metrics FOR SELECT USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team leads and Managers can create metrics" ON public.performance_metrics FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'team_lead') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Managers can update metrics" ON public.performance_metrics FOR UPDATE USING (
  public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin')
);

-- SKILLS POLICIES
CREATE POLICY "Users can view their own skills" ON public.skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view team skills" ON public.skills FOR SELECT USING (public.is_manager_of(auth.uid(), user_id));
CREATE POLICY "HR and Admins can view all skills" ON public.skills FOR SELECT USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage their own skills" ON public.skills FOR ALL USING (auth.uid() = user_id);