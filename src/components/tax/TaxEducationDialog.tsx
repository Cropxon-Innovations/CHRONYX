import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Scale,
  IndianRupee,
  Calculator,
  Percent,
  FileText,
  Shield,
  Lightbulb,
  TrendingDown,
  Building2,
  Heart,
  Home,
  GraduationCap,
  PiggyBank,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const TAX_GLOSSARY = [
  {
    term: "Assessment Year (AY)",
    definition: "The year in which income earned during the previous Financial Year is assessed and taxed. E.g., income earned in FY 2025-26 is assessed in AY 2026-27.",
    example: "If you earned income from April 2025 to March 2026, your AY is 2026-27.",
  },
  {
    term: "Financial Year (FY)",
    definition: "The 12-month period (April to March) during which income is earned. Also called Previous Year in tax terms.",
    example: "FY 2025-26 runs from 1st April 2025 to 31st March 2026.",
  },
  {
    term: "Gross Total Income",
    definition: "Sum of income from all five heads: Salary, House Property, Business/Profession, Capital Gains, and Other Sources, before deductions.",
    example: "Salary Rs.12L + Rental Rs.2L = Gross Total Income Rs.14L",
  },
  {
    term: "Taxable Income",
    definition: "Gross Total Income minus all eligible deductions under Chapter VI-A. This is the amount on which tax is calculated.",
    example: "Gross Income Rs.14L - Deductions Rs.2L = Taxable Income Rs.12L",
  },
  {
    term: "Standard Deduction",
    definition: "A flat deduction available to salaried individuals and pensioners. Rs.75,000 in New Regime (FY 2025-26), Rs.50,000 in Old Regime.",
    example: "Auto-applied to salary income, no documents needed.",
  },
  {
    term: "Section 80C",
    definition: "Deduction up to Rs.1,50,000 for investments in PPF, ELSS, Life Insurance, EPF, NSC, Tax Saver FD, Tuition Fees, Home Loan Principal.",
    example: "PPF Rs.80K + ELSS Rs.50K + LIC Rs.20K = Rs.1.5L deduction",
  },
  {
    term: "Section 80D",
    definition: "Deduction for health insurance premiums. Self/Family: Rs.25K (Rs.50K if senior), Parents: Rs.25K-50K based on age.",
    example: "Self Rs.25K + Senior Parents Rs.50K = Rs.75K deduction",
  },
  {
    term: "Section 80CCD(1B)",
    definition: "Additional Rs.50,000 deduction for NPS contributions, over and above the Rs.1.5L limit of 80C.",
    example: "Extra Rs.50K tax benefit for NPS investments.",
  },
  {
    term: "Section 24(b)",
    definition: "Deduction up to Rs.2,00,000 for interest paid on home loan for self-occupied property.",
    example: "If you pay Rs.2.5L interest, you can claim Rs.2L deduction.",
  },
  {
    term: "Rebate u/s 87A",
    definition: "Tax relief for lower-income taxpayers. In New Regime: Zero tax if income ≤ Rs.12L. In Old Regime: Up to Rs.12,500 if income ≤ Rs.5L.",
    example: "Rs.11L income in New Regime = Zero tax due to 87A rebate.",
  },
  {
    term: "Surcharge",
    definition: "Additional tax on high incomes. 10% above Rs.50L, 15% above Rs.1Cr, 25% above Rs.2Cr. New Regime caps at 25%.",
    example: "Rs.1.2Cr income attracts 15% surcharge on base tax.",
  },
  {
    term: "Health & Education Cess",
    definition: "4% cess levied on total tax (including surcharge) to fund health and education initiatives.",
    example: "Tax Rs.1L + Surcharge Rs.10K = Cess Rs.4,400",
  },
  {
    term: "TDS (Tax Deducted at Source)",
    definition: "Tax deducted by employer/payer before paying you. Reflects in Form 16/26AS. Can be claimed as advance tax paid.",
    example: "Employer deducts TDS monthly from salary as per tax slabs.",
  },
  {
    term: "HRA (House Rent Allowance)",
    definition: "Exemption for rent paid, available only in Old Regime. Calculated as minimum of: Actual HRA, 50%/40% of salary, or Rent - 10% of salary.",
    example: "Pay Rs.25K rent, get Rs.15-20K HRA exemption based on formula.",
  },
];

