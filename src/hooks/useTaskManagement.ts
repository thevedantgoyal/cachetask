import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

      // Fetch tasks
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
          projects (name)
        `)
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

      return (filteredTasks || []).map((task) => ({
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

      // Get manager's profile id
      const { data: managerProfile } = await supabase
        .from("profiles")
        .select("id")
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
    }: {
      taskId: string;
      status: string;
    }) => {
      const updateData: { status: string; completed_at?: string | null } = { status };
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
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

// Delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
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
    }: {
      taskId: string;
      title: string;
      description?: string;
      assignedTo?: string | null;
      projectId?: string | null;
      priority?: string;
      dueDate?: string | null;
      status?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        title,
        description: description || null,
        assigned_to: assignedTo || null,
        project_id: projectId || null,
        priority: priority || "medium",
        due_date: dueDate || null,
      };

      if (status) {
        updateData.status = status;
        if (status === "completed") {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
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
