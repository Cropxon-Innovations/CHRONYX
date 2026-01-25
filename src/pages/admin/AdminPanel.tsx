import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, CreditCard, Layout, Bell, BarChart3, 
  Settings, Shield, FileText, Database, Heart
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayments from "@/components/admin/AdminPayments";
import AdminTemplates from "@/components/admin/AdminTemplates";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminPricing from "@/components/admin/AdminPricing";
import AdminServiceHealth from "@/components/admin/AdminServiceHealth";

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">CHRONYX Admin</h1>
              <p className="text-xs text-muted-foreground">OriginX Labs Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Logged in as:</span>
            <span className="text-xs font-medium">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="overview" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <Users className="w-4 h-4" />
              <span className="text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <Layout className="w-4 h-4" />
              <span className="text-xs">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <Bell className="w-4 h-4" />
              <span className="text-xs">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <Settings className="w-4 h-4" />
              <span className="text-xs">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary/10">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Health</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>
          
          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>
          
          <TabsContent value="payments">
            <AdminPayments />
          </TabsContent>
          
          <TabsContent value="templates">
            <AdminTemplates />
          </TabsContent>
          
          <TabsContent value="notifications">
            <AdminNotifications />
          </TabsContent>
          
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
          
          <TabsContent value="pricing">
            <AdminPricing />
          </TabsContent>
          
          <TabsContent value="health">
            <AdminServiceHealth />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
