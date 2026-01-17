import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Calculator, 
  Calendar, 
  IndianRupee, 
  TrendingUp, 
  PiggyBank,
  Building2,
  Heart,
  Home,
  Sparkles,
  FlaskConical,
  Info,
  Download,
  Scale,
  Loader2,
  CheckCircle2,
  FileText,
  Crown,
  Lock
} from "lucide-react";

// Import new tax components
import { TaxynBot } from "@/components/tax/TaxynBot";
import { TaxLegalDisclaimer } from "@/components/tax/TaxLegalDisclaimer";
import { RegimeSavingsCard } from "@/components/tax/RegimeSavingsCard";
import { MissedDeductionsCard } from "@/components/tax/MissedDeductionsCard";

interface SlabBreakdown {
  slab_order: number;
  min_amount: number;
  max_amount: number | null;
  rate_percentage: number;
  taxable_in_slab: number;
  tax_in_slab: number;
}

interface TaxResult {
  financial_year: string;
  regime: string;
  gross_income: number;
  standard_deduction: number;
  total_deductions: number;
  deductions_breakdown: Record<string, number>;
  taxable_income: number;
  slab_breakdown: SlabBreakdown[];
  tax_before_rebate: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
}

interface ComparisonResult {
  financial_year: string;
  gross_income: number;
  old_regime: TaxResult;
  new_regime: TaxResult;
  recommended_regime: 'old' | 'new';
  savings_amount: number;
  savings_percentage: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatLakh = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return formatCurrency(amount);
};

