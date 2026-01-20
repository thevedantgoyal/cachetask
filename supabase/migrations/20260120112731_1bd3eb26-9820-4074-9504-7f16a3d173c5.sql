-- Create a function to promote a user to admin (can only be called once when no admins exist)
CREATE OR REPLACE FUNCTION public.setup_first_admin(_user_id UUID, _setup_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any admins exist
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If admins exist, require setup code (you can set this in secrets)
  IF admin_count > 0 THEN
    -- Check setup code from environment or hardcoded initial setup
    IF _setup_code != 'FIRST_ADMIN_SETUP_2024' THEN
      RAISE EXCEPTION 'Invalid setup code or admins already exist';
    END IF;
  END IF;
  
  -- Remove existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Add admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin');
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.setup_first_admin(UUID, TEXT) TO authenticated;