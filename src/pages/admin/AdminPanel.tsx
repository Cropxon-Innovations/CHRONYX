import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, CreditCard, Layout, Bell, BarChart3, 
  Settings, Heart, ChevronLeft, ChevronRight, LogOut, Database,
  Activity, Megaphone, Zap, HardDrive, Table2
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminTemplates from "@/components/admin/AdminTemplates";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminPricing from "@/components/admin/AdminPricing";
import AdminServiceHealth from "@/components/admin/AdminServiceHealth";
import AdminActivityLogs from "@/components/admin/AdminActivityLogs";
import AdminEdgeFunctions from "@/components/admin/AdminEdgeFunctions";
import AdminStorageBuckets from "@/components/admin/AdminStorageBuckets";
import AdminDatabaseTables from "@/components/admin/AdminDatabaseTables";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  description: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  // Main
  { id: "overview", label: "Overview", icon: LayoutDashboard, description: "Dashboard overview", section: "Main" },
  { id: "users", label: "Users", icon: Users, description: "User management", section: "Main" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Payment records", section: "Main" },
  { id: "activity", label: "Activity Logs", icon: Activity, description: "User activity", section: "Main" },
  
  // Infrastructure
  { id: "edge-functions", label: "Edge Functions", icon: Zap, description: "47 serverless functions", section: "Infrastructure" },
  { id: "database", label: "Database Tables", icon: Table2, description: "179 database tables", section: "Infrastructure" },
  { id: "storage", label: "Storage Buckets", icon: HardDrive, description: "11 storage buckets", section: "Infrastructure" },
  
  // Content
  { id: "templates", label: "Templates", icon: Layout, description: "Template library", section: "Content" },
  { id: "notifications", label: "Notifications", icon: Megaphone, description: "System notifications", section: "Content" },
  
  // Analytics & Config
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "Platform analytics", section: "Analytics" },
  { id: "pricing", label: "Pricing", icon: Settings, description: "Pricing configuration", section: "Analytics" },
  { id: "health", label: "Service Health", icon: Heart, description: "System status", section: "Analytics" },
];

const AdminPanel = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
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
      case "activity":
        return <AdminActivityLogs />;
      case "health":
        return <AdminServiceHealth />;
      case "edge-functions":
        return <AdminEdgeFunctions />;
      case "database":
        return <AdminDatabaseTables />;
      case "storage":
        return <AdminStorageBuckets />;
      default:
        return <AdminOverview />;
    }
  };

  // Group menu items by section
  const sections = ["Main", "Infrastructure", "Content", "Analytics"];
  const groupedItems = sections.map(section => ({
    section,
    items: menuItems.filter(item => item.section === section)
  }));

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
          <nav className="px-2 space-y-4">
            {groupedItems.map(({ section, items }) => (
              <div key={section}>
                {!isSidebarCollapsed && (
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {section}
                  </p>
                )}
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
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
                </div>
              </div>
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
