import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { downloadTaxPDF } from "./TaxPDFGenerator";
import Form16Scanner, { ExtractedForm16Data } from "./Form16Scanner";
import TaxScenarioSelector from "./TaxScenarioSelector";
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  IndianRupee,
  FileText,
  Shield,
  Sparkles,
  Download,
  Scale,
  TrendingUp,
  Info,
  XCircle,
  Building2,
  Heart,
  Home,
  GraduationCap,
  PiggyBank,
  Target,
  RefreshCw,
  Upload,
} from "lucide-react";

interface DiscoveredIncome {
  income_type: string;
  description: string;
  gross_amount: number;
  source_type: string;
  confidence_score: number;
  is_auto_detected: boolean;
  user_confirmed?: boolean;
}

interface DiscoveredDeduction {
  section_code: string;
  description: string;
  claimed_amount: number;
  max_limit: number | null;
  source_type: string;
  confidence_score: number;
  savings_impact: number;
  is_auto_detected: boolean;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  impact_amount: number;
  action_required: boolean;
}

interface AuditFlag {
  severity: string;
  title: string;
  description: string;
  resolution_required: boolean;
}

interface TaxWizardState {
  step: number;
  financialYear: string;
  regime: "old" | "new";
  incomes: DiscoveredIncome[];
  deductions: Record<string, number>;
  discoveredDeductions: DiscoveredDeduction[];
  recommendations: Recommendation[];
  auditFlags: AuditFlag[];
  auditScore: number;
  calculation: any;
  comparison: any;
}

const STEPS = [
  { id: 1, title: "Select FY", icon: Calendar },
  { id: 2, title: "Income", icon: IndianRupee },
  { id: 3, title: "Deductions", icon: PiggyBank },
  { id: 4, title: "Compare", icon: Scale },
  { id: 5, title: "Review", icon: Target },
  { id: 6, title: "Preview", icon: FileText },
];

