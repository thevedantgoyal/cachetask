import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProjectWithMembers {
  id: string;
  name: string;
  description: string | null;
  project_type: string;
  due_date: string | null;
  status: string | null;
  created_at: string;
  created_by: string | null;
  members: { id: string; employee_id: string; full_name: string; email: string }[];
}

export interface ProjectMember {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
}

// Fetch projects created by the logged-in manager
export const useManagerProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["manager-projects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      // Fetch projects created by this manager
      const { data: projects, error } = await supabase
        .from("projects")
        .select("id, name, description, project_type, due_date, status, created_at, created_by")
        .eq("created_by", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch members for each project
      const projectIds = projects?.map((p) => p.id) || [];
      if (projectIds.length === 0) return [];

      const { data: members } = await supabase
        .from("project_members")
        .select("id, project_id, employee_id")
        .in("project_id", projectIds);

      // Get employee profiles
      const employeeIds = [...new Set(members?.map((m) => m.employee_id) || [])];
      let profileMap = new Map<string, { full_name: string; email: string }>();

      if (employeeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", employeeIds);

        profileMap = new Map(profiles?.map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
      }

      return (projects || []).map((p) => ({
        ...p,
        members: (members || [])
          .filter((m) => m.project_id === p.id)
          .map((m) => ({
            id: m.id,
            employee_id: m.employee_id,
            full_name: profileMap.get(m.employee_id)?.full_name || "Unknown",
            email: profileMap.get(m.employee_id)?.email || "",
          })),
      })) as ProjectWithMembers[];
    },
    enabled: !!user,
  });
};

// Fetch projects where the employee is a member
export const useEmployeeProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employee-projects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      // Get project IDs the employee is a member of
      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("employee_id", profile.id);

      if (!memberships || memberships.length === 0) return [];

      const projectIds = memberships.map((m) => m.project_id);

      const { data: projects, error } = await supabase
        .from("projects")
        .select("id, name, description, project_type, due_date, status, created_at, created_by")
        .in("id", projectIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all members for these projects
      const { data: allMembers } = await supabase
        .from("project_members")
        .select("id, project_id, employee_id")
        .in("project_id", projectIds);

      const employeeIds = [...new Set(allMembers?.map((m) => m.employee_id) || [])];
      let profileMap = new Map<string, { full_name: string; email: string }>();

      if (employeeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", employeeIds);

        profileMap = new Map(profiles?.map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
      }

      // Get task counts per project for the employee
      const { data: taskCounts } = await supabase
        .from("tasks")
        .select("project_id")
        .eq("assigned_to", profile.id)
        .eq("is_deleted", false)
        .in("project_id", projectIds);

      const taskCountMap = new Map<string, number>();
      taskCounts?.forEach((t) => {
        if (t.project_id) {
          taskCountMap.set(t.project_id, (taskCountMap.get(t.project_id) || 0) + 1);
        }
      });

      return (projects || []).map((p) => ({
        ...p,
        members: (allMembers || [])
          .filter((m) => m.project_id === p.id)
          .map((m) => ({
            id: m.id,
            employee_id: m.employee_id,
            full_name: profileMap.get(m.employee_id)?.full_name || "Unknown",
            email: profileMap.get(m.employee_id)?.email || "",
          })),
        taskCount: taskCountMap.get(p.id) || 0,
      }));
    },
    enabled: !!user,
  });
};

// Fetch members of a specific project (for task assignment)
export const useProjectMembers = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: members, error } = await supabase
        .from("project_members")
        .select("employee_id")
        .eq("project_id", projectId);

      if (error) throw error;

      const employeeIds = members?.map((m) => m.employee_id) || [];
      if (employeeIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title")
        .in("id", employeeIds);

      return (profiles || []).map((p) => ({
        id: p.id,
        user_id: p.id, // Profile ID used as reference
        full_name: p.full_name,
        email: p.email,
        job_title: p.job_title,
      }));
    },
    enabled: !!projectId,
  });
};

// Create a project with members
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      projectType,
      dueDate,
      employeeIds,
    }: {
      name: string;
      description?: string;
      projectType: string;
      dueDate: string;
      employeeIds: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) throw new Error("Profile not found");

      // Validate that all employees are direct reports
      const { data: directReports } = await supabase
        .from("profiles")
        .select("id")
        .eq("manager_id", profile.id)
        .in("id", employeeIds);

      if (!directReports || directReports.length !== employeeIds.length) {
        throw new Error("You can only assign direct reporting employees to projects");
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name,
          description: description || null,
          project_type: projectType,
          due_date: dueDate,
          created_by: profile.id,
          status: "active",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add members
      const memberInserts = employeeIds.map((empId) => ({
        project_id: project.id,
        employee_id: empId,
      }));

      const { error: membersError } = await supabase
        .from("project_members")
        .insert(memberInserts);

      if (membersError) throw membersError;

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Get unseen task counts by type for employee
export const useUnseenTaskCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unseen-task-counts", user?.id],
    queryFn: async () => {
      if (!user) return { projectTaskCount: 0, separateTaskCount: 0 };

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return { projectTaskCount: 0, separateTaskCount: 0 };

      const { data: unseenTasks } = await supabase
        .from("tasks")
        .select("id, task_type, project_id")
        .eq("assigned_to", profile.id)
        .eq("is_deleted", false)
        .eq("is_seen", false)
        .neq("status", "approved");

      let projectTaskCount = 0;
      let separateTaskCount = 0;

      unseenTasks?.forEach((t) => {
        if (t.task_type === "project_task" && t.project_id) {
          projectTaskCount++;
        } else {
          separateTaskCount++;
        }
      });

      return { projectTaskCount, separateTaskCount };
    },
    enabled: !!user,
  });
};

// Mark tasks as seen by type
export const useMarkTasksSeen = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskType: "project" | "separate") => {
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) throw new Error("Profile not found");

      let query = supabase
        .from("tasks")
        .update({ is_seen: true })
        .eq("assigned_to", profile.id)
        .eq("is_deleted", false)
        .eq("is_seen", false);

      if (taskType === "project") {
        query = query.eq("task_type", "project_task").not("project_id", "is", null);
      } else {
        // Separate tasks: either task_type is not project_task, or project_id is null
        query = query.or("task_type.neq.project_task,project_id.is.null");
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unseen-task-counts"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
