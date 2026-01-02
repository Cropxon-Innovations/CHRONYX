import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Wallet,
  Shield,
  Clock,
  Trophy,
  Activity,
  LogOut,
} from "lucide-react";

const navItems = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/todos", label: "Todos", icon: CheckSquare },
  { path: "/app/study", label: "Study", icon: BookOpen },
  { path: "/app/loans", label: "Loans & EMI", icon: Wallet },
  { path: "/app/insurance", label: "Insurance", icon: Shield },
  { path: "/app/lifespan", label: "Lifespan", icon: Clock },
  { path: "/app/achievements", label: "Achievements", icon: Trophy },
  { path: "/app/activity", label: "Activity", icon: Activity },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/app" className="text-xl font-light tracking-[0.25em] text-sidebar-foreground">
          VYOM
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 vyom-scrollbar overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Exit
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