const FINANCIAL_YEARS = [
  { code: "FY2024_25", label: "FY 2024-25", isCurrent: false },
  { code: "FY2025_26", label: "FY 2025-26", isCurrent: true },
  { code: "FY2026_27", label: "FY 2026-27", isCurrent: false },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TaxWizard() {
  const { user } = useAuth();
  const [state, setState] = useState<TaxWizardState>({
    step: 1,
    financialYear: "FY2025_26",
    regime: "new",
    incomes: [],
    deductions: {},
    discoveredDeductions: [],
    recommendations: [],
    auditFlags: [],
    auditScore: 0,
    calculation: null,
    comparison: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [manualIncome, setManualIncome] = useState<number>(0);
  const [form16Data, setForm16Data] = useState<ExtractedForm16Data | null>(null);
  const [scenarioData, setScenarioData] = useState<Record<string, Record<string, number | string>>>({});

  // Handle Form16 data extraction
  const handleForm16Data = (data: ExtractedForm16Data) => {
    setForm16Data(data);
    // Pre-fill income from Form 16
    if (data.gross_salary) {
      setManualIncome(data.gross_salary);
    }
    // Pre-fill deductions from Form 16
    const newDeductions: Record<string, number> = {};
    if (data.section_80c) newDeductions["80C"] = data.section_80c;
    if (data.section_80d) newDeductions["80D"] = data.section_80d;
    if (data.section_80ccd_1b) newDeductions["80CCD1B"] = data.section_80ccd_1b;
    if (data.section_24b) newDeductions["24B"] = data.section_24b;
    if (data.section_80e) newDeductions["80E"] = data.section_80e;
    if (data.hra_exemption) newDeductions["HRA"] = data.hra_exemption;
    
    setState(prev => ({ ...prev, deductions: { ...prev.deductions, ...newDeductions } }));
    toast.success("Form 16 data imported successfully!");
  };

  // Handle scenario data changes
  const handleScenariosChange = (data: Record<string, Record<string, number | string>>) => {
    setScenarioData(data);
  };

  const currentStep = STEPS.find((s) => s.id === state.step);
  const progress = (state.step / STEPS.length) * 100;

  // Discover income mutation
  const discoverIncomeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tax-discover-income", {
        body: { financial_year: state.financialYear },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        incomes: data.incomes || [],
      }));
      toast.success(`Found ${data.incomes?.length || 0} income sources`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to discover income");
    },
  });

  // Discover deductions mutation
  const discoverDeductionsMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const totalIncome = state.incomes.reduce((sum, i) => sum + i.gross_amount, 0) || manualIncome;

      const response = await supabase.functions.invoke("tax-discover-deductions", {
        body: { 
          financial_year: state.financialYear,
          gross_income: totalIncome,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      const deductionsMap: Record<string, number> = {};
      data.deductions?.forEach((d: DiscoveredDeduction) => {
        deductionsMap[d.section_code] = (deductionsMap[d.section_code] || 0) + d.claimed_amount;
      });

      setState((prev) => ({
        ...prev,
        deductions: deductionsMap,
        discoveredDeductions: data.deductions || [],
      }));
      toast.success(`Found ${data.deductions?.length || 0} potential deductions`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to discover deductions");
    },
  });

  // Calculate and compare mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const totalIncome = state.incomes.reduce((sum, i) => sum + i.gross_amount, 0) || manualIncome;

      // Calculate for selected regime
      const calcResponse = await supabase.functions.invoke("tax-full-calculation", {
        body: {
          financial_year: state.financialYear,
          regime: state.regime,
          incomes: state.incomes.length > 0 ? state.incomes : [{ income_type: "salary", gross_amount: totalIncome }],
          deductions: state.deductions,
          save_calculation: true,
        },
      });

      if (calcResponse.error) throw calcResponse.error;

      // Get recommendations
      const recsResponse = await supabase.functions.invoke("tax-recommend", {
        body: {
          financial_year: state.financialYear,
          gross_income: totalIncome,
          regime: state.regime,
          old_regime_tax: state.regime === "old" ? calcResponse.data.calculation.total_tax_liability : calcResponse.data.calculation.alternate_regime_tax,
          new_regime_tax: state.regime === "new" ? calcResponse.data.calculation.total_tax_liability : calcResponse.data.calculation.alternate_regime_tax,
          deductions: state.deductions,
          incomes: state.incomes,
        },
      });

      // Get audit check
      const auditResponse = await supabase.functions.invoke("tax-audit", {
        body: {
          financial_year: state.financialYear,
          gross_income: totalIncome,
          regime: state.regime,
          deductions: state.deductions,
          incomes: state.incomes,
        },
      });

      return {
        calculation: calcResponse.data.calculation,
        recommendations: recsResponse.data?.recommendations || [],
        audit: auditResponse.data,
      };
    },
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        calculation: data.calculation,
        recommendations: data.recommendations,
        auditFlags: data.audit?.flags || [],
        auditScore: data.audit?.audit_score || 0,
      }));
      toast.success("Tax calculation complete!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to calculate tax");
    },
  });

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (state.step === 1) {
        // Moving to income discovery
        await discoverIncomeMutation.mutateAsync();
      } else if (state.step === 2) {
        // Moving to deductions
        await discoverDeductionsMutation.mutateAsync();
      } else if (state.step === 3) {
        // Moving to comparison - calculate both regimes
        await calculateMutation.mutateAsync();
      }

      setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 6) }));
    } catch (error) {
      console.error("Step error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  };

  const updateDeduction = (section: string, amount: number) => {
    const validAmount = Math.max(0, amount);
    setState((prev) => ({
      ...prev,
      deductions: { ...prev.deductions, [section]: validAmount },
    }));
  };

  const toggleIncomeConfirmation = (index: number) => {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.map((inc, i) =>
        i === index ? { ...inc, user_confirmed: !inc.user_confirmed } : inc
      ),
    }));
  };

  const totalIncome = state.incomes.reduce((sum, i) => sum + i.gross_amount, 0) || manualIncome;
  const totalDeductions = Object.values(state.deductions).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {currentStep && <currentStep.icon className="w-5 h-5 text-primary" />}
              <span className="font-medium">Step {state.step}: {currentStep?.title}</span>
            </div>
            <Badge variant="outline">{state.financialYear.replace("_", " ").replace("FY", "FY ")}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`text-xs ${
                  step.id <= state.step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 1: Financial Year Selection */}
          {state.step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Select Financial Year
                </CardTitle>
                <CardDescription>
                  Choose the financial year for your tax calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {FINANCIAL_YEARS.map((fy) => (
                    <button
                      key={fy.code}
                      onClick={() => setState((prev) => ({ ...prev, financialYear: fy.code }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        state.financialYear === fy.code
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <p className="font-medium">{fy.label}</p>
                      {fy.isCurrent && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Current
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Preferred Tax Regime</Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setState((prev) => ({ ...prev, regime: "new" }))}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        state.regime === "new"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <p className="font-medium">New Regime</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower rates, limited deductions
                      </p>
                    </button>
                    <button
                      onClick={() => setState((prev) => ({ ...prev, regime: "old" }))}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        state.regime === "old"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <p className="font-medium">Old Regime</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher rates, all deductions
                      </p>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Form 16 Upload Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Form 16 (Optional)
                  </Label>
                  <Form16Scanner onDataExtracted={handleForm16Data} />
                  {form16Data && (
                    <Badge variant="secondary" className="mt-2">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Form 16 imported
                    </Badge>
                  )}
                </div>

                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    Tax rules are locked per financial year. CHRONYX will compare both regimes and recommend the best option.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Income Discovery */}
          {state.step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-primary" />
                  Income Discovery
                </CardTitle>
                <CardDescription>
                  We found these income sources from your CHRONYX data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.incomes.length > 0 ? (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {state.incomes.map((income, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            income.user_confirmed ? "border-green-500 bg-green-500/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={income.user_confirmed}
                                onCheckedChange={() => toggleIncomeConfirmation(index)}
                              />
                              <div>
                                <p className="font-medium capitalize">
                                  {income.income_type.replace("_", " ")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {income.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(income.gross_amount)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(income.confidence_score * 100)}% confident
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 space-y-6">
                    <div>
                      <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No income data found. Fetch from your CHRONYX data or add manually.
                      </p>
                    </div>
                    
                    <Button 
                      onClick={() => discoverIncomeMutation.mutate()}
                      disabled={discoverIncomeMutation.isPending}
                      className="gap-2"
                    >
                      {discoverIncomeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Fetch from CHRONYX
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                      </div>
                    </div>
                    
                    <div className="max-w-xs mx-auto space-y-2">
                      <Label>Gross Annual Income</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 1200000"
                        value={manualIncome || ""}
                        onChange={(e) => {
                          const value = Math.max(0, Number(e.target.value));
                          setManualIncome(value);
                        }}
                      />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Tax Scenarios for additional income */}
                <TaxScenarioSelector onScenariosChange={handleScenariosChange} />

                <Separator />

                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Total Gross Income</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Deductions */}
          {state.step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  Deductions Discovery
                </CardTitle>
                <CardDescription>
                  Available deductions based on your data (Old Regime only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* 80C */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <Label>Section 80C</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["80C"] || ""}
                      onChange={(e) => updateDeduction("80C", Number(e.target.value))}
                      placeholder="Max ₹1,50,000"
                    />
                    <p className="text-xs text-muted-foreground">
                      PPF, ELSS, LIC, EPF, Tuition
                    </p>
                  </div>

                  {/* 80D */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <Label>Section 80D</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["80D"] || ""}
                      onChange={(e) => updateDeduction("80D", Number(e.target.value))}
                      placeholder="Max ₹75,000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Health Insurance Premium
                    </p>
                  </div>

                  {/* 80CCD1B */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <Label>Section 80CCD(1B)</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["80CCD1B"] || ""}
                      onChange={(e) => updateDeduction("80CCD1B", Number(e.target.value))}
                      placeholder="Max ₹50,000"
                    />
                    <p className="text-xs text-muted-foreground">NPS Contribution</p>
                  </div>

                  {/* 24B */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-orange-500" />
                      <Label>Section 24(b)</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["24B"] || ""}
                      onChange={(e) => updateDeduction("24B", Number(e.target.value))}
                      placeholder="Max ₹2,00,000"
                    />
                    <p className="text-xs text-muted-foreground">Home Loan Interest</p>
                  </div>

                  {/* 80E */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-cyan-500" />
                      <Label>Section 80E</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["80E"] || ""}
                      onChange={(e) => updateDeduction("80E", Number(e.target.value))}
                      placeholder="No limit"
                    />
                    <p className="text-xs text-muted-foreground">Education Loan Interest</p>
                  </div>

                  {/* HRA */}
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-500" />
                      <Label>HRA Exemption</Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={state.deductions["HRA"] || ""}
                      onChange={(e) => updateDeduction("HRA", Number(e.target.value))}
                      placeholder="As per rules"
                    />
                    <p className="text-xs text-muted-foreground">House Rent Allowance</p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Total Deductions</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(totalDeductions)}
                  </span>
                </div>

                {state.regime === "new" && (
                  <Alert className="bg-amber-500/10 border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <AlertDescription className="text-xs">
                      Most deductions are not available under the New Regime. We'll compare both and recommend the best option.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Regime Comparison */}
          {state.step === 4 && state.calculation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  Regime Comparison
                </CardTitle>
                <CardDescription>
                  Comparing Old vs New tax regime for your income
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Current Regime */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      state.calculation.is_optimal
                        ? "border-green-500 bg-green-500/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={state.regime === "new" ? "default" : "secondary"}>
                        {state.regime === "new" ? "New Regime" : "Old Regime"}
                      </Badge>
                      {state.calculation.is_optimal && (
                        <Badge variant="outline" className="text-green-600 border-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Taxable Income</span>
                        <span>{formatCurrency(state.calculation.taxable_income)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax + Cess</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(state.calculation.total_tax_liability)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Effective Rate</span>
                        <span>{state.calculation.effective_rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Alternate Regime */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      !state.calculation.is_optimal
                        ? "border-green-500 bg-green-500/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">
                        {state.regime === "new" ? "Old Regime" : "New Regime"}
                      </Badge>
                      {!state.calculation.is_optimal && (
                        <Badge variant="outline" className="text-green-600 border-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tax + Cess</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(state.calculation.alternate_regime_tax)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Savings Card */}
                {Math.abs(state.calculation.savings_vs_alternate) > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">You save by choosing {state.calculation.is_optimal ? state.regime : (state.regime === "new" ? "old" : "new")} regime</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(Math.abs(state.calculation.savings_vs_alternate))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Recommendations & Audit */}
          {state.step === 5 && (
            <div className="space-y-4">
              {/* Audit Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Audit Readiness Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${state.auditScore * 2.51} 251`}
                          className={
                            state.auditScore >= 80
                              ? "text-green-500"
                              : state.auditScore >= 60
                              ? "text-amber-500"
                              : "text-red-500"
                          }
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                        {state.auditScore}%
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {state.auditScore >= 80
                          ? "Excellent"
                          : state.auditScore >= 60
                          ? "Good"
                          : "Needs Attention"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {state.auditFlags.filter((f) => f.resolution_required).length} issues need resolution
                      </p>
                    </div>
                  </div>

                  {state.auditFlags.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {state.auditFlags.map((flag, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg flex items-start gap-2 ${
                            flag.severity === "error"
                              ? "bg-red-500/10 border border-red-500/30"
                              : flag.severity === "warning"
                              ? "bg-amber-500/10 border border-amber-500/30"
                              : "bg-blue-500/10 border border-blue-500/30"
                          }`}
                        >
                          {flag.severity === "error" ? (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{flag.title}</p>
                            <p className="text-xs text-muted-foreground">{flag.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {state.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {state.recommendations.slice(0, 5).map((rec, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            rec.priority === "high" || rec.priority === "critical"
                              ? "border-primary/50 bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{rec.title}</p>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </div>
                            {rec.impact_amount > 0 && (
                              <Badge variant="outline" className="text-green-600 shrink-0">
                                Save {formatCurrency(rec.impact_amount)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 6: Final Preview */}
          {state.step === 6 && state.calculation && (
            <div className="space-y-4">
              {/* Regime Comparison Card */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Regime Comparison
                  </CardTitle>
                  <CardDescription>
                    Side-by-side comparison to help you choose the optimal regime
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Current Regime */}
                    <div
                      className={`p-4 rounded-xl border-2 transition-all ${
                        state.calculation.is_optimal
                          ? "border-green-500 bg-green-500/5 ring-2 ring-green-500/20"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={state.calculation.is_optimal ? "bg-green-500" : "bg-muted"}>
                          {state.regime === "new" ? "New Regime" : "Old Regime"}
                        </Badge>
                        {state.calculation.is_optimal && (
                          <Badge variant="outline" className="text-green-600 border-green-500 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Tax Payable</p>
                          <p className="text-2xl font-bold">{formatCurrency(state.calculation.total_tax_liability)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Standard Deduction</p>
                            <p className="font-medium">{state.regime === "new" ? "₹75,000" : "₹50,000"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Effective Rate</p>
                            <p className="font-medium">{state.calculation.effective_rate}%</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Key Features:</p>
                          <ul className="text-xs space-y-1">
                            {state.regime === "new" ? (
                              <>
                                <li>• Lower base tax rates</li>
                                <li>• Simplified - no deduction tracking</li>
                                <li>• ₹12L income = Zero tax (with rebate)</li>
                              </>
                            ) : (
                              <>
                                <li>• All deductions available (80C, 80D, etc.)</li>
                                <li>• HRA exemption allowed</li>
                                <li>• Home loan interest u/s 24(b)</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Alternate Regime */}
                    <div
                      className={`p-4 rounded-xl border-2 transition-all ${
                        !state.calculation.is_optimal
                          ? "border-green-500 bg-green-500/5 ring-2 ring-green-500/20"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={!state.calculation.is_optimal ? "bg-green-500" : "bg-muted"}>
                          {state.regime === "new" ? "Old Regime" : "New Regime"}
                        </Badge>
                        {!state.calculation.is_optimal && (
                          <Badge variant="outline" className="text-green-600 border-green-500 gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Tax Payable</p>
                          <p className="text-2xl font-bold">{formatCurrency(state.calculation.alternate_regime_tax)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Standard Deduction</p>
                            <p className="font-medium">{state.regime !== "new" ? "₹75,000" : "₹50,000"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Potential Savings</p>
                            <p className="font-medium text-green-600">
                              {!state.calculation.is_optimal ? formatCurrency(Math.abs(state.calculation.savings_vs_alternate)) : "-"}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Key Features:</p>
                          <ul className="text-xs space-y-1">
                            {state.regime !== "new" ? (
                              <>
                                <li>• Lower base tax rates</li>
                                <li>• Simplified - no deduction tracking</li>
                                <li>• ₹12L income = Zero tax (with rebate)</li>
                              </>
                            ) : (
                              <>
                                <li>• All deductions available (80C, 80D, etc.)</li>
                                <li>• HRA exemption allowed</li>
                                <li>• Home loan interest u/s 24(b)</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings Highlight */}
                  {Math.abs(state.calculation.savings_vs_alternate) > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            You save by choosing{" "}
                            <span className="font-semibold text-foreground">
                              {state.calculation.is_optimal
                                ? (state.regime === "new" ? "New" : "Old")
                                : (state.regime === "new" ? "Old" : "New")}{" "}
                              Regime
                            </span>
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(Math.abs(state.calculation.savings_vs_alternate))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tax Summary Card */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-purple-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Tax Computation Summary
                  </CardTitle>
                  <CardDescription>
                    Complete tax calculation for {state.financialYear.replace("_", " ").replace("FY", "FY ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Summary Cards */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                      <p className="text-xs text-muted-foreground">Gross Income</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(state.calculation.gross_total_income)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                      <p className="text-xs text-muted-foreground">Deductions</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(state.calculation.total_deductions)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                      <p className="text-xs text-muted-foreground">Taxable Income</p>
                      <p className="text-xl font-bold text-amber-600">
                        {formatCurrency(state.calculation.taxable_income)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                      <p className="text-xs text-muted-foreground">Tax Payable</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(state.calculation.total_tax_liability)}
                      </p>
                    </div>
                  </div>

                  {/* Slab Breakdown */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 p-3 border-b">
                      <p className="font-medium">Tax Slab Breakdown ({state.regime === "new" ? "New" : "Old"} Regime)</p>
                    </div>
                    <div className="p-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left py-2">Income Slab</th>
                            <th className="text-right py-2">Rate</th>
                            <th className="text-right py-2">Taxable</th>
                            <th className="text-right py-2">Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.calculation.slab_breakdown.map((slab: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="py-2">
                                {formatCurrency(slab.min_amount)} -{" "}
                                {slab.max_amount ? formatCurrency(slab.max_amount) : "Above"}
                              </td>
                              <td className="text-right">{slab.rate_percentage}%</td>
                              <td className="text-right">{formatCurrency(slab.taxable_in_slab)}</td>
                              <td className="text-right font-medium">{formatCurrency(slab.tax_in_slab)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tax Computation */}
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Gross Total Income</span>
                      <span className="font-medium">{formatCurrency(state.calculation.gross_total_income)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Less: Total Deductions</span>
                      <span>- {formatCurrency(state.calculation.total_deductions)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Taxable Income</span>
                      <span className="font-medium">{formatCurrency(state.calculation.taxable_income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax on Total Income</span>
                      <span>{formatCurrency(state.calculation.tax_on_income)}</span>
                    </div>
                    {state.calculation.rebate_87a > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Less: Rebate u/s 87A</span>
                        <span>- {formatCurrency(state.calculation.rebate_87a)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax after Rebate</span>
                      <span>{formatCurrency(state.calculation.tax_after_rebate)}</span>
                    </div>
                    {state.calculation.surcharge > 0 && (
                      <div className="flex justify-between">
                        <span>Add: Surcharge ({state.calculation.surcharge_rate}%)</span>
                        <span>{formatCurrency(state.calculation.surcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Add: Health & Education Cess (4%)</span>
                      <span>{formatCurrency(state.calculation.cess)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total Tax Liability</span>
                      <span className="text-primary">
                        {formatCurrency(state.calculation.total_tax_liability)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Effective Tax Rate</span>
                      <span>{state.calculation.effective_rate}%</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Monthly Tax Equivalent</span>
                      <span>{formatCurrency(Math.round(state.calculation.total_tax_liability / 12))}</span>
                    </div>
                  </div>

                  {/* Audit Score Summary */}
                  {state.auditScore > 0 && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
                          <circle
                            cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6"
                            strokeDasharray={`${state.auditScore * 1.76} 176`}
                            className={state.auditScore >= 80 ? "text-green-500" : state.auditScore >= 60 ? "text-amber-500" : "text-red-500"}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                          {state.auditScore}%
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">Audit Readiness Score</p>
                        <p className="text-sm text-muted-foreground">
                          {state.auditScore >= 80 ? "Excellent compliance" : state.auditScore >= 60 ? "Good, minor issues" : "Needs attention"}
                        </p>
                        {state.auditFlags.filter(f => f.resolution_required).length > 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            {state.auditFlags.filter(f => f.resolution_required).length} issue(s) need resolution
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <AlertTitle>Important Disclaimer</AlertTitle>
                    <AlertDescription className="text-xs">
                      This is a computer-generated tax estimate for informational purposes only. It does not constitute tax advice. 
                      Please consult a qualified Chartered Accountant or tax professional for accurate tax filing. 
                      CHRONYX and ORIGINX LABS PVT. LTD. are not responsible for any discrepancies.
                    </AlertDescription>
                  </Alert>

                  {/* Footer */}
                  <div className="text-center pt-4 border-t text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">Prepared by CHRONYX</p>
                    <p>A product of ORIGINX LABS PVT. LTD.</p>
                    <p className="mt-2">Digitally generated • Signed electronically</p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 bg-muted/30 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => calculateMutation.mutate()}
                    disabled={calculateMutation.isPending}
                  >
                    {calculateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Recalculate
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    onClick={async () => {
                      try {
                        toast.loading("Generating PDF...", { id: "pdf-gen" });
                        await downloadTaxPDF({
                          calculation: state.calculation,
                          incomes: state.incomes.length > 0 ? state.incomes : [{ income_type: "salary", gross_amount: manualIncome, description: "Total Income" }],
                          deductions: state.deductions,
                          auditScore: state.auditScore,
                          auditFlags: state.auditFlags,
                          recommendations: state.recommendations,
                          userName: user?.email?.split("@")[0] || "User",
                          userEmail: user?.email || "",
                        });
                        toast.success("PDF downloaded successfully!", { id: "pdf-gen" });
                      } catch (error) {
                        console.error("PDF generation error:", error);
                        toast.error("Failed to generate PDF", { id: "pdf-gen" });
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={state.step === 1 || isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {state.step < 6 ? (
          <Button onClick={handleNext} disabled={isLoading || (state.step === 2 && totalIncome === 0)}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {state.step === 3 ? "Calculate" : "Next"}
          </Button>
        ) : (
          <Button variant="default">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}
