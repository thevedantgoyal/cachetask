
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('task_assigned', 'contribution_approved', 'contribution_rejected', 'role_changed', 'team_assigned', 'general', 'leave_request'));
