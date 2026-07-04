import type {
  Holding, MutualFund, Stock, Transaction, SIP, Goal, WatchItem,
  NewsItem, PortfolioSummary,
} from "../types";

/**
 * Deterministic mock market/portfolio data.
 * Kept isolated in one file so a real adapter (AMFI / Alpha Vantage /
 * Twelve Data / FMP) can swap it out without touching UI.
 */

export const mockStocks: Stock[] = [
  {
    id: "s1", kind: "stock", symbol: "RELIANCE", name: "Reliance Industries",
    quantity: 15, avgPrice: 2450, currentPrice: 2812.5, invested: 36750, currentValue: 42187.5,
    todayChangePct: 1.24, overallChangePct: 14.79, weight: 8.6,
    sector: "Energy", industry: "Refineries", risk: "Moderate", rating: 4, recommendation: "Buy",
    prevClose: 2778, open: 2785, high: 2820, low: 2770, volume: 5_620_000,
    marketCap: 19_02_400, pe: 26.1, pb: 2.3, roe: 9.4, roce: 11.2, eps: 107.6,
    dividendYield: 0.36, wk52High: 3024, wk52Low: 2220,
  },
  {
    id: "s2", kind: "stock", symbol: "TCS", name: "Tata Consultancy Services",
    quantity: 8, avgPrice: 3600, currentPrice: 4120, invested: 28800, currentValue: 32960,
    todayChangePct: -0.52, overallChangePct: 14.44, weight: 6.7,
    sector: "IT", industry: "Software", risk: "Low", rating: 5, recommendation: "Hold",
    prevClose: 4141, open: 4130, high: 4155, low: 4100, volume: 1_820_000,
    marketCap: 15_04_000, pe: 30.4, pb: 14.1, roe: 46.9, roce: 60.3, eps: 135.5,
    dividendYield: 1.4, wk52High: 4256, wk52Low: 3260,
  },
  {
    id: "s3", kind: "stock", symbol: "HDFCBANK", name: "HDFC Bank",
    quantity: 22, avgPrice: 1580, currentPrice: 1712, invested: 34760, currentValue: 37664,
    todayChangePct: 0.86, overallChangePct: 8.35, weight: 7.7,
    sector: "Financials", industry: "Private Bank", risk: "Low", rating: 5, recommendation: "Buy",
    prevClose: 1697, open: 1700, high: 1720, low: 1692, volume: 8_240_000,
    marketCap: 13_02_500, pe: 18.8, pb: 2.7, roe: 16.9, roce: 7.2, eps: 91.1,
    dividendYield: 1.14, wk52High: 1794, wk52Low: 1363,
  },
  {
    id: "s4", kind: "stock", symbol: "INFY", name: "Infosys",
    quantity: 20, avgPrice: 1420, currentPrice: 1585, invested: 28400, currentValue: 31700,
    todayChangePct: 2.14, overallChangePct: 11.62, weight: 6.5,
    sector: "IT", industry: "Software", risk: "Low", rating: 4, recommendation: "Hold",
    prevClose: 1552, open: 1560, high: 1595, low: 1548, volume: 4_120_000,
    marketCap: 6_58_800, pe: 26.0, pb: 8.2, roe: 32.4, roce: 42.1, eps: 60.9,
    dividendYield: 2.32, wk52High: 1953, wk52Low: 1358,
  },
];

export const mockMutualFunds: MutualFund[] = [
  {
    id: "m1", kind: "mutual_fund", symbol: "PARAG-FCF-DIR-G", name: "Parag Parikh Flexi Cap Direct Growth",
    quantity: 685.42, avgPrice: 62.8, currentPrice: 78.4, invested: 43044.4, currentValue: 53736.9,
    todayChangePct: 0.42, overallChangePct: 24.83, weight: 10.9,
    sector: "Diversified", risk: "Moderate", rating: 5, recommendation: "Buy",
    fundHouse: "PPFAS", category: "Flexi Cap", nav: 78.4, expenseRatio: 0.62,
    aum: 68_420, fundManager: "Rajeev Thakkar", exitLoad: "1% before 365 days",
    returns: { "1Y": 32.1, "3Y": 21.8, "5Y": 23.4 },
  },
  {
    id: "m2", kind: "mutual_fund", symbol: "AXIS-BLU-DIR-G", name: "Axis Bluechip Direct Growth",
    quantity: 512.1, avgPrice: 48.2, currentPrice: 54.7, invested: 24683.2, currentValue: 28011.9,
    todayChangePct: 0.18, overallChangePct: 13.48, weight: 5.7,
    sector: "Large Cap", risk: "Low", rating: 4, recommendation: "Hold",
    fundHouse: "Axis MF", category: "Large Cap", nav: 54.7, expenseRatio: 0.58,
    aum: 32_180, fundManager: "Shreyash Devalkar", exitLoad: "1% before 12 months",
    returns: { "1Y": 21.4, "3Y": 14.2, "5Y": 15.1 },
  },
  {
    id: "m3", kind: "mutual_fund", symbol: "MIRAE-ELS-DIR-G", name: "Mirae Asset ELSS Tax Saver Direct",
    quantity: 384.5, avgPrice: 32.4, currentPrice: 41.6, invested: 12457.8, currentValue: 15995.2,
    todayChangePct: 0.91, overallChangePct: 28.4, weight: 3.3,
    sector: "ELSS", risk: "Moderate", rating: 5, recommendation: "Buy",
    fundHouse: "Mirae Asset", category: "ELSS", nav: 41.6, expenseRatio: 0.53,
    aum: 21_640, fundManager: "Neelesh Surana", exitLoad: "Nil (Lock-in 3Y)",
    returns: { "1Y": 26.8, "3Y": 19.1, "5Y": 20.3 },
  },
];

