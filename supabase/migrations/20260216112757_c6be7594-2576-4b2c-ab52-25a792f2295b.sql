
-- Meeting Rooms Master Table
CREATE TABLE public.meeting_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  floor TEXT,
  capacity INTEGER NOT NULL DEFAULT 10,
  has_projector BOOLEAN NOT NULL DEFAULT false,
  has_video_conferencing BOOLEAN NOT NULL DEFAULT false,
  has_whiteboard BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active rooms"
  ON public.meeting_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage rooms"
  ON public.meeting_rooms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Room Bookings Table
CREATE TABLE public.room_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.meeting_rooms(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT,
  project_id UUID REFERENCES public.projects(id),
  meeting_type TEXT NOT NULL DEFAULT 'internal' CHECK (meeting_type IN ('internal', 'client', 'leadership')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'leadership')),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participants TEXT[],
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled')),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all bookings"
  ON public.room_bookings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create bookings"
  ON public.room_bookings FOR INSERT
  WITH CHECK (auth.uid() = booked_by);

CREATE POLICY "Users can update their own bookings"
  ON public.room_bookings FOR UPDATE
  USING (auth.uid() = booked_by);

CREATE POLICY "Admins can manage all bookings"
  ON public.room_bookings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Booking Audit Log
CREATE TABLE public.booking_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.room_bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs for their bookings"
  ON public.booking_audit_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert audit logs"
  ON public.booking_audit_log FOR INSERT
  WITH CHECK (auth.uid() = performed_by);

-- Trigger for updated_at on meeting_rooms
CREATE TRIGGER update_meeting_rooms_updated_at
  BEFORE UPDATE ON public.meeting_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on room_bookings
CREATE TRIGGER update_room_bookings_updated_at
  BEFORE UPDATE ON public.room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast conflict detection
CREATE INDEX idx_room_bookings_conflict ON public.room_bookings (room_id, booking_date, start_time, end_time) WHERE status NOT IN ('cancelled');

-- Unique constraint helper function for conflict detection
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  _room_id UUID,
  _booking_date DATE,
  _start_time TIME,
  _end_time TIME,
  _exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, title TEXT, priority TEXT, booked_by UUID, start_time TIME, end_time TIME)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT rb.id, rb.title, rb.priority, rb.booked_by, rb.start_time, rb.end_time
  FROM public.room_bookings rb
  WHERE rb.room_id = _room_id
    AND rb.booking_date = _booking_date
    AND rb.status NOT IN ('cancelled')
    AND rb.start_time < _end_time
    AND rb.end_time > _start_time
    AND (_exclude_id IS NULL OR rb.id != _exclude_id);
END;
$$;
