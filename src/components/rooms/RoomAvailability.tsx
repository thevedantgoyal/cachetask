import { useState, useMemo } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MeetingRoom, RoomBooking } from "@/hooks/useRoomBooking";

interface RoomAvailabilityProps {
  rooms: MeetingRoom[];
  bookings: RoomBooking[];
  onDateChange: (date: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

export const RoomAvailability = ({ rooms, bookings, onDateChange }: RoomAvailabilityProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const activeRooms = rooms.filter(r => r.status === "active");

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const dayBookings = useMemo(() => {
    return bookings.filter(b => b.booking_date === dateStr && b.status !== "cancelled");
  }, [bookings, dateStr]);

  const navigate = (dir: number) => {
    const next = addDays(selectedDate, dir);
    setSelectedDate(next);
    onDateChange(format(next, "yyyy-MM-dd"));
  };

  const getSlotStatus = (roomId: string, hour: number) => {
    const timeStr = `${String(hour).padStart(2, "0")}:00:00`;
    const nextStr = `${String(hour + 1).padStart(2, "0")}:00:00`;
    return dayBookings.find(b =>
      b.room_id === roomId && b.start_time < nextStr && b.end_time > timeStr
    );
  };

  const filteredRooms = selectedRoom === "all" ? activeRooms : activeRooms.filter(r => r.id === selectedRoom);

  const priorityColor: Record<string, string> = {
    normal: "bg-primary/70",
    high: "bg-amber-500",
    leadership: "bg-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display">Room Availability</CardTitle>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All rooms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {activeRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{format(selectedDate, "EEEE, MMM d, yyyy")}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Time header */}
          <div className="flex border-b border-border pb-1 mb-2">
            <div className="w-24 shrink-0 text-[10px] text-muted-foreground font-medium">Room</div>
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-[10px] text-muted-foreground text-center">{h}:00</div>
            ))}
          </div>

          {filteredRooms.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No rooms available.</p>
          ) : (
            filteredRooms.map(room => (
              <div key={room.id} className="flex items-center mb-1.5">
                <div className="w-24 shrink-0 text-xs font-medium truncate pr-2">{room.name}</div>
                <div className="flex-1 flex gap-px">
                  {HOURS.map(h => {
                    const booking = getSlotStatus(room.id, h);
                    return (
                      <div
                        key={h}
                        className={`flex-1 h-7 rounded-sm transition-colors ${
                          booking ? `${priorityColor[booking.priority] || "bg-primary/70"} cursor-pointer` : "bg-muted/50 hover:bg-muted"
                        }`}
                        title={booking ? `${booking.title} (${booking.priority})` : `Available ${h}:00-${h + 1}:00`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Legend:</span>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-muted/50" /><span className="text-[10px]">Available</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-primary/70" /><span className="text-[10px]">Normal</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-500" /><span className="text-[10px]">High</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-destructive" /><span className="text-[10px]">Leadership</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
