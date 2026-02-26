import { useState, useMemo, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addDays, isAfter, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimesheetEntry {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  hours: number;
  description: string;
  attachment: string | null;
  createdAt: string;
}

export interface ProjectOption {
  id: string;
  name: string;
  tasks: { id: string; title: string }[];
}

export type TimesheetStatus = "incomplete" | "submitted" | "approved";

const TARGET_HOURS = 40;
const MAX_DAILY_HOURS = 24;
const MAX_WEEKLY_HOURS = 60;

export const useTimesheetManagement = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [weekStatus, setWeekStatus] = useState<TimesheetStatus>("incomplete");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch user's projects with tasks
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    // Get user's profile id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    // Get projects user is a member of
    const { data: memberships } = await supabase
      .from("project_members")
      .select("project_id, projects(id, name)")
      .eq("employee_id", profile.id);

    if (!memberships || memberships.length === 0) {
      setProjects([]);
      return;
    }

    const projectOptions: ProjectOption[] = [];
    for (const m of memberships) {
      const proj = m.projects as any;
      if (!proj) continue;

      // Get tasks for this project assigned to user
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("project_id", proj.id)
        .eq("assigned_to", profile.id)
        .eq("is_deleted", false);

      projectOptions.push({
        id: proj.id,
        name: proj.name,
        tasks: (tasks || []).map((t) => ({ id: t.id, title: t.title })),
      });
    }

    setProjects(projectOptions);
  }, [user]);

  // Fetch timesheet entries for current week
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    const { data, error } = await supabase
      .from("timesheets")
      .select("*, projects(name), tasks(title)")
      .eq("user_id", user.id)
      .gte("date", format(currentWeekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"))
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching timesheets:", error);
      return;
    }

    const mapped: TimesheetEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      date: row.date,
      projectId: row.project_id || "",
      projectName: row.projects?.name || "Unknown",
      taskId: row.task_id || "",
      taskTitle: row.tasks?.title || "General",
      hours: Number(row.hours),
      description: row.description,
      attachment: row.attachment_url,
      createdAt: row.created_at,
    }));

    setEntries(mapped);
  }, [user, currentWeekStart]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const currentWeekEntries = entries;

  const totalWeeklyHours = useMemo(() => {
    return currentWeekEntries.reduce((sum, e) => sum + e.hours, 0);
  }, [currentWeekEntries]);

  const getDailyHours = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");
    return currentWeekEntries
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const getEntriesForDate = (date: Date): TimesheetEntry[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return currentWeekEntries.filter((e) => e.date === dateStr);
  };

  const validateEntry = (
    date: Date | undefined,
    projectId: string,
    taskId: string,
    hours: number,
    description: string
  ): string | null => {
    if (!date) return "Please select a date.";
    if (isAfter(date, new Date())) return "Cannot log time for future dates.";
    if (!projectId) return "Please select a project.";
    if (!taskId) return "Please select a task.";
    if (hours <= 0) return "Hours must be greater than 0.";
    if (hours > MAX_DAILY_HOURS) return `Cannot log more than ${MAX_DAILY_HOURS} hours per day.`;
    if (!description.trim()) return "Please describe the work done.";

    const dailyTotal = getDailyHours(date) + hours;
    if (dailyTotal > MAX_DAILY_HOURS) return `Total daily hours would exceed ${MAX_DAILY_HOURS}. Currently logged: ${getDailyHours(date)}h.`;

    const weeklyTotal = totalWeeklyHours + hours;
    if (weeklyTotal > MAX_WEEKLY_HOURS) return `Total weekly hours would exceed ${MAX_WEEKLY_HOURS}. Currently logged: ${totalWeeklyHours}h.`;

    return null;
  };

  const addEntry = async (
    date: Date,
    projectId: string,
    taskId: string,
    hours: number,
    description: string,
    attachment: string | null
  ) => {
    if (!user) return;

    const { error } = await supabase.from("timesheets").insert({
      user_id: user.id,
      project_id: projectId || null,
      task_id: taskId || null,
      date: format(date, "yyyy-MM-dd"),
      hours,
      description,
      attachment_url: attachment,
    });

    if (error) {
      toast.error("Failed to save timesheet entry");
      console.error(error);
      return;
    }

    toast.success("Time entry logged!");
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    if (weekStatus !== "incomplete") return;

    const { error } = await supabase.from("timesheets").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete entry");
      console.error(error);
      return;
    }

    toast.success("Entry deleted");
    fetchEntries();
  };

  const submitWeeklyTimesheet = () => {
    setWeekStatus("submitted");
    toast.success("Weekly timesheet submitted for review!");
  };

  // Navigate weeks
  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
    setWeekStatus("incomplete");
  };

  const goToPrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
    setWeekStatus("incomplete");
  };

  const goToWeekOf = (date: Date) => {
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    setWeekStatus("incomplete");
  };

  return {
    entries: currentWeekEntries,
    weekDays,
    currentWeekStart,
    totalWeeklyHours,
    targetHours: TARGET_HOURS,
    maxWeeklyHours: MAX_WEEKLY_HOURS,
    weekStatus,
    projects,
    getDailyHours,
    getEntriesForDate,
    validateEntry,
    addEntry,
    deleteEntry,
    submitWeeklyTimesheet,
    goToNextWeek,
    goToPrevWeek,
    goToWeekOf,
    selectedMonth,
    setSelectedMonth,
  };
};
