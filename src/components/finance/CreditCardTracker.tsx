import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Building2,
  Plus,
  Filter,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface CreditCardTransaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  transaction_type: 'debit' | 'credit';
  payment_mode: string;
  source_platform: string;
  raw_extracted_data: {
    cardType?: string;
    cardLast4?: string;
    category?: string;
    referenceId?: string;
    transactionTime?: string;
  };
  created_at: string;
  confidence_score: number;
}

interface CardSummary {
  cardName: string;
  cardLast4: string;
  totalSpent: number;
  totalPaid: number;
  pendingAmount: number;
  transactionCount: number;
  lastTransaction: string | null;
}

// Bank card patterns for detection
const CREDIT_CARD_BANKS = [
  { pattern: /icici/i, name: 'ICICI Bank', color: 'bg-orange-500' },
  { pattern: /hdfc/i, name: 'HDFC Bank', color: 'bg-blue-600' },
  { pattern: /sbi/i, name: 'SBI Card', color: 'bg-blue-500' },
  { pattern: /axis/i, name: 'Axis Bank', color: 'bg-purple-600' },
  { pattern: /kotak/i, name: 'Kotak', color: 'bg-red-500' },
  { pattern: /amex|american express/i, name: 'Amex', color: 'bg-blue-400' },
  { pattern: /citi/i, name: 'Citi', color: 'bg-blue-700' },
  { pattern: /indusind/i, name: 'IndusInd', color: 'bg-indigo-600' },
  { pattern: /rbl/i, name: 'RBL Bank', color: 'bg-teal-600' },
  { pattern: /yes\s*bank/i, name: 'Yes Bank', color: 'bg-green-600' },
];

