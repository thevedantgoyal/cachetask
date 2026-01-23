-- Create scheduled notifications table for admin broadcasts
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'role', 'user')),
  target_value TEXT, -- role name or user_id, null if target_type is 'all'
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled')),
  send_push BOOLEAN NOT NULL DEFAULT true,
  send_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view scheduled notifications
CREATE POLICY "Admins can view all scheduled notifications"
ON public.scheduled_notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create scheduled notifications
CREATE POLICY "Admins can create scheduled notifications"
ON public.scheduled_notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update scheduled notifications
CREATE POLICY "Admins can update scheduled notifications"
ON public.scheduled_notifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete scheduled notifications
CREATE POLICY "Admins can delete scheduled notifications"
ON public.scheduled_notifications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));