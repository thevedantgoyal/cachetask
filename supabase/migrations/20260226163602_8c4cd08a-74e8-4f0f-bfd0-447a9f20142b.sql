
-- 1. Make evidence bucket private
UPDATE storage.buckets SET public = false WHERE id = 'evidence';

-- 2. Fix setup_first_admin to block privilege escalation when admins already exist
CREATE OR REPLACE FUNCTION public.setup_first_admin(_user_id uuid, _setup_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admins exist
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If admins already exist, block entirely - no setup code can bypass this
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin setup is no longer available. An admin already exists.';
  END IF;
  
  -- Only allow first admin creation (no code needed since no admins exist yet)
  -- Remove existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin');
  
  RETURN TRUE;
END;
$function$;
