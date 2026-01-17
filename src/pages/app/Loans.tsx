import { useState, useMemo } from "react";
import { Plus, FileText, History, Calendar, Settings, Scale, CreditCard, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { LoanSummaryCards, formatCurrency } from "@/components/loans/LoanSummaryCards";
import { LoanCard } from "@/components/loans/LoanCard";
import { AddLoanForm, LoanFormData } from "@/components/loans/AddLoanForm";
import { EmiScheduleTable } from "@/components/loans/EmiScheduleTable";
import { LoanActions } from "@/components/loans/LoanActions";
import { getBankColor, getBankInitials } from "@/components/loans/BankLogos";
import { AmortizationPDF } from "@/components/loans/AmortizationPDF";
import { LoanDocuments } from "@/components/loans/LoanDocuments";
import { LoanHistory } from "@/components/loans/LoanHistory";
import { BulkEmiPayment } from "@/components/loans/BulkEmiPayment";
import { LoanComparison } from "@/components/loans/LoanComparison";
import RefinanceCalculator from "@/components/loans/RefinanceCalculator";
import FloatingEmiCard from "@/components/loans/FloatingEmiCard";

const Loans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showBulkPayment, setShowBulkPayment] = useState(false);
  const [showRefinance, setShowRefinance] = useState(false);

  // Fetch loans
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["loans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all EMI schedules
  const { data: allEmis = [] } = useQuery({
    queryKey: ["all-emis", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emi_schedule")
        .select("*")
        .order("emi_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch this month's expenses
  const { data: monthlyExpenses = 0 } = useQuery({
    queryKey: ["monthly-expenses", user?.id],
    queryFn: async () => {
      const now = new Date();
      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", startOfMonthStr)
        .lte("expense_date", endOfMonthStr);
      if (error) throw error;
      return data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    },
    enabled: !!user,
  });

  // Normalize payment status (handle null, case variations)
  const normalizeStatusForSummary = (status: string | null | undefined): string => {
    if (!status) return "pending";
    return status.toLowerCase();
  };

  // Calculate summary metrics
  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const activeLoans = loans.filter(l => l.status === "active" || !l.status);
    
    let totalOutstanding = 0;
    let emiDueThisMonth = 0;
    let totalEmiThisMonth = 0;

    activeLoans.forEach(loan => {
      const loanEmis = allEmis
        .filter(e => e.loan_id === loan.id)
        .sort((a, b) => parseISO(a.emi_date).getTime() - parseISO(b.emi_date).getTime());
      
      const pendingEmis = loanEmis.filter(e => normalizeStatusForSummary(e.payment_status) === "pending");
      
      if (pendingEmis.length > 0) {
        const firstPending = pendingEmis[0];
        totalOutstanding += Number(firstPending.remaining_principal) + Number(firstPending.principal_component);
      }

      // EMIs due this month
      const thisMonthEmis = pendingEmis.filter(e => {
        const emiDate = parseISO(e.emi_date);
        return isWithinInterval(emiDate, { start: monthStart, end: monthEnd });
      });

      emiDueThisMonth += thisMonthEmis.length;
      totalEmiThisMonth += thisMonthEmis.reduce((sum, e) => sum + Number(e.emi_amount), 0);
    });

    return {
      totalOutstanding,
      activeLoansCount: activeLoans.length,
      emiDueThisMonth,
      totalEmiThisMonth,
    };
  }, [loans, allEmis]);
  // Normalize payment status (handle null, case variations)
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "pending";
    return status.toLowerCase();
  };

  // Get loan details for cards
  const getLoanDetails = (loanId: string) => {
    const loanEmis = allEmis
      .filter(e => e.loan_id === loanId)
      .sort((a, b) => parseISO(a.emi_date).getTime() - parseISO(b.emi_date).getTime());
    
    const paidEmis = loanEmis.filter(e => normalizeStatus(e.payment_status) === "paid");
    const pendingEmis = loanEmis.filter(e => normalizeStatus(e.payment_status) === "pending");
    
    // Remaining principal = first pending EMI's remaining_principal (after this EMI is paid)
    // Since remaining_principal in DB is "balance after this EMI", we use it directly
    const firstPendingEmi = pendingEmis[0];
    const remainingPrincipal = firstPendingEmi 
      ? Number(firstPendingEmi.remaining_principal) + Number(firstPendingEmi.principal_component)
      : 0;

    return {
      remainingPrincipal,
      paidCount: paidEmis.length,
      pendingCount: pendingEmis.length,
      nextEmiDate: firstPendingEmi ? format(parseISO(firstPendingEmi.emi_date), "MMM dd") : undefined,
      schedule: loanEmis,
    };
  };

  // Add loan mutation
  const addLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const { data: loan, error } = await supabase
        .from("loans")
        .insert({ ...data, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-emi-schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_id: loan.id,
            principal: data.principal_amount,
            annual_interest_rate: data.interest_rate,
            tenure_months: data.tenure_months,
            emi_start_date: data.start_date,
            emi_amount_override: data.emi_amount,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate EMI schedule");
      return loan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["all-emis"] });
      toast({ title: "Loan added successfully" });
      setShowAddLoan(false);
    },
    onError: () => {
      toast({ title: "Failed to add loan", variant: "destructive" });
    },
  });

  // Edit loan mutation
  const editLoanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LoanFormData }) => {
      const { error } = await supabase.from("loans").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ title: "Loan updated" });
      setEditingLoan(null);
    },
    onError: () => {
      toast({ title: "Failed to update loan", variant: "destructive" });
    },
  });

  // Delete loan mutation
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("emi_schedule").delete().eq("loan_id", id);
      await supabase.from("emi_events").delete().eq("loan_id", id);
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["all-emis"] });
      toast({ title: "Loan deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete loan", variant: "destructive" });
    },
  });

  // Mark EMI paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async ({ emiId, paidDate, paymentMethod }: { emiId: string; paidDate: string; paymentMethod: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark-emi-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emi_id: emiId, paid_date: paidDate, payment_method: paymentMethod }),
        }
      );
      if (!response.ok) throw new Error("Failed to mark EMI as paid");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-emis"] });
      toast({ title: "EMI marked as paid" });
    },
  });

  // Part payment mutation
  const partPaymentMutation = useMutation({
    mutationFn: async ({ loanId, amount, date, reductionType, method }: any) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-part-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_id: loanId,
            amount,
            payment_date: date,
            reduction_type: reductionType,
            payment_method: method,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to apply part-payment");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-emis"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ 
        title: "Part-payment applied",
        description: `Interest saved: ${formatCurrency(data.interest_saved, "INR")}`,
      });
    },
  });

  // Foreclosure mutation
  const foreclosureMutation = useMutation({
    mutationFn: async ({ loanId, date, method }: any) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-foreclosure`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loan_id: loanId,
            foreclosure_date: date,
            payment_method: method,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to foreclose loan");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-emis"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ 
        title: "Loan foreclosed",
        description: `Interest saved: ${formatCurrency(data.interest_saved, "INR")}`,
      });
      setSelectedLoanId(null);
    },
  });

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const selectedLoanDetails = selectedLoanId ? getLoanDetails(selectedLoanId) : null;

  const floatingEmiCard = (
    <FloatingEmiCard
      loans={loans}
      allEmis={allEmis}
      onMarkPaid={(emiId, paidDate, paymentMethod) =>
        markPaidMutation.mutate({ emiId, paidDate, paymentMethod })
      }
      isLoading={markPaidMutation.isPending}
    />
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide">Loans & EMI</h1>
          <p className="text-sm text-muted-foreground mt-1">Personal liability ledger</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {loans.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowRefinance(!showRefinance)}
              className="border-border"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Refinance
            </Button>
          )}
          {loans.length > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setShowComparison(!showComparison)}
              className="border-border"
            >
              <Scale className="w-4 h-4 mr-2" />
              Compare
            </Button>
          )}
          {allEmis.filter(e => e.payment_status === "Pending").length > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setShowBulkPayment(!showBulkPayment)}
              className="border-border"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Bulk Pay
            </Button>
          )}
          <Button onClick={() => setShowAddLoan(true)} className="bg-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Add Loan
          </Button>
        </div>
      </header>

      {/* Refinance Calculator */}
      {showRefinance && loans.length > 0 && (
        <div className="mb-6">
          <RefinanceCalculator loans={loans} />
        </div>
      )}

      {/* Comparison View */}
      {showComparison && (
        <LoanComparison 
          loans={loans} 
          allEmis={allEmis} 
          onClose={() => setShowComparison(false)} 
        />
      )}

      {/* Bulk Payment View */}
      {showBulkPayment && (
        <BulkEmiPayment
          pendingEmis={allEmis.filter(e => e.payment_status === "Pending")}
          loans={loans}
          onMarkPaid={(emiIds, paidDate, paymentMethod) => {
            // Mark each EMI as paid
            emiIds.forEach(emiId => {
              markPaidMutation.mutate({ emiId, paidDate, paymentMethod });
            });
          }}
          isLoading={markPaidMutation.isPending}
          onClose={() => setShowBulkPayment(false)}
        />
      )}

      {/* Summary Cards */}
      <LoanSummaryCards
        totalOutstanding={summary.totalOutstanding}
        activeLoansCount={summary.activeLoansCount}
        emiDueThisMonth={summary.emiDueThisMonth}
        totalEmiThisMonth={summary.totalEmiThisMonth}
        currency="INR"
      />

      {/* Monthly Expenses Badge */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Expenses This Month</p>
            <p className="text-xs text-muted-foreground">{format(new Date(), "MMMM yyyy")}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-foreground">{formatCurrency(monthlyExpenses, "INR")}</p>
          <p className="text-xs text-muted-foreground">Total spent</p>
        </div>
      </div>

      {/* EMI Card - shown inline for all screen sizes */}
      {floatingEmiCard}

      <div className="space-y-6">
        <div className="min-w-0">
          {/* Main Content */}
          {selectedLoan ? (
            <div className="space-y-6">
              {/* Back button and loan header */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setSelectedLoanId(null)} className="text-muted-foreground">
                  ← Back to Loans
                </Button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: getBankColor(selectedLoan.bank_name) }}
                >
                  {getBankInitials(selectedLoan.bank_name)}
                </div>
                <div>
                  <h2 className="text-lg font-medium">{selectedLoan.bank_name} - {selectedLoan.loan_type} Loan</h2>
                  <p className="text-sm text-muted-foreground">
                    A/C: {selectedLoan.loan_account_number} • {selectedLoan.interest_rate}% p.a.
                  </p>
                </div>
              </div>

              <Tabs defaultValue="schedule" className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <TabsList className="bg-muted/50 border border-border flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-card">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      EMI Schedule
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="data-[state=active]:bg-card">
                      <FileText className="w-4 h-4 mr-1.5" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-card">
                      <History className="w-4 h-4 mr-1.5" />
                      History
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="data-[state=active]:bg-card">
                      <Settings className="w-4 h-4 mr-1.5" />
                      Actions
                    </TabsTrigger>
                  </TabsList>
                  <AmortizationPDF loan={selectedLoan} schedule={selectedLoanDetails?.schedule || []} />
                </div>

                <TabsContent value="schedule">
                  <EmiScheduleTable
                    schedule={selectedLoanDetails?.schedule || []}
                    currency={selectedLoan.country === "USA" ? "USD" : "INR"}
                    onMarkPaid={(emiId, paidDate, paymentMethod) =>
                      markPaidMutation.mutate({ emiId, paidDate, paymentMethod })
                    }
                    isLoading={markPaidMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="documents">
                  <LoanDocuments loanId={selectedLoan.id} />
                </TabsContent>

                <TabsContent value="history">
                  <LoanHistory
                    loanId={selectedLoan.id}
                    currency={selectedLoan.country === "USA" ? "USD" : "INR"}
                  />
                </TabsContent>

                <TabsContent value="actions">
                  <LoanActions
                    loanId={selectedLoan.id}
                    currency={selectedLoan.country === "USA" ? "USD" : "INR"}
                    outstandingPrincipal={selectedLoanDetails?.remainingPrincipal || 0}
                    onPartPayment={(amount, date, reductionType, method) =>
                      partPaymentMutation.mutate({ loanId: selectedLoan.id, amount, date, reductionType, method })
                    }
                    onForeclosure={(date, method) =>
                      foreclosureMutation.mutate({ loanId: selectedLoan.id, date, method })
                    }
                    isLoading={partPaymentMutation.isPending || foreclosureMutation.isPending}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Loans</h2>
              {loansLoading ? (
                <div className="p-12 text-center text-muted-foreground">Loading...</div>
              ) : loans.length === 0 ? (
                <div className="p-12 text-center bg-card border border-border rounded-lg">
                  <p className="text-muted-foreground mb-4">No loans added yet</p>
                  <Button onClick={() => setShowAddLoan(true)} variant="outline" className="border-border">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Loan
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {loans.map((loan) => {
                    const details = getLoanDetails(loan.id);
                    return (
                      <LoanCard
                        key={loan.id}
                        loan={loan}
                        remainingPrincipal={details.remainingPrincipal}
                        paidCount={details.paidCount}
                        pendingCount={details.pendingCount}
                        nextEmiDate={details.nextEmiDate}
                        onClick={() => setSelectedLoanId(loan.id)}
                        onEdit={() => setEditingLoan(loan)}
                        onDelete={() => {
                          if (confirm("Delete this loan and all EMI data?")) {
                            deleteLoanMutation.mutate(loan.id);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Add Loan Dialog */}
      <AddLoanForm
        open={showAddLoan}
        onOpenChange={setShowAddLoan}
        onSubmit={(data) => addLoanMutation.mutate(data)}
        isLoading={addLoanMutation.isPending}
      />

      {/* Edit Loan Dialog */}
      <AddLoanForm
        open={!!editingLoan}
        onOpenChange={(open) => !open && setEditingLoan(null)}
        onSubmit={(data) => editLoanMutation.mutate({ id: editingLoan.id, data })}
        isLoading={editLoanMutation.isPending}
        initialData={editingLoan}
        mode="edit"
      />
    </div>
  );
};

export default Loans;
