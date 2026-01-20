import { LucideIcon, Info } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  maxValue?: number;
  showInfo?: boolean;
  variant?: "default" | "success" | "warning";
  className?: string;
}

export const MetricCard = ({
  icon: Icon,
  label,
  value,
  maxValue = 100,
  showInfo = true,
  variant = "default",
  className,
}: MetricCardProps) => {
  return (
    <div className={cn("metric-item", className)}>
      <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground">{label}</span>
          {showInfo && (
            <Info className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
        <ProgressBar value={value} max={maxValue} showValue variant={variant} />
      </div>
    </div>
  );
};
