import { useQuery } from "@tanstack/react-query";
import { wealthxRepository } from "../services/repository";

const k = (name: string) => ["wealthx", name] as const;

export const usePortfolioSummary   = () => useQuery({ queryKey: k("portfolio"),    queryFn: wealthxRepository.getPortfolioSummary,   staleTime: 60_000 });
export const useGrowthSeries       = () => useQuery({ queryKey: k("growth"),       queryFn: wealthxRepository.getGrowthSeries,       staleTime: 60_000 });
export const useAllocation         = () => useQuery({ queryKey: k("allocation"),   queryFn: wealthxRepository.getAllocation,         staleTime: 60_000 });
export const useSectorAllocation   = () => useQuery({ queryKey: k("sector-alloc"), queryFn: wealthxRepository.getSectorAllocation,   staleTime: 60_000 });
export const useAllHoldings        = () => useQuery({ queryKey: k("holdings"),     queryFn: wealthxRepository.getAllHoldings,        staleTime: 60_000 });
export const useStocks             = () => useQuery({ queryKey: k("stocks"),       queryFn: wealthxRepository.getStocks,             staleTime: 60_000 });
export const useMutualFunds        = () => useQuery({ queryKey: k("mfs"),          queryFn: wealthxRepository.getMutualFunds,        staleTime: 60_000 });
export const useETFs               = () => useQuery({ queryKey: k("etfs"),         queryFn: wealthxRepository.getETFs,               staleTime: 60_000 });
export const useGold               = () => useQuery({ queryKey: k("gold"),         queryFn: wealthxRepository.getGold,               staleTime: 60_000 });
export const useFixedIncome        = () => useQuery({ queryKey: k("fi"),           queryFn: wealthxRepository.getFixedIncome,        staleTime: 60_000 });
export const useTransactions       = () => useQuery({ queryKey: k("txns"),         queryFn: wealthxRepository.getTransactions,       staleTime: 60_000 });
export const useSIPs               = () => useQuery({ queryKey: k("sips"),         queryFn: wealthxRepository.getSIPs,               staleTime: 60_000 });
export const useGoals              = () => useQuery({ queryKey: k("goals"),        queryFn: wealthxRepository.getGoals,              staleTime: 60_000 });
export const useWatchlist          = () => useQuery({ queryKey: k("watchlist"),    queryFn: wealthxRepository.getWatchlist,          staleTime: 60_000 });
export const useNews               = () => useQuery({ queryKey: k("news"),         queryFn: wealthxRepository.getNews,               staleTime: 60_000 });
