import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import HoldingsTable from "../components/HoldingsTable";
import { useAllHoldings, usePortfolioSummary, useStocks, useMutualFunds, useETFs, useGold, useFixedIncome } from "../hooks/useWealthX";
import { exportPortfolioPDF } from "../utils/exportPdf";

export const Portfolio = () => {
  const all = useAllHoldings();
  const s   = usePortfolioSummary();
  const stocks = useStocks();
  const mfs    = useMutualFunds();
  const etfs   = useETFs();
  const gold   = useGold();
  const fi     = useFixedIncome();

  const onExport = () => {
    if (s.data && all.data) exportPortfolioPDF({ summary: s.data, holdings: all.data });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Portfolio</h2>
          <p className="text-sm text-muted-foreground">All holdings across every asset class — values in ₹.</p>
        </div>
        <Button size="sm" variant="outline" onClick={onExport} disabled={!s.data || !all.data}>
          <Download className="w-3.5 h-3.5 mr-2" /> Export PDF
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="mf">Mutual Funds</TabsTrigger>
          <TabsTrigger value="etf">ETFs</TabsTrigger>
          <TabsTrigger value="gold">Gold</TabsTrigger>
          <TabsTrigger value="fi">Fixed Income</TabsTrigger>
        </TabsList>
        <TabsContent value="all"   className="mt-4"><HoldingsTable data={all.data ?? []} /></TabsContent>
        <TabsContent value="stocks" className="mt-4"><HoldingsTable data={stocks.data ?? []} /></TabsContent>
        <TabsContent value="mf"     className="mt-4"><HoldingsTable data={mfs.data ?? []} /></TabsContent>
        <TabsContent value="etf"    className="mt-4"><HoldingsTable data={etfs.data ?? []} /></TabsContent>
        <TabsContent value="gold"   className="mt-4"><HoldingsTable data={gold.data ?? []} /></TabsContent>
        <TabsContent value="fi"     className="mt-4"><HoldingsTable data={fi.data ?? []} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Portfolio;
