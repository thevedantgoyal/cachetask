import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ClipboardList } from "lucide-react";
import { TaskCard } from "@/components/cards/TaskCard";
import { useTasks, formatDueLabel } from "@/hooks/useTasks";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TasksPage = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const [filterPriority, setFilterPriority] = useState<string>("");

  const filteredTasks = filterPriority
    ? tasks?.filter((t) => t.priority === filterPriority)
    : tasks;

  const priorityFilters = [
    { value: "", label: "All" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  return (
    <>
      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {priorityFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterPriority(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterPriority === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted border border-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Failed to load tasks</div>
      ) : filteredTasks && filteredTasks.length > 0 ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          {filteredTasks.map((task, index) => (
            <motion.div key={task.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
              <TaskCard
                title={task.title}
                description={task.description || undefined}
                project={task.project_name || "No Project"}
                dueLabel={formatDueLabel(task.due_date)}
                priority={task.priority}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filterPriority ? "Try a different filter" : "Tasks will appear here when assigned by your manager"}
          </p>
        </div>
      )}
    </>
  );
};

export default TasksPage;