const REGIME_COMPARISON = {
  new: {
    name: "New Tax Regime",
    introduced: "Budget 2020, made default from FY 2023-24",
    lastUpdated: "Budget 2025 (FY 2025-26)",
    philosophy: "Lower rates, simpler compliance, fewer exemptions",
    standardDeduction: "Rs.75,000",
    rebateLimit: "Rs.12,00,000 (Zero tax)",
    slabs: [
      { range: "0 - 4,00,000", rate: "Nil" },
      { range: "4,00,000 - 8,00,000", rate: "5%" },
      { range: "8,00,000 - 12,00,000", rate: "10%" },
      { range: "12,00,000 - 16,00,000", rate: "15%" },
      { range: "16,00,000 - 20,00,000", rate: "20%" },
      { range: "20,00,000 - 24,00,000", rate: "25%" },
      { range: "Above 24,00,000", rate: "30%" },
    ],
    pros: [
      "Lower tax rates at each slab",
      "Zero tax up to Rs.12L income (with rebate)",
      "No documentation/investment proofs needed",
      "Simple and straightforward calculation",
      "Better for those without investments",
    ],
    cons: [
      "No 80C, 80D, HRA exemptions",
      "No home loan interest deduction (24b)",
      "Not suitable if you have heavy investments",
      "LTA, children education exemptions not available",
    ],
    bestFor: "Salaried with income < Rs.12L, or those without significant investments/deductions",
  },
  old: {
    name: "Old Tax Regime",
    introduced: "Original Indian tax system",
    lastUpdated: "Unchanged since FY 2020-21",
    philosophy: "Higher rates but extensive deduction options",
    standardDeduction: "Rs.50,000",
    rebateLimit: "Rs.5,00,000 (Up to Rs.12,500 rebate)",
    slabs: [
      { range: "0 - 2,50,000", rate: "Nil" },
      { range: "2,50,000 - 5,00,000", rate: "5%" },
      { range: "5,00,000 - 10,00,000", rate: "20%" },
      { range: "Above 10,00,000", rate: "30%" },
    ],
    pros: [
      "80C deduction up to Rs.1.5L",
      "80D health insurance deduction",
      "HRA exemption for rent",
      "Home loan interest up to Rs.2L (24b)",
      "80CCD(1B) additional Rs.50K for NPS",
      "Leave Travel Allowance (LTA)",
    ],
    cons: [
      "Higher base tax rates",
      "Needs investment planning and documentation",
      "Complicated calculation",
      "Requires proof submission to employer",
    ],
    bestFor: "Those with home loans, high rent, health insurance, and total deductions exceeding Rs.4-5L",
  },
};

