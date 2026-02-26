
CREATE OR REPLACE FUNCTION public.notify_leave_applied()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _employee_name TEXT;
  _manager_profile RECORD;
  _leave_type_name TEXT;
BEGIN
  -- Only on new leave insert with pending status
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Get employee name
    SELECT full_name INTO _employee_name FROM public.profiles WHERE user_id = NEW.user_id;

    -- Get manager's user_id via manager_id on the employee's profile
    SELECT p2.user_id, p2.id AS profile_id
    INTO _manager_profile
    FROM public.profiles emp
    JOIN public.profiles p2 ON p2.id = emp.manager_id
    WHERE emp.user_id = NEW.user_id;

    -- Get leave type name
    SELECT name INTO _leave_type_name FROM public.leave_types WHERE id = NEW.leave_type_id;

    -- Create notification for manager
    IF _manager_profile.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        _manager_profile.user_id,
        'leave_request',
        'Leave Request from ' || COALESCE(_employee_name, 'Employee'),
        COALESCE(_employee_name, 'An employee') || ' has requested ' || COALESCE(_leave_type_name, 'leave') ||
          ' from ' || NEW.from_date::text || ' to ' || NEW.to_date::text ||
          ' (' || NEW.days_count || ' day(s))',
        jsonb_build_object(
          'leave_id', NEW.id,
          'employee_user_id', NEW.user_id,
          'leave_type', _leave_type_name,
          'from_date', NEW.from_date,
          'to_date', NEW.to_date,
          'days_count', NEW.days_count
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_leave_applied
AFTER INSERT ON public.leaves
FOR EACH ROW
EXECUTE FUNCTION public.notify_leave_applied();
