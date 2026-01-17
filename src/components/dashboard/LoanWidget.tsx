import { useState, useEffect } from "react";
import { CreditCard, Calendar, Home, Car, Bike, GraduationCap, Briefcase, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LoanByType {
  type: string;
  count: number;
  totalPrincipal: number;
  totalOutstanding: number;
  totalPaid: number;
}

interface LoanSummary {
  totalLoans: number;
  totalOutstanding: number;
  totalPaid: number;
  totalPrincipal: number;
  loansByType: LoanByType[];
  upcomingPayments: Array<{
    loanId: string;
    bankName: string;
    loanType: string;
    amount: number;
    dueDate: string;
    daysUntil: number;
  }>;
  overallProgress: number;
  emiDueThisMonth: number;
  emiPaidThisMonth: number;
  emiCountThisMonth: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getLoanTypeConfig = (type: string) => {
  const typeConfigs: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    'Home': { icon: Home, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    'Auto': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Car': { icon: Car, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    'Bike': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Two Wheeler': { icon: Bike, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    'Education': { icon: GraduationCap, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    'Personal': { icon: Briefcase, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    'Business': { icon: Briefcase, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  };
  return typeConfigs[type] || { icon: CreditCard, color: 'text-primary', bgColor: 'bg-primary/10' };
};

const LoanWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoanSummary();
    }
  }, [user]);

  const fetchLoanSummary = async () => {
    try {
      // Fetch active loans for the current user
      const { data: loans, error } = await supabase
        .from("loans")
        .select("id, bank_name, principal_amount, emi_amount, status, loan_type")
        .eq("user_id", user?.id)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching loans:", error);
        return;
      }

      if (!loans || loans.length === 0) {
        setSummary(null);
        setLoading(false);
        return;
      }

      // Fetch EMI schedule for all user's loans
      const loanIds = loans.map(l => l.id);
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const { data: schedules } = await supabase
        .from("emi_schedule")
        .select("loan_id, emi_amount, emi_date, payment_status, remaining_principal")
        .in("loan_id", loanIds)
        .order("emi_date", { ascending: true });

      // Calculate totals
      let totalPaid = 0;
      let totalOutstanding = 0;
      let emiDueThisMonth = 0;
      let emiPaidThisMonth = 0;
      let emiCountThisMonth = 0;
      const upcomingPayments: LoanSummary['upcomingPayments'] = [];

      // Group by loan type
      const typeGroups: Record<string, LoanByType> = {};

      loans.forEach(loan => {
        const loanType = loan.loan_type || 'Other';
        const loanSchedules = schedules?.filter(s => s.loan_id === loan.id) || [];
        const paidSchedules = loanSchedules.filter(s => s.payment_status === 'Paid');
        const pendingSchedules = loanSchedules.filter(s => s.payment_status !== 'Paid');
        
        const loanPaid = paidSchedules.reduce((sum, s) => sum + Number(s.emi_amount), 0);
        const loanOutstanding = pendingSchedules.length > 0 ? Number(pendingSchedules[0].remaining_principal || 0) : 0;
        
        totalPaid += loanPaid;
        totalOutstanding += loanOutstanding;

        // Update type groups
        if (!typeGroups[loanType]) {
          typeGroups[loanType] = { type: loanType, count: 0, totalPrincipal: 0, totalOutstanding: 0, totalPaid: 0 };
        }
        typeGroups[loanType].count += 1;
        typeGroups[loanType].totalPrincipal += Number(loan.principal_amount);
        typeGroups[loanType].totalOutstanding += loanOutstanding;
        typeGroups[loanType].totalPaid += loanPaid;

        // EMI due this month
        const thisMonthEmis = loanSchedules.filter(s => s.emi_date >= monthStart && s.emi_date <= monthEnd);
        thisMonthEmis.forEach(emi => {
          emiCountThisMonth++;
          if (emi.payment_status === 'Paid') {
            emiPaidThisMonth += Number(emi.emi_amount);
          } else {
            emiDueThisMonth += Number(emi.emi_amount);
          }
        });
        
        // Find next unpaid EMI for upcoming payments
        const nextUnpaid = pendingSchedules.find(s => s.emi_date >= today);
        if (nextUnpaid && nextUnpaid.emi_date <= nextMonth) {
          const daysUntil = Math.ceil(
            (new Date(nextUnpaid.emi_date).getTime() - new Date().getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          upcomingPayments.push({
            loanId: loan.id,
            bankName: loan.bank_name,
            loanType: loanType,
            amount: Number(nextUnpaid.emi_amount),
            dueDate: nextUnpaid.emi_date,
            daysUntil,
          });
        }
      });

      const totalPrincipal = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0);
      const overallProgress = totalPrincipal > 0 
        ? Math.round((totalPaid / (totalPaid + totalOutstanding)) * 100)
        : 0;

      const loansByType = Object.values(typeGroups);

      setSummary({
        totalLoans: loans.length,
        totalOutstanding,
        totalPaid,
        totalPrincipal,
        loansByType,
        upcomingPayments: upcomingPayments.slice(0, 3),
        overallProgress,
        emiDueThisMonth,
        emiPaidThisMonth,
        emiCountThisMonth,
      });
    } catch (error) {
      console.error("Error fetching loan summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToLoans = () => {
    navigate('/app/loans');
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loans & EMI</h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">No active loans</p>
        <button 
          onClick={handleNavigateToLoans}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Add your first loan <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loans & EMI</h3>
            <p className="text-xs text-muted-foreground">{summary.totalLoans} active loan{summary.totalLoans > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button 
          onClick={handleNavigateToLoans}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Loan Types with Icons */}
      {summary.loansByType.length > 0 && (
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-2">
            {summary.loansByType.map((item) => {
              const config = getLoanTypeConfig(item.type);
              const Icon = config.icon;
              return (
                <Tooltip key={item.type}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNavigateToLoans}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${config.bgColor} hover:scale-105 transition-transform cursor-pointer`}
                    >
                      <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <span className="text-lg font-semibold text-foreground">{item.count}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate w-full text-center">
                        {item.type}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-popover border border-border">
                    <div className="text-xs space-y-1.5">
                      <p className="font-medium">{item.type} Loan</p>
                      <p className="text-muted-foreground">
                        {item.count} {item.count === 1 ? 'loan' : 'loans'}
                      </p>
                      <div className="border-t border-border pt-1.5 space-y-1">
                        <p>Principal: {formatCurrency(item.totalPrincipal)}</p>
                        <p className="text-emerald-500">Paid: {formatCurrency(item.totalPaid)}</p>
                        <p className="text-amber-500">Pending: {formatCurrency(item.totalOutstanding)}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* EMI This Month */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">EMI This Month</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Due</p>
            <p className="text-lg font-semibold text-amber-600">{formatCurrency(summary.emiDueThisMonth)}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Paid</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(summary.emiPaidThisMonth)}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Repayment</span>
          <span className="font-medium">{summary.overallProgress}%</span>
        </div>
        <Progress value={summary.overallProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Paid: {formatCurrency(summary.totalPaid)}</span>
          <span>Remaining: {formatCurrency(summary.totalOutstanding)}</span>
        </div>
      </div>

      {/* Upcoming Payments */}
      {summary.upcomingPayments.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">Upcoming EMIs</h4>
          <div className="space-y-2">
            {summary.upcomingPayments.map((payment, index) => {
              const config = getLoanTypeConfig(payment.loanType);
              const Icon = config.icon;
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    payment.daysUntil <= 5 
                      ? 'bg-destructive/10 border border-destructive/20' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{payment.bankName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                    <p className={`text-xs ${payment.daysUntil <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {payment.daysUntil <= 0 ? 'Due today' : `${payment.daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanWidget;
