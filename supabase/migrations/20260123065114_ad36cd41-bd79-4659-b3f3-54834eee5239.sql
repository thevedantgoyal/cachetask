-- Fix the permissive INSERT policy - only allow authenticated users or admin to insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Allow admins/managers to create notifications for users
CREATE POLICY "Admins and managers can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager', 'team_lead', 'hr')
  )
  OR auth.uid() = user_id
);