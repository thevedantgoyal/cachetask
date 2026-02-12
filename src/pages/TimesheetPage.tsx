import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimesheetManagement } from "@/hooks/useTimesheetManagement";
import { TimesheetDashboard } from "@/components/timesheet/TimesheetDashboard";
import { LogTimeForm } from "@/components/timesheet/LogTimeForm";
import { WeeklyView } from "@/components/timesheet/WeeklyView";

const TimesheetPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLogging, setIsLogging] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const ts = useTimesheetManagement();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-2">
        <PageHeader
          title="Timesheet"
          showNotifications
          onNotificationClick={() => setIsNotificationsOpen(true)}
        />

        <AnimatePresence mode="wait">
          {isLogging ? (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <LogTimeForm
                projects={ts.projects}
                validate={ts.validateEntry}
                onSubmit={(date, projectId, taskId, hours, desc, attachment) => {
                  ts.addEntry(date, projectId, taskId, hours, desc, attachment);
                  setIsLogging(false);
                }}
                onCancel={() => setIsLogging(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-6">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="dashboard">Overview</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                  <TimesheetDashboard
                    totalHours={ts.totalWeeklyHours}
                    targetHours={ts.targetHours}
                    weekStatus={ts.weekStatus}
                    onLogTime={() => setIsLogging(true)}
                    onSubmitWeek={ts.submitWeeklyTimesheet}
                  />
                </TabsContent>

                <TabsContent value="weekly">
                  <WeeklyView
                    weekDays={ts.weekDays}
                    getEntriesForDate={ts.getEntriesForDate}
                    getDailyHours={ts.getDailyHours}
                    totalWeeklyHours={ts.totalWeeklyHours}
                    targetHours={ts.targetHours}
                    weekStatus={ts.weekStatus}
                    onDeleteEntry={ts.deleteEntry}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        <RoleBasedNav />
      </div>

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default TimesheetPage;
