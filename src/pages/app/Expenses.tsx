import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, TrendingUp, Calendar, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import ExpensesList from "@/components/expenses/ExpensesList";
import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import ExpenseCharts from "@/components/expenses/ExpenseCharts";
import FinanceFlowSettings from "@/components/finance/FinanceFlowSettings";
import FinanceFlowButton from "@/components/finance/FinanceFlowButton";
import GmailConnectionSuccess from "@/components/finance/GmailConnectionSuccess";
import FinanceFlowErrorAlert, { parseFinanceFlowError, type FinanceFlowErrorCode } from "@/components/finance/FinanceFlowErrorAlert";
import FinanceFlowAnalytics from "@/components/finance/FinanceFlowAnalytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExpenseStats {
  todayTotal: number;
  monthTotal: number;
  topCategory: string;
  avgDaily: number;
}

const Expenses = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState<ExpenseStats>({
    todayTotal: 0,
    monthTotal: 0,
    topCategory: "-",
    avgDaily: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Gmail connection success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [connectedGmailEmail, setConnectedGmailEmail] = useState<string | null>(null);
  
  // Error state
  const [gmailError, setGmailError] = useState<FinanceFlowErrorCode | null>(null);

  // Handle Gmail OAuth callback messages
  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const gmailEmail = searchParams.get("gmail_email");
    const gmailErrorParam = searchParams.get("gmail_error");
    
    if (gmailConnected) {
      setConnectedGmailEmail(gmailEmail ? decodeURIComponent(gmailEmail) : null);
      setShowSuccessDialog(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (gmailErrorParam) {
      // Map error parameter to our error codes
      const errorMap: Record<string, FinanceFlowErrorCode> = {
        'PERMISSION_DENIED': 'PERMISSION_DENIED',
        'INVALID_TOKEN': 'INVALID_TOKEN',
        'CONFIG_ERROR': 'CONFIG_ERROR',
        'DATABASE_ERROR': 'UNKNOWN',
        'access_denied': 'PERMISSION_DENIED',
        'invalid_grant': 'INVALID_TOKEN',
      };
      setGmailError(errorMap[gmailErrorParam] || 'UNKNOWN');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, refreshKey]);

  const fetchStats = async () => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    // Today's expenses
    const { data: todayExpenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .eq("expense_date", today);

    const todayTotal = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // This month's expenses
    const { data: monthExpenses } = await supabase
      .from("expenses")
      .select("amount, category, expense_date")
      .eq("user_id", user.id)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd);

    const monthTotal = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // Top category
    const categoryTotals: Record<string, number> = {};
    monthExpenses?.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    // Average daily
    const uniqueDays = new Set(monthExpenses?.map((e) => e.expense_date)).size;
    const avgDaily = uniqueDays > 0 ? monthTotal / uniqueDays : 0;

    setStats({
      todayTotal,
      monthTotal,
      topCategory,
      avgDaily: Math.round(avgDaily),
    });
  };

  const handleExpenseAdded = () => {
    setIsDialogOpen(false);
    setRefreshKey((k) => k + 1);
    logActivity("Added expense", "Expenses");
  };

  const handleStartSync = async () => {
    // Trigger initial sync after connection
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke("gmail-sync", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      setRefreshKey((k) => k + 1);
      toast({
        title: "Initial Sync Started",
        description: "FinanceFlow is scanning your Gmail for transactions.",
      });
    } catch (error) {
      console.error("Initial sync error:", error);
    }
  };

  const handleErrorAction = () => {
    if (gmailError === 'TOKEN_EXPIRED' || gmailError === 'INVALID_TOKEN' || gmailError === 'PERMISSION_DENIED') {
      // Redirect to connect Gmail again
      handleConnectGmail();
    } else {
      // Just dismiss for other errors
      setGmailError(null);
    }
  };

  const handleConnectGmail = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("get-google-client-id");
      
      if (error || !data?.client_id) {
        toast({
          title: "Configuration Error",
          description: "Google OAuth is not configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const clientId = data.client_id;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;
      const state = btoa(JSON.stringify({ user_id: user.id }));
      
      const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email");
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error("OAuth error:", error);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Gmail Connection Success Dialog */}
      <GmailConnectionSuccess
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        gmailEmail={connectedGmailEmail}
        onStartSync={handleStartSync}
      />

      {/* Error Alert */}
      {gmailError && (
        <FinanceFlowErrorAlert
          errorCode={gmailError}
          onAction={handleErrorAction}
          onDismiss={() => setGmailError(null)}
        />
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your daily spending</p>
        </div>
        <div className="flex items-center gap-2">
          <FinanceFlowButton onImportComplete={() => setRefreshKey((k) => k + 1)} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="vyom">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <AddExpenseForm onSuccess={handleExpenseAdded} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              ₹{stats.todayTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              ₹{stats.monthTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground truncate">
              {stats.topCategory}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5" />
              Avg Daily
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              ₹{stats.avgDaily.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Charts Section */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-4">Analytics</h2>
        <ExpenseCharts key={`charts-${refreshKey}`} />
      </section>

      {/* FinanceFlow AI Section */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-light text-foreground mb-4 flex items-center gap-2">
            Auto Finance
            <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">BETA</span>
          </h2>
          <FinanceFlowSettings />
        </div>
        <FinanceFlowAnalytics />
      </section>

      {/* Expenses List */}
      <ExpensesList key={refreshKey} onUpdate={() => setRefreshKey((k) => k + 1)} />
    </div>
  );
};

export default Expenses;
