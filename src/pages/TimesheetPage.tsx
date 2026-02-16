import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimesheetManagement } from "@/hooks/useTimesheetManagement";
import { TimesheetDashboard } from "@/components/timesheet/TimesheetDashboard";
import { LogTimeForm } from "@/components/timesheet/LogTimeForm";
import { WeeklyView } from "@/components/timesheet/WeeklyView";

const TimesheetPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLogging, setIsLogging] = useState(false);
  const ts = useTimesheetManagement();

  return (
    <AnimatePresence mode="wait">
      {isLogging ? (
        <motion.div key="log" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
  );
};

export default TimesheetPage;
