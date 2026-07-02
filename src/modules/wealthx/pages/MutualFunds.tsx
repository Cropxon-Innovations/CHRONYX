import { useMutualFunds } from "../hooks/useWealthX";
import HoldingsTable from "../components/HoldingsTable";
import { formatCompactINR, formatINR, formatPct } from "@/lib/inr";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const MutualFunds = () => {
  const { data, isLoading } = useMutualFunds();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Mutual Funds</h2>
        <p className="text-sm text-muted-foreground">NAV, AUM, expense ratio, rolling returns & fund manager details.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        {(data ?? []).map((f) => (
          <div key={f.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.fundHouse}</p>
                <h3 className="text-base font-semibold text-foreground mt-0.5 tracking-tight">{f.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.category} · Managed by {f.fundManager}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{f.risk}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">NAV</p>
                <p className="text-sm font-medium tabular-nums">{formatINR(f.nav, 2)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">AUM</p>
                <p className="text-sm font-medium tabular-nums">₹{f.aum.toLocaleString("en-IN")} Cr</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Expense</p>
                <p className="text-sm font-medium tabular-nums">{f.expenseRatio}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/60 text-center">
              {(["1Y", "3Y", "5Y"] as const).map((p) => (
                <div key={p}>
                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{p}</p>
                  <p className={`text-sm font-medium tabular-nums ${f.returns[p] >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {formatPct(f.returns[p])}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Invested {formatCompactINR(f.invested)}</span>
              <span className={f.overallChangePct >= 0 ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>
                {formatCompactINR(f.currentValue)} · {formatPct(f.overallChangePct)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Exit load: {f.exitLoad}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Holdings detail</h3>
        <HoldingsTable data={data ?? []} />
      </div>
    </div>
  );
};

export default MutualFunds;
