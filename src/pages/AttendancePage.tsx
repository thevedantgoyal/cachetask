import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttendance } from "@/hooks/useAttendance";
import { AttendanceDisclaimer } from "@/components/attendance/AttendanceDisclaimer";
import { FaceVerification } from "@/components/attendance/FaceVerification";
import { LocationVerification } from "@/components/attendance/LocationVerification";
import { AttendanceConfirmation } from "@/components/attendance/AttendanceConfirmation";
import { CheckOutConfirmation } from "@/components/attendance/CheckOutConfirmation";
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory";
import { TodayStatus } from "@/components/attendance/TodayStatus";

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState("today");
  const {
    currentStep,
    activeFlowType,
    faceStatus,
    locationStatus,
    locationData,
    todayMarked,
    todayCheckedOut,
    attendanceHistory,
    errorMessage,
    officeRadius,
    formattedWorkingDuration,
    startAttendanceFlow,
    startCheckOutFlow,
    simulateFaceVerification,
    retryFaceVerification,
    verifyLocation,
    confirmAttendance,
    confirmCheckOut,
    resetFlow,
    getTodayAttendance,
  } = useAttendance();

  const todayRecord = getTodayAttendance();
  const showVerificationFlow = currentStep !== "disclaimer" && !todayMarked && activeFlowType === "checkin";
  const showCheckOutFlow = currentStep !== "disclaimer" && activeFlowType === "checkout" && !todayCheckedOut;

  const handleConfirmAttendance = () => {
    confirmAttendance();
    resetFlow();
  };

  const handleConfirmCheckOut = () => {
    confirmCheckOut();
    resetFlow();
  };

  const isInVerificationFlow = showVerificationFlow || showCheckOutFlow;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto page-container">
        {/* Header */}
        <header className="flex items-center gap-4 py-2">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Attendance</h2>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          {!isInVerificationFlow ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-6">
                <TodayStatus
                  record={todayRecord}
                  onMarkAttendance={startAttendanceFlow}
                  onMarkCheckOut={startCheckOutFlow}
                  workingDuration={formattedWorkingDuration()}
                  isCheckedOut={todayCheckedOut}
                />

                {currentStep === "disclaimer" && !todayMarked && !todayRecord && (
                  <AttendanceDisclaimer
                    onProceed={startAttendanceFlow}
                    disabled={!!todayRecord}
                  />
                )}
              </TabsContent>

              <TabsContent value="history">
                <AttendanceHistory records={attendanceHistory} />
              </TabsContent>
            </Tabs>
          ) : (
            <AnimatePresence mode="wait">
              {currentStep === "face" && (
                <FaceVerification
                  key="face"
                  status={faceStatus}
                  errorMessage={errorMessage}
                  onVerify={simulateFaceVerification}
                  onRetry={retryFaceVerification}
                />
              )}

              {currentStep === "location" && (
                <LocationVerification
                  key="location"
                  status={locationStatus}
                  locationData={locationData}
                  officeRadius={officeRadius}
                  errorMessage={errorMessage}
                  onVerify={verifyLocation}
                />
              )}

              {currentStep === "confirmation" && activeFlowType === "checkin" && (
                <AttendanceConfirmation
                  key="confirmation"
                  locationData={locationData}
                  onConfirm={handleConfirmAttendance}
                />
              )}

              {currentStep === "confirmation" && activeFlowType === "checkout" && (
                <CheckOutConfirmation
                  key="checkout-confirmation"
                  locationData={locationData}
                  todayRecord={todayRecord}
                  onConfirm={handleConfirmCheckOut}
                />
              )}
            </AnimatePresence>
          )}
        </motion.div>

        <RoleBasedNav />
      </div>
    </div>
  );
};

export default AttendancePage;
