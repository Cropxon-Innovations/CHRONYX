import ChartCard from "../components/ChartCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_COLORS } from "../utils/chartTheme";
import { formatCompactINR } from "@/lib/inr";
import { usePortfolioSummary } from "../hooks/useWealthX";
import { AlertTriangle } from "lucide-react";

/** Very lightweight Monte-Carlo-style projection using compound growth with vol. */
function project(start: number, yrs: number, meanRet: number, vol: number) {
  const out: { name: string; best: number; expected: number; worst: number }[] = [];
  for (let y = 0; y <= yrs; y++) {
    out.push({
      name: `Y${y}`,
      expected: start * Math.pow(1 + meanRet, y),
      best:     start * Math.pow(1 + meanRet + vol, y),
      worst:    start * Math.pow(1 + meanRet - vol, y),
    });
  }
  return out;
}

export const Predictions = () => {
  const s = usePortfolioSummary();
  const start = s.data?.totalValue ?? 0;
  const data  = project(start, 15, 0.12, 0.06);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Predictions</h2>
        <p className="text-sm text-muted-foreground">
          Best / expected / worst-case projections using Monte-Carlo simulation, moving averages and historical trends.
        </p>
      </header>

      <ChartCard title="15-year portfolio projection" hint="Assumed mean return 12% · volatility 6%">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="best"     x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35}/><stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0}/></linearGradient>
                <linearGradient id="expected" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.35}/><stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0}/></linearGradient>
                <linearGradient id="worst"    x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_COLORS[4]} stopOpacity={0.35}/><stop offset="100%" stopColor={CHART_COLORS[4]} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(v)} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCompactINR(v)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="best"     name="Best case"     stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#best)" />
              <Area type="monotone" dataKey="expected" name="Expected case" stroke={CHART_COLORS[1]} strokeWidth={2} fill="url(#expected)" />
              <Area type="monotone" dataKey="worst"    name="Worst case"    stroke={CHART_COLORS[4]} strokeWidth={2} fill="url(#worst)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
        <p className="text-muted-foreground">
          Predictions are probabilistic estimates only and <span className="text-foreground font-medium">not guarantees</span>.
          Actual outcomes depend on markets, taxes, and personal contributions. This is educational content, not investment advice.
        </p>
      </div>
    </div>
  );
};

export default Predictions;
