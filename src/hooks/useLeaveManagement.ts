import { useState, useEffect, useCallback } from "react";
import { differenceInCalendarDays, isAfter, isBefore, startOfDay, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeaveBalance {
  type: string;
  code: string;
  total: number;
  used: number;
  remaining: number;
  color: string;
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
  leaveCode: string;
  fromDate: string;
  toDate: string;
  halfDay: boolean;
  reason: string;
  attachment: string | null;
  daysCount: number;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
  approverName: string;
  approverComment: string | null;
  approvalStage: string;
}

export const useLeaveManagement = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!user) return;
    const year = new Date().getFullYear();

    const { data, error } = await supabase
      .from("leave_balances")
      .select("*, leave_types!inner(code, name, color)")
      .eq("user_id", user.id)
      .eq("year", year);

    if (error) {
      console.error("Error fetching leave balances:", error);
      return;
    }

    const mapped: LeaveBalance[] = (data || []).map((row: any) => ({
      type: row.leave_types.name,
      code: row.leave_types.code,
      total: row.total,
      used: Number(row.used),
      remaining: row.total - Number(row.used),
      color: row.leave_types.color,
    }));

    setBalances(mapped);
  }, [user]);

  const fetchLeaves = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("leaves")
      .select("*, leave_types!inner(code, name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leaves:", error);
      return;
    }

    const mapped: LeaveRequest[] = (data || []).map((row: any) => ({
      id: row.id,
      leaveType: row.leave_types.name,
      leaveCode: row.leave_types.code,
      fromDate: row.from_date,
      toDate: row.to_date,
      halfDay: row.half_day,
      reason: row.reason,
      attachment: row.attachment_url,
      daysCount: Number(row.days_count),
      status: row.status as "pending" | "approved" | "rejected",
      appliedOn: row.created_at,
      approverName: row.approver_id ? "Reporting Manager" : "—",
      approverComment: row.approver_comment,
      approvalStage: row.status === "pending" ? "Pending Manager Approval" :
        row.status === "approved" ? "Manager Approved" : "Manager Rejected",
    }));

    setLeaveRequests(mapped);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBalances(), fetchLeaves()]);
      setLoading(false);
    };
    load();
  }, [fetchBalances, fetchLeaves]);

  const calculateDays = (from: Date, to: Date, halfDay: boolean): number => {
    const days = differenceInCalendarDays(to, from) + 1;
    return halfDay ? Math.max(days - 0.5, 0.5) : days;
  };

  const validateLeaveRequest = (
    leaveCode: string,
    fromDate: Date | undefined,
    toDate: Date | undefined,
    reason: string
  ): string | null => {
    if (!fromDate || !toDate) return "Please select both dates.";
    if (isBefore(startOfDay(fromDate), startOfDay(new Date()))) return "Cannot apply for past dates.";
    if (isAfter(fromDate, toDate)) return "From date must be before or equal to To date.";
    if (!reason.trim()) return "Reason is mandatory.";

    const days = differenceInCalendarDays(toDate, fromDate) + 1;
    const balance = balances.find((b) => b.code === leaveCode);
    if (balance && days > balance.remaining)
      return `Insufficient ${balance.type} balance. You have ${balance.remaining} day(s) remaining.`;

    return null;
  };

  const submitLeaveRequest = async (
    leaveCode: string,
    fromDate: Date,
    toDate: Date,
    halfDay: boolean,
    reason: string,
    attachment: string | null
  ) => {
    if (!user) return;

    const balance = balances.find((b) => b.code === leaveCode);
    if (!balance) return;

    const daysCount = calculateDays(fromDate, toDate, halfDay);

    // Get leave_type_id
    const { data: ltData } = await supabase
      .from("leave_types")
      .select("id")
      .eq("code", leaveCode)
      .single();

    if (!ltData) {
      toast.error("Invalid leave type");
      return;
    }

    // Check overlap via DB function
    const { data: hasOverlap } = await supabase.rpc("check_leave_overlap", {
      _user_id: user.id,
      _from_date: format(fromDate, "yyyy-MM-dd"),
      _to_date: format(toDate, "yyyy-MM-dd"),
    });

    if (hasOverlap) {
      toast.error("You already have a leave request for overlapping dates.");
      return;
    }

    const { error } = await supabase.from("leaves").insert({
      user_id: user.id,
      leave_type_id: ltData.id,
      from_date: format(fromDate, "yyyy-MM-dd"),
      to_date: format(toDate, "yyyy-MM-dd"),
      half_day: halfDay,
      days_count: daysCount,
      reason,
      attachment_url: attachment,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit leave request");
      console.error(error);
      return;
    }

    toast.success("Leave request submitted successfully!");
    await Promise.all([fetchBalances(), fetchLeaves()]);
  };

  return {
    balances,
    leaveRequests,
    isApplying,
    setIsApplying,
    calculateDays,
    validateLeaveRequest,
    submitLeaveRequest,
    loading,
  };
};
