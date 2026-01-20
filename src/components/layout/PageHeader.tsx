import { ChevronLeft, Settings, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  showSettings?: boolean;
  showMenu?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  showBack = false,
  showSettings = false,
  showMenu = false,
  rightElement,
  className,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className={cn("flex items-center justify-between py-4", className)}>
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {showMenu && (
          <button className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <h1 className="page-header py-0">{title}</h1>
      
      <div className="w-10 flex justify-end">
        {showSettings && (
          <button className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        {rightElement}
      </div>
    </header>
  );
};
