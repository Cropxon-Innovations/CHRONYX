import { cn } from "@/lib/utils";
import { formatCompactINR, formatINR, formatPct } from "@/lib/inr";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricProps {
  label: string;
  value: number | string;
  /** Optional percentage delta */
  deltaPct?: number;
  /** Optional secondary line */
  hint?: string;
  /** Format `value` as INR when it's a number */
  format?: "inr" | "inr-compact" | "raw" | "pct";
  className?: string;
}

export const MetricCard = ({ label, value, deltaPct, hint, format = "inr-compact", className }: MetricProps) => {
  const isNum = typeof value === "number";
  const display = !isNum
    ? value
    : format === "inr"         ? formatINR(value as number)
    : format === "inr-compact" ? formatCompactINR(value as number)
    : format === "pct"         ? `${(value as number).toFixed(2)}%`
    : String(value);

  const positive = (deltaPct ?? 0) >= 0;
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 hover:shadow-sm transition-shadow", className)}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight text-foreground">{display}</span>
        {deltaPct !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              positive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {formatPct(deltaPct)}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export default MetricCard;