export const mockETFs: Holding[] = [
  {
    id: "e1", kind: "etf", symbol: "NIFTYBEES", name: "Nippon India Nifty 50 BeES",
    quantity: 120, avgPrice: 218, currentPrice: 258, invested: 26160, currentValue: 30960,
    todayChangePct: 0.35, overallChangePct: 18.35, weight: 6.3,
    sector: "Index", risk: "Moderate", rating: 5, recommendation: "Hold",
  },
];

export const mockGold: Holding[] = [
  {
    id: "g1", kind: "gold", symbol: "SGB-2032", name: "Sovereign Gold Bond 2024-32",
    quantity: 10, avgPrice: 6120, currentPrice: 7482, invested: 61200, currentValue: 74820,
    todayChangePct: 0.72, overallChangePct: 22.25, weight: 15.3,
    sector: "Commodity", risk: "Low", rating: 5, recommendation: "Hold",
  },
];

export const mockFixedIncome: Holding[] = [
  {
    id: "f1", kind: "fixed_income", symbol: "SBI-FD-7Y", name: "SBI FD (7.1% • 7Y)",
    quantity: 1, avgPrice: 200000, currentPrice: 214200, invested: 200000, currentValue: 214200,
    todayChangePct: 0.02, overallChangePct: 7.1, weight: 43.7,
    sector: "Debt", risk: "Low", rating: 4, recommendation: "Hold",
  },
];

export const mockAllHoldings: Holding[] = [
  ...mockStocks, ...mockMutualFunds, ...mockETFs, ...mockGold, ...mockFixedIncome,
];

export const mockTransactions: Transaction[] = [
  { id: "t1", date: "2026-06-01", kind: "mutual_fund", symbol: "PARAG-FCF-DIR-G", action: "sip",  quantity: 63.7, price: 78.4, amount: 5000 },
  { id: "t2", date: "2026-05-24", kind: "stock",       symbol: "RELIANCE",          action: "buy",  quantity: 5,    price: 2782, amount: 13910 },
  { id: "t3", date: "2026-05-18", kind: "stock",       symbol: "HDFCBANK",          action: "buy",  quantity: 10,   price: 1690, amount: 16900 },
  { id: "t4", date: "2026-05-10", kind: "mutual_fund", symbol: "AXIS-BLU-DIR-G",    action: "sip",  quantity: 45.6, price: 54.7, amount: 2500 },
  { id: "t5", date: "2026-04-30", kind: "stock",       symbol: "TCS",               action: "dividend", quantity: 0, price: 0, amount: 720, notes: "Final dividend ₹90/sh" },
];

export const mockSIPs: SIP[] = [
  { id: "sip1", fundName: "Parag Parikh Flexi Cap", amount: 5000, frequency: "Monthly", nextDate: "2026-07-01", startDate: "2023-04-01", status: "active", totalInvested: 195000, currentValue: 268400, expectedCorpus: 3_25_00_000 },
  { id: "sip2", fundName: "Axis Bluechip",          amount: 2500, frequency: "Monthly", nextDate: "2026-07-05", startDate: "2022-11-05", status: "active", totalInvested: 107500, currentValue: 128900, expectedCorpus: 1_40_00_000 },
  { id: "sip3", fundName: "Mirae ELSS Tax Saver",   amount: 3000, frequency: "Monthly", nextDate: "2026-07-10", startDate: "2024-02-10", status: "active", totalInvested: 84000,  currentValue: 108600, expectedCorpus: 82_00_000 },
];

