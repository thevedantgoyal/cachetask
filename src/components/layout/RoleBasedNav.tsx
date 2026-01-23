import { Home, ListTodo, History, BarChart3, User, Shield, Users, TrendingUp, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useUserRoles";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  roles?: string[]; // If empty/undefined, show to all
}

const allNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ListTodo, label: "Tasks", path: "/tasks" },
  { icon: TrendingUp, label: "Skills", path: "/skills" },
  { icon: History, label: "History", path: "/history" },
  { icon: BarChart3, label: "Stats", path: "/performance" },
  { icon: Users, label: "Team", path: "/manager", roles: ["manager", "team_lead", "hr", "admin"] },
  { icon: Shield, label: "Admin", path: "/admin", roles: ["admin"] },
  { icon: User, label: "Profile", path: "/profile" },
];

export const RoleBasedNav = () => {
  const location = useLocation();
  const { roles, loading } = useUserRoles();

  // Filter nav items based on user roles
  const visibleItems = allNavItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((role) => roles.includes(role as any));
  });

  // Limit to 5 items for mobile bottom nav
  const navItems = visibleItems.slice(0, 5);

  if (loading) {
    return (
      <nav className="bottom-nav z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-2">
              <div className="w-5 h-5 bg-muted rounded animate-pulse" />
              <div className="w-8 h-2 bg-muted rounded mt-1 animate-pulse" />
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn("bottom-nav-item relative flex-1", isActive && "active")}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full bg-primary"
                    style={{ x: "-50%" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
