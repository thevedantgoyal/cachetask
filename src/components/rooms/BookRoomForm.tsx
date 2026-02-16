import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { MeetingRoom } from "@/hooks/useRoomBooking";

interface BookRoomFormProps {
  rooms: MeetingRoom[];
  onBook: (booking: {
    room_id: string; title: string; purpose?: string; meeting_type: string;
    priority: string; booking_date: string; start_time: string; end_time: string;
    participants?: string[];
  }) => Promise<any>;
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  if (h > 19) return null;
  return `${String(h).padStart(2, "0")}:${m}`;
}).filter(Boolean) as string[];

export const BookRoomForm = ({ rooms, onBook }: BookRoomFormProps) => {
  const [form, setForm] = useState({
    room_id: "", title: "", purpose: "", meeting_type: "internal",
    priority: "normal", start_time: "", end_time: "", participants: "",
  });
  const [date, setDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const activeRooms = rooms.filter(r => r.status === "active");

  const validate = () => {
    const w: string[] = [];
    if (!form.room_id || !form.title.trim() || !date || !form.start_time || !form.end_time) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) w.push("Cannot book past time slots.");

    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) w.push("End time must be after start time.");
    if (startMin < 8 * 60 || endMin > 20 * 60) w.push("Bookings outside office hours (8:00–20:00) are not permitted.");
    if (endMin - startMin > 240) w.push("Warning: Booking exceeds 4 hours. Please confirm this is required.");

    setWarnings(w);
    return w.filter(x => !x.startsWith("Warning")).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !date) return;
    setSubmitting(true);
    const participants = form.participants.split(",").map(s => s.trim()).filter(Boolean);
    await onBook({
      room_id: form.room_id,
      title: form.title.trim(),
      purpose: form.purpose.trim() || undefined,
      meeting_type: form.meeting_type,
      priority: form.priority,
      booking_date: format(date, "yyyy-MM-dd"),
      start_time: form.start_time + ":00",
      end_time: form.end_time + ":00",
      participants: participants.length > 0 ? participants : undefined,
    });
    setSubmitting(false);
    setForm({ room_id: "", title: "", purpose: "", meeting_type: "internal", priority: "normal", start_time: "", end_time: "", participants: "" });
    setDate(undefined);
    setWarnings([]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display">Book a Meeting Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Room *</Label>
          <Select value={form.room_id} onValueChange={v => setForm(f => ({ ...f, room_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
            <SelectContent>
              {activeRooms.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name} — {r.location} (Cap: {r.capacity})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div><Label>Meeting Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Weekly Standup" maxLength={100} /></div>
        <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Describe the meeting purpose..." rows={2} maxLength={500} /></div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Meeting Type</Label>
            <Select value={form.meeting_type} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Time *</Label>
            <Select value={form.start_time} onValueChange={v => setForm(f => ({ ...f, start_time: v }))}>
              <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
              <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>End Time *</Label>
            <Select value={form.end_time} onValueChange={v => setForm(f => ({ ...f, end_time: v }))}>
              <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
              <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div><Label>Participants (comma-separated emails)</Label><Input value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="john@company.com, jane@company.com" /></div>

        {warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {warnings.map((w, i) => <p key={i} className="text-xs">{w}</p>)}
            </AlertDescription>
          </Alert>
        )}

        <p className="text-[10px] text-muted-foreground italic">All meeting bookings are recorded for organizational transparency.</p>

        <Button onClick={handleSubmit} className="w-full" disabled={submitting || !form.room_id || !form.title.trim() || !date || !form.start_time || !form.end_time}>
          {submitting ? "Booking..." : "Confirm Booking"}
        </Button>
      </CardContent>
    </Card>
  );
};
