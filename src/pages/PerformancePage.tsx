import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, Lightbulb, Clock, TrendingUp } from "lucide-react";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { MetricCard } from "@/components/cards/MetricCard";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

const metrics = [
  { icon: Users, label: "Collaboration", value: 70 },
  { icon: MessageSquare, label: "Communication", value: 80 },
  { icon: Lightbulb, label: "Problem Solving", value: 65 },
  { icon: Clock, label: "Time Management", value: 75 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PerformancePage = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const overallScore = 75;
  const currentMonth = new Date()
    .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-2">
        <PageHeader
          title="My Performance"
          showNotifications
          onNotificationClick={() => setIsNotificationsOpen(true)}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Score Circle */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center pt-4"
          >
            <ScoreCircle score={overallScore} label="FOCUS SCORE" />
          </motion.div>

          {/* Insight Text */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Performance Insight</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your current performance indicates exceptional{" "}
                  <span className="font-semibold text-foreground">
                    Collaboration
                  </span>
                  . Keep aligning with your quarterly milestones.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Metric Analysis */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Metric Analysis</h3>
              <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {currentMonth}
              </span>
            </div>

            <div className="space-y-2">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <MetricCard
                    icon={metric.icon}
                    label={metric.label}
                    value={metric.value}
                    variant={metric.value >= 75 ? "success" : "default"}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        </motion.div>

        <RoleBasedNav />
      </div>

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export default PerformancePage;
