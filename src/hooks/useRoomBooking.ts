import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MeetingRoom {
  id: string;
  name: string;
  location: string;
  floor: string | null;
  capacity: number;
  has_projector: boolean;
  has_video_conferencing: boolean;
  has_whiteboard: boolean;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RoomBooking {
  id: string;
  room_id: string;
  booked_by: string;
  title: string;
  purpose: string | null;
  project_id: string | null;
  meeting_type: string;
  priority: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  participants: string[] | null;
  status: string;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  room?: MeetingRoom;
}

export interface AuditLogEntry {
  id: string;
  booking_id: string;
  action: string;
  performed_by: string;
  details: Record<string, any> | null;
  created_at: string;
}

export const useRoomBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [myBookings, setMyBookings] = useState<RoomBooking[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from("meeting_rooms" as any)
      .select("*")
      .order("name");
    if (!error && data) setRooms(data as unknown as MeetingRoom[]);
  }, []);

  const fetchBookings = useCallback(async (date?: string) => {
    let query = supabase
      .from("room_bookings" as any)
      .select("*")
      .neq("status", "cancelled")
      .order("booking_date")
      .order("start_time");
    if (date) query = query.eq("booking_date", date);
    const { data, error } = await query;
    if (!error && data) setBookings(data as unknown as RoomBooking[]);
  }, []);

  const fetchMyBookings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("room_bookings" as any)
      .select("*")
      .eq("booked_by", user.id)
      .order("booking_date", { ascending: false })
      .order("start_time");
    if (!error && data) setMyBookings(data as unknown as RoomBooking[]);
  }, [user]);

  const fetchAuditLog = useCallback(async (bookingId: string) => {
    const { data, error } = await supabase
      .from("booking_audit_log" as any)
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });
    if (!error && data) setAuditLog(data as unknown as AuditLogEntry[]);
    return data as unknown as AuditLogEntry[] | null;
  }, []);

  const checkConflict = useCallback(async (
    roomId: string, bookingDate: string, startTime: string, endTime: string, excludeId?: string
  ) => {
    const { data, error } = await supabase.rpc("check_booking_conflict" as any, {
      _room_id: roomId,
      _booking_date: bookingDate,
      _start_time: startTime,
      _end_time: endTime,
      _exclude_id: excludeId || null,
    });
    if (error) return [];
    return (data as any[]) || [];
  }, []);

  const createRoom = useCallback(async (room: Omit<MeetingRoom, "id" | "created_at" | "updated_at" | "created_by">) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("meeting_rooms" as any)
      .insert({ ...room, created_by: user.id } as any)
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "Room Created", description: `${room.name} has been added.` });
    await fetchRooms();
    return data;
  }, [user, toast, fetchRooms]);

  const createBooking = useCallback(async (booking: {
    room_id: string; title: string; purpose?: string; project_id?: string;
    meeting_type: string; priority: string; booking_date: string;
    start_time: string; end_time: string; participants?: string[];
  }) => {
    if (!user) return null;
    const conflicts = await checkConflict(booking.room_id, booking.booking_date, booking.start_time, booking.end_time);
    if (conflicts.length > 0) {
      const conflictPriorities = conflicts.map((c: any) => c.priority);
      const priorityOrder = { normal: 0, high: 1, leadership: 2 };
      const bookingPriority = (priorityOrder as any)[booking.priority] || 0;
      const maxConflictPriority = Math.max(...conflictPriorities.map((p: string) => (priorityOrder as any)[p] || 0));
      if (bookingPriority <= maxConflictPriority) {
        toast({
          title: "Slot Unavailable",
          description: "This slot is already reserved. Higher-priority meetings require management override.",
          variant: "destructive",
        });
        return null;
      }
    }

    const { data, error } = await supabase
      .from("room_bookings" as any)
      .insert({ ...booking, booked_by: user.id } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Log audit
    await supabase.from("booking_audit_log" as any).insert({
      booking_id: (data as any).id,
      action: "created",
      performed_by: user.id,
      details: { title: booking.title, priority: booking.priority },
    } as any);

    toast({ title: "Booking Confirmed", description: `"${booking.title}" has been scheduled.` });
    await Promise.all([fetchBookings(), fetchMyBookings()]);
    return data;
  }, [user, toast, checkConflict, fetchBookings, fetchMyBookings]);

  const cancelBooking = useCallback(async (bookingId: string, reason: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("room_bookings" as any)
      .update({ status: "cancelled", cancellation_reason: reason } as any)
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase.from("booking_audit_log" as any).insert({
      booking_id: bookingId,
      action: "cancelled",
      performed_by: user.id,
      details: { reason },
    } as any);

    toast({ title: "Booking Cancelled" });
    await Promise.all([fetchBookings(), fetchMyBookings()]);
  }, [user, toast, fetchBookings, fetchMyBookings]);

  const updateRoom = useCallback(async (id: string, updates: Partial<MeetingRoom>) => {
    const { error } = await supabase
      .from("meeting_rooms" as any)
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Room Updated" });
    await fetchRooms();
  }, [toast, fetchRooms]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchBookings(), fetchMyBookings()]);
      setLoading(false);
    };
    init();
  }, [fetchRooms, fetchBookings, fetchMyBookings]);

  return {
    rooms, bookings, myBookings, auditLog, loading,
    fetchRooms, fetchBookings, fetchMyBookings, fetchAuditLog,
    checkConflict, createRoom, createBooking, cancelBooking, updateRoom,
  };
};
