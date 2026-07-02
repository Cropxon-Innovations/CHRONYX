import { usePortfolioSummary, useSectorAllocation, useGrowthSeries, useAllHoldings } from "../hooks/useWealthX";
import MetricCard from "../components/MetricCard";
import ChartCard from "../components/ChartCard";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ZAxis, Treemap } from "recharts";
import { CHART_COLORS } from "../utils/chartTheme";
import { formatCompactINR } from "@/lib/inr";

export const Analytics = () => {
  const s        = usePortfolioSummary();
  const sector   = useSectorAllocation();
  const growth   = useGrowthSeries();
  const holdings = useAllHoldings();

  const risk = holdings.data?.map((h) => ({
    name: h.symbol,
    risk: h.risk === "Low" ? 2 : h.risk === "Moderate" ? 5 : h.risk === "High" ? 7 : 9,
    ret: h.overallChangePct,
    size: h.currentValue,
  })) ?? [];

  const treemap = (holdings.data ?? []).map((h) => ({ name: h.symbol, size: h.currentValue }));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">Absolute & annualised returns, risk-adjusted metrics, sector exposure.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="XIRR"           value={s.data?.xirr ?? 0}                 format="pct" />
        <MetricCard label="CAGR"           value={s.data?.cagr ?? 0}                 format="pct" />
        <MetricCard label="Sharpe Ratio"   value="1.42"                              format="raw" />
        <MetricCard label="Sortino Ratio"  value="1.87"                              format="raw" />
        <MetricCard label="Alpha"          value="3.24%"                             format="raw" />
        <MetricCard label="Beta"           value="0.92"                              format="raw" />
        <MetricCard label="Std Deviation"  value="14.8%"                             format="raw" />
        <MetricCard label="Max Drawdown"   value="-11.4%"                            format="raw" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Rolling returns" hint="12-month rolling window">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth.data ?? []}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactINR(v)} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Risk vs Return" hint="Bubble size = current value">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="risk" name="Risk" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="number" dataKey="ret" name="Return %" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <ZAxis type="number" dataKey="size" range={[60, 400]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={risk} fill={CHART_COLORS[2]} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Holdings treemap" hint="Concentration by current value">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={treemap} dataKey="size" stroke="hsl(var(--background))" fill={CHART_COLORS[0]} />
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
};

export default Analytics;
