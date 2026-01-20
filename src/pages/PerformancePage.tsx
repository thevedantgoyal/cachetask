import { motion } from "framer-motion";
import { Users, MessageSquare, Lightbulb, Clock, Menu } from "lucide-react";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { MetricCard } from "@/components/cards/MetricCard";
import { BottomNav } from "@/components/layout/BottomNav";

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
  const overallScore = 75;
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto page-container">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="page-header py-0">My Performance</h1>
          <div className="w-10" />
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Score Circle */}
          <motion.div variants={itemVariants} className="flex justify-center pt-4">
            <ScoreCircle score={overallScore} label="FOCUS SCORE" />
          </motion.div>

          {/* Insight Text */}
          <motion.p
            variants={itemVariants}
            className="text-center text-muted-foreground px-4"
          >
            Your current performance indicates exceptional{" "}
            <span className="font-semibold text-foreground">Collaboration</span>.
            Keep aligning with your quarterly milestones.
          </motion.p>

          {/* Metric Analysis */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Metric Analysis</h3>
              <span className="text-sm text-muted-foreground">{currentMonth}</span>
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

        <BottomNav />
      </div>
    </div>
  );
};

export default PerformancePage;
