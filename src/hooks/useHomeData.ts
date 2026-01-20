import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isPast, startOfDay, endOfDay } from "date-fns";

export interface HomeTask {
  id: string;
  title: string;
  description: string | null;
  project_name: string | null;
  due_date: string | null;
  priority: string | null;
}

export interface HomeStats {
  totalTasks: number;
  completedToday: number;
  pendingContributions: number;
  approvedContributions: number;
}

export const useHomeTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["home-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          due_date,
          priority,
          projects (name)
        `)
        .eq("assigned_to", profile.id)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(3);

      if (error) throw error;

      return (data || []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_name: task.projects?.name || "No Project",
        due_date: task.due_date,
        priority: task.priority,
      }));
    },
    enabled: !!user,
  });
};

export const useHomeStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["home-stats", user?.id],
    queryFn: async () => {
      if (!user) return { totalTasks: 0, completedToday: 0, pendingContributions: 0, approvedContributions: 0 };

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return { totalTasks: 0, completedToday: 0, pendingContributions: 0, approvedContributions: 0 };

      // Get total active tasks
      const { count: totalTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", profile.id)
        .neq("status", "completed");

      // Get tasks completed today
      const today = new Date();
      const { count: completedToday } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", profile.id)
        .eq("status", "completed")
        .gte("completed_at", startOfDay(today).toISOString())
        .lte("completed_at", endOfDay(today).toISOString());

      // Get pending contributions
      const { count: pendingContributions } = await supabase
        .from("contributions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Get approved contributions
      const { count: approvedContributions } = await supabase
        .from("contributions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");

      return {
        totalTasks: totalTasks || 0,
        completedToday: completedToday || 0,
        pendingContributions: pendingContributions || 0,
        approvedContributions: approvedContributions || 0,
      };
    },
    enabled: !!user,
  });
};

export const formatDueLabel = (dueDate: string | null): string => {
  if (!dueDate) return "No due date";
  
  const date = new Date(dueDate);
  if (isPast(date)) {
    return "Overdue";
  }
  
  return `Due ${formatDistanceToNow(date, { addSuffix: true })}`;
};
