import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addDays, isAfter } from "date-fns";

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

const mockProjects: ProjectOption[] = [
  {
    id: "p1",
    name: "CacheTask Platform",
    tasks: [
      { id: "t1", title: "Frontend Development" },
      { id: "t2", title: "API Integration" },
      { id: "t3", title: "Bug Fixes" },
    ],
  },
  {
    id: "p2",
    name: "HR Portal Redesign",
    tasks: [
      { id: "t4", title: "UI/UX Research" },
      { id: "t5", title: "Component Library" },
      { id: "t6", title: "User Testing" },
    ],
  },
  {
    id: "p3",
    name: "Mobile App v2",
    tasks: [
      { id: "t7", title: "Feature Development" },
      { id: "t8", title: "Performance Optimization" },
    ],
  },
];

const generateMockEntries = (): TimesheetEntry[] => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const entries: TimesheetEntry[] = [];

  // Add some mock entries for earlier days this week
  for (let i = 0; i < Math.min(today.getDay() === 0 ? 6 : today.getDay() - 1, 3); i++) {
    const date = addDays(weekStart, i);
    entries.push({
      id: `ts-${i}-1`,
      date: format(date, "yyyy-MM-dd"),
      projectId: "p1",
      projectName: "CacheTask Platform",
      taskId: "t1",
      taskTitle: "Frontend Development",
      hours: 5,
      description: "Worked on leave management module UI components",
      attachment: null,
      createdAt: format(date, "yyyy-MM-dd'T'09:00:00"),
    });
    entries.push({
      id: `ts-${i}-2`,
      date: format(date, "yyyy-MM-dd"),
      projectId: "p2",
      projectName: "HR Portal Redesign",
      taskId: "t4",
      taskTitle: "UI/UX Research",
      hours: 3,
      description: "Conducted stakeholder interviews for portal redesign",
      attachment: null,
      createdAt: format(date, "yyyy-MM-dd'T'14:00:00"),
    });
  }

  return entries;
};

const TARGET_HOURS = 40;
const MAX_DAILY_HOURS = 24;
const MAX_WEEKLY_HOURS = 60;

export const useTimesheetManagement = () => {
  const [entries, setEntries] = useState<TimesheetEntry[]>(generateMockEntries);
  const [weekStatus, setWeekStatus] = useState<TimesheetStatus>("incomplete");
  const [currentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const projects = mockProjects;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const currentWeekEntries = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d >= currentWeekStart && d <= weekEnd;
    });
  }, [entries, currentWeekStart]);

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

  const addEntry = (
    date: Date,
    projectId: string,
    taskId: string,
    hours: number,
    description: string,
    attachment: string | null
  ) => {
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks.find((t) => t.id === taskId);
    if (!project || !task) return;

    const newEntry: TimesheetEntry = {
      id: `ts-${Date.now()}`,
      date: format(date, "yyyy-MM-dd"),
      projectId,
      projectName: project.name,
      taskId,
      taskTitle: task.title,
      hours,
      description,
      attachment,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [...prev, newEntry]);
  };

  const deleteEntry = (id: string) => {
    if (weekStatus !== "incomplete") return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const submitWeeklyTimesheet = () => {
    setWeekStatus("submitted");
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
  };
};
