import { Sparkles } from "lucide-react";

const sections = [
  { title: "Daily summary",        body: "Your portfolio is up on the back of a broad IT rally. Financials are stable; Reliance continues its multi-week uptrend." },
  { title: "Weekly review",        body: "Best contributor: PPFAS Flexi Cap (+2.1%). Weakest: Axis Bluechip (-0.4%). Overall week +1.8%." },
  { title: "Monthly review",       body: "Portfolio grew 5.6% vs Nifty 50's 4.2%. Alpha of ~1.4% driven by mid-cap allocation." },
  { title: "Risk review",          value: "Moderate", body: "Standard deviation at 14.8% is in line with a 70/30 equity/debt profile. No single stock exceeds 8% weight." },
  { title: "Rebalancing tips",     body: "IT + Financials now form 55% of equity. Consider trimming ~5% and increasing exposure to Healthcare or Consumer." },
  { title: "Sector analysis",      body: "IT sector cyclicals may face BFSI-spend pressure. Financials remain structurally strong with credit growth at 15%." },
  { title: "Market commentary",    body: "The Nifty is trading at 20.4x forward earnings — slightly above the 5Y average. Valuations demand selectivity." },
  { title: "Tax suggestions",      body: "You have ₹42,000 of LTCG headroom left this FY (below ₹1L). Consider tax-loss harvesting on underperformers." },
  { title: "Investment ideas",     body: "Sectors with improving earnings breadth: Manufacturing, Renewables, Defence. Bottom-up quality names preferred." },
  { title: "Portfolio health",     value: "82 / 100", body: "Diversification 74/100 · Risk 46/100 · Cost efficiency 88/100. Overall: healthy with room to diversify further." },
];

export const Insights = () => (
  <div className="space-y-6">
    <header>
      <h2 className="text-lg font-semibold text-foreground tracking-tight">AI Insights</h2>
      <p className="text-sm text-muted-foreground">
        Explanations of every metric in plain English. Educational only — not financial advice.
      </p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((s) => (
        <div key={s.title} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              {s.value && <p className="text-lg font-semibold text-foreground mt-1">{s.value}</p>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>

    <p className="text-[11px] text-muted-foreground italic">
      Chronyx WealthX AI communicates in probability & risk-based language and never guarantees returns.
    </p>
  </div>
);

export default Insights;
