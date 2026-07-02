import type { Holding } from "../types";
import { formatCompactINR, formatINR, formatPct } from "@/lib/inr";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rec = {
  Buy:    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Hold:   "bg-sky-500/15 text-sky-600 border-sky-500/30",
  Reduce: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Sell:   "bg-rose-500/15 text-rose-600 border-rose-500/30",
} as const;

export const HoldingsTable = ({
  data,
  showRecommendation = true,
}: {
  data: Holding[];
  showRecommendation?: boolean;
}) => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="min-w-[180px]">Instrument</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Avg</TableHead>
            <TableHead className="text-right">LTP</TableHead>
            <TableHead className="text-right">Invested</TableHead>
            <TableHead className="text-right">Current</TableHead>
            <TableHead className="text-right">Today</TableHead>
            <TableHead className="text-right">Overall</TableHead>
            {showRecommendation && <TableHead className="text-right">AI</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((h) => {
            const pnl = h.currentValue - h.invested;
            const positive = pnl >= 0;
            return (
              <TableRow key={h.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{h.name}</span>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {h.symbol} · {h.sector}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{h.quantity.toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{formatINR(h.avgPrice, 2)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(h.currentPrice, 2)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{formatCompactINR(h.invested)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{formatCompactINR(h.currentValue)}</TableCell>
                <TableCell className={cn("text-right tabular-nums text-xs", h.todayChangePct >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {formatPct(h.todayChangePct)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", positive ? "text-emerald-500" : "text-rose-500")}>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium">{formatPct(h.overallChangePct)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatCompactINR(pnl)}</span>
                  </div>
                </TableCell>
                {showRecommendation && (
                  <TableCell className="text-right">
                    <Badge variant="outline" className={cn("text-[10px] font-medium", rec[h.recommendation])}>
                      {h.recommendation}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  </div>
);

export default HoldingsTable;
