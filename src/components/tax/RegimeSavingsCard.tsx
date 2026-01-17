import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingDown, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface RegimeSavingsCardProps {
  oldRegimeTax: number;
  newRegimeTax: number;
  recommendedRegime: "old" | "new";
  savingsAmount: number;
}

const formatCurrency = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
};

export function RegimeSavingsCard({
  oldRegimeTax,
  newRegimeTax,
  recommendedRegime,
  savingsAmount,
}: RegimeSavingsCardProps) {
  const betterRegime = recommendedRegime === "new" ? "New Regime" : "Old Regime";

  if (savingsAmount < 100) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Both regimes result in similar tax. Choose based on your preference.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recommended</p>
                <p className="font-semibold text-green-600 flex items-center gap-1">
                  {betterRegime}
                  <CheckCircle2 className="w-4 h-4" />
                </p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Best Choice
            </Badge>
          </div>

          {/* Comparison */}
          <div className="flex items-center justify-between gap-4 p-3 bg-background/50 rounded-lg">
            <div className={`text-center ${recommendedRegime === "old" ? "opacity-100" : "opacity-50"}`}>
              <p className="text-[10px] text-muted-foreground uppercase">Old Regime</p>
              <p className={`font-bold ${recommendedRegime === "old" ? "text-green-600" : ""}`}>
                {formatCurrency(oldRegimeTax)}
              </p>
            </div>
            
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            
            <div className={`text-center ${recommendedRegime === "new" ? "opacity-100" : "opacity-50"}`}>
              <p className="text-[10px] text-muted-foreground uppercase">New Regime</p>
              <p className={`font-bold ${recommendedRegime === "new" ? "text-green-600" : ""}`}>
                {formatCurrency(newRegimeTax)}
              </p>
            </div>
          </div>

          {/* Savings highlight */}
          <div className="mt-3 text-center">
            <p className="text-sm">
              You save{" "}
              <span className="font-bold text-lg text-green-600">
                {formatCurrency(savingsAmount)}
              </span>{" "}
              with {betterRegime}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              That's ₹{Math.round(savingsAmount / 12).toLocaleString()}/month extra in your pocket!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}