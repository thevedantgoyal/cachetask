import { motion } from "framer-motion";
import { Plus, Menu } from "lucide-react";
import { TaskCard } from "@/components/cards/TaskCard";
import { BottomNav } from "@/components/layout/BottomNav";

const allTasks = [
  {
    id: "1",
    title: "Review Q3 Marketing Plan",
    project: "Marketing Strategy",
    dueLabel: "Due in 2 days",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    title: "Prepare Sales Presentation",
    project: "Sales Enablement",
    dueLabel: "Due in 1 week",
    imageUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200&h=200&fit=crop",
  },
  {
    id: "3",
    title: "Analyze Customer Feedback",
    project: "Product Development",
    dueLabel: "Due in 2 weeks",
    imageUrl: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=200&h=200&fit=crop",
  },
  {
    id: "4",
    title: "Plan Team Building Event",
    project: "Employee Engagement",
    dueLabel: "Due in 3 weeks",
    imageUrl: "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=200&h=200&fit=crop",
  },
];

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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 mt-2"
        >
          {allTasks.map((task, index) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              transition={{ delay: index * 0.05 }}
            >
              <TaskCard
                title={task.title}
                project={task.project}
                dueLabel={task.dueLabel}
                imageUrl={task.imageUrl}
              />
            </motion.div>
          ))}
        </motion.div>

        <BottomNav />
      </div>
    </div>
  );
};

export default TasksPage;
