import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Shield, CheckCircle, Clock, TrendingUp, ListTodo } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard } from "@/components/cards/TaskCard";
import { MetricCard } from "@/components/cards/MetricCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { AddWorkUpdateModal } from "@/components/modals/AddWorkUpdateModal";
import { useHomeTasks, useHomeStats, formatDueLabel } from "@/hooks/useHomeData";
import { Skeleton } from "@/components/ui/skeleton";

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

const Index = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  const { data: tasks, isLoading: tasksLoading } = useHomeTasks();
  const { data: stats, isLoading: statsLoading } = useHomeStats();

  useEffect(() => {
    const checkRolesAndProfile = async () => {
      if (!user) return;

      // Check roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      setIsAdmin(userRoles.includes("admin"));
      setIsManager(
        userRoles.includes("manager") ||
        userRoles.includes("team_lead") ||
        userRoles.includes("hr") ||
        userRoles.includes("admin")
      );

      // Get profile name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfileName(profileData.full_name.split(" ")[0]);
      }
    };

    checkRolesAndProfile();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto page-container">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <h2 className="text-lg font-semibold">Home</h2>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                to="/admin"
                className="p-2 rounded-full hover:bg-muted transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="w-5 h-5 text-primary" />
              </Link>
            )}
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 mt-4"
        >
          {/* Greeting */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-display font-bold">
              {getGreeting()}, {profileName || "there"}
            </h1>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </>
            ) : (
              <>
                <MetricCard
                  label="Active Tasks"
                  value={stats?.totalTasks || 0}
                  maxValue={10}
                  icon={ListTodo}
                  showInfo={false}
                />
                <MetricCard
                  label="Done Today"
                  value={stats?.completedToday || 0}
                  maxValue={5}
                  icon={CheckCircle}
                  variant="success"
                  showInfo={false}
                />
                <MetricCard
                  label="Pending"
                  value={stats?.pendingContributions || 0}
                  maxValue={10}
                  icon={Clock}
                  variant="warning"
                  showInfo={false}
                />
                <MetricCard
                  label="Approved"
                  value={stats?.approvedContributions || 0}
                  maxValue={20}
                  icon={TrendingUp}
                  variant="success"
                  showInfo={false}
                />
              </>
            )}
          </motion.div>

          {/* Manager Quick Access */}
          {isManager && (
            <motion.div variants={itemVariants}>
              <Link
                to="/manager"
                className="block bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Review Contributions</h3>
                    <p className="text-sm text-muted-foreground">
                      Approve or review team submissions
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-primary/60" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Today's Tasks */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Tasks</h3>
              <Link to="/tasks" className="text-sm text-primary font-medium">
                View all
              </Link>
            </div>
            {tasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TaskCard
                      title={task.title}
                      description={task.description || undefined}
                      project={task.project_name || "No Project"}
                      dueLabel={formatDueLabel(task.due_date)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-2xl">
                <p className="text-muted-foreground">No tasks assigned</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tasks will appear here when assigned
                </p>
              </div>
            )}
          </motion.section>
        </motion.div>

        {/* FAB */}
        <motion.button
          className="fab"
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        <BottomNav />
      </div>

      <AddWorkUpdateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
