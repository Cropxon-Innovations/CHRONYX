import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw,
  Search,
  Trash2,
  Loader2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockHolding {
  id: string;
  symbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  current_price: number | null;
  last_price_update: string | null;
  name: string | null;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export const StockPortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["stock-holdings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_holdings")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StockHolding[];
    },
    enabled: !!user?.id,
  });

  const searchStocksMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke("stock-prices", {
        body: { action: "search", symbol: query },
      });
      if (error) throw error;
      return data.results as SearchResult[];
    },
    onSuccess: (results) => {
      setSearchResults(results);
    },
  });

  const addHoldingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStock) throw new Error("No stock selected");
      
      const { data, error } = await supabase.functions.invoke("stock-prices", {
        body: {
          action: "add_holding",
          symbol: selectedStock.symbol,
          exchange: selectedStock.exchange,
          quantity: parseFloat(quantity),
          averagePrice: parseFloat(averagePrice),
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-holdings"] });
      toast.success("Stock added to portfolio!");
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error("Failed to add stock");
      console.error(error);
    },
  });

  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      const { data, error } = await supabase.functions.invoke("stock-prices", {
        body: { action: "update_all" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-holdings"] });
      toast.success("Prices updated!");
    },
    onError: () => {
      toast.error("Failed to refresh prices");
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  const deleteHoldingMutation = useMutation({
    mutationFn: async (holdingId: string) => {
      const { error } = await supabase.functions.invoke("stock-prices", {
        body: { action: "delete_holding", holdingId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-holdings"] });
      toast.success("Stock removed from portfolio");
    },
  });

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStock(null);
    setQuantity("");
    setAveragePrice("");
  };

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      searchStocksMutation.mutate(searchQuery);
      setIsSearching(false);
    }
  };

  // Portfolio calculations
  const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.average_price), 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + (h.quantity * (h.current_price || h.average_price)), 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holdings</p>
                <p className="text-2xl font-light">{holdings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invested</p>
                <p className="text-2xl font-light">₹{(totalInvested / 100000).toFixed(2)}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-light">₹{(totalCurrentValue / 100000).toFixed(2)}L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-border/50",
          totalProfitLoss >= 0 
            ? "bg-gradient-to-br from-emerald-500/5 to-green-500/10" 
            : "bg-gradient-to-br from-red-500/5 to-rose-500/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                totalProfitLoss >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"
              )}>
                {totalProfitLoss >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className={cn(
                  "text-2xl font-light",
                  totalProfitLoss >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {totalProfitLoss >= 0 ? "+" : ""}₹{(Math.abs(totalProfitLoss) / 1000).toFixed(1)}K
                  <span className="text-sm ml-1">({totalProfitLossPercent.toFixed(1)}%)</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Stock Portfolio
            </CardTitle>
            <CardDescription>Track your stock investments with live prices</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshPricesMutation.mutate()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Stock to Portfolio</DialogTitle>
                  <DialogDescription>
                    Search and add stocks from NSE/BSE
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Search Stock</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., RELIANCE, TCS"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && !selectedStock && (
                    <div className="space-y-2">
                      <Label>Select Stock</Label>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {searchResults.map((stock) => (
                          <button
                            key={stock.symbol}
                            onClick={() => setSelectedStock(stock)}
                            className="w-full p-3 rounded-lg text-left hover:bg-muted transition-colors"
                          >
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground">{stock.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStock && (
                    <>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedStock.symbol}</p>
                            <p className="text-sm text-muted-foreground">{selectedStock.name}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedStock(null)}>
                            Change
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            placeholder="100"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Avg. Price (₹) *</Label>
                          <Input
                            type="number"
                            placeholder="1500.50"
                            value={averagePrice}
                            onChange={(e) => setAveragePrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addHoldingMutation.mutate()}
                    disabled={!selectedStock || !quantity || !averagePrice || addHoldingMutation.isPending}
                  >
                    {addHoldingMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Add to Portfolio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No stocks in your portfolio</p>
              <p className="text-sm text-muted-foreground/70">
                Add your stock holdings to track live prices
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Stock</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Avg Price</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">LTP</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Value</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">P&L</th>
                    <th className="text-right py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {holdings.map((holding, index) => {
                      const currentPrice = holding.current_price || holding.average_price;
                      const value = holding.quantity * currentPrice;
                      const invested = holding.quantity * holding.average_price;
                      const profitLoss = value - invested;
                      const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
                      const isProfit = profitLoss >= 0;

                      return (
                        <motion.tr
                          key={holding.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/30 hover:bg-muted/20"
                        >
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {holding.name || holding.exchange}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">{holding.quantity}</td>
                          <td className="py-3 px-2 text-right">₹{holding.average_price.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right font-medium">₹{currentPrice.toFixed(2)}</td>
                          <td className="py-3 px-2 text-right">₹{value.toLocaleString("en-IN")}</td>
                          <td className={cn(
                            "py-3 px-2 text-right",
                            isProfit ? "text-emerald-600" : "text-red-600"
                          )}>
                            <div className="flex items-center justify-end gap-1">
                              {isProfit ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>
                                {isProfit ? "+" : ""}₹{Math.abs(profitLoss).toFixed(0)}
                                <span className="text-xs ml-1">({profitLossPercent.toFixed(1)}%)</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteHoldingMutation.mutate(holding.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockPortfolio;
