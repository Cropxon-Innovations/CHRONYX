import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  CreditCard,
  Smartphone,
  Building2,
  ChevronRight,
  Download,
  Filter,
  LayoutList,
  Clock,
  BarChart3,
  FileText,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, startOfDay, endOfDay, isWithinInterval, parseISO, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  payment_mode: string;
  confidence_score: number;
  email_subject: string;
  source_platform: string;
  transaction_type: 'debit' | 'credit';
  raw_extracted_data: {
    category?: string;
    referenceId?: string;
    accountMask?: string;
    description?: string;
    channel?: string;
  };
  is_processed: boolean;
  needs_review: boolean;
  created_at: string;
}

interface FinanceFlowDashboardProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

type ViewMode = 'table' | 'timeline' | 'cards';
type Period = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PAYMENT_MODE_ICONS: Record<string, React.ReactNode> = {
  UPI: <Smartphone className="w-3.5 h-3.5" />,
  Card: <CreditCard className="w-3.5 h-3.5" />,
  'Bank Transfer': <Building2 className="w-3.5 h-3.5" />,
  Other: <Receipt className="w-3.5 h-3.5" />,
};

const FinanceFlowDashboard = ({ transactions, onRefresh }: FinanceFlowDashboardProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [period, setPeriod] = useState<Period>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const yesterday = subDays(now, 1);
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [period, selectedDate]);

  // Calculate yesterday's data for comparison
  const yesterdayData = useMemo(() => {
    const yesterday = subDays(new Date(), 1);
    const yesterdayTxs = transactions.filter(tx => isSameDay(parseISO(tx.transaction_date), yesterday));
    const debits = yesterdayTxs.filter(t => t.transaction_type === 'debit');
    const credits = yesterdayTxs.filter(t => t.transaction_type === 'credit');
    return {
      count: yesterdayTxs.length,
      debitAmount: debits.reduce((sum, t) => sum + Number(t.amount), 0),
      creditAmount: credits.reduce((sum, t) => sum + Number(t.amount), 0),
    };
  }, [transactions]);

  // Calculate today's data for comparison
  const todayData = useMemo(() => {
    const today = new Date();
    const todayTxs = transactions.filter(tx => isSameDay(parseISO(tx.transaction_date), today));
    const debits = todayTxs.filter(t => t.transaction_type === 'debit');
    const credits = todayTxs.filter(t => t.transaction_type === 'credit');
    return {
      count: todayTxs.length,
      debitAmount: debits.reduce((sum, t) => sum + Number(t.amount), 0),
      creditAmount: credits.reduce((sum, t) => sum + Number(t.amount), 0),
    };
  }, [transactions]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = parseISO(tx.transaction_date);
      // Use isSameDay for 'today' or 'yesterday' to handle date-only strings properly
      let inRange = false;
      if (period === 'today') {
        inRange = isSameDay(txDate, new Date());
      } else if (period === 'yesterday') {
        inRange = isSameDay(txDate, subDays(new Date(), 1));
      } else {
        inRange = isWithinInterval(txDate, { start: dateRange.start, end: dateRange.end });
      }
      const matchesCategory = categoryFilter === 'all' || tx.raw_extracted_data?.category === categoryFilter;
      return inRange && matchesCategory;
    });
  }, [transactions, dateRange, categoryFilter, period]);

  // Calculate summaries
  const summaries = useMemo(() => {
    const debits = filteredTransactions.filter(t => t.transaction_type === 'debit');
    const credits = filteredTransactions.filter(t => t.transaction_type === 'credit');
    
    return {
      totalTransactions: filteredTransactions.length,
      totalDebits: debits.length,
      totalCredits: credits.length,
      debitAmount: debits.reduce((sum, t) => sum + Number(t.amount), 0),
      creditAmount: credits.reduce((sum, t) => sum + Number(t.amount), 0),
      netFlow: credits.reduce((sum, t) => sum + Number(t.amount), 0) - debits.reduce((sum, t) => sum + Number(t.amount), 0),
      byCategory: filteredTransactions.reduce((acc, t) => {
        const cat = t.raw_extracted_data?.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>),
      byPaymentMode: filteredTransactions.reduce((acc, t) => {
        acc[t.payment_mode] = (acc[t.payment_mode] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>),
    };
  }, [filteredTransactions]);

  // Group transactions by date for timeline view
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      const dateKey = tx.transaction_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(tx => {
      if (tx.raw_extracted_data?.category) cats.add(tx.raw_extracted_data.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">Date & Time</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Merchant</th>
            <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
            <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Mode</th>
            <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Ref ID</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
            <th className="text-center p-3 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
          </tr>
        </thead>
        <tbody>
          {[...filteredTransactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => (
            <tr key={tx.id} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-3">
                <div className="text-[11px]">
                  <div className="font-medium">{format(parseISO(tx.transaction_date), 'MMM d, yyyy')}</div>
                  <div className="text-muted-foreground text-[10px]">
                    Transaction: {format(new Date(tx.created_at), 'HH:mm')}
                  </div>
                  <div className="text-muted-foreground text-[9px] italic">
                    Fetched: {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                  </div>
                </div>
              </td>
              <td className="p-3">
                <div>
                  <p className="font-medium truncate max-w-[150px]">{tx.merchant_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:hidden">
                    {tx.raw_extracted_data?.category || 'Uncategorized'}
                  </p>
                </div>
              </td>
              <td className="p-3 hidden sm:table-cell">
                <Badge variant="outline" className="text-xs">
                  {tx.raw_extracted_data?.category || 'Uncategorized'}
                </Badge>
              </td>
              <td className="p-3 hidden md:table-cell">
                <div className="flex items-center gap-1.5">
                  {PAYMENT_MODE_ICONS[tx.payment_mode] || PAYMENT_MODE_ICONS.Other}
                  <span className="text-xs">{tx.payment_mode}</span>
                </div>
              </td>
              <td className="p-3 hidden lg:table-cell">
                <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {tx.raw_extracted_data?.referenceId?.substring(0, 12) || 'N/A'}
                </code>
              </td>
              <td className="p-3 text-right font-semibold">
                <span className={cn(
                  tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-foreground'
                )}>
                  {tx.transaction_type === 'credit' ? '+' : ''}₹{Number(tx.amount).toLocaleString()}
                </span>
              </td>
              <td className="p-3 text-center hidden sm:table-cell">
                {tx.transaction_type === 'credit' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> Credit
                  </Badge>
                ) : (
                  <Badge className="bg-destructive/10 text-destructive text-[10px]">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" /> Debit
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No transactions found for this period</p>
        </div>
      )}
    </div>
  );

  const renderTimelineView = () => (
    <ScrollArea className="h-[500px]">
      <div className="space-y-6 p-2">
        {groupedByDate.map(([dateKey, txs]) => {
          const dayTotal = txs.reduce((sum, t) => {
            const amount = Number(t.amount);
            return sum + (t.transaction_type === 'credit' ? amount : -amount);
          }, 0);
          
          return (
            <div key={dateKey} className="relative">
              {/* Date Header */}
              <div className="sticky top-0 bg-background z-10 py-2 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{format(parseISO(dateKey), 'EEEE')}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(dateKey), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    dayTotal >= 0 ? "text-emerald-600" : "text-destructive"
                  )}>
                    {dayTotal >= 0 ? '+' : ''}₹{Math.abs(dayTotal).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{txs.length} transactions</p>
                </div>
              </div>
              
              {/* Transactions */}
              <div className="pl-4 border-l-2 border-muted ml-4 mt-4 space-y-3">
                {[...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => (
                  <div key={tx.id} className="relative flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 -ml-4 pl-6">
                    <div className={cn(
                      "absolute left-0 top-5 w-2 h-2 rounded-full -translate-x-[5px]",
                      tx.transaction_type === 'credit' ? "bg-emerald-500" : "bg-destructive"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-medium truncate">{tx.merchant_name || 'Unknown'}</p>
                          {PAYMENT_MODE_ICONS[tx.payment_mode]}
                        </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-muted-foreground">
                              {format(new Date(tx.created_at), 'HH:mm')}
                            </div>
                            <div className="text-[9px] text-muted-foreground italic">
                              Fetched: {format(new Date(tx.created_at), 'HH:mm')}
                            </div>
                          </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tx.email_subject}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {tx.raw_extracted_data?.category || 'Other'}
                        </Badge>
                        {tx.raw_extracted_data?.referenceId && (
                          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                            {tx.raw_extracted_data.referenceId.substring(0, 10)}...
                          </code>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "font-semibold",
                        tx.transaction_type === 'credit' ? "text-emerald-600" : "text-foreground"
                      )}>
                        {tx.transaction_type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {groupedByDate.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions found for this period</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTransactions.map(tx => (
        <Card key={tx.id} className={cn(
          "transition-all hover:shadow-md",
          tx.transaction_type === 'credit' ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-destructive"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {PAYMENT_MODE_ICONS[tx.payment_mode]}
                <Badge variant="outline" className="text-[10px]">
                  {tx.payment_mode}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(tx.transaction_date), 'MMM d')}
              </span>
            </div>
            <p className="font-semibold truncate mb-1">{tx.merchant_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground truncate mb-3">{tx.email_subject}</p>
            <div className="flex items-center justify-between">
              <Badge className="text-[10px]">{tx.raw_extracted_data?.category || 'Other'}</Badge>
              <p className={cn(
                "font-bold text-lg",
                tx.transaction_type === 'credit' ? "text-emerald-600" : "text-foreground"
              )}>
                {tx.transaction_type === 'credit' ? '+' : ''}₹{Number(tx.amount).toLocaleString()}
              </p>
            </div>
            {tx.raw_extracted_data?.referenceId && (
              <div className="mt-2 pt-2 border-t">
                <code className="text-[10px] text-muted-foreground">
                  Ref: {tx.raw_extracted_data.referenceId}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {filteredTransactions.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No transactions found for this period</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Yesterday vs Today Comparison */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Yesterday vs Today</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Yesterday</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">₹{yesterdayData.debitAmount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">spent</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{yesterdayData.count} transactions</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Today</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">₹{todayData.debitAmount.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">spent</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{todayData.count} transactions</p>
            </div>
          </div>
          {todayData.debitAmount !== yesterdayData.debitAmount && (
            <div className="mt-3 pt-3 border-t">
              <p className={cn(
                "text-xs flex items-center gap-1",
                todayData.debitAmount > yesterdayData.debitAmount ? "text-destructive" : "text-emerald-600"
              )}>
                {todayData.debitAmount > yesterdayData.debitAmount ? (
                  <><TrendingUp className="w-3 h-3" /> Spending ₹{(todayData.debitAmount - yesterdayData.debitAmount).toLocaleString()} more than yesterday</>
                ) : (
                  <><TrendingDown className="w-3 h-3" /> Spending ₹{(yesterdayData.debitAmount - todayData.debitAmount).toLocaleString()} less than yesterday</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Receipt className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[10px]">{period}</Badge>
            </div>
            <p className="text-2xl font-bold">{summaries.totalTransactions}</p>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ArrowDownRight className="w-5 h-5 text-destructive" />
              <span className="text-xs text-muted-foreground">{summaries.totalDebits} txns</span>
            </div>
            <p className="text-2xl font-bold text-destructive">₹{summaries.debitAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">{summaries.totalCredits} txns</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">₹{summaries.creditAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Received</p>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "bg-gradient-to-br to-transparent",
          summaries.netFlow >= 0 ? "from-emerald-500/5" : "from-destructive/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {summaries.netFlow >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
            </div>
            <p className={cn(
              "text-2xl font-bold",
              summaries.netFlow >= 0 ? "text-emerald-600" : "text-destructive"
            )}>
              {summaries.netFlow >= 0 ? '+' : ''}₹{Math.abs(summaries.netFlow).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Net Cash Flow</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Period Selection */}
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[130px] h-9">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>

              {period === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      {format(selectedDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('timeline')}
              >
                <Clock className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode('cards')}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction View */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transactions
              <Badge variant="secondary" className="ml-2">{filteredTransactions.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1 h-8">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'cards' && renderCardsView()}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(summaries.byCategory).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(summaries.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => (
                  <div key={cat} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground truncate">{cat}</p>
                    <p className="font-semibold">₹{amount.toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinanceFlowDashboard;