export const mockGoals: Goal[] = [
  { id: "g-ret",  name: "Retirement Corpus",  kind: "retirement", targetAmount: 5_00_00_000, currentAmount: 68_40_000, targetDate: "2049-01-01", requiredSIP: 42500, probability: 0.78 },
  { id: "g-hse",  name: "Down Payment (Flat)",kind: "house",      targetAmount: 40_00_000,   currentAmount: 12_60_000, targetDate: "2029-04-01", requiredSIP: 38000, probability: 0.71 },
  { id: "g-edu",  name: "Kid's Education",    kind: "education",  targetAmount: 60_00_000,   currentAmount: 8_20_000,  targetDate: "2039-06-01", requiredSIP: 12500, probability: 0.83 },
  { id: "g-emg",  name: "Emergency Fund",     kind: "emergency",  targetAmount: 6_00_000,    currentAmount: 4_80_000,  targetDate: "2026-12-31", requiredSIP: 10000, probability: 0.95 },
];

export const mockWatchlist: WatchItem[] = [
  { id: "w1", symbol: "BAJFINANCE", name: "Bajaj Finance",     kind: "stock", price: 7245, changePct: 1.42, targetPrice: 8000, alerts: [{ type: "price", threshold: 7800 }] },
  { id: "w2", symbol: "ITC",         name: "ITC Limited",       kind: "stock", price: 452,  changePct: -0.23, targetPrice: 500,  alerts: [{ type: "52wk", threshold: 500 }] },
  { id: "w3", symbol: "SBIN",        name: "State Bank of India",kind: "stock", price: 812, changePct: 0.68, alerts: [{ type: "price", threshold: 900 }] },
];

export const mockNews: NewsItem[] = [
  { id: "n1", headline: "RBI holds repo at 6.5%, GDP forecast raised to 7.2%", source: "Mint",     date: "2026-06-28", sentiment: "positive", tags: ["RBI", "Macro"],    summary: "The MPC voted 5-1 to hold rates, citing sticky food inflation but improving growth momentum." },
  { id: "n2", headline: "Reliance Q4 profit up 12% YoY on Jio ARPU expansion",  source: "ET Now",   date: "2026-06-26", sentiment: "positive", tags: ["RELIANCE"],       summary: "Consolidated PAT of ₹19,458 Cr beat estimates by 4%, driven by Digital and Retail." },
  { id: "n3", headline: "IT sector faces near-term headwinds from BFSI slowdown",source: "Bloomberg",date: "2026-06-24", sentiment: "negative", tags: ["IT", "TCS", "INFY"], summary: "Analysts expect Q1 guidance to remain conservative amid client budget rationalisation." },
];

export const mockPortfolio: PortfolioSummary = (() => {
  const totalValue    = mockAllHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalInvested = mockAllHoldings.reduce((s, h) => s + h.invested, 0);
  const profit = totalValue - totalInvested;
  return {
    totalValue,
    totalInvested,
    profit,
    profitPct: (profit / totalInvested) * 100,
    todayPnl:    2_842,
    yesterdayPnl:-1_120,
    weekPnl:     8_640,
    monthPnl:    24_180,
    yearPnl:     72_450,
    cashAvailable: 18_400,
    xirr: 18.24,
    cagr: 16.72,
    healthScore: 82,
    riskScore: 46,
    diversificationScore: 74,
  };
})();

/** Portfolio value time series (last 12 months, ₹). */
export const mockGrowthSeries: { name: string; value: number }[] = [
  { name: "Jul", value: 3_82_000 },
  { name: "Aug", value: 3_98_500 },
  { name: "Sep", value: 4_11_200 },
  { name: "Oct", value: 4_04_800 },
  { name: "Nov", value: 4_22_900 },
  { name: "Dec", value: 4_38_100 },
  { name: "Jan", value: 4_46_700 },
  { name: "Feb", value: 4_58_200 },
  { name: "Mar", value: 4_71_400 },
  { name: "Apr", value: 4_66_900 },
  { name: "May", value: 4_82_100 },
  { name: "Jun", value: Math.round(mockPortfolio.totalValue) },
];

/** Asset allocation slice. */
export const mockAllocation = [
  { name: "Stocks",       value: mockStocks.reduce((s, h) => s + h.currentValue, 0) },
  { name: "Mutual Funds", value: mockMutualFunds.reduce((s, h) => s + h.currentValue, 0) },
  { name: "ETFs",         value: mockETFs.reduce((s, h) => s + h.currentValue, 0) },
  { name: "Gold",         value: mockGold.reduce((s, h) => s + h.currentValue, 0) },
  { name: "Fixed Income", value: mockFixedIncome.reduce((s, h) => s + h.currentValue, 0) },
];

/** Sector allocation across the equity book. */
export const mockSectorAllocation = (() => {
  const map = new Map<string, number>();
  [...mockStocks, ...mockMutualFunds, ...mockETFs].forEach((h) => {
    map.set(h.sector, (map.get(h.sector) ?? 0) + h.currentValue);
  });
  return Array.from(map, ([name, value]) => ({ name, value }));
})();
