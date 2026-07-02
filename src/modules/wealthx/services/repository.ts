/**
 * Repository / adapter layer for WealthX.
 *
 * Right now everything returns mock data. To wire a real provider (AMFI,
 * NSE, Alpha Vantage, Twelve Data, Finnhub, FMP, Polygon), implement a
 * new adapter that satisfies these functions and swap the imports below.
 * UI code MUST NOT import from `./mockData` directly — always through
 * this repository so providers stay hot-swappable.
 */

import {
  mockAllHoldings, mockStocks, mockMutualFunds, mockETFs, mockGold, mockFixedIncome,
  mockTransactions, mockSIPs, mockGoals, mockWatchlist, mockNews,
  mockPortfolio, mockGrowthSeries, mockAllocation, mockSectorAllocation,
} from "./mockData";
import type {
  Holding, MutualFund, Stock, Transaction, SIP, Goal, WatchItem, NewsItem, PortfolioSummary,
} from "../types";

const delay = <T,>(v: T, ms = 250): Promise<T> =>
  new Promise((r) => setTimeout(() => r(v), ms));

export const wealthxRepository = {
  getPortfolioSummary: (): Promise<PortfolioSummary>        => delay(mockPortfolio),
  getGrowthSeries:     ()                                    => delay(mockGrowthSeries),
  getAllocation:       ()                                    => delay(mockAllocation),
  getSectorAllocation: ()                                    => delay(mockSectorAllocation),
  getAllHoldings:      (): Promise<Holding[]>                => delay(mockAllHoldings),
  getStocks:           (): Promise<Stock[]>                  => delay(mockStocks),
  getMutualFunds:      (): Promise<MutualFund[]>             => delay(mockMutualFunds),
  getETFs:             (): Promise<Holding[]>                => delay(mockETFs),
  getGold:             (): Promise<Holding[]>                => delay(mockGold),
  getFixedIncome:      (): Promise<Holding[]>                => delay(mockFixedIncome),
  getTransactions:     (): Promise<Transaction[]>            => delay(mockTransactions),
  getSIPs:             (): Promise<SIP[]>                    => delay(mockSIPs),
  getGoals:            (): Promise<Goal[]>                   => delay(mockGoals),
  getWatchlist:        (): Promise<WatchItem[]>              => delay(mockWatchlist),
  getNews:             (): Promise<NewsItem[]>               => delay(mockNews),
};

export type WealthXRepository = typeof wealthxRepository;
