import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sendTaskAssignedEmail } from "@/hooks/useEmailNotifications";
import { sendPushNotification } from "@/hooks/usePushNotifications";

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  job_title: string | null;
}

export interface Project {
  id: string;
  name: string;
}

export interface ManagedTask {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  assigned_to_name: string | null;
  assigned_to_id: string | null;
  project_name: string | null;
  task_type: string | null;
  blocked_reason: string | null;
  reassignment_count: number;
}

// Fetch team members that the current user manages
export const useTeamMembers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["team-members", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get current user's profile
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!managerProfile) return [];

      // Check if user has manager/admin/hr roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      const canViewAll = userRoles.includes("hr") || userRoles.includes("admin");
      const isManager = userRoles.includes("manager") || userRoles.includes("team_lead");

      if (!canViewAll && !isManager) return [];

      // Fetch team members
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, email, job_title");

      if (!canViewAll) {
        // Only fetch direct reports for managers
        query = query.eq("manager_id", managerProfile.id);
      }

      const { data, error } = await query.order("full_name");

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!user,
  });
};

// Fetch available projects
export const useProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
};

// Fetch tasks created/managed by the current user
export const useManagedTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["managed-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get manager's profile
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!managerProfile) return [];

      // Check roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRoles = roles?.map((r) => r.role) || [];
      const canViewAll = userRoles.includes("hr") || userRoles.includes("admin");
      const isManager = userRoles.includes("manager") || userRoles.includes("team_lead");

      if (!canViewAll && !isManager) return [];

      // Fetch tasks (exclude soft-deleted)
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          assigned_to,
          task_type,
          blocked_reason,
          reassignment_count,
          is_deleted,
          projects (name)
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get assignee info
      const assignedToIds = [...new Set(tasks?.map((t) => t.assigned_to).filter(Boolean))] as string[];

      let profileMap = new Map<string, { full_name: string; manager_id: string | null }>();

      if (assignedToIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, manager_id")
          .in("id", assignedToIds);

        profileMap = new Map(profiles?.map((p) => [p.id, { full_name: p.full_name, manager_id: p.manager_id }]));
      }

      // Filter tasks based on role
      const filteredTasks = tasks?.filter((task) => {
        if (canViewAll) return true;
        if (!task.assigned_to) return true; // Unassigned tasks visible to managers
        const assignee = profileMap.get(task.assigned_to);
        return assignee?.manager_id === managerProfile.id;
      });

      return (filteredTasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        created_at: task.created_at,
        assigned_to_id: task.assigned_to,
        assigned_to_name: task.assigned_to ? profileMap.get(task.assigned_to)?.full_name || null : null,
        project_name: task.projects?.name || null,
        task_type: task.task_type || "project_task",
        blocked_reason: task.blocked_reason || null,
        reassignment_count: task.reassignment_count || 0,
      }));
    },
    enabled: !!user,
  });
};

// Create a new task
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      assignedTo,
      projectId,
      priority,
      dueDate,
    }: {
      title: string;
      description?: string;
      assignedTo?: string;
      projectId?: string;
      priority?: string;
      dueDate?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get manager's profile id and name
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("tasks")
        .insert([{
          title,
          description: description || null,
          assigned_to: assignedTo || null,
          assigned_by: managerProfile?.id || null,
          project_id: projectId || null,
          priority: priority || "medium",
          due_date: dueDate || null,
          status: "pending",
        }])
        .select()
        .single();

      if (error) throw error;

      // Send email and push notification to assignee
      if (assignedTo) {
        const { data: assigneeProfile } = await supabase
          .from("profiles")
          .select("email, user_id")
          .eq("id", assignedTo)
          .maybeSingle();

        if (assigneeProfile?.email) {
          sendTaskAssignedEmail(
            assigneeProfile.email,
            title,
            managerProfile?.full_name
          ).catch((err) => console.error("Failed to send task assignment email:", err));
        }

        // Send push notification
        if (assigneeProfile?.user_id) {
          sendPushNotification(
            assigneeProfile.user_id,
            "New Task Assigned 📋",
            `You've been assigned: "${title}"`,
            { url: "/tasks", tag: "task-assigned" }
          ).catch((err) => console.error("Failed to send task push notification:", err));
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Update task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      status,
      blockedReason,
    }: {
      taskId: string;
      status: string;
      blockedReason?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (status !== "approved") {
        updateData.completed_at = null;
      }

      if (status === "blocked" && blockedReason) {
        updateData.blocked_reason = blockedReason;
      } else if (status !== "blocked") {
        updateData.blocked_reason = null;
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Soft delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase
        .from("tasks")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: profile?.id || null,
        })
        .eq("id", taskId);

      if (error) throw error;

      // Log activity
      if (profile) {
        await supabase.from("task_activity_logs").insert([{
          task_id: taskId,
          action_type: "deleted",
          performed_by: profile.id,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Reassign a task
export const useReassignTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      newAssigneeId,
      reason,
    }: {
      taskId: string;
      newAssigneeId: string;
      reason?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get current task to find old assignee
      const { data: task } = await supabase
        .from("tasks")
        .select("assigned_to, title, reassignment_count")
        .eq("id", taskId)
        .single();

      if (!task || !profile) throw new Error("Task or profile not found");

      const { error } = await supabase
        .from("tasks")
        .update({
          assigned_to: newAssigneeId,
          reassigned_from: task.assigned_to,
          reassignment_reason: reason || null,
          reassignment_count: (task.reassignment_count || 0) + 1,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      // Log activity
      await supabase.from("task_activity_logs").insert([{
        task_id: taskId,
        action_type: "reassigned",
        performed_by: profile.id,
        old_value: { assigned_to: task.assigned_to } as unknown as import("@/integrations/supabase/types").Json,
        new_value: { assigned_to: newAssigneeId, reason } as unknown as import("@/integrations/supabase/types").Json,
      }]);

      // Notify new assignee
      const { data: assigneeProfile } = await supabase
        .from("profiles")
        .select("email, user_id")
        .eq("id", newAssigneeId)
        .maybeSingle();

      if (assigneeProfile?.user_id) {
        await supabase.rpc("create_notification", {
          _user_id: assigneeProfile.user_id,
          _type: "task_reassigned",
          _title: "Task Reassigned to You",
          _message: `You've been assigned: "${task.title}" by ${profile.full_name}`,
          _metadata: { task_id: taskId },
        });

        sendPushNotification(
          assigneeProfile.user_id,
          "Task Reassigned 🔄",
          `You've been assigned: "${task.title}"`,
          { url: "/tasks", tag: "task-reassigned" }
        ).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// Update a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      title,
      description,
      assignedTo,
      projectId,
      priority,
      dueDate,
      status,
      blockedReason,
      taskType,
    }: {
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
      const updateData: Record<string, unknown> = {
        title,
        description: description || null,
        assigned_to: assignedTo || null,
        project_id: projectId || null,
        priority: priority || "medium",
        due_date: dueDate || null,
      };

      if (taskType) {
        updateData.task_type = taskType;
      }

      if (status) {
        updateData.status = status;
        if (status === "completed") {
          updateData.completed_at = new Date().toISOString();
        } else if (status !== "approved") {
          updateData.completed_at = null;
        }
        if (status === "blocked" && blockedReason) {
          updateData.blocked_reason = blockedReason;
        } else if (status !== "blocked") {
          updateData.blocked_reason = null;
        }
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
