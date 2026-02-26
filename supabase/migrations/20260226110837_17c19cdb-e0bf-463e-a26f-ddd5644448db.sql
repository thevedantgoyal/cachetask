
-- ============================================================
-- 1. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  status text NOT NULL DEFAULT 'present',
  location_lat numeric,
  location_lng numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date),
  CONSTRAINT attendance_status_check CHECK (status IN ('present', 'late', 'half_day', 'absent'))
);

CREATE INDEX idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_user_date ON public.attendance(user_id, date);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON public.attendance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON public.attendance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team attendance"
  ON public.attendance FOR SELECT
  USING (is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR and Admins can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organization can view all attendance"
  ON public.attendance FOR SELECT
  USING (has_role(auth.uid(), 'organization'));

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. LEAVE TYPES TABLE
-- ============================================================
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  default_days integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT 'hsl(var(--primary))',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leave types"
  ON public.leave_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage leave types"
  ON public.leave_types FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Seed default leave types
INSERT INTO public.leave_types (code, name, default_days, color) VALUES
  ('CL', 'Casual Leave', 12, 'hsl(var(--primary))'),
  ('SL', 'Sick Leave', 10, 'hsl(142 76% 36%)'),
  ('EL', 'Earned Leave', 15, 'hsl(38 92% 50%)');

-- ============================================================
-- 3. LEAVE BALANCES TABLE
-- ============================================================
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  total integer NOT NULL DEFAULT 0,
  used numeric NOT NULL DEFAULT 0,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_balances_unique UNIQUE (user_id, leave_type_id, year),
  CONSTRAINT leave_balances_used_check CHECK (used >= 0)
);

CREATE INDEX idx_leave_balances_user ON public.leave_balances(user_id);
CREATE INDEX idx_leave_balances_year ON public.leave_balances(year);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leave balances"
  ON public.leave_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team leave balances"
  ON public.leave_balances FOR SELECT
  USING (is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR and Admins can view all leave balances"
  ON public.leave_balances FOR SELECT
  USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "HR and Admins can manage leave balances"
  ON public.leave_balances FOR ALL
  USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organization can view all leave balances"
  ON public.leave_balances FOR SELECT
  USING (has_role(auth.uid(), 'organization'));

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. LEAVES TABLE (requests)
-- ============================================================
CREATE TABLE public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id),
  from_date date NOT NULL,
  to_date date NOT NULL,
  half_day boolean NOT NULL DEFAULT false,
  days_count numeric NOT NULL,
  reason text NOT NULL,
  attachment_url text,
  status text NOT NULL DEFAULT 'pending',
  approver_id uuid,
  approver_comment text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leaves_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT leaves_dates_check CHECK (to_date >= from_date),
  CONSTRAINT leaves_days_check CHECK (days_count > 0)
);

CREATE INDEX idx_leaves_user ON public.leaves(user_id);
CREATE INDEX idx_leaves_status ON public.leaves(status);
CREATE INDEX idx_leaves_dates ON public.leaves(from_date, to_date);
CREATE INDEX idx_leaves_approver ON public.leaves(approver_id);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leaves"
  ON public.leaves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leaves"
  ON public.leaves FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can cancel own pending leaves"
  ON public.leaves FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Managers can view team leaves"
  ON public.leaves FOR SELECT
  USING (is_manager_of(auth.uid(), user_id));

CREATE POLICY "Managers can approve/reject team leaves"
  ON public.leaves FOR UPDATE
  USING (is_manager_of(auth.uid(), user_id) OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "HR and Admins can view all leaves"
  ON public.leaves FOR SELECT
  USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organization can view all leaves"
  ON public.leaves FOR SELECT
  USING (has_role(auth.uid(), 'organization'));

CREATE TRIGGER update_leaves_updated_at
  BEFORE UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. LEAVE OVERLAP PREVENTION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_leave_overlap(
  _user_id uuid,
  _from_date date,
  _to_date date,
  _exclude_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leaves
    WHERE user_id = _user_id
      AND status IN ('pending', 'approved')
      AND from_date <= _to_date
      AND to_date >= _from_date
      AND (_exclude_id IS NULL OR id != _exclude_id)
  )
$$;

-- ============================================================
-- 6. LEAVE APPROVAL FUNCTION (transactional balance deduction)
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_leave(_leave_id uuid, _approver_comment text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _leave RECORD;
  _balance RECORD;
BEGIN
  SELECT * INTO _leave FROM public.leaves WHERE id = _leave_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found or not pending';
  END IF;

  SELECT * INTO _balance FROM public.leave_balances
    WHERE user_id = _leave.user_id
      AND leave_type_id = _leave.leave_type_id
      AND year = EXTRACT(YEAR FROM _leave.from_date)::integer;

  IF NOT FOUND OR (_balance.total - _balance.used) < _leave.days_count THEN
    RAISE EXCEPTION 'Insufficient leave balance';
  END IF;

  UPDATE public.leaves SET
    status = 'approved',
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id;

  UPDATE public.leave_balances SET
    used = used + _leave.days_count
  WHERE id = _balance.id;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 7. LEAVE REJECTION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.reject_leave(_leave_id uuid, _approver_comment text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leaves SET
    status = 'rejected',
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found or not pending';
  END IF;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- 8. TIMESHEETS TABLE
-- ============================================================
CREATE TABLE public.timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id),
  task_id uuid REFERENCES public.tasks(id),
  date date NOT NULL,
  hours numeric NOT NULL,
  description text NOT NULL,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timesheets_hours_check CHECK (hours > 0 AND hours <= 24)
);

CREATE INDEX idx_timesheets_user ON public.timesheets(user_id);
CREATE INDEX idx_timesheets_date ON public.timesheets(date);
CREATE INDEX idx_timesheets_user_date ON public.timesheets(user_id, date);
CREATE INDEX idx_timesheets_project ON public.timesheets(project_id);

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timesheets"
  ON public.timesheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timesheets"
  ON public.timesheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timesheets"
  ON public.timesheets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timesheets"
  ON public.timesheets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team timesheets"
  ON public.timesheets FOR SELECT
  USING (is_manager_of(auth.uid(), user_id));

CREATE POLICY "HR and Admins can view all timesheets"
  ON public.timesheets FOR SELECT
  USING (has_role(auth.uid(), 'hr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Organization can view all timesheets"
  ON public.timesheets FOR SELECT
  USING (has_role(auth.uid(), 'organization'));

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. AUTO-PROVISION LEAVE BALANCES ON NEW USER
-- ============================================================
CREATE OR REPLACE FUNCTION public.provision_leave_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leave_balances (user_id, leave_type_id, total, year)
  SELECT NEW.user_id, lt.id, lt.default_days, EXTRACT(YEAR FROM now())::integer
  FROM public.leave_types lt
  ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER provision_leave_on_profile_complete
  AFTER UPDATE OF profile_completed ON public.profiles
  FOR EACH ROW
  WHEN (NEW.profile_completed = true AND OLD.profile_completed = false)
  EXECUTE FUNCTION public.provision_leave_balances();
