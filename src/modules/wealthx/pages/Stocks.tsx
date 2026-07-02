import { useStocks } from "../hooks/useWealthX";
import HoldingsTable from "../components/HoldingsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR, formatPct } from "@/lib/inr";

export const Stocks = () => {
  const { data, isLoading } = useStocks();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Stocks</h2>
        <p className="text-sm text-muted-foreground">Live prices, fundamentals & AI summary — values in ₹.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.sector} · {s.industry}</p>
                <h3 className="text-base font-semibold text-foreground mt-0.5 tracking-tight">{s.name} <span className="text-xs text-muted-foreground">({s.symbol})</span></h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular-nums text-foreground">{formatINR(s.currentPrice, 2)}</p>
                <p className={`text-xs tabular-nums ${s.todayChangePct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{formatPct(s.todayChangePct)}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 text-center text-xs">
              {[
                ["Open", formatINR(s.open, 2)],
                ["High", formatINR(s.high, 2)],
                ["Low",  formatINR(s.low, 2)],
                ["Prev", formatINR(s.prevClose, 2)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
                  <p className="tabular-nums text-foreground">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/60 text-xs">
              <Kv k="P/E"       v={s.pe.toFixed(1)} />
              <Kv k="P/B"       v={s.pb.toFixed(1)} />
              <Kv k="ROE"       v={`${s.roe}%`} />
              <Kv k="ROCE"      v={`${s.roce}%`} />
              <Kv k="EPS"       v={`₹${s.eps}`} />
              <Kv k="Div Yield" v={`${s.dividendYield}%`} />
              <Kv k="Mkt Cap"   v={`₹${s.marketCap.toLocaleString("en-IN")} Cr`} />
              <Kv k="52W High"  v={formatINR(s.wk52High, 0)} />
              <Kv k="52W Low"   v={formatINR(s.wk52Low, 0)} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Positions</h3>
        <HoldingsTable data={data ?? []} />
      </div>
    </div>
  );
};

const Kv = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between border-b border-border/40 pb-1">
    <span className="text-muted-foreground">{k}</span>
    <span className="tabular-nums text-foreground">{v}</span>
  </div>
);

export default Stocks;
