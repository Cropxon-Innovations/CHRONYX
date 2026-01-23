import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Wallet, TrendingUp, Building2, Gem, Shield, PiggyBank,
  Plus, RefreshCw, ChevronRight, Landmark, Car, Home
} from "lucide-react";
import { AddAssetDialog } from "./AddAssetDialog";

interface AssetCategory {
  code: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  total: number;
  count: number;
}

interface Asset {
  id: string;
  category_code: string;
  subcategory: string;
  asset_name: string;
  current_value: number;
  purchase_value: number;
  purchase_date: string | null;
  description: string | null;
}

const CATEGORY_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  CASH_BANK: { name: 'Cash & Bank', icon: <Wallet className="h-5 w-5" />, color: 'bg-blue-500' },
  INVESTMENTS: { name: 'Investments', icon: <TrendingUp className="h-5 w-5" />, color: 'bg-green-500' },
  PROPERTY_REAL: { name: 'Property & Real Assets', icon: <Building2 className="h-5 w-5" />, color: 'bg-purple-500' },
  PHYSICAL_VALUABLES: { name: 'Physical & Valuables', icon: <Gem className="h-5 w-5" />, color: 'bg-yellow-500' },
  INSURANCE_ASSET: { name: 'Insurance (Declared)', icon: <Shield className="h-5 w-5" />, color: 'bg-teal-500' },
  RETIREMENT: { name: 'Retirement & Savings', icon: <PiggyBank className="h-5 w-5" />, color: 'bg-orange-500' },
  INTELLECTUAL_DIGITAL: { name: 'Intellectual & Digital', icon: <Landmark className="h-5 w-5" />, color: 'bg-pink-500' },
  BUSINESS_OWNERSHIP: { name: 'Business & Ownership', icon: <Building2 className="h-5 w-5" />, color: 'bg-indigo-500' },
  RECEIVABLES: { name: 'Receivables & Claims', icon: <Wallet className="h-5 w-5" />, color: 'bg-gray-500' },
};

