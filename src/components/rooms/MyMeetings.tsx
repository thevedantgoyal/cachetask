import { useMemo } from "react";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { Clock, MapPin, Users, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { RoomBooking, MeetingRoom } from "@/hooks/useRoomBooking";

interface MyMeetingsProps {
  bookings: RoomBooking[];
  rooms: MeetingRoom[];
  onCancel: (id: string, reason: string) => Promise<void>;
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  ongoing: "bg-success/10 text-success",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
  rescheduled: "bg-amber-100 text-amber-700",
};

export const MyMeetings = ({ bookings, rooms, onCancel }: MyMeetingsProps) => {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms]);

  const upcoming = useMemo(() =>
    bookings
      .filter(b => b.status === "scheduled" && isAfter(parseISO(b.booking_date), new Date(new Date().setHours(0, 0, 0, 0) - 86400000)))
      .slice(0, 20),
    [bookings]
  );

  const past = useMemo(() =>
    bookings
      .filter(b => b.status !== "scheduled" || isBefore(parseISO(b.booking_date), new Date(new Date().setHours(0, 0, 0, 0))))
      .slice(0, 10),
    [bookings]
  );

  const handleCancel = async () => {
    if (!cancelId || !reason.trim()) return;
    await onCancel(cancelId, reason.trim());
    setCancelId(null);
    setReason("");
  };

  const BookingCard = ({ b }: { b: RoomBooking }) => {
    const room = roomMap[b.room_id];
    return (
      <Card className="card-hover">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{b.title}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{format(parseISO(b.booking_date), "MMM d")} · {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}</span>
              </div>
              {room && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{room.name} — {room.location}</span>
                </div>
              )}
              {b.participants && b.participants.length > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3 shrink-0" />
                  <span>{b.participants.length} participant{b.participants.length > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 ml-2">
              <Badge className={`text-[10px] ${statusStyles[b.status] || ""}`}>{b.status}</Badge>
              <Badge variant="outline" className="text-[10px]">{b.priority}</Badge>
            </div>
          </div>
          {b.status === "scheduled" && (
            <div className="mt-2 pt-2 border-t border-border">
              <Dialog open={cancelId === b.id} onOpenChange={o => { if (!o) setCancelId(null); }}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs gap-1" onClick={() => setCancelId(b.id)}>
                    <XCircle className="w-3 h-3" /> Cancel Booking
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Cancel Booking</DialogTitle></DialogHeader>
                  <Textarea placeholder="Reason for cancellation..." value={reason} onChange={e => setReason(e.target.value)} maxLength={500} />
                  <Button variant="destructive" onClick={handleCancel} disabled={!reason.trim()}>Confirm Cancellation</Button>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-display font-semibold mb-2">Upcoming Meetings</h2>
        {upcoming.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No upcoming meetings.</CardContent></Card>
        ) : (
          <div className="space-y-2">{upcoming.map(b => <BookingCard key={b.id} b={b} />)}</div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-base font-display font-semibold mb-2">Recent History</h2>
          <div className="space-y-2">{past.map(b => <BookingCard key={b.id} b={b} />)}</div>
        </div>
      )}
    </div>
  );
};
