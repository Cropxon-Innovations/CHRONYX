import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Home,
  Briefcase,
  TrendingUp,
  Gift,
  Wallet,
  Clock,
  Plus,
  ChevronRight,
  CheckCircle2,
  IndianRupee
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaxScenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: ScenarioField[];
}

interface ScenarioField {
  id: string;
  label: string;
  type: "number" | "text" | "date";
  placeholder?: string;
  helperText?: string;
}

const SCENARIOS: TaxScenario[] = [
  {
    id: "job_change",
    label: "Changed Job This Year",
    description: "Worked with multiple employers",
    icon: Briefcase,
    fields: [
      { id: "prev_employer_salary", label: "Previous Employer Salary", type: "number", placeholder: "Total salary received" },
      { id: "prev_employer_tds", label: "TDS by Previous Employer", type: "number", placeholder: "TDS deducted" },
      { id: "current_employer_salary", label: "Current Employer Salary", type: "number", placeholder: "Total salary received" },
      { id: "current_employer_tds", label: "TDS by Current Employer", type: "number", placeholder: "TDS deducted" },
    ],
  },
  {
    id: "house_loan",
    label: "Home Loan",
    description: "Interest & principal deductions",
    icon: Home,
    fields: [
      { id: "loan_principal", label: "Principal Repaid (80C)", type: "number", placeholder: "Max ₹1.5L under 80C" },
      { id: "loan_interest", label: "Interest Paid (24b)", type: "number", placeholder: "Max ₹2L for self-occupied" },
      { id: "property_type", label: "Property Type", type: "text", placeholder: "Self-occupied / Let out" },
    ],
  },
  {
    id: "rental_income",
    label: "Rental Income",
    description: "Income from house property",
    icon: Building2,
    fields: [
      { id: "annual_rent", label: "Annual Rent Received", type: "number", placeholder: "Total rent received" },
      { id: "municipal_tax", label: "Municipal Taxes Paid", type: "number", placeholder: "Property tax paid" },
      { id: "home_loan_interest", label: "Home Loan Interest", type: "number", placeholder: "If any" },
    ],
  },
  {
    id: "capital_gains",
    label: "Capital Gains",
    description: "Stocks, mutual funds, property",
    icon: TrendingUp,
    fields: [
      { id: "stcg", label: "Short-Term Capital Gains", type: "number", placeholder: "Equity < 1 year" },
      { id: "ltcg", label: "Long-Term Capital Gains", type: "number", placeholder: "Equity > 1 year, above ₹1L" },
      { id: "property_gains", label: "Property Capital Gains", type: "number", placeholder: "If sold property" },
    ],
  },
  {
    id: "other_income",
    label: "Other Income",
    description: "Interest, dividends, freelance",
    icon: Wallet,
    fields: [
      { id: "savings_interest", label: "Savings Account Interest", type: "number", placeholder: "80TTA: ₹10K exempt" },
      { id: "fd_interest", label: "FD/RD Interest", type: "number", placeholder: "Fully taxable" },
      { id: "dividend_income", label: "Dividend Income", type: "number", placeholder: "Taxable at slab rates" },
      { id: "freelance_income", label: "Freelance/Other Income", type: "number", placeholder: "Any other income" },
    ],
  },
  {
    id: "arrears",
    label: "Arrears & Bonus",
    description: "Past salary received this year",
    icon: Gift,
    fields: [
      { id: "arrears_amount", label: "Arrears Received", type: "number", placeholder: "For previous years" },
      { id: "bonus_amount", label: "Bonus Received", type: "number", placeholder: "Performance bonus" },
      { id: "arrears_year", label: "Arrears Period", type: "text", placeholder: "e.g., FY 2023-24" },
    ],
  },
];

interface TaxScenarioSelectorProps {
  onScenariosChange: (scenarios: Record<string, Record<string, number | string>>) => void;
}

export function TaxScenarioSelector({ onScenariosChange }: TaxScenarioSelectorProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [scenarioData, setScenarioData] = useState<Record<string, Record<string, number | string>>>({});

  const toggleScenario = (scenarioId: string) => {
    const newSelected = new Set(selectedScenarios);
    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId);
      setExpandedScenario(null);
      const newData = { ...scenarioData };
      delete newData[scenarioId];
      setScenarioData(newData);
    } else {
      newSelected.add(scenarioId);
      setExpandedScenario(scenarioId);
      setScenarioData({ ...scenarioData, [scenarioId]: {} });
    }
    setSelectedScenarios(newSelected);
    onScenariosChange(scenarioData);
  };

  const updateField = (scenarioId: string, fieldId: string, value: string | number) => {
    const newData = {
      ...scenarioData,
      [scenarioId]: {
        ...(scenarioData[scenarioId] || {}),
        [fieldId]: value,
      },
    };
    setScenarioData(newData);
    onScenariosChange(newData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScenarioTotal = (scenarioId: string): number => {
    const data = scenarioData[scenarioId] || {};
    return Object.values(data).reduce<number>((sum, val) => {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Your Tax Scenarios
        </CardTitle>
        <CardDescription className="text-xs">
          Select applicable scenarios to include additional income or deductions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {SCENARIOS.map((scenario) => {
          const isSelected = selectedScenarios.has(scenario.id);
          const isExpanded = expandedScenario === scenario.id;
          const Icon = scenario.icon;
          const total = getScenarioTotal(scenario.id);

          return (
            <motion.div
              key={scenario.id}
              layout
              className={cn(
                "border rounded-lg overflow-hidden transition-colors",
                isSelected ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <button
                onClick={() => toggleScenario(scenario.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{scenario.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{scenario.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && total > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(total)}
                    </Badge>
                  )}
                  <Checkbox checked={isSelected} />
                </div>
              </button>

              <AnimatePresence>
                {isSelected && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t bg-muted/30"
                  >
                    <div className="p-4 space-y-3">
                      {scenario.fields.map((field) => (
                        <div key={field.id} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={scenarioData[scenario.id]?.[field.id] || ""}
                            onChange={(e) => {
                              const val = field.type === "number" 
                                ? parseFloat(e.target.value) || 0 
                                : e.target.value;
                              updateField(scenario.id, field.id, val);
                            }}
                            className="h-8 text-sm"
                          />
                          {field.helperText && (
                            <p className="text-[10px] text-muted-foreground">{field.helperText}</p>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setExpandedScenario(null)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isSelected && !isExpanded && (
                <button
                  onClick={() => setExpandedScenario(scenario.id)}
                  className="w-full p-2 border-t text-xs text-primary hover:bg-primary/5 flex items-center justify-center gap-1"
                >
                  Edit Details
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default TaxScenarioSelector;
