import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaveManagement } from "@/hooks/useLeaveManagement";
import { LeaveBalanceCards } from "@/components/leave/LeaveBalanceCards";
import { ApplyLeaveForm } from "@/components/leave/ApplyLeaveForm";
import { LeaveHistory } from "@/components/leave/LeaveHistory";

const LeavePage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const leave = useLeaveManagement();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-2">
        <PageHeader
          title="Leave Management"
          showNotifications
          onNotificationClick={() => setIsNotificationsOpen(true)}
        />

        <AnimatePresence mode="wait">
          {leave.isApplying ? (
            <motion.div
              key="apply"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ApplyLeaveForm
                balances={leave.balances}
                calculateDays={leave.calculateDays}
                validate={leave.validateLeaveRequest}
                onSubmit={(code, from, to, half, reason, attachment) => {
                  leave.submitLeaveRequest(code, from, to, half, reason, attachment);
                  leave.setIsApplying(false);
                }}
                onCancel={() => leave.setIsApplying(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-6">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-6">
                  <LeaveBalanceCards
                    balances={leave.balances}
                    onApplyLeave={() => leave.setIsApplying(true)}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <LeaveHistory requests={leave.leaveRequests} />
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

export default LeavePage;
