import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface MissedDeduction {
  section: string;
  label: string;
  maxLimit: number;
  claimed: number;
  potentialSavings: number;
  tip: string;
}

interface MissedDeductionsCardProps {
  deductions: Record<string, number>;
  taxBracket: number; // 5, 10, 20, 30, etc.
  regime: string;
}

const formatCurrency = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString()}`;
};

const DEDUCTION_CONFIG: Record<string, { label: string; maxLimit: number; tip: string }> = {
  "80C": {
    label: "Section 80C",
    maxLimit: 150000,
    tip: "Invest in PPF, ELSS, or LIC",
  },
  "80CCD1B": {
    label: "NPS (80CCD1B)",
    maxLimit: 50000,
    tip: "Additional NPS contribution",
  },
  "80D": {
    label: "Section 80D",
    maxLimit: 75000,
    tip: "Health insurance for self + parents",
  },
  "24B": {
    label: "Home Loan Interest",
    maxLimit: 200000,
    tip: "Claim on self-occupied property",
  },
  HRA: {
    label: "HRA Exemption",
    maxLimit: 0, // Variable
    tip: "Submit rent receipts to employer",
  },
};

export function MissedDeductionsCard({ deductions, taxBracket, regime }: MissedDeductionsCardProps) {
  if (regime === "new") {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <Lightbulb className="w-6 h-6 mx-auto mb-2 text-amber-500" />
          <p>Deductions not applicable in New Regime.</p>
          <p className="text-xs mt-1">Switch to Old Regime to claim deductions.</p>
        </CardContent>
      </Card>
    );
  }

  const missedDeductions: MissedDeduction[] = [];

  Object.entries(DEDUCTION_CONFIG).forEach(([key, config]) => {
    const claimed = deductions[key] || 0;
    const remaining = config.maxLimit - claimed;

    if (config.maxLimit > 0 && remaining > 10000) {
      const potentialSavings = Math.round((remaining * taxBracket) / 100);
      missedDeductions.push({
        section: key,
        label: config.label,
        maxLimit: config.maxLimit,
        claimed,
        potentialSavings,
        tip: config.tip,
      });
    }
  });

  if (missedDeductions.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-green-600">All Deductions Maximized!</p>
          <p className="text-xs text-muted-foreground mt-1">
            You're making the most of available tax benefits.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPotentialSavings = missedDeductions.reduce((sum, d) => sum + d.potentialSavings, 0);

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            You Can Save More
          </span>
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            Up to {formatCurrency(totalPotentialSavings)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {missedDeductions.slice(0, 3).map((deduction, index) => (
          <motion.div
            key={deduction.section}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
          >
            <div>
              <p className="text-xs font-medium">{deduction.label}</p>
              <p className="text-[10px] text-muted-foreground">{deduction.tip}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-amber-600">
                Save {formatCurrency(deduction.potentialSavings)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(deduction.maxLimit - deduction.claimed)} unclaimed
              </p>
            </div>
          </motion.div>
        ))}

        {missedDeductions.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{missedDeductions.length - 3} more deductions available
          </p>
        )}
      </CardContent>
    </Card>
  );
}