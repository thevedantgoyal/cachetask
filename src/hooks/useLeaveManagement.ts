import { useState } from "react";
import { format, differenceInCalendarDays, isAfter, isBefore, startOfDay } from "date-fns";

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

const initialBalances: LeaveBalance[] = [
  { type: "Casual Leave", code: "CL", total: 12, used: 3, remaining: 9, color: "hsl(var(--primary))" },
  { type: "Sick Leave", code: "SL", total: 10, used: 2, remaining: 8, color: "hsl(var(--success))" },
  { type: "Earned Leave", code: "EL", total: 15, used: 5, remaining: 10, color: "hsl(var(--warning))" },
];

const mockHistory: LeaveRequest[] = [
  {
    id: "lr-001",
    leaveType: "Casual Leave",
    leaveCode: "CL",
    fromDate: "2025-12-15",
    toDate: "2025-12-16",
    halfDay: false,
    reason: "Personal work",
    attachment: null,
    daysCount: 2,
    status: "approved",
    appliedOn: "2025-12-10T09:30:00",
    approverName: "Rajesh Kumar",
    approverComment: "Approved. Enjoy your time off.",
    approvalStage: "Manager Approved",
  },
  {
    id: "lr-002",
    leaveType: "Sick Leave",
    leaveCode: "SL",
    fromDate: "2025-11-20",
    toDate: "2025-11-21",
    halfDay: false,
    reason: "Fever and cold",
    attachment: "medical_certificate.pdf",
    daysCount: 2,
    status: "approved",
    appliedOn: "2025-11-20T08:00:00",
    approverName: "Rajesh Kumar",
    approverComment: "Get well soon.",
    approvalStage: "HR Acknowledged",
  },
  {
    id: "lr-003",
    leaveType: "Earned Leave",
    leaveCode: "EL",
    fromDate: "2025-10-01",
    toDate: "2025-10-05",
    halfDay: false,
    reason: "Family vacation",
    attachment: null,
    daysCount: 5,
    status: "rejected",
    appliedOn: "2025-09-15T14:20:00",
    approverName: "Rajesh Kumar",
    approverComment: "Conflicts with project deadline. Please reschedule.",
    approvalStage: "Manager Rejected",
  },
];

export const useLeaveManagement = () => {
  const [balances, setBalances] = useState<LeaveBalance[]>(initialBalances);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockHistory);
  const [isApplying, setIsApplying] = useState(false);

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
    if (balance && days > balance.remaining) return `Insufficient ${balance.type} balance. You have ${balance.remaining} day(s) remaining.`;
    
    return null;
  };

  const submitLeaveRequest = (
    leaveCode: string,
    fromDate: Date,
    toDate: Date,
    halfDay: boolean,
    reason: string,
    attachment: string | null
  ) => {
    const balance = balances.find((b) => b.code === leaveCode);
    if (!balance) return;

    const daysCount = calculateDays(fromDate, toDate, halfDay);

    const newRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      leaveType: balance.type,
      leaveCode: balance.code,
      fromDate: format(fromDate, "yyyy-MM-dd"),
      toDate: format(toDate, "yyyy-MM-dd"),
      halfDay,
      reason,
      attachment,
      daysCount,
      status: "pending",
      appliedOn: new Date().toISOString(),
      approverName: "Rajesh Kumar",
      approverComment: null,
      approvalStage: "Pending Manager Approval",
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);
    setBalances((prev) =>
      prev.map((b) =>
        b.code === leaveCode
          ? { ...b, used: b.used + daysCount, remaining: b.remaining - daysCount }
          : b
      )
    );
  };

  return {
    balances,
    leaveRequests,
    isApplying,
    setIsApplying,
    calculateDays,
    validateLeaveRequest,
    submitLeaveRequest,
  };
};
