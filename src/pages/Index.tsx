import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TaskCard } from "@/components/cards/TaskCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AddWorkUpdateModal } from "@/components/modals/AddWorkUpdateModal";

// Mock data - in production this would come from the database
const todaysTasks = [
  {
    id: "1",
    title: "Complete Project Proposal",
    description: "Draft and finalize the proposal for the upcoming project.",
    project: "Product Development",
    dueLabel: "Due Today",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    title: "Team Meeting Prep",
    description: "Prepare agenda and materials for the team meeting.",
    project: "Team Operations",
    dueLabel: "Due Tomorrow",
    imageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=200&fit=crop",
  },
  {
    id: "3",
    title: "Client Feedback Review",
    description: "Analyze and summarize client feedback from the recent survey.",
    project: "Customer Success",
    dueLabel: "Due This Week",
    imageUrl: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop",
  },
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

const Index = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const dailyProgress = 60;

  useEffect(() => {
    const checkAdminAndProfile = async () => {
      if (!user) return;

      // Check if admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roleData);

      // Get profile name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfileName(profileData.full_name.split(" ")[0]);
      }
    };

    checkAdminAndProfile();
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

          {/* Today's Tasks */}
          <motion.section variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4">Today's Tasks</h3>
            <div className="space-y-3">
              {todaysTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <TaskCard
                    title={task.title}
                    description={task.description}
                    project={task.project}
                    dueLabel={task.dueLabel}
                    imageUrl={task.imageUrl}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Daily Focus */}
          <motion.section
            variants={itemVariants}
            className="bg-card rounded-2xl p-4 shadow-soft border border-border/50"
          >
            <h3 className="text-lg font-semibold mb-2">Daily Focus</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {dailyProgress}% Complete
                </span>
              </div>
              <ProgressBar value={dailyProgress} size="md" />
              <p className="text-sm text-muted-foreground mt-2">
                Keep up the great work!
              </p>
            </div>
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
