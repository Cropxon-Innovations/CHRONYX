import { useGoals } from "../hooks/useWealthX";
import { Progress } from "@/components/ui/progress";
import { formatCompactINR, formatINR } from "@/lib/inr";
import { Target, Home, Car, GraduationCap, Plane, ShieldAlert, Sparkles } from "lucide-react";

const iconMap = {
  retirement: Target,
  house:      Home,
  car:        Car,
  education:  GraduationCap,
  vacation:   Plane,
  emergency:  ShieldAlert,
  custom:     Sparkles,
} as const;

export const Goals = () => {
  const { data } = useGoals();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Financial Goals</h2>
        <p className="text-sm text-muted-foreground">Track progress, required SIPs and probability of success — values in ₹.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((g) => {
          const Icon = iconMap[g.kind] ?? Sparkles;
          const pct  = Math.round((g.currentAmount / g.targetAmount) * 100);
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground tracking-tight">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">Target by {new Date(g.targetDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}</p>
                </div>
                <span className="text-xs font-medium text-foreground">{pct}%</span>
              </div>

              <Progress value={pct} className="mt-4 h-2" />

              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Current</p>
                  <p className="tabular-nums font-medium text-foreground mt-0.5">{formatCompactINR(g.currentAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Target</p>
                  <p className="tabular-nums font-medium text-foreground mt-0.5">{formatCompactINR(g.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Req. SIP</p>
                  <p className="tabular-nums font-medium text-foreground mt-0.5">{formatINR(g.requiredSIP)}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Probability of success</span>
                <span className={g.probability >= 0.75 ? "text-emerald-500 font-medium" : g.probability >= 0.5 ? "text-amber-500 font-medium" : "text-rose-500 font-medium"}>
                  {(g.probability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
