import { motion } from "framer-motion";
import { Plus, Menu, Loader2 } from "lucide-react";
import { TaskCard } from "@/components/cards/TaskCard";
import { RoleBasedNav } from "@/components/layout/RoleBasedNav";
import { useTasks, formatDueLabel } from "@/hooks/useTasks";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TasksPage = () => {
  const { data: tasks, isLoading, error } = useTasks();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto page-container">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="page-header py-0">My Tasks</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Failed to load tasks
          </div>
        ) : tasks && tasks.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 mt-2"
          >
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <TaskCard
                  title={task.title}
                  description={task.description || undefined}
                  project={task.project_name || "No Project"}
                  dueLabel={formatDueLabel(task.due_date)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks assigned to you</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks will appear here when assigned by your manager
            </p>
          </div>
        )}

        <RoleBasedNav />
      </div>
    </div>
  );
};

export default TasksPage;
