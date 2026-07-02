import { useTransactions } from "../hooks/useWealthX";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/inr";

const actionColors: Record<string, string> = {
  buy:      "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  sell:     "bg-rose-500/15 text-rose-600 border-rose-500/30",
  dividend: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  sip:      "bg-violet-500/15 text-violet-600 border-violet-500/30",
  bonus:    "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export const Transactions = () => {
  const { data } = useTransactions();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Transactions</h2>
        <p className="text-sm text-muted-foreground">Every buy, sell, SIP, dividend and bonus — values in ₹.</p>
      </header>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize text-[10px] ${actionColors[t.action]}`}>{t.action}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{t.symbol}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.quantity || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{t.price ? formatINR(t.price, 2) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatINR(t.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
