import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, isPast } from "date-fns";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_name: string | null;
  due_date: string | null;
  status: string | null;
  priority: string | null;
  task_type: string | null;
  blocked_reason: string | null;
  reassignment_count: number;
  assigned_to_name?: string | null;
}

export const useTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id],
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
          status,
          priority,
          task_type,
          blocked_reason,
          reassignment_count,
          is_deleted,
          projects (
            name
          )
        `)
        .eq("assigned_to", profile.id)
        .eq("is_deleted", false)
        .neq("status", "approved")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_name: task.projects?.name || "No Project",
        due_date: task.due_date,
        status: task.status,
        priority: task.priority,
        task_type: task.task_type || "project_task",
        blocked_reason: task.blocked_reason || null,
        reassignment_count: task.reassignment_count || 0,
      }));
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
