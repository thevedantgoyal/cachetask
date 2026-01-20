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
}

export const useTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the user's profile id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      // Fetch tasks assigned to this user with project info
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          projects (
            name
          )
        `)
        .eq("assigned_to", profile.id)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;

      return (data || []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_name: task.projects?.name || "No Project",
        due_date: task.due_date,
        status: task.status,
        priority: task.priority,
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