const CreditCardTracker = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchCreditCardTransactions();
    }
  }, [user]);

  const fetchCreditCardTransactions = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all card transactions from auto_imported_transactions
    const { data, error } = await supabase
      .from("auto_imported_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_mode", "Card")
      .order("transaction_date", { ascending: false });

    if (!error && data) {
      const typedData = data.map(tx => ({
        ...tx,
        transaction_type: (tx.transaction_type || 'debit') as 'debit' | 'credit',
        raw_extracted_data: tx.raw_extracted_data as CreditCardTransaction['raw_extracted_data']
      }));
      setTransactions(typedData);
    }

    setLoading(false);
  };

  // Detect bank from source platform or merchant
  const detectBank = (tx: CreditCardTransaction): { name: string; color: string } => {
    const searchText = `${tx.source_platform || ''} ${tx.merchant_name || ''} ${tx.raw_extracted_data?.cardType || ''}`;
    
    for (const bank of CREDIT_CARD_BANKS) {
      if (bank.pattern.test(searchText)) {
        return { name: bank.name, color: bank.color };
      }
    }
    return { name: 'Credit Card', color: 'bg-gray-500' };
  };

  // Group transactions by card
  const cardSummaries = useMemo(() => {
    const summaryMap = new Map<string, CardSummary>();

    transactions.forEach(tx => {
      const bank = detectBank(tx);
      const cardLast4 = tx.raw_extracted_data?.cardLast4 || '****';
      const cardKey = `${bank.name}-${cardLast4}`;

      if (!summaryMap.has(cardKey)) {
        summaryMap.set(cardKey, {
          cardName: bank.name,
          cardLast4,
          totalSpent: 0,
          totalPaid: 0,
          pendingAmount: 0,
          transactionCount: 0,
          lastTransaction: null,
        });
      }

      const summary = summaryMap.get(cardKey)!;
      summary.transactionCount++;
      
      if (tx.transaction_type === 'debit') {
        summary.totalSpent += Number(tx.amount);
      } else {
        summary.totalPaid += Number(tx.amount);
      }
      
      summary.pendingAmount = summary.totalSpent - summary.totalPaid;
      
      if (!summary.lastTransaction || tx.transaction_date > summary.lastTransaction) {
        summary.lastTransaction = tx.transaction_date;
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions]);

  // Filter transactions by selected card
  const filteredTransactions = useMemo(() => {
    if (selectedCard === 'all') return transactions;
    
    return transactions.filter(tx => {
      const bank = detectBank(tx);
      const cardLast4 = tx.raw_extracted_data?.cardLast4 || '****';
      return `${bank.name}-${cardLast4}` === selectedCard;
    });
  }, [transactions, selectedCard]);

  // This month's summary
  const monthSummary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTxs = filteredTransactions.filter(tx => {
      const txDate = parseISO(tx.transaction_date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    const spent = monthTxs
      .filter(tx => tx.transaction_type === 'debit')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const paid = monthTxs
      .filter(tx => tx.transaction_type === 'credit')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      spent,
      paid,
      pending: spent - paid,
      transactionCount: monthTxs.length,
    };
  }, [filteredTransactions]);

  // Category breakdown for credit card spending
  const categoryBreakdown = useMemo(() => {
    const categories = new Map<string, number>();

    filteredTransactions
      .filter(tx => tx.transaction_type === 'debit')
      .forEach(tx => {
        const category = tx.raw_extracted_data?.category || 'Other';
        categories.set(category, (categories.get(category) || 0) + Number(tx.amount));
      });

    return Array.from(categories.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Credit Card Tracker
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track spending across ICICI, HDFC, SBI, Axis & more
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Card Selector - Horizontal scroll on mobile */}
      {cardSummaries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Badge
            variant={selectedCard === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
            onClick={() => setSelectedCard('all')}
          >
            All Cards
          </Badge>
          {cardSummaries.map(card => (
            <Badge
              key={`${card.cardName}-${card.cardLast4}`}
              variant={selectedCard === `${card.cardName}-${card.cardLast4}` ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5"
              onClick={() => setSelectedCard(`${card.cardName}-${card.cardLast4}`)}
            >
              {card.cardName} •••• {card.cardLast4}
            </Badge>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">This Month Spent</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-destructive">
              ₹{monthSummary.spent.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {monthSummary.transactionCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">Paid</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600">
              ₹{monthSummary.paid.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Payments received
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-amber-500/20",
          monthSummary.pending > 0 ? "bg-amber-500/5" : "bg-emerald-500/5"
        )}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              {monthSummary.pending > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">Outstanding</span>
            </div>
            <p className={cn(
              "text-lg sm:text-2xl font-bold",
              monthSummary.pending > 0 ? "text-amber-600" : "text-emerald-600"
            )}>
              ₹{Math.abs(monthSummary.pending).toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {monthSummary.pending > 0 ? 'Due amount' : 'Credit balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">Active Cards</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-foreground">
              {cardSummaries.length}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Cards detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {cardSummaries.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {cardSummaries.map(card => {
                const bank = CREDIT_CARD_BANKS.find(b => b.name === card.cardName);
                const utilization = card.totalSpent > 0 
                  ? Math.min(100, Math.round((card.pendingAmount / card.totalSpent) * 100))
                  : 0;

                return (
                  <Card 
                    key={`${card.cardName}-${card.cardLast4}`}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedCard(`${card.cardName}-${card.cardLast4}`);
                      setActiveTab('transactions');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            bank?.color || 'bg-gray-500'
                          )}>
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{card.cardName}</p>
                            <p className="text-xs text-muted-foreground">•••• {card.cardLast4}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {card.transactionCount} txn
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Spent</span>
                          <span className="font-medium">₹{card.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Paid</span>
                          <span className="font-medium text-emerald-600">₹{card.totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Outstanding</span>
                          <span className={cn(
                            "font-semibold",
                            card.pendingAmount > 0 ? "text-amber-600" : "text-emerald-600"
                          )}>
                            ₹{Math.abs(card.pendingAmount).toLocaleString()}
                          </span>
                        </div>

                        {card.pendingAmount > 0 && (
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Payment Progress</span>
                              <span>{100 - utilization}%</span>
                            </div>
                            <Progress value={100 - utilization} className="h-1.5" />
                          </div>
                        )}

                        {card.lastTransaction && (
                          <p className="text-[10px] text-muted-foreground pt-1">
                            Last: {format(parseISO(card.lastTransaction), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">No credit card transactions detected</p>
                <p className="text-xs mt-1">Sync your Gmail to import card transactions</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Transaction History
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredTransactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] sm:h-[500px]">
                {filteredTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {filteredTransactions.map(tx => {
                      const bank = detectBank(tx);
                      const bankConfig = CREDIT_CARD_BANKS.find(b => b.name === bank.name);

                      return (
                        <div
                          key={tx.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50",
                            tx.transaction_type === 'credit' && "border-l-4 border-l-emerald-500"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              bankConfig?.color || 'bg-gray-500'
                            )}>
                              <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{tx.merchant_name || 'Unknown'}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{format(parseISO(tx.transaction_date), 'MMM d, yyyy')}</span>
                                {tx.raw_extracted_data?.transactionTime && (
                                  <>
                                    <span>•</span>
                                    <span>{tx.raw_extracted_data.transactionTime}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[9px] h-4">
                                  {bank.name}
                                </Badge>
                                {tx.raw_extracted_data?.category && (
                                  <Badge variant="secondary" className="text-[9px] h-4">
                                    {tx.raw_extracted_data.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className={cn(
                              "font-semibold text-sm",
                              tx.transaction_type === 'credit' ? "text-emerald-600" : "text-foreground"
                            )}>
                              {tx.transaction_type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[9px] mt-1",
                                tx.transaction_type === 'credit' 
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              )}
                            >
                              {tx.transaction_type === 'credit' ? 'Payment' : 'Spend'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mb-3 opacity-40" />
                    <p className="text-sm">No transactions found</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {categoryBreakdown.map((cat, index) => {
                    const maxAmount = categoryBreakdown[0].amount;
                    const percentage = Math.round((cat.amount / maxAmount) * 100);

                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground">₹{cat.amount.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Filter className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm">No category data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditCardTracker;
