import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Plus, Clock, Shield, Settings2 } from "lucide-react";
import { useRoomBooking } from "@/hooks/useRoomBooking";
import { useUserRoles } from "@/hooks/useUserRoles";
import { RoomAvailability } from "@/components/rooms/RoomAvailability";
import { BookRoomForm } from "@/components/rooms/BookRoomForm";
import { MyMeetings } from "@/components/rooms/MyMeetings";
import { BookingAuditTrail } from "@/components/rooms/BookingAuditTrail";
import { RoomManagement } from "@/components/rooms/RoomManagement";
import { Skeleton } from "@/components/ui/skeleton";

const RoomBookingPage = () => {
  const {
    rooms, bookings, myBookings, loading,
    fetchBookings, fetchAuditLog,
    createRoom, createBooking, cancelBooking, updateRoom,
  } = useRoomBooking();
  const { isAdmin, isManager } = useUserRoles();
  const canManageRooms = isAdmin || isManager;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="availability" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="availability" className="text-xs gap-1">
            <CalendarCheck className="w-3.5 h-3.5 hidden sm:block" /> Rooms
          </TabsTrigger>
          <TabsTrigger value="book" className="text-xs gap-1">
            <Plus className="w-3.5 h-3.5 hidden sm:block" /> Book
          </TabsTrigger>
          <TabsTrigger value="my" className="text-xs gap-1">
            <Clock className="w-3.5 h-3.5 hidden sm:block" /> My
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1">
            <Shield className="w-3.5 h-3.5 hidden sm:block" /> Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="mt-3 space-y-4">
          <RoomAvailability rooms={rooms} bookings={bookings} onDateChange={(d) => fetchBookings(d)} />
          {canManageRooms && (
            <RoomManagement rooms={rooms} onCreateRoom={createRoom} onUpdateRoom={updateRoom} />
          )}
        </TabsContent>

        <TabsContent value="book" className="mt-3">
          <BookRoomForm rooms={rooms} onBook={createBooking} />
        </TabsContent>

        <TabsContent value="my" className="mt-3">
          <MyMeetings bookings={myBookings} rooms={rooms} onCancel={cancelBooking} />
        </TabsContent>

        <TabsContent value="audit" className="mt-3">
          <BookingAuditTrail bookings={bookings} rooms={rooms} fetchAuditLog={fetchAuditLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomBookingPage;
