
-- Update approve_leave to enforce hierarchy validation
CREATE OR REPLACE FUNCTION public.approve_leave(_leave_id uuid, _approver_comment text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _leave RECORD;
  _balance RECORD;
  _approver_name TEXT;
  _leave_type_name TEXT;
  _employee_manager_id UUID;
  _caller_profile_id UUID;
  _is_admin BOOLEAN;
BEGIN
  -- Get leave request (must be pending)
  SELECT * INTO _leave FROM public.leaves WHERE id = _leave_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found or not pending';
  END IF;

  _caller_profile_id := public.get_user_profile_id(auth.uid());
  _is_admin := public.has_role(auth.uid(), 'admin');

  -- Get employee's manager_id for hierarchy check
  SELECT manager_id INTO _employee_manager_id FROM public.profiles WHERE user_id = _leave.user_id;

  -- Hierarchy validation
  IF _employee_manager_id IS NOT NULL THEN
    -- Employee has a reporting manager - only that manager can approve
    IF _caller_profile_id != _employee_manager_id THEN
      RAISE EXCEPTION 'Only the reporting manager can approve this leave request';
    END IF;
  ELSE
    -- Employee has no reporting manager - only admin can approve
    IF NOT _is_admin THEN
      RAISE EXCEPTION 'Only admin can approve leave for employees without a reporting manager';
    END IF;
  END IF;

  -- Check balance
  SELECT * INTO _balance FROM public.leave_balances
    WHERE user_id = _leave.user_id
      AND leave_type_id = _leave.leave_type_id
      AND year = EXTRACT(YEAR FROM _leave.from_date)::integer;

  IF NOT FOUND OR (_balance.total - _balance.used) < _leave.days_count THEN
    RAISE EXCEPTION 'Insufficient leave balance';
  END IF;

  -- Update leave status
  UPDATE public.leaves SET
    status = 'approved',
    approver_id = _caller_profile_id,
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id;

  -- Deduct balance (transaction-safe within this function)
  UPDATE public.leave_balances SET
    used = used + _leave.days_count
  WHERE id = _balance.id;

  -- Send notification to employee
  SELECT full_name INTO _approver_name FROM public.profiles WHERE user_id = auth.uid();
  SELECT name INTO _leave_type_name FROM public.leave_types WHERE id = _leave.leave_type_id;

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
$function$;

-- Update reject_leave to enforce hierarchy validation and mandatory rejection reason
CREATE OR REPLACE FUNCTION public.reject_leave(_leave_id uuid, _approver_comment text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _leave RECORD;
  _approver_name TEXT;
  _leave_type_name TEXT;
  _employee_manager_id UUID;
  _caller_profile_id UUID;
  _is_admin BOOLEAN;
BEGIN
  -- Get leave request (must be pending)
  SELECT * INTO _leave FROM public.leaves WHERE id = _leave_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found or not pending';
  END IF;

  -- Rejection reason is mandatory
  IF _approver_comment IS NULL OR trim(_approver_comment) = '' THEN
    RAISE EXCEPTION 'Rejection reason is mandatory';
  END IF;

  _caller_profile_id := public.get_user_profile_id(auth.uid());
  _is_admin := public.has_role(auth.uid(), 'admin');

  -- Get employee's manager_id for hierarchy check
  SELECT manager_id INTO _employee_manager_id FROM public.profiles WHERE user_id = _leave.user_id;

  -- Hierarchy validation
  IF _employee_manager_id IS NOT NULL THEN
    -- Employee has a reporting manager - only that manager can reject
    IF _caller_profile_id != _employee_manager_id THEN
      RAISE EXCEPTION 'Only the reporting manager can reject this leave request';
    END IF;
  ELSE
    -- Employee has no reporting manager - only admin can reject
    IF NOT _is_admin THEN
      RAISE EXCEPTION 'Only admin can reject leave for employees without a reporting manager';
    END IF;
  END IF;

  -- Update leave status (do NOT deduct balance)
  UPDATE public.leaves SET
    status = 'rejected',
    approver_id = _caller_profile_id,
    approver_comment = _approver_comment,
    approved_at = now()
  WHERE id = _leave_id;

  -- Send notification to employee
  SELECT full_name INTO _approver_name FROM public.profiles WHERE user_id = auth.uid();
  SELECT name INTO _leave_type_name FROM public.leave_types WHERE id = _leave.leave_type_id;

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
$function$;
