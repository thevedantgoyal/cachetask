import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  description?: string;
  project: string;
  dueLabel: string;
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
}

export const TaskCard = ({
  title,
  description,
  project,
  dueLabel,
  imageUrl,
  className,
  onClick,
}: TaskCardProps) => {
  return (
    <motion.div
      className={cn("task-card flex gap-4", className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-primary">{dueLabel}</span>
        <h3 className="font-semibold text-foreground mt-1 line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">Project: {project}</p>
      </div>
      {imageUrl && (
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-accent flex-shrink-0">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.div>
  );
};