const SUBCATEGORIES: Record<string, string[]> = {
  CASH_BANK: ['Savings Account', 'Current Account', 'Salary Account', 'Fixed Deposit', 'Recurring Deposit', 'Cash in Hand', 'Wallet Balance'],
  INVESTMENTS: ['Stocks', 'ESOPs', 'Mutual Funds - Equity', 'Mutual Funds - Debt', 'Mutual Funds - ELSS', 'Index Funds', 'Bonds', 'NCDs', 'Gold ETF', 'Silver ETF', 'REITs', 'Crypto', 'Others'],
  PROPERTY_REAL: ['Residential Property', 'Commercial Property', 'Agricultural Land', 'Plot / Land', 'Rental Property'],
  PHYSICAL_VALUABLES: ['Gold Jewellery', 'Silver', 'Bullion', 'Car', 'Bike', 'Art & Collectibles', 'Watches', 'Electronics'],
  INSURANCE_ASSET: ['Life Insurance', 'Health Insurance', 'Term Insurance', 'Vehicle Insurance', 'Property Insurance'],
  RETIREMENT: ['EPF', 'PPF', 'NPS', 'Superannuation', 'Gratuity'],
  INTELLECTUAL_DIGITAL: ['Patents', 'Trademarks', 'Domains', 'Copyrights', 'Digital Products', 'Online Businesses'],
  BUSINESS_OWNERSHIP: ['Partnership Shares', 'Private Company Equity', 'Startup Investments', 'LLP Interests'],
  RECEIVABLES: ['Money Lent', 'Security Deposits', 'Advances', 'Legal Claims'],
};

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const AssetsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [totalNetWorth, setTotalNetWorth] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchAssets();
  }, [user]);

  const fetchAssets = async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      // Fetch user assets
      const { data: assetsData, error } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("current_value", { ascending: false });

      if (error) throw error;

      const assets = assetsData || [];
      setAssets(assets);

      // Fetch income entries (consider as assets - receivables)
      const { data: incomeData } = await supabase
        .from("income_entries")
        .select("amount")
        .eq("user_id", user.id);

      const totalIncome = (incomeData || []).reduce((sum, i) => sum + Number(i.amount || 0), 0);

      // Calculate category totals
      const categoryTotals: Record<string, { total: number; count: number }> = {};
      
      Object.keys(CATEGORY_CONFIG).forEach(code => {
        categoryTotals[code] = { total: 0, count: 0 };
      });

      assets.forEach(asset => {
        if (categoryTotals[asset.category_code]) {
          categoryTotals[asset.category_code].total += Number(asset.current_value || 0);
          categoryTotals[asset.category_code].count++;
        }
      });

      const categoriesArray: AssetCategory[] = Object.entries(CATEGORY_CONFIG).map(([code, config]) => ({
        code,
        name: config.name,
        icon: config.icon,
        color: config.color,
        total: categoryTotals[code]?.total || 0,
        count: categoryTotals[code]?.count || 0,
      })).filter(c => c.total > 0 || c.count > 0);

      // Sort by total value
      categoriesArray.sort((a, b) => b.total - a.total);
      setCategories(categoriesArray);

      // Calculate total net worth from assets only (not insurance coverage)
      const total = assets
        .filter(a => a.category_code !== 'INSURANCE_ASSET') // Don't count insurance coverage as asset value
        .reduce((sum, a) => sum + Number(a.current_value || 0), 0);
      
      setTotalNetWorth(total);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getCategoryAssets = (categoryCode: string) => {
    return assets.filter(a => a.category_code === categoryCode);
  };

  const getGainLoss = (asset: Asset) => {
    const gain = Number(asset.current_value || 0) - Number(asset.purchase_value || 0);
    const percentage = asset.purchase_value > 0 ? (gain / asset.purchase_value) * 100 : 0;
    return { gain, percentage };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Assets Dashboard</h2>
          <p className="text-sm text-muted-foreground">Your complete wealth overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAssets} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Total Net Worth */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Assets Value</p>
              <p className="text-4xl font-bold">{formatCurrency(totalNetWorth)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {assets.length} assets in {categories.length} categories
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {categories.slice(0, 3).map(cat => (
                <div key={cat.code} className="text-center">
                  <div className={`w-10 h-10 rounded-full ${cat.color} text-white flex items-center justify-center mx-auto mb-1`}>
                    {cat.icon}
                  </div>
                  <p className="text-xs font-medium">{formatCurrency(cat.total)}</p>
                  <p className="text-xs text-muted-foreground">{cat.name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(CATEGORY_CONFIG).map(([code, config]) => {
          const catData = categories.find(c => c.code === code);
          const total = catData?.total || 0;
          const count = catData?.count || 0;
          const percentage = totalNetWorth > 0 ? (total / totalNetWorth) * 100 : 0;

          return (
            <Card 
              key={code} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === code ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === code ? null : code)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg ${config.color} text-white flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                    selectedCategory === code ? 'rotate-90' : ''
                  }`} />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium">{config.name}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(total)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={percentage} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{count} asset{count !== 1 ? 's' : ''}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {CATEGORY_CONFIG[selectedCategory].icon}
              {CATEGORY_CONFIG[selectedCategory].name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getCategoryAssets(selectedCategory).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No assets in this category yet</p>
                <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {CATEGORY_CONFIG[selectedCategory].name} Asset
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getCategoryAssets(selectedCategory).map(asset => {
                  const { gain, percentage } = getGainLoss(asset);
                  const isPositive = gain >= 0;

                  return (
                    <div 
                      key={asset.id} 
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{asset.asset_name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {asset.subcategory}
                          </Badge>
                        </div>
                        {asset.description && (
                          <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(asset.current_value)}</p>
                        {asset.purchase_value > 0 && (
                          <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(gain)} ({percentage.toFixed(1)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Asset Dialog */}
      <AddAssetDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchAssets}
        categories={CATEGORY_CONFIG}
        subcategories={SUBCATEGORIES}
        defaultCategory={selectedCategory || undefined}
      />
    </div>
  );
};

export default AssetsDashboard;
