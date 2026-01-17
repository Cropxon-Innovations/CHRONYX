import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingDown, FileText, Loader2, IndianRupee, Percent, ArrowRight, CheckCircle2, Scale } from "lucide-react";
import { toast } from "sonner";

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
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
  return formatCurrency(amount);
};

export function TaxCalculatorEngine() {
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
  const [result, setResult] = useState<TaxResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Income Tax Calculator
            <Badge variant="secondary" className="ml-2">BETA</Badge>
          </h2>
          <p className="text-muted-foreground mt-1">
            DB-driven Indian Income Tax Engine with Old & New Regime support
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Income Details
            </CardTitle>
            <CardDescription>Enter your income and deduction details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Financial Year */}
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
                </SelectContent>
              </Select>
            </div>

            {/* Tax Regime */}
            <div className="space-y-2">
              <Label>Tax Regime</Label>
              <Tabs value={regime} onValueChange={(v) => setRegime(v as "old" | "new")}>
                <TabsList className="w-full">
                  <TabsTrigger value="new" className="flex-1">New Regime</TabsTrigger>
                  <TabsTrigger value="old" className="flex-1">Old Regime</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Gross Income */}
            <div className="space-y-2">
              <Label>Gross Annual Income (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 1200000"
                value={grossIncome || ""}
                onChange={(e) => setGrossIncome(Number(e.target.value))}
              />
              {grossIncome > 0 && (
                <p className="text-xs text-muted-foreground">{formatLakh(grossIncome)}</p>
              )}
            </div>

            {/* Deductions (Old Regime Only) */}
            {regime === "old" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Deductions</Label>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">80C (Max 1.5L)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={deductions["80C"] || ""}
                        onChange={(e) => updateDeduction("80C", Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">80CCD1B NPS</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={deductions["80CCD1B"] || ""}
                        onChange={(e) => updateDeduction("80CCD1B", Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">80D Health</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={deductions["80D"] || ""}
                        onChange={(e) => updateDeduction("80D", Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">24(b) Home Loan</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={deductions["24B"] || ""}
                        onChange={(e) => updateDeduction("24B", Number(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => calculateMutation.mutate()}
                disabled={!grossIncome || calculateMutation.isPending}
                className="flex-1"
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
                disabled={!grossIncome || compareMutation.isPending}
              >
                {compareMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scale className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Tax Result Card */}
          {result && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Tax Summary
                  </CardTitle>
                  <Badge>{result.regime === "new" ? "New Regime" : "Old Regime"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Taxable Income</p>
                    <p className="text-lg font-bold">{formatLakh(result.taxable_income)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <p className="text-xs text-muted-foreground">Total Tax</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(result.total_tax)}</p>
                  </div>
                </div>

                {/* Slab Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Slab-wise Breakdown</p>
                  <div className="space-y-1 text-xs">
                    {result.slab_breakdown.filter(s => s.tax_in_slab > 0).map((slab) => (
                      <div key={slab.slab_order} className="flex justify-between p-2 bg-muted/30 rounded">
                        <span>
                          {slab.max_amount 
                            ? `${formatLakh(slab.min_amount)} - ${formatLakh(slab.max_amount)}`
                            : `Above ${formatLakh(slab.min_amount)}`
                          } @ {slab.rate_percentage}%
                        </span>
                        <span className="font-medium">{formatCurrency(slab.tax_in_slab)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                <div className="text-xs space-y-1 text-muted-foreground">
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
                  <div className="flex justify-between">
                    <span>Cess (4%)</span>
                    <span>+ {formatCurrency(result.cess)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Effective Rate</span>
                    <span>{result.effective_rate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Card */}
          {comparison && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingDown className="w-5 h-5" />
                  Regime Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className={`p-3 rounded-lg ${comparison.recommended_regime === 'old' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' : 'bg-muted/50'}`}>
                    <p className="text-xs text-muted-foreground">Old Regime</p>
                    <p className="font-bold">{formatCurrency(comparison.old_regime.total_tax)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${comparison.recommended_regime === 'new' ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' : 'bg-muted/50'}`}>
                    <p className="text-xs text-muted-foreground">New Regime</p>
                    <p className="font-bold">{formatCurrency(comparison.new_regime.total_tax)}</p>
                  </div>
                </div>
                
                <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <p className="text-sm">
                    You save <span className="font-bold text-green-600">{formatCurrency(comparison.savings_amount)}</span> with{" "}
                    <span className="font-semibold">{comparison.recommended_regime === 'new' ? 'New' : 'Old'} Regime</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}