import { useNews } from "../hooks/useWealthX";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const sentimentClass = {
  positive: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  neutral:  "bg-sky-500/15 text-sky-600 border-sky-500/30",
  negative: "bg-rose-500/15 text-rose-600 border-rose-500/30",
} as const;

export const News = () => {
  const { data } = useNews();
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Market News</h2>
        <p className="text-sm text-muted-foreground">Curated headlines with AI summaries and sentiment analysis.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data ?? []).map((n) => (
          <article key={n.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{n.source} · {new Date(n.date).toLocaleDateString("en-IN")}</p>
              <Badge variant="outline" className={`text-[10px] capitalize ${sentimentClass[n.sentiment]}`}>{n.sentiment}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-snug">{n.headline}</h3>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
              <p>{n.summary}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-1.5">
              {n.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{t}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default News;
