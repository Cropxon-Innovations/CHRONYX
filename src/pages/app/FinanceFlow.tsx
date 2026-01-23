import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Database,
  Tag,
  Filter,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Smartphone,
  Building2,
  FileSearch,
  Shield,
  ChevronRight,
  Activity,
  Calendar,
  Inbox,
  Archive,
  FolderOpen,
  Settings2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  History,
  Zap,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Types
interface SyncSettings {
  is_enabled: boolean;
  gmail_email: string | null;
  last_sync_at: string | null;
  sync_status: string;
  total_synced_count: number;
}

interface ImportedTransaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  payment_mode: string;
  confidence_score: number;
  needs_review: boolean;
  review_reason: string | null;
  is_duplicate: boolean;
  is_processed: boolean;
  email_subject: string;
  source_platform: string;
  raw_extracted_data: any;
  created_at: string;
}

interface SyncHistory {
  id: string;
  sync_type: string;
  emails_scanned: number;
  transactions_found: number;
  duplicates_detected: number;
  imported_count: number;
  sync_duration_ms: number | null;
  error_message: string | null;
  status: string;
  created_at: string;
}

// Pipeline steps
const PIPELINE_STEPS = [
  { id: "gmail", label: "Gmail", icon: Mail, description: "Fetching emails" },
  { id: "parse", label: "Parsing", icon: FileSearch, description: "Extracting data" },
  { id: "normalize", label: "Normalize", icon: Filter, description: "Standardizing format" },
  { id: "dedupe", label: "Deduplicate", icon: Database, description: "Removing duplicates" },
  { id: "categorize", label: "Categorize", icon: Tag, description: "Smart categorization" },
  { id: "store", label: "Ledger", icon: CheckCircle2, description: "Stored securely" },
];

