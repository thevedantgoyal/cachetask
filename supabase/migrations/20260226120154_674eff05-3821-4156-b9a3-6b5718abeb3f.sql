
-- Update approve_leave to notify the employee
CREATE OR REPLACE FUNCTION public.approve_leave(_leave_id uuid, _approver_comment text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _leave RECORD;
  _balance RECORD;
  _approver_name TEXT;
  _leave_type_name TEXT;
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

  -- Set approver_id from current auth user's profile
  UPDATE public.leaves SET
    status = 'approved',
    approver_id = get_user_profile_id(auth.uid()),
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id;

  UPDATE public.leave_balances SET
    used = used + _leave.days_count
  WHERE id = _balance.id;

  -- Get approver name
  SELECT full_name INTO _approver_name FROM public.profiles WHERE user_id = auth.uid();
  -- Get leave type name
  SELECT name INTO _leave_type_name FROM public.leave_types WHERE id = _leave.leave_type_id;

  -- Notify the employee
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _leave.user_id,
    'leave_request',
    'Leave Approved',
    'Your ' || COALESCE(_leave_type_name, 'leave') || ' request from ' || _leave.from_date::text || ' to ' || _leave.to_date::text || ' has been approved by ' || COALESCE(_approver_name, 'your manager'),
    jsonb_build_object(
      'leave_id', _leave_id,
      'status', 'approved',
      'approver_name', _approver_name,
      'leave_type', _leave_type_name,
      'from_date', _leave.from_date,
      'to_date', _leave.to_date
    )
  );

  RETURN TRUE;
END;
$$;

-- Update reject_leave to notify the employee
CREATE OR REPLACE FUNCTION public.reject_leave(_leave_id uuid, _approver_comment text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _leave RECORD;
  _approver_name TEXT;
  _leave_type_name TEXT;
BEGIN
  SELECT * INTO _leave FROM public.leaves WHERE id = _leave_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found or not pending';
  END IF;

  UPDATE public.leaves SET
    status = 'rejected',
    approver_id = get_user_profile_id(auth.uid()),
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id;

  -- Get approver name
  SELECT full_name INTO _approver_name FROM public.profiles WHERE user_id = auth.uid();
  -- Get leave type name
  SELECT name INTO _leave_type_name FROM public.leave_types WHERE id = _leave.leave_type_id;

  -- Notify the employee
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (
    _leave.user_id,
    'leave_request',
    'Leave Rejected',
    'Your ' || COALESCE(_leave_type_name, 'leave') || ' request from ' || _leave.from_date::text || ' to ' || _leave.to_date::text || ' has been rejected by ' || COALESCE(_approver_name, 'your manager') ||
      CASE WHEN _approver_comment IS NOT NULL AND _approver_comment != '' THEN '. Reason: ' || _approver_comment ELSE '' END,
    jsonb_build_object(
      'leave_id', _leave_id,
      'status', 'rejected',
      'approver_name', _approver_name,
      'leave_type', _leave_type_name,
      'from_date', _leave.from_date,
      'to_date', _leave.to_date,
      'comment', _approver_comment
    )
  );

  RETURN TRUE;
END;
$$;
