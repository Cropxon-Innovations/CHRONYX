import { useWatchlist } from "../hooks/useWealthX";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { formatINR, formatPct } from "@/lib/inr";
import { toast } from "sonner";

export const Watchlist = () => {
  const { data } = useWatchlist();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Watchlist</h2>
          <p className="text-sm text-muted-foreground">Track prices, set alerts and never miss a target.</p>
        </div>
        <Button size="sm" onClick={() => toast.info("Add-symbol dialog coming soon")}>
          <Plus className="w-3.5 h-3.5 mr-2" /> Add symbol
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((w) => (
          <div key={w.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{w.symbol}</p>
                <h3 className="text-base font-semibold text-foreground tracking-tight mt-0.5">{w.name}</h3>
              </div>
              <Badge variant="outline" className="capitalize text-[10px]">{w.kind.replace("_", " ")}</Badge>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-xl font-semibold tabular-nums text-foreground">{formatINR(w.price, 2)}</span>
              <span className={`text-xs font-medium tabular-nums ${w.changePct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {formatPct(w.changePct)}
              </span>
            </div>

            {w.targetPrice && (
              <p className="text-xs text-muted-foreground mt-2">
                Target · <span className="text-foreground font-medium">{formatINR(w.targetPrice, 2)}</span>
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bell className="w-3.5 h-3.5" />
                {w.alerts.length} alert{w.alerts.length !== 1 ? "s" : ""}
              </div>
              <Button size="sm" variant="ghost" onClick={() => toast.success("Alert configured")}>Manage</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Watchlist;
