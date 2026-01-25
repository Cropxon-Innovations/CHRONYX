import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, CreditCard, Layout, Bell, BarChart3, 
  Settings, Heart, ChevronLeft, ChevronRight, LogOut, Database,
  Activity, Megaphone, FileText
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminTemplates from "@/components/admin/AdminTemplates";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminPricing from "@/components/admin/AdminPricing";
import AdminServiceHealth from "@/components/admin/AdminServiceHealth";
import AdminDatabase from "@/components/admin/AdminDatabase";
import AdminActivityLogs from "@/components/admin/AdminActivityLogs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, description: "Dashboard overview" },
  { id: "users", label: "Users", icon: Users, description: "User management" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Payment records" },
  { id: "templates", label: "Templates", icon: Layout, description: "Template library" },
  { id: "notifications", label: "Notifications", icon: Megaphone, description: "System notifications" },
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "Platform analytics" },
  { id: "pricing", label: "Pricing", icon: Settings, description: "Pricing configuration" },
  { id: "database", label: "Database", icon: Database, description: "Tables & schema" },
  { id: "activity", label: "Activity Logs", icon: Activity, description: "User activity" },
  { id: "health", label: "Service Health", icon: Heart, description: "System status" },
];

const AdminPanel = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Redirect non-admins after auth check is complete
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (isAdmin === false) {
        navigate("/app", { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "payments":
        return <AdminPayments />;
      case "templates":
        return <AdminTemplates />;
      case "notifications":
        return <AdminNotifications />;
      case "analytics":
        return <AdminAnalytics />;
      case "pricing":
        return <AdminPricing />;
      case "database":
        return <AdminDatabase />;
      case "activity":
        return <AdminActivityLogs />;
      case "health":
        return <AdminServiceHealth />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border/50 z-50 transition-all duration-300 flex flex-col",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Logo Section */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-semibold text-sm truncate">CHRONYX Admin</h1>
                <p className="text-[10px] text-muted-foreground truncate">OriginX Labs Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "hover:bg-muted/50",
                  activeTab === item.id 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", activeTab === item.id && "text-primary")} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="p-3 border-t border-border/50">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-muted/30",
            isSidebarCollapsed && "justify-center"
          )}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user?.email}</p>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Admin</Badge>
              </div>
            )}
          </div>
          
          {!isSidebarCollapsed && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2 justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300",
        isSidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 h-14 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-full px-6">
            <div>
              <h2 className="font-semibold">
                {menuItems.find(item => item.id === activeTab)?.label || "Overview"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {menuItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                System Online
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;