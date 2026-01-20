import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItemProps {
  icon: LucideIcon;
  title: string;
  status: "pending" | "approved" | "rejected";
  className?: string;
}

const statusStyles = {
  pending: "text-pending",
  approved: "text-success",
  rejected: "text-destructive",
};

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const HistoryItem = ({
  icon: Icon,
  title,
  status,
  className,
}: HistoryItemProps) => {
  return (
    <div className={cn("flex items-start gap-3 py-3", className)}>
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0 border-l-2 border-muted pl-3">
        <h4 className="font-medium text-foreground">{title}</h4>
        <span className={cn("text-sm font-medium", statusStyles[status])}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
};
