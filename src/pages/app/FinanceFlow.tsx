import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FolderCheck,
  FolderX,
  Timer,
  Bell,
  Megaphone,
  MessageSquare,
  Trash2,
  Play,
  Pause,
  LayoutList,
  Receipt,
  PieChart,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow, differenceInMinutes, differenceInSeconds } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import FinanceFlowDashboard from "@/components/finance/FinanceFlowDashboard";
import FinanceAnalytics from "@/components/finance/FinanceAnalytics";
import AssetsDashboard from "@/components/assets/AssetsDashboard";
import ReportSubscriptions from "@/components/finance/ReportSubscriptions";
import { StockPortfolio } from "@/components/finance/StockPortfolio";
import { FinancialGoalsTracker } from "@/components/finance/FinancialGoalsTracker";

// Types
interface FolderSettings {
  inbox: boolean;
  promotions: boolean;
  updates: boolean;
  social: boolean;
  spam: boolean;
  trash: boolean;
}

interface SyncSettings {
  is_enabled: boolean;
  gmail_email: string | null;
  last_sync_at: string | null;
  sync_status: string;
  total_synced_count: number;
  scan_folders: FolderSettings;
  sync_frequency_minutes: number;
  scan_days: number;
  scan_mode: 'limited' | 'full';
  last_auto_sync_at: string | null;
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
  transaction_type: 'debit' | 'credit';
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

// Folder configurations
const FOLDER_CONFIG = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, description: 'Primary transaction emails' },
  { id: 'promotions', label: 'Promotions', icon: Megaphone, description: 'Promotional emails' },
  { id: 'updates', label: 'Updates', icon: Bell, description: 'Update notifications' },
  { id: 'social', label: 'Social', icon: MessageSquare, description: 'Social network alerts' },
  { id: 'spam', label: 'Spam', icon: AlertTriangle, description: 'Spam folder (risky)' },
  { id: 'trash', label: 'Trash', icon: Trash2, description: 'Deleted emails' },
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
  
  // Auto-sync state
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number>(1800); // 30 minutes
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);
  
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
      const rawFolders = settingsData.scan_folders as Record<string, boolean> | null;
      const scanFolders: FolderSettings = {
        inbox: rawFolders?.inbox ?? true,
        promotions: rawFolders?.promotions ?? true,
        updates: rawFolders?.updates ?? true,
        social: rawFolders?.social ?? false,
        spam: rawFolders?.spam ?? false,
        trash: rawFolders?.trash ?? false,
      };
      
      const scanMode = (settingsData.scan_mode === 'full' || settingsData.scan_mode === 'limited') 
        ? settingsData.scan_mode 
        : 'limited';
      
      setSettings({
        ...settingsData,
        scan_folders: scanFolders,
        sync_frequency_minutes: settingsData.sync_frequency_minutes || 30,
        scan_days: settingsData.scan_days || 90,
        scan_mode: scanMode,
      });
      
      // Calculate next sync countdown
      if (settingsData.last_sync_at) {
        const lastSync = new Date(settingsData.last_sync_at);
        const now = new Date();
        const secondsSince = differenceInSeconds(now, lastSync);
        const syncFreq = (settingsData.sync_frequency_minutes || 30) * 60;
        setNextSyncSeconds(Math.max(0, syncFreq - secondsSince));
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
      const typedTxData = txData.map(tx => {
        const rawData = tx.raw_extracted_data as Record<string, unknown> | null;
        return {
          ...tx,
          transaction_type: (tx.transaction_type || rawData?.transactionType || 'debit') as 'debit' | 'credit'
        };
      });
      setTransactions(typedTxData);
      calculateStats(typedTxData);
      calculateDetection(typedTxData);
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

  // Auto-sync countdown timer (updates every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setNextSyncSeconds(prev => {
        const newVal = Math.max(0, prev - 1);
        // When countdown reaches 0, trigger auto-sync
        if (newVal === 0 && autoSyncEnabled && settings?.is_enabled) {
          handleAutoSync();
          return (settings?.sync_frequency_minutes || 30) * 60; // Reset countdown
        }
        return newVal;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, settings?.is_enabled, settings?.sync_frequency_minutes]);

  // Handle auto-sync
  const handleAutoSync = async () => {
    if (!user || syncing || !settings?.is_enabled) return;
    
    console.log('[FinanceFlow] Triggering auto-sync...');
    await handleSync(true);
  };

  // Calculate stats
  const calculateStats = (txs: ImportedTransaction[]) => {
    const debitTxs = txs.filter(t => 
      t.transaction_type === 'debit' || t.raw_extracted_data?.transactionType === 'debit' || !t.raw_extracted_data?.transactionType
    );
    const creditTxs = txs.filter(t => 
      t.transaction_type === 'credit' || t.raw_extracted_data?.transactionType === 'credit'
    );
    
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

  // Manual/Auto sync
  const handleSync = async (isAuto = false) => {
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
        title: isAuto ? "Auto-Sync Complete" : "Sync Complete",
        description: `Processed ${result.processed} emails, imported ${result.imported} transactions`,
      });
      
      // Update last auto sync time
      if (isAuto) {
        await supabase
          .from("gmail_sync_settings")
          .update({ last_auto_sync_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }
      
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

  // Update folder settings
  const handleFolderToggle = async (folderId: string, enabled: boolean) => {
    if (!user || !settings) return;
    
    const newFolders = {
      ...settings.scan_folders,
      [folderId]: enabled,
    };
    
    await supabase
      .from("gmail_sync_settings")
      .update({ scan_folders: newFolders })
      .eq("user_id", user.id);
    
    setSettings({ ...settings, scan_folders: newFolders });
    
    toast({
      title: `${FOLDER_CONFIG.find(f => f.id === folderId)?.label} ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  // Update scan mode
  const handleScanModeChange = async (mode: 'limited' | 'full') => {
    if (!user || !settings) return;
    
    const newFolders = mode === 'full' 
      ? { inbox: true, promotions: true, updates: true, social: true, spam: true, trash: true }
      : { inbox: true, promotions: true, updates: true, social: false, spam: false, trash: false };
    
    await supabase
      .from("gmail_sync_settings")
      .update({ scan_mode: mode, scan_folders: newFolders })
      .eq("user_id", user.id);
    
    setSettings({ ...settings, scan_mode: mode, scan_folders: newFolders });
    
    toast({
      title: `Scan mode changed to ${mode}`,
      description: mode === 'full' ? 'All folders will be scanned' : 'Only primary folders will be scanned',
    });
  };

  // Update sync frequency
  const handleSyncFrequencyChange = async (minutes: string) => {
    if (!user || !settings) return;
    
    const freq = parseInt(minutes);
    
    await supabase
      .from("gmail_sync_settings")
      .update({ sync_frequency_minutes: freq })
      .eq("user_id", user.id);
    
    setSettings({ ...settings, sync_frequency_minutes: freq });
    setNextSyncSeconds(freq * 60);
    
    toast({
      title: `Auto-sync interval updated`,
      description: `Syncing every ${freq} minutes`,
    });
  };

  // Approve transaction - adds to Expenses (debit) or Income (credit)
  const handleApprove = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || !user) return;
    
    const isCredit = tx.transaction_type === 'credit' || tx.raw_extracted_data?.transactionType === 'credit';
    
    if (isCredit) {
      // Add to Income
      const { error: incomeError } = await supabase
        .from("income_entries")
        .insert({
          user_id: user.id,
          income_date: tx.transaction_date,
          amount: tx.amount,
          notes: `Auto-imported from Gmail: ${tx.merchant_name || tx.email_subject?.substring(0, 80)}`,
          is_auto_generated: true,
          source_type: "gmail",
          gmail_import_id: tx.id,
          confidence_score: tx.confidence_score,
          merchant_name: tx.merchant_name,
        });
      
      if (!incomeError) {
        await supabase
          .from("auto_imported_transactions")
          .update({ is_processed: true, needs_review: false })
          .eq("id", txId);
        
        toast({ 
          title: "Added to Income",
          description: `₹${Number(tx.amount).toLocaleString()} credited from ${tx.merchant_name || 'Unknown'}`,
        });
        fetchData();
      }
    } else {
      // Add to Expenses
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
          confidence_score: tx.confidence_score,
        });
      
      if (!expenseError) {
        await supabase
          .from("auto_imported_transactions")
          .update({ is_processed: true, needs_review: false })
          .eq("id", txId);
        
        toast({ 
          title: "Added to Expenses",
          description: `₹${Number(tx.amount).toLocaleString()} debited to ${tx.raw_extracted_data?.category || 'Other'}`,
        });
        fetchData();
      }
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

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            FinanceFlow
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Automatic transaction ingestion from Gmail
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-sync toggle */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-muted/50 border">
            {autoSyncEnabled ? (
              <Play className="w-3 h-3 text-emerald-500" />
            ) : (
              <Pause className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline">Auto</span>
            <Switch
              checked={autoSyncEnabled}
              onCheckedChange={setAutoSyncEnabled}
              className="scale-75"
            />
          </div>
          
          <Button
            onClick={() => handleSync(false)}
            disabled={syncing || !settings?.is_enabled}
            size="sm"
            className="gap-1 sm:gap-2"
          >
            {syncing ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="hidden xs:inline">{syncing ? "Syncing..." : "Fetch Now"}</span>
          </Button>
        </div>
      </div>

      {/* Top Status Bar - Mobile Responsive */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-3 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
                settings?.is_enabled ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <Mail className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  settings?.is_enabled ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Connection</p>
                <p className="text-xs sm:text-sm font-medium truncate">
                  {settings?.is_enabled ? (
                    <span className="text-emerald-500">Connected</span>
                  ) : (
                    <span className="text-muted-foreground">Not Connected</span>
                  )}
                </p>
              </div>
            </div>

            {/* Last Sync */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Last Sync</p>
                <p className="text-xs sm:text-sm font-medium truncate">
                  {settings?.last_sync_at
                    ? formatDistanceToNow(new Date(settings.last_sync_at), { addSuffix: true })
                    : "Never"
                  }
                </p>
              </div>
            </div>

            {/* Next Auto-Sync with countdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
                autoSyncEnabled && settings?.is_enabled ? "bg-primary/20" : "bg-muted"
              )}>
                <Timer className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5",
                  autoSyncEnabled && settings?.is_enabled ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Next Sync</p>
                <p className="text-xs sm:text-sm font-medium font-mono">
                  {autoSyncEnabled && settings?.is_enabled 
                    ? formatCountdown(nextSyncSeconds)
                    : "Paused"
                  }
                </p>
              </div>
            </div>

            {/* Sync Frequency */}
            <div className="flex items-center gap-2 sm:gap-3 hidden sm:flex">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Frequency</p>
                <p className="text-xs sm:text-sm font-medium">
                  Every {settings?.sync_frequency_minutes || 30} min
                </p>
              </div>
            </div>

            {/* Total Synced */}
            <div className="flex items-center gap-2 sm:gap-3 hidden lg:flex">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total Synced</p>
                <p className="text-xs sm:text-sm font-medium">
                  {settings?.total_synced_count || 0} txns
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
        <TabsList className="grid w-full grid-cols-5 sm:grid-cols-10 lg:w-auto lg:inline-grid overflow-x-auto">
          <TabsTrigger value="dashboard" className="gap-1">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1">
            <PieChart className="w-3 h-3" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1">
            <Wallet className="w-3 h-3" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="stocks" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="hidden sm:inline">Stocks</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-1">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="folders" className="gap-1">
            <FolderOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Folders</span>
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
          <TabsTrigger value="reports" className="gap-1">
            <Mail className="w-3 h-3" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1">
            <FileSearch className="w-3 h-3" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Using New Component with Today Summary, Date Filters, Views */}
        <TabsContent value="dashboard" className="mt-4">
          <FinanceFlowDashboard 
            transactions={transactions}
            onRefresh={fetchData}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <FinanceAnalytics />
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4">
          <AssetsDashboard />
        </TabsContent>

        {/* Stocks Tab */}
        <TabsContent value="stocks" className="mt-4">
          <StockPortfolio />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <FinancialGoalsTracker />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <ReportSubscriptions />
        </TabsContent>

        {/* Folders Tab - NEW */}
        <TabsContent value="folders" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Folder Coverage Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Folder Coverage
                </CardTitle>
                <CardDescription>
                  Select which Gmail folders to scan for transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FOLDER_CONFIG.map((folder) => {
                    const Icon = folder.icon;
                    const isEnabled = settings?.scan_folders?.[folder.id as keyof FolderSettings] ?? false;
                    const isRisky = folder.id === 'spam' || folder.id === 'trash';
                    
                    return (
                      <div
                        key={folder.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          isEnabled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent",
                          isRisky && isEnabled && "border-amber-500/30 bg-amber-500/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            isEnabled ? "bg-primary/10" : "bg-muted"
                          )}>
                            <Icon className={cn(
                              "w-4 h-4",
                              isEnabled ? "text-primary" : "text-muted-foreground",
                              isRisky && isEnabled && "text-amber-500"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              {folder.label}
                              {isRisky && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                                  Risky
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{folder.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleFolderToggle(folder.id, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Scan Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Scan Settings
                </CardTitle>
                <CardDescription>
                  Configure auto-sync frequency and scan range
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scan Mode */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Scan Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => handleScanModeChange('limited')}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        settings?.scan_mode === 'limited' 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FolderCheck className="w-4 h-4 text-primary" />
                        <span className="font-medium">Limited</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scan Inbox, Promotions, and Updates only
                      </p>
                    </div>
                    <div
                      onClick={() => handleScanModeChange('full')}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-colors",
                        settings?.scan_mode === 'full' 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">Full</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scan all folders including Spam & Trash
                      </p>
                    </div>
                  </div>
                  {settings?.scan_mode === 'full' && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Full mode will scan all Gmail folders including Spam and Trash for maximum transaction detection. This may increase processing time.
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Auto-Sync Frequency */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Auto-Sync Frequency</Label>
                  <Select
                    value={String(settings?.sync_frequency_minutes || 30)}
                    onValueChange={handleSyncFrequencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every 1 hour</SelectItem>
                      <SelectItem value="120">Every 2 hours</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="720">Every 12 hours</SelectItem>
                      <SelectItem value="1440">Once a day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Automatically sync new transactions from Gmail
                  </p>
                </div>

                <Separator />

                {/* Data Range */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Data Range</Label>
                  <Select
                    value={String(settings?.scan_days || 90)}
                    onValueChange={async (value) => {
                      const days = parseInt(value);
                      await supabase
                        .from("gmail_sync_settings")
                        .update({ scan_days: days })
                        .eq("user_id", user?.id);
                      setSettings(s => s ? { ...s, scan_days: days } : s);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                      <SelectItem value="365">Last 1 year</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How far back to scan for transaction emails
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                Low-confidence transactions that need your review. Approve to add to Expenses (debits) or Income (credits).
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
                    {reviewQueue.map((tx) => {
                      const isCredit = tx.transaction_type === 'credit' || tx.raw_extracted_data?.transactionType === 'credit';
                      
                      return (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium">{tx.merchant_name || 'Unknown'}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {tx.payment_mode}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px]",
                                    isCredit 
                                      ? "bg-emerald-500/10 text-emerald-500" 
                                      : "bg-destructive/10 text-destructive"
                                  )}
                                >
                                  {isCredit ? '↓ Credit (Income)' : '↑ Debit (Expense)'}
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
                              <p className={cn(
                                "text-lg font-semibold",
                                isCredit ? "text-emerald-500" : "text-foreground"
                              )}>
                                {isCredit ? '+' : ''}₹{Number(tx.amount).toLocaleString()}
                              </p>
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
                                className={cn(
                                  "gap-1",
                                  isCredit && "bg-emerald-600 hover:bg-emerald-700"
                                )}
                                onClick={() => handleApprove(tx.id)}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {isCredit ? 'Add to Income' : 'Add to Expenses'}
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
                      );
                    })}
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
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
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
                  {transactions.slice(0, 100).map((tx) => {
                    const isCredit = tx.transaction_type === 'credit' || tx.raw_extracted_data?.transactionType === 'credit';
                    
                    return (
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
                        <span className={cn(
                          "shrink-0 w-12",
                          isCredit ? "text-emerald-500" : "text-destructive"
                        )}>
                          {isCredit ? "CR" : "DR"}
                        </span>
                        <span className="text-muted-foreground shrink-0 w-12">
                          {tx.payment_mode?.substring(0, 4)}
                        </span>
                        <span className={cn(
                          "shrink-0 w-24 text-right",
                          isCredit ? "text-emerald-500" : ""
                        )}>
                          {isCredit ? '+' : ''}₹{Number(tx.amount).toLocaleString()}
                        </span>
                        <span className="truncate flex-1">
                          {tx.merchant_name || 'Unknown'}
                        </span>
                        <span className={cn(
                          "shrink-0",
                          (tx.confidence_score || 0) >= 0.7 ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {Math.round((tx.confidence_score || 0) * 100)}%
                        </span>
                      </div>
                    );
                  })}
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
