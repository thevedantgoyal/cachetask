import { motion } from "framer-motion";
import { 
  CheckCircle, 
  XCircle, 
  Camera, 
  MapPin, 
  Clock, 
  Calendar,
  FileText 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceRecord } from "@/hooks/useAttendance";
import { format, parseISO } from "date-fns";

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export const AttendanceHistory = ({ records }: AttendanceHistoryProps) => {
  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Absent
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Attendance History</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your past attendance records
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attendance records yet</p>
            </div>
          ) : (
            records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted/30 rounded-xl p-4 border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {format(parseISO(record.date), "dd")}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(parseISO(record.date), "MMM")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {format(parseISO(record.date), "EEEE")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(record.date), "yyyy")}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>

                {record.status === "present" && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-medium">{record.checkInTime}</span>
                    </div>
                    {record.distance !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Distance:</span>
                        <span className="font-medium">{record.distance}m</span>
                      </div>
                    )}
                  </div>
                )}

                {record.status === "present" && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded ${record.faceVerified ? "bg-emerald-500/20" : "bg-muted"}`}>
                        <Camera className={`w-3.5 h-3.5 ${record.faceVerified ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Face {record.faceVerified ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`p-1 rounded ${record.locationVerified ? "bg-emerald-500/20" : "bg-muted"}`}>
                        <MapPin className={`w-3.5 h-3.5 ${record.locationVerified ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Location {record.locationVerified ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {record.verificationMethod}
                    </div>
                  </div>
                )}

                {record.status === "absent" && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      No attendance recorded for this day
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
