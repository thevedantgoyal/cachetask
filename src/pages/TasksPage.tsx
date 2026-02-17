import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ClipboardList } from "lucide-react";
import { TaskCard } from "@/components/cards/TaskCard";
import { useTasks, formatDueLabel } from "@/hooks/useTasks";
import { TaskDetailDrawer, TaskDetailData } from "@/components/tasks/TaskDetailDrawer";
import { useUpdateTaskStatus } from "@/hooks/useTaskManagement";
import { useInsertActivityLog } from "@/hooks/useTaskActivityLogs";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusFilters = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

const priorityFilters = [
  { value: "", label: "All" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const TasksPage = () => {
  const { data: tasks, isLoading, error } = useTasks();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [showBlockedPrompt, setShowBlockedPrompt] = useState<string | null>(null);

  const updateStatus = useUpdateTaskStatus();
  const insertLog = useInsertActivityLog();

  const filteredTasks = tasks?.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const handleTaskClick = (task: typeof tasks extends (infer T)[] | undefined ? T : never) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      project_name: task.project_name,
      reassignment_count: task.reassignment_count,
      blocked_reason: task.blocked_reason,
      task_type: task.task_type,
    });
    setDrawerOpen(true);
  };

  const handleStatusUpdate = async (taskId: string, oldStatus: string | null, newStatus: string) => {
    if (newStatus === "blocked") {
      setShowBlockedPrompt(taskId);
      return;
    }

    try {
      await updateStatus.mutateAsync({ taskId, status: newStatus });
      await insertLog.mutateAsync({
        taskId,
        actionType: "status_changed",
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
      });
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleBlockedSubmit = async (taskId: string) => {
    if (!blockedReason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    try {
      const task = tasks?.find((t) => t.id === taskId);
      await updateStatus.mutateAsync({ taskId, status: "blocked", blockedReason: blockedReason.trim() });
      await insertLog.mutateAsync({
        taskId,
        actionType: "status_changed",
        oldValue: { status: task?.status },
        newValue: { status: "blocked", blocked_reason: blockedReason.trim() },
      });
      toast.success("Task marked as blocked");
      setShowBlockedPrompt(null);
      setBlockedReason("");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <>
      {/* Status Filter Pills */}
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-muted border border-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Priority Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {priorityFilters.map((filter) => (
          <button
            key={`p-${filter.value}`}
            onClick={() => setFilterPriority(filter.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              filterPriority === filter.value
                ? "bg-secondary text-secondary-foreground"
                : "bg-card hover:bg-muted border border-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Blocked reason prompt */}
      {showBlockedPrompt && (
        <div className="mb-4 p-4 bg-card rounded-2xl border border-border/50 space-y-3">
          <p className="text-sm font-medium">Why is this task blocked?</p>
          <textarea
            value={blockedReason}
            onChange={(e) => setBlockedReason(e.target.value)}
            placeholder="Describe the blocker..."
            rows={2}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleBlockedSubmit(showBlockedPrompt)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-destructive text-destructive-foreground"
            >
              Confirm Block
            </button>
            <button
              onClick={() => { setShowBlockedPrompt(null); setBlockedReason(""); }}
              className="px-4 py-2 rounded-full text-sm font-medium bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                status={task.status}
                reassignmentCount={task.reassignment_count}
                onClick={() => handleTaskClick(task)}
                onStatusChange={(newStatus) => handleStatusUpdate(task.id, task.status, newStatus)}
                isEmployee
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus || filterPriority ? "Try a different filter" : "Tasks will appear here when assigned by your manager"}
          </p>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canUploadEvidence
      />
    </>
  );
};

export default TasksPage;
