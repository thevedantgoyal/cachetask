import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  User,
  Folder,
  Flag,
  Loader2,
  Clock,
  Trash2,
  ChevronDown,
  Edit,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTeamMembers,
  useProjects,
  useManagedTasks,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useUpdateTask,
  useReassignTask,
  ManagedTask,
} from "@/hooks/useTaskManagement";
import { useInsertActivityLog } from "@/hooks/useTaskActivityLogs";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskDetailDrawer, TaskDetailData } from "@/components/tasks/TaskDetailDrawer";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { EditTaskModal } from "./EditTaskModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const priorityColors = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

export const TaskManagement = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [editingTask, setEditingTask] = useState<ManagedTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useManagedTasks();
  
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const reassignTask = useReassignTask();
  const insertLog = useInsertActivityLog();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setProjectId("");
    setPriority("medium");
    setDueDate("");
    setShowCreateForm(false);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      const result = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignedTo || undefined,
        projectId: projectId || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
      // Log creation
      if (result?.id) {
        insertLog.mutateAsync({
          taskId: result.id,
          actionType: "created",
          newValue: { title: title.trim(), priority, status: "pending" },
        }).catch(console.error);
      }
      toast.success("Task created successfully");
      resetForm();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, oldStatus: string | null, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ taskId, status: newStatus });
      await insertLog.mutateAsync({
        taskId,
        actionType: "status_changed",
        oldValue: { status: oldStatus },
        newValue: { status: newStatus },
      });
      toast.success(`Task marked as ${newStatus.replace("_", " ")}`);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to archive this task?")) return;

    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task archived");
    } catch (error) {
      toast.error("Failed to archive task");
    }
  };

  const handleReassign = async () => {
    if (!reassignTaskId || !reassignTo) return;
    try {
      await reassignTask.mutateAsync({
        taskId: reassignTaskId,
        newAssigneeId: reassignTo,
        reason: reassignReason.trim() || undefined,
      });
      toast.success("Task reassigned");
      setReassignTaskId(null);
      setReassignTo("");
      setReassignReason("");
    } catch {
      toast.error("Failed to reassign task");
    }
  };

  const handleEditTask = async (data: {
    taskId: string;
    title: string;
    description?: string;
    assignedTo?: string | null;
    projectId?: string | null;
    priority?: string;
    dueDate?: string | null;
    status?: string;
    blockedReason?: string;
    taskType?: string;
  }) => {
    try {
      await updateTask.mutateAsync(data);
      toast.success("Task updated successfully");
      setEditingTask(null);
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleTaskClick = (task: ManagedTask) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      project_name: task.project_name,
      assigned_to_name: task.assigned_to_name,
      reassignment_count: task.reassignment_count,
      blocked_reason: task.blocked_reason,
      task_type: task.task_type,
    });
    setDrawerOpen(true);
  };

  const filteredTasks = filterStatus
    ? tasks.filter((t) => t.status === filterStatus)
    : tasks;

  const isLoading = membersLoading || projectsLoading || tasksLoading;

  const statusFilters = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
    { value: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task Management</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </Button>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 space-y-4"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            New Task
          </h3>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title *"
            className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">Assign to (optional)</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">Select project (optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <Folder className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <Flag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCreateTask}
              disabled={createTask.isPending || !title.trim()}
              className="flex-1"
            >
              {createTask.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Task
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reassign Modal */}
      {reassignTaskId && (
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Reassign Task
          </h3>
          <select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            className="w-full p-3 rounded-xl border border-border bg-background"
          >
            <option value="">Select new assignee</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
          <input
            type="text"
            value={reassignReason}
            onChange={(e) => setReassignReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full p-3 rounded-xl border border-border bg-background text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleReassign} disabled={!reassignTo || reassignTask.isPending} className="flex-1">
              {reassignTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reassign
            </Button>
            <Button variant="outline" onClick={() => setReassignTaskId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-2xl">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filterStatus ? "Try a different filter" : "Create your first task above"}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              variants={itemVariants}
              className="bg-card rounded-2xl p-4 shadow-soft border border-border/50 cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <TaskStatusBadge status={task.status} />
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                      {task.priority}
                    </span>
                    {(task.reassignment_count || 0) > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <RefreshCw className="w-3 h-3" /> {task.reassignment_count}
                      </span>
                    )}
                  </div>

                  <h4 className={`font-medium ${task.status === "completed" || task.status === "approved" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {task.assigned_to_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {task.assigned_to_name}
                      </span>
                    )}
                    {task.project_name && (
                      <span className="flex items-center gap-1">
                        <Folder className="w-3 h-3" /> {task.project_name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions dropdown */}
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[160px]">
                    <button onClick={() => setEditingTask(task)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => setReassignTaskId(task.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Reassign
                    </button>
                    <hr className="my-1 border-border" />
                    {["pending", "in_progress", "review", "blocked", "completed", "approved"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(task.id, task.status, s)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted capitalize flex items-center gap-2"
                      >
                        {s === "approved" && <ShieldCheck className="w-4 h-4" />}
                        {s.replace("_", " ")}
                      </button>
                    ))}
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Archive
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleEditTask}
        isSaving={updateTask.isPending}
        teamMembers={teamMembers}
        projects={projects}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canUploadEvidence={false}
      />
    </div>
  );
};
