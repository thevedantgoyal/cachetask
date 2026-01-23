import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Calendar, Folder, Flag } from "lucide-react";

interface TaskCardProps {
  title: string;
  description?: string;
  project: string;
  dueLabel: string;
  priority?: string | null;
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
}

const priorityConfig = {
  urgent: { color: "bg-destructive/10 text-destructive", label: "Urgent" },
  high: { color: "bg-orange-500/10 text-orange-600", label: "High" },
  medium: { color: "bg-yellow-500/10 text-yellow-600", label: "Medium" },
  low: { color: "bg-green-500/10 text-green-600", label: "Low" },
};

export const TaskCard = ({
  title,
  description,
  project,
  dueLabel,
  priority,
  imageUrl,
  className,
  onClick,
}: TaskCardProps) => {
  const priorityInfo = priority
    ? priorityConfig[priority as keyof typeof priorityConfig]
    : null;
  const isOverdue = dueLabel === "Overdue";

  return (
    <motion.div
      className={cn(
        "bg-card rounded-2xl p-4 shadow-soft border border-border/50 cursor-pointer hover:shadow-card transition-shadow",
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with priority and due date */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                isOverdue
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Calendar className="w-3 h-3" />
              {dueLabel}
            </span>
            {priorityInfo && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                  priorityInfo.color
                )}
              >
                <Flag className="w-3 h-3" />
                {priorityInfo.label}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}

          {/* Project */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Folder className="w-3.5 h-3.5" />
            <span>{project}</span>
          </div>
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-accent flex-shrink-0">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