export function TaxEducationDialog() {
  const [activeTab, setActiveTab] = useState<"regimes" | "glossary">("regimes");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Learn Tax Basics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-500" />
            Tax Education Center
          </DialogTitle>
          <DialogDescription>
            Understand Indian Income Tax rules, regimes, and terminologies
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-3 bg-muted/30 border-b">
          <Button
            variant={activeTab === "regimes" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("regimes")}
            className="gap-2"
          >
            <Scale className="w-4 h-4" />
            Old vs New Regime
          </Button>
          <Button
            variant={activeTab === "glossary" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("glossary")}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Tax Glossary
          </Button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {activeTab === "regimes" && (
            <div className="p-4 space-y-6">
              {/* Quick Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Quick Decision Guide (FY 2025-26)</p>
                    <p className="text-muted-foreground">
                      • Income ≤ Rs.12L? <span className="text-green-600 font-medium">New Regime = Zero Tax</span><br/>
                      • Deductions &lt; Rs.4L? <span className="text-violet-600 font-medium">New Regime is better</span><br/>
                      • Deductions &gt; Rs.5L? <span className="text-blue-600 font-medium">Old Regime may save more</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* New Regime */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Badge className="bg-white/20 text-white hover:bg-white/30">Default</Badge>
                      {REGIME_COMPARISON.new.name}
                    </h3>
                    <p className="text-xs opacity-80 mt-1">{REGIME_COMPARISON.new.philosophy}</p>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="text-xs space-y-1">
                      <p><span className="text-muted-foreground">Standard Deduction:</span> <span className="font-medium">{REGIME_COMPARISON.new.standardDeduction}</span></p>
                      <p><span className="text-muted-foreground">Zero Tax up to:</span> <span className="font-medium text-green-600">{REGIME_COMPARISON.new.rebateLimit}</span></p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-xs font-medium mb-2">Tax Slabs:</p>
                      <div className="space-y-1">
                        {REGIME_COMPARISON.new.slabs.map((slab, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Rs.{slab.range}</span>
                            <span className="font-medium">{slab.rate}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Advantages
                      </p>
                      <ul className="text-xs space-y-0.5 text-muted-foreground">
                        {REGIME_COMPARISON.new.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Limitations
                      </p>
                      <ul className="text-xs space-y-0.5 text-muted-foreground">
                        {REGIME_COMPARISON.new.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2 bg-violet-500/10 rounded-lg">
                      <p className="text-xs">
                        <span className="font-medium">Best for:</span> {REGIME_COMPARISON.new.bestFor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Old Regime */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Badge className="bg-white/20 text-white hover:bg-white/30">Optional</Badge>
                      {REGIME_COMPARISON.old.name}
                    </h3>
                    <p className="text-xs opacity-80 mt-1">{REGIME_COMPARISON.old.philosophy}</p>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="text-xs space-y-1">
                      <p><span className="text-muted-foreground">Standard Deduction:</span> <span className="font-medium">{REGIME_COMPARISON.old.standardDeduction}</span></p>
                      <p><span className="text-muted-foreground">Rebate Limit:</span> <span className="font-medium">{REGIME_COMPARISON.old.rebateLimit}</span></p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <p className="text-xs font-medium mb-2">Tax Slabs:</p>
                      <div className="space-y-1">
                        {REGIME_COMPARISON.old.slabs.map((slab, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Rs.{slab.range}</span>
                            <span className="font-medium">{slab.rate}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Advantages
                      </p>
                      <ul className="text-xs space-y-0.5 text-muted-foreground">
                        {REGIME_COMPARISON.old.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Limitations
                      </p>
                      <ul className="text-xs space-y-0.5 text-muted-foreground">
                        {REGIME_COMPARISON.old.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <p className="text-xs">
                        <span className="font-medium">Best for:</span> {REGIME_COMPARISON.old.bestFor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">Important Notes:</p>
                    <ul className="text-muted-foreground mt-1 space-y-0.5">
                      <li>• New Regime is the default from FY 2023-24. You must opt-out to use Old Regime.</li>
                      <li>• Salaried can switch regimes every year. Business owners have limited switching.</li>
                      <li>• Tax slabs shown are for FY 2025-26 as per Budget 2025.</li>
                      <li>• Always verify with official IT department sources before filing.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "glossary" && (
            <div className="p-4">
              <Accordion type="single" collapsible className="space-y-2">
                {TAX_GLOSSARY.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {index + 1}
                        </Badge>
                        {item.term}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{item.definition}</p>
                        {item.example && (
                          <div className="p-2 bg-muted/50 rounded text-xs">
                            <span className="font-medium">Example:</span> {item.example}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground">
            Information based on Indian Income Tax Act. Last updated: Budget 2025. Always consult a CA for personalized advice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