const Tax = () => {
  const { user } = useAuth();
  const { isPro, isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState("calculator");
  
  // Form state
  const [financialYear, setFinancialYear] = useState("FY2025_26");
  const [regime, setRegime] = useState<"old" | "new">("new");
  const [grossIncome, setGrossIncome] = useState<number>(0);
  const [deductions, setDeductions] = useState({
    "80C": 0,
    "80CCD1B": 0,
    "80D": 0,
    "80E": 0,
    "24B": 0,
    "HRA": 0,
  });
  
  // Results
  const [result, setResult] = useState<TaxResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [calculationsThisMonth, setCalculationsThisMonth] = useState(0);
  
  const isProUser = isPro();
  const isPremiumUser = isPremium();
  const freeLimit = 1;
  const canCalculate = isProUser || calculationsThisMonth < freeLimit;

  // Get current FY
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const fyLabel = currentMonth >= 3 
    ? `FY ${currentYear}-${(currentYear + 1).toString().slice(-2)}` 
    : `FY ${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  // Fetch financial years from DB
  const { data: financialYears } = useQuery({
    queryKey: ["tax-financial-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_financial_years" as any)
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch user's calculation count this month
  useEffect(() => {
    const fetchCalcCount = async () => {
      if (!user) return;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from("tax_calculations" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());
      
      setCalculationsThisMonth(count || 0);
    };
    fetchCalcCount();
  }, [user, result]);

  // Fetch income data
  useEffect(() => {
    const fetchIncomeData = async () => {
      if (!user) return;
      
      const fyStart = currentMonth >= 3 
        ? new Date(currentYear, 3, 1) 
        : new Date(currentYear - 1, 3, 1);
      const fyEnd = currentMonth >= 3 
        ? new Date(currentYear + 1, 2, 31) 
        : new Date(currentYear, 2, 31);
      
      const { data: incomeData } = await supabase
        .from("income_entries")
        .select("amount")
        .eq("user_id", user.id)
        .gte("income_date", format(fyStart, "yyyy-MM-dd"))
        .lte("income_date", format(fyEnd, "yyyy-MM-dd"));
      
      const totalIncome = incomeData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      if (totalIncome > 0 && grossIncome === 0) {
        setGrossIncome(totalIncome);
      }

      // Fetch insurance for 80D
      const { data: insuranceData } = await supabase
        .from("insurances")
        .select("premium_amount, policy_type")
        .eq("user_id", user.id)
        .eq("status", "active");

      const healthPremiums = insuranceData
        ?.filter(i => i.policy_type === "Health")
        .reduce((sum, i) => sum + Number(i.premium_amount), 0) || 0;
      
      if (healthPremiums > 0 && deductions["80D"] === 0) {
        setDeductions(prev => ({ ...prev, "80D": Math.min(healthPremiums, 75000) }));
      }
    };
    fetchIncomeData();
  }, [user]);

  // Calculate tax mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tax-calculate", {
        body: {
          financial_year: financialYear,
          regime,
          gross_income: grossIncome,
          deductions: regime === "old" ? deductions : {},
          save_calculation: true,
        },
      });

      if (response.error) throw response.error;
      return response.data as TaxResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setCalculationsThisMonth(prev => prev + 1);
      toast.success("Tax calculated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to calculate tax");
    },
  });

  // Compare regimes mutation
  const compareMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tax-compare", {
        body: {
          financial_year: financialYear,
          gross_income: grossIncome,
          deductions,
        },
      });

      if (response.error) throw response.error;
      return response.data as ComparisonResult;
    },
    onSuccess: (data) => {
      setComparison(data);
      toast.success("Comparison complete!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to compare regimes");
    },
  });

  const updateDeduction = (key: string, value: number) => {
    setDeductions((prev) => ({ ...prev, [key]: value }));
  };

  const getTaxBracket = () => {
    if (!result) return 30;
    const income = result.taxable_income;
    if (income > 1500000) return 30;
    if (income > 1200000) return 20;
    if (income > 1000000) return 15;
    if (income > 700000) return 10;
    if (income > 300000) return 5;
    return 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">
              Tax Dashboard
            </h1>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-violet-500/10 text-violet-500 border-violet-500/30">
              <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
              BETA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {fyLabel} • Indian Income Tax Calculator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="w-3 h-3" />
            {fyLabel}
          </Badge>
          {!isProUser && (
            <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/30">
              {calculationsThisMonth}/{freeLimit} calculations
            </Badge>
          )}
        </div>
      </header>

      {/* Free tier notice */}
      {!isProUser && (
        <Alert className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <AlertTitle className="text-violet-600">Tax Snapshot (Free)</AlertTitle>
          <AlertDescription className="text-sm">
            {calculationsThisMonth >= freeLimit ? (
              <span className="text-destructive">
                You've used your free calculation this month. Upgrade to Pro for unlimited access.
              </span>
            ) : (
              <>
                Basic comparison & slab breakdown. Upgrade to <strong>Pro</strong> for deduction optimization, 
                PDF export, and TAXYN assistant.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="slabs">Slabs</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="w-5 h-5 text-primary" />
                    Income & Tax Calculation
                  </CardTitle>
                  <CardDescription>
                    Enter your income details for {fyLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Financial Year */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Financial Year</Label>
                      <Select value={financialYear} onValueChange={setFinancialYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select FY" />
                        </SelectTrigger>
                        <SelectContent>
                          {financialYears?.map((fy: any) => (
                            <SelectItem key={fy.code} value={fy.code}>
                              {fy.display_name} {fy.is_current && "(Current)"}
                            </SelectItem>
                          ))}
                          {!financialYears?.length && (
                            <>
                              <SelectItem value="FY2024_25">FY 2024-25</SelectItem>
                              <SelectItem value="FY2025_26">FY 2025-26 (Current)</SelectItem>
                              <SelectItem value="FY2026_27">FY 2026-27</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Tax Regime */}
                    <div className="space-y-2">
                      <Label>Tax Regime</Label>
                      <Tabs value={regime} onValueChange={(v) => setRegime(v as "old" | "new")} className="w-full">
                        <TabsList className="w-full">
                          <TabsTrigger value="new" className="flex-1 text-xs">New Regime</TabsTrigger>
                          <TabsTrigger value="old" className="flex-1 text-xs">Old Regime</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Gross Income */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Gross Annual Income
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g., 1200000"
                      value={grossIncome || ""}
                      onChange={(e) => setGrossIncome(Number(e.target.value))}
                      className="text-lg font-medium"
                    />
                    {grossIncome > 0 && (
                      <p className="text-xs text-muted-foreground">{formatLakh(grossIncome)}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => calculateMutation.mutate()}
                      disabled={!grossIncome || calculateMutation.isPending || !canCalculate}
                      className="flex-1 sm:flex-none"
                    >
                      {calculateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Calculator className="w-4 h-4 mr-2" />
                      )}
                      Calculate Tax
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => compareMutation.mutate()}
                      disabled={!grossIncome || compareMutation.isPending || !canCalculate}
                    >
                      {compareMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Scale className="w-4 h-4 mr-2" />
                      )}
                      Compare Regimes
                    </Button>

                    {isProUser && (
                      <Button variant="outline" disabled={!result}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Result Card */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Tax Summary
                        </CardTitle>
                        <Badge>{result.regime === "new" ? "New Regime" : "Old Regime"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Gross Income</p>
                          <p className="font-bold text-green-600">{formatLakh(result.gross_income)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Deductions</p>
                          <p className="font-bold">{formatLakh(result.standard_deduction + result.total_deductions)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Taxable</p>
                          <p className="font-bold">{formatLakh(result.taxable_income)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/10 text-center">
                          <p className="text-[10px] text-muted-foreground uppercase">Tax Payable</p>
                          <p className="font-bold text-primary">{formatCurrency(result.total_tax)}</p>
                        </div>
                      </div>

                      {/* Slab Breakdown */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Slab-wise Breakdown</p>
                        <div className="space-y-1">
                          {result.slab_breakdown.filter(s => s.tax_in_slab > 0 || s.taxable_in_slab > 0).map((slab) => (
                            <div 
                              key={slab.slab_order} 
                              className="flex justify-between items-center p-2 bg-muted/30 rounded text-xs"
                            >
                              <span className="text-muted-foreground">
                                {slab.max_amount 
                                  ? `${formatLakh(slab.min_amount)} - ${formatLakh(slab.max_amount)}`
                                  : `Above ${formatLakh(slab.min_amount)}`
                                } @ {slab.rate_percentage}%
                              </span>
                              <span className="font-medium">
                                {formatCurrency(slab.tax_in_slab)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional details */}
                      <div className="mt-4 pt-3 border-t text-xs space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Standard Deduction</span>
                          <span>- {formatCurrency(result.standard_deduction)}</span>
                        </div>
                        {result.rebate_87a > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>87A Rebate</span>
                            <span>- {formatCurrency(result.rebate_87a)}</span>
                          </div>
                        )}
                        {result.surcharge > 0 && (
                          <div className="flex justify-between">
                            <span>Surcharge</span>
                            <span>+ {formatCurrency(result.surcharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Health & Education Cess (4%)</span>
                          <span>+ {formatCurrency(result.cess)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-foreground">
                          <span>Effective Tax Rate</span>
                          <span>{result.effective_rate}%</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Monthly Tax Equivalent</span>
                          <span>{formatCurrency(Math.round(result.total_tax / 12))}/month</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Comparison Card */}
              {comparison && (
                <RegimeSavingsCard
                  oldRegimeTax={comparison.old_regime.total_tax}
                  newRegimeTax={comparison.new_regime.total_tax}
                  recommendedRegime={comparison.recommended_regime}
                  savingsAmount={comparison.savings_amount}
                />
              )}
            </TabsContent>

            <TabsContent value="deductions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PiggyBank className="w-5 h-5" />
                    Tax Deductions
                    {regime === "new" && (
                      <Badge variant="outline" className="ml-2 text-amber-500">
                        Limited in New Regime
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {regime === "old" 
                      ? "Enter your investments to claim deductions"
                      : "New regime has limited deductions. Switch to Old Regime for full benefits."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section 80C */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-medium">Section 80C (Max ₹1.5L)</Label>
                      {regime === "new" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">PPF, ELSS, LIC, EPF, NSC, Tax-saver FD</p>
                    <Input
                      type="number"
                      placeholder="Enter 80C investments"
                      value={deductions["80C"] || ""}
                      onChange={(e) => updateDeduction("80C", Number(e.target.value) || 0)}
                      disabled={regime === "new"}
                    />
                    <Progress value={(Math.min(deductions["80C"], 150000) / 150000) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {formatCurrency(Math.min(deductions["80C"], 150000))} / ₹1.5L
                    </p>
                  </div>

                  {/* NPS 80CCD1B */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-purple-500" />
                      <Label className="text-sm font-medium">NPS 80CCD(1B) (Max ₹50K)</Label>
                      {regime === "new" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <Input
                      type="number"
                      placeholder="Additional NPS contribution"
                      value={deductions["80CCD1B"] || ""}
                      onChange={(e) => updateDeduction("80CCD1B", Number(e.target.value) || 0)}
                      disabled={regime === "new"}
                    />
                  </div>

                  {/* Section 80D */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <Label className="text-sm font-medium">Section 80D (Max ₹75K)</Label>
                      {regime === "new" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Health insurance premium</p>
                    <Input
                      type="number"
                      placeholder="Health insurance premium"
                      value={deductions["80D"] || ""}
                      onChange={(e) => updateDeduction("80D", Number(e.target.value) || 0)}
                      disabled={regime === "new"}
                    />
                  </div>

                  {/* Home Loan 24B */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-amber-500" />
                      <Label className="text-sm font-medium">Section 24(b) - Home Loan Interest (Max ₹2L)</Label>
                      {regime === "new" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <Input
                      type="number"
                      placeholder="Home loan interest"
                      value={deductions["24B"] || ""}
                      onChange={(e) => updateDeduction("24B", Number(e.target.value) || 0)}
                      disabled={regime === "new"}
                    />
                  </div>

                  {/* HRA */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-500" />
                      <Label className="text-sm font-medium">HRA Exemption</Label>
                      {regime === "new" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <Input
                      type="number"
                      placeholder="HRA exemption amount"
                      value={deductions["HRA"] || ""}
                      onChange={(e) => updateDeduction("HRA", Number(e.target.value) || 0)}
                      disabled={regime === "new"}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Missed Deductions Card */}
              {result && (
                <MissedDeductionsCard
                  deductions={deductions}
                  taxBracket={getTaxBracket()}
                  regime={regime}
                />
              )}
            </TabsContent>

            <TabsContent value="slabs" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* New Regime Slabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      New Tax Regime
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { range: "₹0 - ₹3L", rate: "0%" },
                      { range: "₹3L - ₹7L", rate: "5%" },
                      { range: "₹7L - ₹10L", rate: "10%" },
                      { range: "₹10L - ₹12L", rate: "15%" },
                      { range: "₹12L - ₹15L", rate: "20%" },
                      { range: "Above ₹15L", rate: "30%" },
                    ].map((slab, i) => (
                      <div key={i} className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                        <span>{slab.range}</span>
                        <span className="font-medium">{slab.rate}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-2">
                      + Standard Deduction: ₹75,000<br />
                      + 4% Health & Education Cess
                    </p>
                  </CardContent>
                </Card>

                {/* Old Regime Slabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      Old Tax Regime
                      <Badge variant="secondary" className="text-xs">With Deductions</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { range: "₹0 - ₹2.5L", rate: "0%" },
                      { range: "₹2.5L - ₹5L", rate: "5%" },
                      { range: "₹5L - ₹10L", rate: "20%" },
                      { range: "Above ₹10L", rate: "30%" },
                    ].map((slab, i) => (
                      <div key={i} className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                        <span>{slab.range}</span>
                        <span className="font-medium">{slab.rate}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-2">
                      + Standard Deduction: ₹50,000<br />
                      + Allows 80C, 80D, HRA, etc.<br />
                      + 4% Health & Education Cess
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - TAXYN & Insights */}
        <div className="space-y-4">
          {/* TAXYN Bot */}
          <TaxynBot
            taxableIncome={result?.taxable_income || 0}
            totalTax={result?.total_tax || 0}
            regime={regime}
            deductions={deductions}
            financialYear={financialYear}
            isPro={isProUser}
          />

          {/* Pro Features Upsell */}
          {!isProUser && (
            <Card className="border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-purple-500/10">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-violet-500 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Unlock Pro Features</h3>
                <ul className="text-xs text-muted-foreground text-left space-y-1 mb-3">
                  <li>✓ Unlimited calculations</li>
                  <li>✓ TAXYN AI Assistant</li>
                  <li>✓ Deduction optimization</li>
                  <li>✓ PDF tax summary</li>
                  <li>✓ Multi-FY comparison</li>
                </ul>
                <Button size="sm" className="w-full bg-gradient-to-r from-violet-500 to-purple-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Starting at ₹199/month
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legal Disclaimer */}
          <TaxLegalDisclaimer variant="minimal" />
        </div>
      </div>

      {/* Full Legal Disclaimer */}
      <TaxLegalDisclaimer variant="full" />
    </div>
  );
};

export default Tax;