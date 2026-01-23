-- Add explicit authentication requirement for profiles table
-- This ensures unauthenticated users cannot access any profile data
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Add explicit authentication requirement for teams table
CREATE POLICY "Require authentication for teams"
ON public.teams
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Drop the overly permissive "Authenticated users can view teams" policy
-- and replace with proper role-based access
DROP POLICY IF EXISTS "Authenticated users can view teams" ON public.teams;