import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Pin,
  PinOff,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  BadgeIndianRupee,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NetWorthData {
  netWorth: number;
  assets: number;
  liabilities: number;
  monthlyDelta: number;
  breakdown: {
    totalIncome: number;
    outstandingLoans: number;
    totalLoansTaken: number;
    totalLoansPaid: number;
    insuranceValue: number;
    // Monthly income/expense
    monthlyIncome: number;
    monthlyExpenses: number;
    // Expenses breakdown by period
    expensesToday: number;
    expensesThisWeek: number;
    expensesThisMonth: number;
    expensesThisQuarter: number;
    expensesThisYear: number;
    totalExpenses: number;
  };
}

interface CollapsibleNetWorthProps {
  isPinned: boolean;
  onTogglePin: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CollapsibleNetWorth = ({ isPinned, onTogglePin, isCollapsed, onToggleCollapse }: CollapsibleNetWorthProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMasked, setIsMasked] = useState(true); // Masked by default

  // Normalize payment status (handle null, case variations)
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "pending";
    return status.toLowerCase();
  };

  const calculateNetWorth = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch from new user_assets table + income + expenses + loans
      const [assetsResult, incomeResult, expensesResult, loansResult] = await Promise.all([
        supabase.from("user_assets").select("category_code, current_value").eq("user_id", user.id).eq("is_active", true),
        supabase.from("income_entries").select("amount, income_date").eq("user_id", user.id),
        supabase.from("expenses").select("amount, expense_date").eq("user_id", user.id),
        supabase.from("loans").select("id, principal_amount, status").eq("user_id", user.id),
      ]);

      const totalIncome = incomeResult.data?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
      const totalExpenses = expensesResult.data?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      // Calculate expenses by period
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // Start of week (Sunday)
      const startOfWeekDate = new Date(now);
      startOfWeekDate.setDate(now.getDate() - now.getDay());
      const startOfWeekStr = startOfWeekDate.toISOString().split('T')[0];
      
      // Start of month
      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Start of quarter
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarterStr = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0];
      
      // Start of year
      const startOfYearStr = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

      const expensesToday = expensesResult.data
        ?.filter(e => e.expense_date === todayStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const expensesThisWeek = expensesResult.data
        ?.filter(e => e.expense_date >= startOfWeekStr && e.expense_date <= todayStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const expensesThisMonth = expensesResult.data
        ?.filter(e => e.expense_date >= startOfMonthStr && e.expense_date <= endOfMonthStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const expensesThisQuarter = expensesResult.data
        ?.filter(e => e.expense_date >= startOfQuarterStr && e.expense_date <= todayStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const expensesThisYear = expensesResult.data
        ?.filter(e => e.expense_date >= startOfYearStr && e.expense_date <= todayStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      // Monthly income
      const monthlyIncome = incomeResult.data
        ?.filter(e => e.income_date >= startOfMonthStr && e.income_date <= endOfMonthStr)
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      // Calculate loans: total principal, outstanding, and paid
      let totalLoansTaken = 0;
      let outstandingLoans = 0;
      let totalLoansPaid = 0;

      if (loansResult.data && loansResult.data.length > 0) {
        // Total principal of all loans (active + closed)
        totalLoansTaken = loansResult.data.reduce((sum, loan) => sum + Number(loan.principal_amount), 0);

        const loanIds = loansResult.data.map(l => l.id);
        
        // Get all EMI data with emi_date for proper sorting
        const { data: emiData } = await supabase
          .from("emi_schedule")
          .select("loan_id, emi_date, principal_component, remaining_principal, payment_status")
          .in("loan_id", loanIds)
          .order("emi_date", { ascending: true });

        if (emiData) {
          // Calculate outstanding (remaining principal from first pending EMI of each loan)
          const loanRemainingMap = new Map<string, number>();

          emiData.forEach(emi => {
            const status = normalizeStatus(emi.payment_status);
            if (status === 'pending' && !loanRemainingMap.has(emi.loan_id)) {
              // Remaining = remaining_principal + current principal component (since this EMI is not paid yet)
              loanRemainingMap.set(emi.loan_id, Number(emi.remaining_principal) + Number(emi.principal_component));
            }
          });

          outstandingLoans = Array.from(loanRemainingMap.values()).reduce((sum, val) => sum + val, 0);

          // Calculate paid = Total principal - Outstanding
          totalLoansPaid = Math.max(0, totalLoansTaken - outstandingLoans);
        }
      }

      // Calculate total assets from user_assets table (excluding INSURANCE_ASSET which is just coverage info)
      const totalUserAssets = (assetsResult.data || [])
        .filter(a => a.category_code !== 'INSURANCE_ASSET')
        .reduce((sum, asset) => sum + Number(asset.current_value || 0), 0);

      // Insurance coverage is informational, not counted as asset value
      const insuranceValue = (assetsResult.data || [])
        .filter(a => a.category_code === 'INSURANCE_ASSET')
        .reduce((sum, asset) => sum + Number(asset.current_value || 0), 0);

      const monthlyDelta = monthlyIncome - expensesThisMonth;
      
      // Assets = Total Income + User Assets (from assets table)
      const assets = totalIncome + totalUserAssets;
      
      // Liabilities = Only Outstanding Loans (NOT expenses)
      const liabilities = outstandingLoans;
      
      // Net Worth = Assets - Liabilities
      const netWorth = assets - liabilities;

      setData({ 
        netWorth, 
        assets, 
        liabilities, 
        monthlyDelta, 
        breakdown: { 
          totalIncome, 
          outstandingLoans,
          totalLoansTaken,
          totalLoansPaid,
          insuranceValue,
          monthlyIncome,
          monthlyExpenses: expensesThisMonth,
          expensesToday,
          expensesThisWeek,
          expensesThisMonth,
          expensesThisQuarter,
          expensesThisYear,
          totalExpenses,
        } 
      });
    } catch (error) {
      console.error("Error calculating net worth:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) calculateNetWorth();
  }, [user, calculateNetWorth]);

  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase.channel('income-changes-nw').on('postgres_changes', { event: '*', schema: 'public', table: 'income_entries' }, calculateNetWorth).subscribe(),
      supabase.channel('expenses-changes-nw').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, calculateNetWorth).subscribe(),
      supabase.channel('loans-changes-nw').on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, calculateNetWorth).subscribe(),
      supabase.channel('emi-changes-nw').on('postgres_changes', { event: '*', schema: 'public', table: 'emi_schedule' }, calculateNetWorth).subscribe(),
      supabase.channel('insurance-changes-nw').on('postgres_changes', { event: '*', schema: 'public', table: 'insurances' }, calculateNetWorth).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, calculateNetWorth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await calculateNetWorth();
  };

  const formatCurrency = (amount: number, masked: boolean = isMasked) => {
    if (masked) return "₹****";
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (absAmount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (absAmount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const formatDelta = (amount: number) => {
    if (isMasked) return "₹**** this month";
    const prefix = amount >= 0 ? "+" : "";
    return `${prefix}${formatCurrency(amount, false)} this month`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-20 mb-2"></div>
        <div className="h-6 bg-muted rounded w-24"></div>
      </div>
    );
  }

  if (!data) return null;

  const TrendIcon = data.monthlyDelta > 0 ? TrendingUp : data.monthlyDelta < 0 ? TrendingDown : Minus;
  const trendColor = data.monthlyDelta > 0 ? "text-vyom-success" : data.monthlyDelta < 0 ? "text-destructive" : "text-muted-foreground";

  // Minimized view
  if (isCollapsed) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors" onClick={onToggleCollapse}>
        <Wallet className="w-4 h-4 text-vyom-accent" />
        <span className={`text-sm font-semibold ${data.netWorth >= 0 ? "text-foreground" : "text-destructive"}`}>
          {isMasked ? "₹****" : formatCurrency(Math.abs(data.netWorth), false)}
        </span>
        <TrendIcon className={`w-3 h-3 ${trendColor}`} />
        <Maximize2 className="w-3 h-3 text-muted-foreground ml-auto" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-vyom-accent" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Worth</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMasked(!isMasked)} title={isMasked ? "Show amounts" : "Hide amounts"}>
            {isMasked ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onTogglePin} title={isPinned ? "Unpin" : "Pin to screen"}>
            {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleCollapse}>
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        <div>
          <p className={`text-xl font-bold ${data.netWorth >= 0 ? "text-foreground" : "text-destructive"}`}>
            {data.netWorth < 0 && !isMasked ? "-" : ""}{isMasked ? "₹****" : formatCurrency(Math.abs(data.netWorth), false)}
          </p>
          <div className={`flex items-center gap-1 mt-0.5 ${trendColor}`}>
            {data.monthlyDelta !== 0 && (data.monthlyDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
            <span className="text-xs">{formatDelta(data.monthlyDelta)}</span>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 px-2 text-xs">
              <span>Details</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-vyom-success/10 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Assets</p>
                <p className="text-xs font-semibold text-vyom-success">{formatCurrency(data.assets)}</p>
              </div>
              <div className="bg-destructive/10 rounded p-2">
                <p className="text-[10px] text-muted-foreground uppercase">Liabilities</p>
                <p className="text-xs font-semibold text-destructive">{formatCurrency(data.liabilities)}</p>
              </div>
            </div>

            {/* This Month Summary */}
            <div className="bg-muted/30 rounded-lg p-2 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <BadgeIndianRupee className="w-3 h-3" />
                This Month
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Income</span>
                  <span className="text-vyom-success font-medium">{formatCurrency(data.breakdown.monthlyIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expense</span>
                  <span className="text-destructive font-medium">{formatCurrency(data.breakdown.monthlyExpenses)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Income</span><span className="text-vyom-success">{formatCurrency(data.breakdown.totalIncome)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Insurance</span><span>{formatCurrency(data.breakdown.insuranceValue)}</span></div>
              
              <div className="pt-2 mt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Liabilities</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Loans Taken</span><span>{formatCurrency(data.breakdown.totalLoansTaken)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Loans Paid</span><span className="text-vyom-success">{formatCurrency(data.breakdown.totalLoansPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Loans Outstanding</span><span className="text-destructive">{formatCurrency(data.breakdown.outstandingLoans)}</span></div>
              </div>
              
              <div className="pt-2 mt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  Expenses
                </p>
                <div className="flex justify-between"><span className="text-muted-foreground">Today</span><span>{formatCurrency(data.breakdown.expensesToday)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Week</span><span>{formatCurrency(data.breakdown.expensesThisWeek)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Month</span><span>{formatCurrency(data.breakdown.expensesThisMonth)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Quarter</span><span>{formatCurrency(data.breakdown.expensesThisQuarter)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Year</span><span>{formatCurrency(data.breakdown.expensesThisYear)}</span></div>
                <div className="flex justify-between font-medium"><span className="text-muted-foreground">All Time</span><span>{formatCurrency(data.breakdown.totalExpenses)}</span></div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default CollapsibleNetWorth;