import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Calendar, 
  FileText, 
  IndianRupee, 
  TrendingUp, 
  PiggyBank,
  Building2,
  Heart,
  GraduationCap,
  Home,
  Sparkles,
  FlaskConical,
  Info,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfYear, endOfYear } from "date-fns";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface TaxSummary {
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  deductions: {
    section80C: number;
    section80D: number;
    hra: number;
    other: number;
  };
}

const TAX_SLABS_NEW = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

const Tax = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    taxableIncome: 0,
    estimatedTax: 0,
    deductions: {
      section80C: 0,
      section80D: 0,
      hra: 0,
      other: 0,
    },
  });

  // Manual deduction inputs
  const [manualDeductions, setManualDeductions] = useState({
    section80C: 0,
    section80D: 0,
    hra: 0,
    nps: 0,
    homeLoanInterest: 0,
  });

  // Get current FY
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const fyStart = currentMonth >= 3 
    ? new Date(currentYear, 3, 1) 
    : new Date(currentYear - 1, 3, 1);
  const fyEnd = currentMonth >= 3 
    ? new Date(currentYear + 1, 2, 31) 
    : new Date(currentYear, 2, 31);
  const fyLabel = currentMonth >= 3 
    ? `FY ${currentYear}-${(currentYear + 1).toString().slice(-2)}` 
    : `FY ${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  useEffect(() => {
    if (user) fetchTaxData();
  }, [user]);

  const fetchTaxData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const fyStartStr = format(fyStart, "yyyy-MM-dd");
      const fyEndStr = format(fyEnd, "yyyy-MM-dd");

      // Fetch income for FY
      const { data: incomeData } = await supabase
        .from("income_entries")
        .select("amount")
        .eq("user_id", user.id)
        .gte("income_date", fyStartStr)
        .lte("income_date", fyEndStr);

      const totalIncome = incomeData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Fetch expenses for FY
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount, category")
        .eq("user_id", user.id)
        .gte("expense_date", fyStartStr)
        .lte("expense_date", fyEndStr);

      const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Fetch insurance premiums (80D)
      const { data: insuranceData } = await supabase
        .from("insurances")
        .select("premium_amount, policy_type")
        .eq("user_id", user.id)
        .eq("status", "active");

      const healthPremiums = insuranceData
        ?.filter(i => i.policy_type === "Health")
        .reduce((sum, i) => sum + Number(i.premium_amount), 0) || 0;

      // Calculate deductions
      const section80D = Math.min(healthPremiums, 75000); // Max 75k for self + parents
      const section80C = Math.min(manualDeductions.section80C, 150000);
      const totalDeductions = section80C + section80D + manualDeductions.hra + manualDeductions.nps + manualDeductions.homeLoanInterest;

      // Calculate taxable income
      const taxableIncome = Math.max(0, totalIncome - totalDeductions);

      // Calculate tax using new regime slabs
      let estimatedTax = 0;
      let remaining = taxableIncome;
      for (const slab of TAX_SLABS_NEW) {
        if (remaining <= 0) break;
        const taxableInSlab = Math.min(remaining, slab.max - slab.min);
        estimatedTax += (taxableInSlab * slab.rate) / 100;
        remaining -= taxableInSlab;
      }

      // Add 4% cess
      estimatedTax *= 1.04;

      setTaxSummary({
        totalIncome,
        totalExpenses,
        taxableIncome,
        estimatedTax: Math.round(estimatedTax),
        deductions: {
          section80C,
          section80D,
          hra: manualDeductions.hra,
          other: manualDeductions.nps + manualDeductions.homeLoanInterest,
        },
      });
    } catch (error) {
      console.error("Error fetching tax data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [manualDeductions]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const totalDeductions = Object.values(taxSummary.deductions).reduce((a, b) => a + b, 0);
  const effectiveTaxRate = taxSummary.totalIncome > 0 
    ? ((taxSummary.estimatedTax / taxSummary.totalIncome) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">Tax & Financial Year</h1>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-red-500/10 text-red-500 border-red-500/30">
              <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
              BETA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{fyLabel} Tax Calculator & Insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="w-3 h-3" />
            {fyLabel}
          </Badge>
        </div>
      </header>

      {/* Pro Feature Alert */}
      {!isPro() && (
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <AlertTitle>Pro Feature</AlertTitle>
          <AlertDescription>
            Upgrade to Pro for detailed tax insights, deduction suggestions, and CA-free tax planning.
          </AlertDescription>
        </Alert>
      )}

      {/* Tax Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-semibold text-vyom-success">
                {formatCurrency(taxSummary.totalIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground">{fyLabel}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <PiggyBank className="w-3 h-3" />
                Deductions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">
                {formatCurrency(totalDeductions)}
              </p>
              <p className="text-[10px] text-muted-foreground">Total claimed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                Taxable Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-semibold text-foreground">
                {formatCurrency(taxSummary.taxableIncome)}
              </p>
              <p className="text-[10px] text-muted-foreground">After deductions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-destructive uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                Estimated Tax
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-semibold text-destructive">
                {formatCurrency(taxSummary.estimatedTax)}
              </p>
              <p className="text-[10px] text-muted-foreground">{effectiveTaxRate}% effective rate</p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Tabs for detailed sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="deductions" className="text-xs sm:text-sm">Deductions</TabsTrigger>
          <TabsTrigger value="slabs" className="text-xs sm:text-sm">Tax Slabs</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-vyom-success" />
                  Income Summary
                </CardTitle>
                <CardDescription>Your earnings this financial year</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Income</span>
                  <span className="font-semibold text-vyom-success">{formatCurrency(taxSummary.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <span className="font-semibold text-destructive">{formatCurrency(taxSummary.totalExpenses)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Savings</span>
                    <span className="font-bold">{formatCurrency(taxSummary.totalIncome - taxSummary.totalExpenses)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-destructive" />
                  Tax Calculation (New Regime)
                </CardTitle>
                <CardDescription>Estimated tax liability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gross Income</span>
                  <span className="font-medium">{formatCurrency(taxSummary.totalIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-vyom-success">
                  <span className="text-sm">(-) Deductions</span>
                  <span className="font-medium">{formatCurrency(totalDeductions)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Taxable Income</span>
                  <span className="font-bold">{formatCurrency(taxSummary.taxableIncome)}</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span className="text-sm font-medium">Tax Payable (incl. 4% cess)</span>
                  <span className="font-bold">{formatCurrency(taxSummary.estimatedTax)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <PiggyBank className="w-4 h-4" />
                Tax Deductions
              </CardTitle>
              <CardDescription>Enter your investments to calculate deductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section 80C */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Section 80C (Max ₹1.5L)</Label>
                </div>
                <p className="text-xs text-muted-foreground">PPF, ELSS, LIC, EPF, NSC, Tax-saver FD, etc.</p>
                <Input
                  type="number"
                  placeholder="Enter 80C investments"
                  value={manualDeductions.section80C || ""}
                  onChange={(e) => setManualDeductions(prev => ({ ...prev, section80C: Number(e.target.value) || 0 }))}
                />
                <Progress value={(Math.min(manualDeductions.section80C, 150000) / 150000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {formatCurrency(Math.min(manualDeductions.section80C, 150000))} / ₹1.5L claimed
                </p>
              </div>

              {/* Section 80D */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <Label className="text-sm font-medium">Section 80D (Max ₹75K)</Label>
                </div>
                <p className="text-xs text-muted-foreground">Health insurance premiums (auto-fetched from Insurance)</p>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">From Insurance Policies</span>
                    <span className="font-medium text-vyom-success">{formatCurrency(taxSummary.deductions.section80D)}</span>
                  </div>
                </div>
              </div>

              {/* HRA */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <Label className="text-sm font-medium">HRA Exemption</Label>
                </div>
                <p className="text-xs text-muted-foreground">House rent allowance exemption</p>
                <Input
                  type="number"
                  placeholder="Enter HRA exemption amount"
                  value={manualDeductions.hra || ""}
                  onChange={(e) => setManualDeductions(prev => ({ ...prev, hra: Number(e.target.value) || 0 }))}
                />
              </div>

              {/* NPS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-purple-500" />
                  <Label className="text-sm font-medium">Section 80CCD(1B) - NPS (Max ₹50K)</Label>
                </div>
                <p className="text-xs text-muted-foreground">Additional NPS contribution</p>
                <Input
                  type="number"
                  placeholder="Enter NPS contribution"
                  value={manualDeductions.nps || ""}
                  onChange={(e) => setManualDeductions(prev => ({ ...prev, nps: Math.min(Number(e.target.value) || 0, 50000) }))}
                />
              </div>

              {/* Home Loan Interest */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <Label className="text-sm font-medium">Section 24 - Home Loan Interest (Max ₹2L)</Label>
                </div>
                <p className="text-xs text-muted-foreground">Interest paid on home loan</p>
                <Input
                  type="number"
                  placeholder="Enter home loan interest"
                  value={manualDeductions.homeLoanInterest || ""}
                  onChange={(e) => setManualDeductions(prev => ({ ...prev, homeLoanInterest: Math.min(Number(e.target.value) || 0, 200000) }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slabs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Income Tax Slabs (New Regime FY 2024-25)
              </CardTitle>
              <CardDescription>Tax rates applicable under the new tax regime</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TAX_SLABS_NEW.map((slab, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      taxSummary.taxableIncome > slab.min ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <span className="text-sm">
                      {slab.max === Infinity 
                        ? `Above ${formatCurrency(slab.min)}`
                        : `${formatCurrency(slab.min)} - ${formatCurrency(slab.max)}`
                      }
                    </span>
                    <Badge variant={slab.rate === 0 ? "secondary" : "default"}>
                      {slab.rate}%
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Note</p>
                    <p className="text-xs text-muted-foreground">
                      Health & Education Cess of 4% is applicable on the total tax amount.
                      This calculator uses the new tax regime rates.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tax;