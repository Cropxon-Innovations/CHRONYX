/** WealthX domain types. */

export type AssetKind = "stock" | "mutual_fund" | "etf" | "gold" | "fixed_income" | "cash";
export type Risk = "Low" | "Moderate" | "High" | "Very High";
export type Recommendation = "Buy" | "Hold" | "Reduce" | "Sell";

export interface Holding {
  id: string;
  kind: AssetKind;
  symbol: string;
  name: string;
  logo?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  todayChangePct: number;
  overallChangePct: number;
  weight: number;      // % of portfolio
  sector: string;
  industry?: string;
  risk: Risk;
  rating: number;      // 1..5
  recommendation: Recommendation;
}

export interface MutualFund extends Holding {
  fundHouse: string;
  category: string;
  nav: number;
  expenseRatio: number;
  aum: number;         // in ₹ Cr
  fundManager: string;
  exitLoad: string;
  returns: { "1Y": number; "3Y": number; "5Y": number };
}

export interface Stock extends Holding {
  prevClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number;    // ₹ Cr
  pe: number;
  pb: number;
  roe: number;
  roce: number;
  eps: number;
  dividendYield: number;
  wk52High: number;
  wk52Low: number;
}

export interface Transaction {
  id: string;
  date: string;         // ISO
  kind: AssetKind;
  symbol: string;
  action: "buy" | "sell" | "dividend" | "sip" | "bonus";
  quantity: number;
  price: number;
  amount: number;
  notes?: string;
}

export interface SIP {
  id: string;
  fundName: string;
  amount: number;
  frequency: "Monthly" | "Weekly" | "Quarterly";
  nextDate: string;     // ISO
  startDate: string;
  status: "active" | "paused";
  totalInvested: number;
  currentValue: number;
  expectedCorpus: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  requiredSIP: number;
  probability: number;  // 0..1
  kind: "retirement" | "house" | "car" | "education" | "vacation" | "emergency" | "custom";
}

export interface WatchItem {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  price: number;
  changePct: number;
  targetPrice?: number;
  alerts: { type: "price" | "volume" | "news" | "52wk"; threshold: number }[];
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  summary: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  profit: number;
  profitPct: number;
  todayPnl: number;
  yesterdayPnl: number;
  weekPnl: number;
  monthPnl: number;
  yearPnl: number;
  cashAvailable: number;
  xirr: number;
  cagr: number;
  healthScore: number;      // 0..100
  riskScore: number;        // 0..100
  diversificationScore: number; // 0..100
}
