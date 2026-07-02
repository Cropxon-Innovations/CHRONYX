import { useSIPs } from "../hooks/useWealthX";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, SkipForward, Pencil, Plus, CalendarClock } from "lucide-react";
import { formatCompactINR, formatINR } from "@/lib/inr";
import { toast } from "sonner";

export const SIPManager = () => {
  const { data } = useSIPs();
  const total = (data ?? []).reduce((s, x) => s + x.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">SIP Manager</h2>
          <p className="text-sm text-muted-foreground">Systematic Investment Plans · monthly outflow {formatINR(total)}</p>
        </div>
        <Button size="sm" onClick={() => toast.info("Coming soon — connect a broker to create SIPs.")}>
          <Plus className="w-3.5 h-3.5 mr-2" /> New SIP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">{s.fundName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.frequency} · Started {new Date(s.startDate).toLocaleDateString("en-IN")}</p>
              </div>
              <Badge variant="outline" className={s.status === "active" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"}>
                {s.status}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <Field label="Instalment" v={formatINR(s.amount)} />
              <Field label="Invested"   v={formatCompactINR(s.totalInvested)} />
              <Field label="Value"      v={formatCompactINR(s.currentValue)} />
            </div>

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="w-3.5 h-3.5" />
                Next {new Date(s.nextDate).toLocaleDateString("en-IN")}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => toast.success(`${s.status === "active" ? "Paused" : "Resumed"} ${s.fundName}`)}>
                  {s.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Skip scheduled for next cycle")}>
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info("Modify dialog coming soon")}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-3">
              Expected corpus at target date: <span className="text-foreground font-medium">{formatCompactINR(s.expectedCorpus)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Field = ({ label, v }: { label: string; v: string }) => (
  <div>
    <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{label}</p>
    <p className="text-sm font-medium tabular-nums text-foreground">{v}</p>
  </div>
);

export default SIPManager;
