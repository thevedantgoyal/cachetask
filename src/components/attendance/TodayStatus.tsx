import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  Camera, 
  MapPin, 
  AlertCircle,
  Fingerprint 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceRecord } from "@/hooks/useAttendance";
import { format } from "date-fns";

interface TodayStatusProps {
  record: AttendanceRecord | null;
  onMarkAttendance: () => void;
}

export const TodayStatus = ({ record, onMarkAttendance }: TodayStatusProps) => {
  const today = format(new Date(), "EEEE, MMMM dd, yyyy");

  if (record && record.status === "present") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-full">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    Attendance Marked
                  </h3>
                  <p className="text-sm text-muted-foreground">{today}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500 hover:bg-emerald-600">Present</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-background/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Check-in Time</span>
                </div>
                <p className="text-lg font-semibold">{record.checkInTime}</p>
              </div>
              <div className="bg-background/60 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Distance</span>
                </div>
                <p className="text-lg font-semibold">{record.distance}m from office</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded">
                  <Camera className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Face Verified
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Location Verified
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Fingerprint className="w-3 h-3" />
                {record.verificationMethod}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-full">
                <AlertCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">
                  Attendance Not Marked
                </h3>
                <p className="text-sm text-muted-foreground">{today}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">
              Pending
            </Badge>
          </div>

          <p className="text-muted-foreground mt-4 mb-6">
            You haven't marked your attendance for today. Mark now to record your presence.
          </p>

          <Button 
            onClick={onMarkAttendance} 
            className="w-full h-12"
            size="lg"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            Mark Attendance
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