const FinanceFlow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [settings, setSettings] = useState<SyncSettings | null>(null);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPipelineStep, setCurrentPipelineStep] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Auto-sync countdown
  const [nextSyncMinutes, setNextSyncMinutes] = useState<number>(30);
  
  // Stats
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalDebits: 0,
    totalCredits: 0,
    upiCount: 0,
    bankCount: 0,
    cardCount: 0,
    debitAmount: 0,
    creditAmount: 0,
    highConfidence: 0,
    lowConfidence: 0,
    needsReview: 0,
    withRefId: 0,
    withDate: 0,
    withAmount: 0,
    withAccount: 0,
  });
  
  // Detection coverage
  const [detectedSources, setDetectedSources] = useState<{
    banks: { name: string; count: number }[];
    upiApps: { name: string; count: number }[];
    cards: { name: string; count: number }[];
  }>({
    banks: [],
    upiApps: [],
    cards: [],
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Fetch settings
    const { data: settingsData } = await supabase
      .from("gmail_sync_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (settingsData) {
      setSettings(settingsData);
      
      // Calculate next sync
      if (settingsData.last_sync_at) {
        const lastSync = new Date(settingsData.last_sync_at);
        const now = new Date();
        const minutesSince = differenceInMinutes(now, lastSync);
        const syncFreq = 30; // Default 30 minutes
        setNextSyncMinutes(Math.max(0, syncFreq - minutesSince));
      }
    }
    
    // Fetch transactions
    const { data: txData } = await supabase
      .from("auto_imported_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    
    if (txData) {
      setTransactions(txData);
      calculateStats(txData);
      calculateDetection(txData);
    }
    
    // Fetch sync history
    const { data: historyData } = await supabase
      .from("financeflow_sync_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (historyData) {
      setSyncHistory(historyData);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-sync countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNextSyncMinutes(prev => Math.max(0, prev - 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const calculateStats = (txs: ImportedTransaction[]) => {
    const debitTxs = txs.filter(t => 
      t.raw_extracted_data?.transactionType === 'debit' || !t.raw_extracted_data?.transactionType
    );
    const creditTxs = txs.filter(t => t.raw_extracted_data?.transactionType === 'credit');
    
    setStats({
      totalTransactions: txs.length,
      totalDebits: debitTxs.length,
      totalCredits: creditTxs.length,
      upiCount: txs.filter(t => t.payment_mode === 'UPI').length,
      bankCount: txs.filter(t => t.payment_mode === 'Bank Transfer').length,
      cardCount: txs.filter(t => t.payment_mode === 'Card').length,
      debitAmount: debitTxs.reduce((sum, t) => sum + Number(t.amount), 0),
      creditAmount: creditTxs.reduce((sum, t) => sum + Number(t.amount), 0),
      highConfidence: txs.filter(t => (t.confidence_score || 0) >= 0.7).length,
      lowConfidence: txs.filter(t => (t.confidence_score || 0) < 0.7).length,
      needsReview: txs.filter(t => t.needs_review).length,
      withRefId: txs.filter(t => t.raw_extracted_data?.referenceId).length,
      withDate: txs.filter(t => t.transaction_date).length,
      withAmount: txs.filter(t => t.amount > 0).length,
      withAccount: txs.filter(t => t.raw_extracted_data?.accountMask).length,
    });
  };

  // Calculate detection coverage
  const calculateDetection = (txs: ImportedTransaction[]) => {
    const bankCounts: Record<string, number> = {};
    const upiCounts: Record<string, number> = {};
    const cardCounts: Record<string, number> = {};
    
    txs.forEach(t => {
      const source = t.source_platform?.toLowerCase() || '';
      const channel = t.raw_extracted_data?.channel;
      
      if (channel === 'BANK' || /sbi|hdfc|icici|axis|kotak|yes|idfc|federal|pnb|bob|canara|union|indusind|rbl/i.test(source)) {
        const bankName = source.replace(/\s*bank$/i, '').toUpperCase() || 'Other';
        bankCounts[bankName] = (bankCounts[bankName] || 0) + 1;
      } else if (channel === 'APP' || /gpay|phonepe|paytm|bhim|amazon\s*pay/i.test(source)) {
        const appName = source || 'Other';
        upiCounts[appName] = (upiCounts[appName] || 0) + 1;
      } else if (channel === 'CARD' || /visa|mastercard|rupay/i.test(source)) {
        const cardName = source || 'Other';
        cardCounts[cardName] = (cardCounts[cardName] || 0) + 1;
      }
    });
    
    setDetectedSources({
      banks: Object.entries(bankCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      upiApps: Object.entries(upiCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      cards: Object.entries(cardCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    });
  };

  // Manual sync
  const handleSync = async () => {
    if (!user || syncing) return;
    
    setSyncing(true);
    setCurrentPipelineStep(0);
    
    try {
      // Simulate pipeline progress
      for (let i = 0; i < PIPELINE_STEPS.length - 1; i++) {
        setCurrentPipelineStep(i);
        await new Promise(r => setTimeout(r, 500));
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      
      const response = await supabase.functions.invoke("gmail-sync", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      setCurrentPipelineStep(PIPELINE_STEPS.length - 1);
      
      if (response.error) throw response.error;
      
      const result = response.data;
      
      toast({
        title: "Sync Complete",
        description: `Processed ${result.processed} emails, imported ${result.imported} transactions`,
      });
      
      // Refresh data
      setTimeout(() => {
        fetchData();
        setCurrentPipelineStep(-1);
      }, 1000);
      
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with Gmail",
        variant: "destructive",
      });
      setCurrentPipelineStep(-1);
    } finally {
      setSyncing(false);
    }
  };

  // Approve transaction
  const handleApprove = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || !user) return;
    
    // Create expense
    const { error: expenseError } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        expense_date: tx.transaction_date,
        amount: tx.amount,
        category: tx.raw_extracted_data?.category || "Other",
        payment_mode: tx.payment_mode,
        merchant_name: tx.merchant_name,
        notes: `Approved from FinanceFlow: ${tx.email_subject?.substring(0, 80)}`,
        is_auto_generated: true,
        source_type: "gmail",
        gmail_import_id: tx.id,
      });
    
    if (!expenseError) {
      // Update transaction
      await supabase
        .from("auto_imported_transactions")
        .update({ is_processed: true, needs_review: false })
        .eq("id", txId);
      
      toast({ title: "Transaction approved and added to expenses" });
      fetchData();
    }
  };

  // Reject transaction
  const handleReject = async (txId: string) => {
    await supabase
      .from("auto_imported_transactions")
      .update({ is_processed: true, needs_review: false, is_duplicate: true })
      .eq("id", txId);
    
    toast({ title: "Transaction rejected" });
    fetchData();
  };

  const reviewQueue = transactions.filter(t => t.needs_review && !t.is_processed);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            FinanceFlow
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automatic transaction ingestion from Gmail
          </p>
        </div>
        
        <Button
          onClick={handleSync}
          disabled={syncing || !settings?.is_enabled}
          className="gap-2"
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {syncing ? "Syncing..." : "Fetch Now"}
        </Button>
      </div>

      {/* Top Status Bar */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                settings?.is_enabled ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <Mail className={cn(
                  "w-5 h-5",
                  settings?.is_enabled ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Connection</p>
                <p className="text-sm font-medium">
                  {settings?.is_enabled ? (
                    <span className="text-emerald-500">Connected</span>
                  ) : (
                    <span className="text-muted-foreground">Not Connected</span>
                  )}
                </p>
                {settings?.gmail_email && (
                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {settings.gmail_email}
                  </p>
                )}
              </div>
            </div>

            {/* Last Sync */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="text-sm font-medium">
                  {settings?.last_sync_at
                    ? formatDistanceToNow(new Date(settings.last_sync_at), { addSuffix: true })
                    : "Never"
                  }
                </p>
              </div>
            </div>

            {/* Next Sync */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Auto-Sync</p>
                <p className="text-sm font-medium">
                  {settings?.is_enabled ? `In ${nextSyncMinutes} min` : "—"}
                </p>
              </div>
            </div>

            {/* Total Synced */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Database className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Synced</p>
                <p className="text-sm font-medium">
                  {settings?.total_synced_count || 0} transactions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Pipeline Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Live Ingestion Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 py-4">
            {PIPELINE_STEPS.map((step, index) => {
              const isComplete = currentPipelineStep > index;
              const isCurrent = currentPipelineStep === index;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      opacity: isCurrent || isComplete ? 1 : 0.5,
                    }}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl border-2 transition-colors min-w-[80px]",
                      isComplete && "bg-emerald-500/10 border-emerald-500/30",
                      isCurrent && "bg-primary/10 border-primary animate-pulse",
                      !isComplete && !isCurrent && "bg-muted/50 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-1",
                      isComplete && "bg-emerald-500 text-white",
                      isCurrent && "bg-primary text-primary-foreground",
                      !isComplete && !isCurrent && "bg-muted"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-center">{step.label}</span>
                  </motion.div>
                  
                  {index < PIPELINE_STEPS.length - 1 && (
                    <ChevronRight className={cn(
                      "w-4 h-4 mx-1",
                      isComplete ? "text-emerald-500" : "text-muted-foreground/30"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Pipeline Stats */}
          {syncing && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 px-2">
              <span>Processing...</span>
              <span className="animate-pulse">Please wait</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-1">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1 relative">
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Review</span>
            {reviewQueue.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                {reviewQueue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="w-3 h-3" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1">
            <FileSearch className="w-3 h-3" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Detected</span>
                    <span className="font-semibold">{stats.totalTransactions}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      Debits
                    </span>
                    <span className="font-medium text-destructive">
                      {stats.totalDebits} (₹{stats.debitAmount.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      Credits
                    </span>
                    <span className="font-medium text-emerald-500">
                      {stats.totalCredits} (₹{stats.creditAmount.toLocaleString()})
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Smartphone className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground">UPI</p>
                      <p className="text-sm font-semibold">{stats.upiCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground">Bank</p>
                      <p className="text-sm font-semibold">{stats.bankCount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-[10px] text-muted-foreground">Card</p>
                      <p className="text-sm font-semibold">{stats.cardCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detection Quality */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Detection Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Reference ID", value: stats.withRefId, total: stats.totalTransactions },
                    { label: "Date Extracted", value: stats.withDate, total: stats.totalTransactions },
                    { label: "Amount Found", value: stats.withAmount, total: stats.totalTransactions },
                    { label: "Account Identified", value: stats.withAccount, total: stats.totalTransactions },
                  ].map((item) => {
                    const percent = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Confidence</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
                      {stats.highConfidence}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Needs Review</span>
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                      {stats.needsReview}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Freshness */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Freshness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Inbox className="w-5 h-5 text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Active Data</p>
                      <p className="text-xs text-muted-foreground">Last 90 days</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      {transactions.filter(t => {
                        const date = new Date(t.created_at);
                        const ninetyDaysAgo = new Date();
                        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                        return date > ninetyDaysAgo;
                      }).length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Archived</p>
                      <p className="text-xs text-muted-foreground">Older than 90 days</p>
                    </div>
                    <Badge variant="outline">
                      {transactions.filter(t => {
                        const date = new Date(t.created_at);
                        const ninetyDaysAgo = new Date();
                        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                        return date <= ninetyDaysAgo;
                      }).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detection Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Detection Coverage
              </CardTitle>
              <CardDescription>Sources detected in your transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Banks */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Banks
                  </p>
                  <div className="space-y-1">
                    {detectedSources.banks.length > 0 ? (
                      detectedSources.banks.slice(0, 5).map(b => (
                        <div key={b.name} className="flex justify-between text-sm py-1 px-2 rounded bg-muted/30">
                          <span>{b.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{b.count}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No bank transactions yet</p>
                    )}
                  </div>
                </div>

                {/* UPI Apps */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> UPI Apps
                  </p>
                  <div className="space-y-1">
                    {detectedSources.upiApps.length > 0 ? (
                      detectedSources.upiApps.slice(0, 5).map(a => (
                        <div key={a.name} className="flex justify-between text-sm py-1 px-2 rounded bg-muted/30">
                          <span>{a.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{a.count}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No UPI transactions yet</p>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Card Networks
                  </p>
                  <div className="space-y-1">
                    {detectedSources.cards.length > 0 ? (
                      detectedSources.cards.slice(0, 5).map(c => (
                        <div key={c.name} className="flex justify-between text-sm py-1 px-2 rounded bg-muted/30">
                          <span>{c.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{c.count}</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No card transactions yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Queue Tab */}
        <TabsContent value="review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Review Queue
                {reviewQueue.length > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                    {reviewQueue.length} pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Low-confidence transactions that need your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>All caught up! No transactions need review.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {reviewQueue.map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{tx.merchant_name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {tx.payment_mode}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[10px]",
                                  (tx.confidence_score || 0) < 0.5 
                                    ? "bg-destructive/10 text-destructive" 
                                    : "bg-amber-500/10 text-amber-500"
                                )}
                              >
                                {Math.round((tx.confidence_score || 0) * 100)}% confidence
                              </Badge>
                            </div>
                            <p className="text-lg font-semibold">₹{Number(tx.amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(tx.transaction_date), "dd MMM yyyy")} • {tx.source_platform}
                            </p>
                            {tx.review_reason && (
                              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                {tx.review_reason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {tx.email_subject}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => handleApprove(tx.id)}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleReject(tx.id)}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Sync History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {syncHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No sync history yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {syncHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-0.5">
                          {item.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : item.status === "partial" ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {format(new Date(item.created_at), "MMM d, h:mm a")}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px]",
                                item.status === "completed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                                item.status === "partial" && "bg-amber-500/10 text-amber-500 border-amber-500/30",
                                item.status === "failed" && "bg-destructive/10 text-destructive border-destructive/30"
                              )}
                            >
                              {item.status}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {item.sync_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{item.emails_scanned} emails scanned</span>
                            <span>•</span>
                            <span>{item.transactions_found} found</span>
                            <span>•</span>
                            <span className="text-emerald-500">+{item.imported_count} imported</span>
                            {item.duplicates_detected > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-500">{item.duplicates_detected} duplicates</span>
                              </>
                            )}
                          </div>
                          {item.error_message && (
                            <p className="text-xs text-destructive mt-1">{item.error_message}</p>
                          )}
                          {item.sync_duration_ms && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Completed in {(item.sync_duration_ms / 1000).toFixed(1)}s
                            </p>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                Ingestion Logs
              </CardTitle>
              <CardDescription>
                Detailed log of all imported transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {transactions.slice(0, 100).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-2 rounded text-xs hover:bg-muted/30 transition-colors font-mono"
                    >
                      <span className="text-muted-foreground shrink-0">
                        {format(new Date(tx.created_at), "MMM dd HH:mm")}
                      </span>
                      <span className={cn(
                        "shrink-0 w-16",
                        tx.is_duplicate ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {tx.is_duplicate ? "[DUPE]" : "[NEW]"}
                      </span>
                      <span className="text-muted-foreground shrink-0 w-12">
                        {tx.payment_mode?.substring(0, 4)}
                      </span>
                      <span className="shrink-0 w-20 text-right">
                        ₹{Number(tx.amount).toLocaleString()}
                      </span>
                      <span className="truncate flex-1">
                        {tx.merchant_name}
                      </span>
                      <span className={cn(
                        "shrink-0",
                        (tx.confidence_score || 0) >= 0.7 ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {Math.round((tx.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceFlow;
