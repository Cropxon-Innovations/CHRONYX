import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { Download, Sparkles, TrendingUp, TrendingDown, Activity, Radio } from "lucide-react";

import MetricCard from "../components/MetricCard";
import ChartCard from "../components/ChartCard";
import { usePortfolioSummary, useGrowthSeries, useAllocation, useSectorAllocation, useAllHoldings, useSIPs, useTransactions, useNews } from "../hooks/useWealthX";
import { formatCompactINR, formatINR, formatPct } from "@/lib/inr";
import { CHART_COLORS } from "../utils/chartTheme";
import { exportPortfolioPDF } from "../utils/exportPdf";
import { useLiveNetWorth } from "@/hooks/useLiveNetWorth";

const CardSkeleton = () => <Skeleton className="h-28 rounded-2xl" />;

export const WealthXDashboard = () => {
  const live      = useLiveNetWorth();
  const summary   = usePortfolioSummary();
  const growth    = useGrowthSeries();
  const alloc     = useAllocation();
  const sector    = useSectorAllocation();
  const holdings  = useAllHoldings();
  const sips      = useSIPs();
  const txns      = useTransactions();
  const news      = useNews();

  const s = summary.data;
  const h = holdings.data ?? [];
  const winners = [...h].sort((a, b) => b.overallChangePct - a.overallChangePct).slice(0, 3);
  const losers  = [...h].sort((a, b) => a.overallChangePct - b.overallChangePct).slice(0, 3);

  const onExport = () => {
    if (s && h.length) exportPortfolioPDF({ summary: s, holdings: h });
  };

  return (
    <div className="space-y-8">
      {/* Live finance sync — Realtime from expenses/income/loans/EMIs/assets */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              <Radio className="inline w-3.5 h-3.5 mr-1 -mt-0.5" /> Live sync — Net Worth
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {live.loading ? "Syncing…" : `Updated ${live.updatedAt.toLocaleTimeString("en-IN")}`}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard label="Net Worth"          value={live.netWorth} />
          <MetricCard label="Total Assets"       value={live.assets} />
          <MetricCard label="Liabilities"        value={live.liabilities} />
          <MetricCard label="Cash Flow (LTD)"    value={live.cash} />
          <MetricCard label="This month savings" value={live.monthlySavings} />
          <MetricCard label="EMIs due (month)"   value={live.emiDueThisMonth} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1">
          <Activity className="w-3 h-3" /> Auto-updates the moment you add or edit expenses, income, loans, EMIs, or assets — no refresh needed.
        </p>
      </section>

      {/* Top summary */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Portfolio overview</h2>
            <p className="text-sm text-muted-foreground">All values in Indian Rupees (₹) · updated moments ago</p>
          </div>
          <Button variant="outline" size="sm" onClick={onExport} disabled={!s}>
            <Download className="w-3.5 h-3.5 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {!s ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard label="Current Value"    value={s.totalValue}    deltaPct={s.profitPct} />
              <MetricCard label="Invested"         value={s.totalInvested} />
              <MetricCard label="Profit / Loss"    value={s.profit}        deltaPct={s.profitPct} />
              <MetricCard label="Today's P&L"      value={s.todayPnl}      deltaPct={(s.todayPnl / s.totalValue) * 100} />
              <MetricCard label="XIRR"             value={s.xirr}          format="pct" />
              <MetricCard label="CAGR"             value={s.cagr}          format="pct" />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {s ? (
            <>
              <MetricCard label="Cash Available"        value={s.cashAvailable} />
              <MetricCard label="Health Score"          value={`${s.healthScore}/100`}          format="raw" />
              <MetricCard label="Risk Score"            value={`${s.riskScore}/100`}            format="raw" />
              <MetricCard label="Diversification"       value={`${s.diversificationScore}/100`} format="raw" />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          )}
        </div>
      </section>

      {/* Growth + Allocation */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Portfolio growth" hint="Trailing 12 months" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth.data ?? []}>
                <defs>
                  <linearGradient id="wxGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                       tickFormatter={(v) => formatCompactINR(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#wxGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Asset allocation" hint="By current value">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alloc.data ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {(alloc.data ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatCompactINR(v)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* Sector + Winners/Losers */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Sector allocation" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sector.data ?? []}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                       tickFormatter={(v) => formatCompactINR(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => formatCompactINR(v)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {(sector.data ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">Top winners</h3>
            </div>
            <ul className="space-y-2">
              {winners.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2 text-foreground">{w.name}</span>
                  <span className="text-emerald-500 tabular-nums font-medium">{formatPct(w.overallChangePct)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-semibold text-foreground">Top laggards</h3>
            </div>
            <ul className="space-y-2">
              {losers.map((w) => (
                <li key={w.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-2 text-foreground">{w.name}</span>
                  <span className={`tabular-nums font-medium ${w.overallChangePct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {formatPct(w.overallChangePct)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SIPs + Recent + AI + News */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Upcoming SIPs</h3>
          <ul className="space-y-3">
            {(sips.data ?? []).map((sip) => (
              <li key={sip.id} className="flex items-center justify-between text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="text-foreground font-medium">{sip.fundName}</p>
                  <p className="text-xs text-muted-foreground">{sip.frequency} · Next {new Date(sip.nextDate).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="font-medium tabular-nums">{formatINR(sip.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Recent transactions</h3>
          <ul className="space-y-3">
            {(txns.data ?? []).slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="text-foreground font-medium capitalize">{t.action} · {t.symbol}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="tabular-nums">{formatINR(t.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">AI daily summary</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your portfolio moved <span className="text-emerald-500 font-medium">{formatPct((s?.todayPnl ?? 0) / (s?.totalValue ?? 1) * 100)}</span> today,
            driven mainly by IT (Infosys) and Financials (HDFC Bank). Gold continues to be a stable hedge and now represents
            ~15% of holdings. Diversification looks healthy at {s?.diversificationScore}/100, though sector concentration in
            IT & Financials warrants a periodic rebalance. This is educational commentary, not financial advice.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Market news</h3>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(news.data ?? []).map((n) => (
              <li key={n.id} className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{n.source}</p>
                <p className="text-sm font-medium mt-1 text-foreground">{n.headline}</p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{n.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

export default WealthXDashboard;
