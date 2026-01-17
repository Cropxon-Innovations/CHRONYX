import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  Mail,
  Calendar,
  Store,
  CreditCard,
  AlertTriangle,
  Sparkles,
  Import,
  ListFilter,
  LayoutGrid,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import FinanceDataFlow from "./FinanceDataFlow";
import TransactionParsingAnimation from "./TransactionParsingAnimation";
import CategoryPreviewCard from "./CategoryPreviewCard";
import FinanceFlowErrorAlert, { parseFinanceFlowError, type FinanceFlowErrorCode } from "./FinanceFlowErrorAlert";
import { useSmartDuplicateDetection } from "@/hooks/useSmartDuplicateDetection";
import TransactionDetailDialog from "./TransactionDetailDialog";

interface PendingTransaction {
  id: string;
  gmail_message_id: string;
  merchant_name: string | null;
  amount: number;
  currency: string;
  transaction_date: string;
  payment_mode: string | null;
  source_platform: string | null;
  email_subject: string | null;
  email_snippet?: string | null;
  confidence_score: number;
  is_processed: boolean;
  is_duplicate: boolean;
  learned_category?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw_extracted_data?: any;
}

interface FinanceFlowPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

// Extended category map with more merchants
const CATEGORY_MAP: Record<string, string> = {
  // Shopping
  amazon: "Shopping", flipkart: "Shopping", myntra: "Shopping", ajio: "Shopping",
  meesho: "Shopping", nykaa: "Shopping", snapdeal: "Shopping", shopsy: "Shopping",
  // Food
  swiggy: "Food", zomato: "Food", bigbasket: "Food", blinkit: "Food",
  zepto: "Food", dunzo: "Food", grofers: "Food", jiomart: "Food",
  // Transport
  uber: "Transport", ola: "Transport", rapido: "Transport", metro: "Transport",
  irctc: "Transport", redbus: "Transport", makemytrip: "Transport",
  // Entertainment
  netflix: "Entertainment", spotify: "Entertainment", hotstar: "Entertainment",
  prime: "Entertainment", youtube: "Entertainment", zee5: "Entertainment",
  sonyliv: "Entertainment", gaana: "Entertainment",
  // Utilities
  jio: "Utilities", airtel: "Utilities", vodafone: "Utilities", vi: "Utilities",
  bsnl: "Utilities", electricity: "Utilities", gas: "Utilities", water: "Utilities",
  bescom: "Utilities", tatapower: "Utilities",
  // Healthcare
  apollo: "Healthcare", "1mg": "Healthcare", pharmeasy: "Healthcare",
  netmeds: "Healthcare", practo: "Healthcare",
  // Education
  coursera: "Education", udemy: "Education", unacademy: "Education",
  byju: "Education", upgrad: "Education", skillshare: "Education",
  // Subscriptions
  adobe: "Subscriptions", microsoft: "Subscriptions", apple: "Subscriptions",
  googleone: "Subscriptions", dropbox: "Subscriptions", notion: "Subscriptions",
  // Others
  phonepe: "Others", paytm: "Others", gpay: "Others", razorpay: "Others",
};

const FinanceFlowPreviewDialog = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: FinanceFlowPreviewDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { recordCorrection, getSuggestedCategory } = useSmartDuplicateDetection();
  
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [syncPhase, setSyncPhase] = useState<"reading" | "parsing" | "categorizing" | "complete">("complete");
  const [currentEmail, setCurrentEmail] = useState<{ subject: string; amount?: number; merchant?: string } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [error, setError] = useState<FinanceFlowErrorCode | null>(null);
  
  // Category overrides for editing
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [paymentModeOverrides, setPaymentModeOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && user) {
      fetchPendingTransactions();
      fetchGmailEmail();
      setError(null);
    }
  }, [open, user]);

  const fetchGmailEmail = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("gmail_sync_settings")
      .select("gmail_email")
      .eq("user_id", user.id)
      .single();
    
    setGmailEmail(data?.gmail_email || null);
  };

  const fetchPendingTransactions = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("auto_imported_transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_processed", false)
      .eq("is_duplicate", false)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setPendingTransactions(data || []);
      setSelectedIds(new Set(data?.map(t => t.id) || []));
      
      // Apply learned categories
      const overrides: Record<string, string> = {};
      for (const tx of data || []) {
        if (tx.learned_category) {
          overrides[tx.id] = tx.learned_category;
        } else if (tx.merchant_name) {
          const suggested = await getSuggestedCategory(tx.merchant_name);
          if (suggested) {
            overrides[tx.id] = suggested;
          }
        }
      }
      setCategoryOverrides(overrides);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    setError(null);
    setSyncPhase("reading");

    try {
      const startTime = Date.now();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Simulate phases for UX
      setTimeout(() => setSyncPhase("parsing"), 1500);
      setTimeout(() => setSyncPhase("categorizing"), 3000);
      
      const response = await supabase.functions.invoke("gmail-sync", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      const duration = Date.now() - startTime;

      // Log sync history
      await supabase.from("financeflow_sync_history").insert({
        user_id: user.id,
        sync_type: "manual",
        emails_scanned: result.processed || 0,
        transactions_found: result.processed || 0,
        duplicates_detected: result.duplicates || 0,
        imported_count: result.imported || 0,
        sync_duration_ms: duration,
        status: "completed",
      });

      setSyncPhase("complete");
      
      toast({
        title: "Sync Complete",
        description: `Found ${result.processed} transactions.`,
      });

      fetchPendingTransactions();
    } catch (err: any) {
      console.error("Sync error:", err);
      setSyncPhase("complete");
      
      // Parse and display error
      const errorCode = parseFinanceFlowError(err);
      setError(errorCode);

      // Log failed sync
      await supabase.from("financeflow_sync_history").insert({
        user_id: user.id,
        sync_type: "manual",
        emails_scanned: 0,
        transactions_found: 0,
        duplicates_detected: 0,
        imported_count: 0,
        error_message: err.message,
        status: "failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingTransactions.map(t => t.id)));
    }
  };

  const getCategoryFromMerchant = (merchant: string | null, txId: string): string => {
    // Check overrides first
    if (categoryOverrides[txId]) return categoryOverrides[txId];
    
    if (!merchant) return "Others";
    const lower = merchant.toLowerCase();
    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(key)) return category;
    }
    return "Others";
  };

  const handleCategoryChange = async (id: string, category: string) => {
    setCategoryOverrides(prev => ({ ...prev, [id]: category }));
    
    // Record correction for learning
    const tx = pendingTransactions.find(t => t.id === id);
    if (tx) {
      await recordCorrection(
        id,
        'category_changed',
        { category: getCategoryFromMerchant(tx.merchant_name, id), merchant_name: tx.merchant_name },
        { category, merchant_name: tx.merchant_name }
      );
    }
  };

  const handlePaymentModeChange = (id: string, paymentMode: string) => {
    setPaymentModeOverrides(prev => ({ ...prev, [id]: paymentMode }));
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one transaction to import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const selectedTransactions = pendingTransactions.filter(t => selectedIds.has(t.id));
      
      const expenses = selectedTransactions.map(t => ({
        user_id: user!.id,
        amount: t.amount,
        category: getCategoryFromMerchant(t.merchant_name, t.id),
        expense_date: t.transaction_date,
        payment_mode: paymentModeOverrides[t.id] || t.payment_mode || "UPI",
        notes: `Auto-imported: ${t.email_subject || t.merchant_name || "Gmail transaction"}`,
        is_auto_generated: true,
        source_type: "gmail",
        source_id: t.gmail_message_id,
        gmail_import_id: t.id,
        confidence_score: t.confidence_score,
        merchant_name: t.merchant_name,
      }));

      const { error: insertError } = await supabase
        .from("expenses")
        .insert(expenses);

      if (insertError) throw insertError;

      // Mark as processed and store learned category
      for (const tx of selectedTransactions) {
        await supabase
          .from("auto_imported_transactions")
          .update({ 
            is_processed: true,
            learned_category: categoryOverrides[tx.id] || getCategoryFromMerchant(tx.merchant_name, tx.id),
            user_verified: !!categoryOverrides[tx.id],
            updated_at: new Date().toISOString()
          })
          .eq("id", tx.id);
      }

      // Update sync count
      const { data: currentSettings } = await supabase
        .from("gmail_sync_settings")
        .select("total_synced_count")
        .eq("user_id", user!.id)
        .single();

      await supabase
        .from("gmail_sync_settings")
        .update({ 
          total_synced_count: (currentSettings?.total_synced_count || 0) + selectedIds.size,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user!.id);

      toast({
        title: "Import Successful",
        description: `Imported ${selectedIds.size} transactions.`,
      });

      onImportComplete();
    } catch (err: any) {
      console.error("Import error:", err);
      toast({
        title: "Import Failed",
        description: err.message || "Failed to import transactions.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-emerald-500";
    if (score >= 0.5) return "text-amber-500";
    return "text-red-500";
  };

  // Group transactions by category
  const groupedByCategory = pendingTransactions.reduce((acc, tx) => {
    const category = getCategoryFromMerchant(tx.merchant_name, tx.id);
    if (!acc[category]) acc[category] = [];
    acc[category].push(tx);
    return acc;
  }, {} as Record<string, PendingTransaction[]>);

  const selectedTotal = pendingTransactions
    .filter(t => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <DialogTitle>FinanceFlow AI Preview</DialogTitle>
            <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-500 border-red-500/30">
              BETA
            </Badge>
          </div>
          <DialogDescription>
            Review and categorize detected transactions before importing
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <FinanceFlowErrorAlert
              errorCode={error}
              onAction={() => {
                setError(null);
                if (error === 'TOKEN_EXPIRED' || error === 'INVALID_TOKEN') {
                  onOpenChange(false);
                }
              }}
              onDismiss={() => setError(null)}
            />
          )}
        </AnimatePresence>

        {/* Data Flow Animation (during sync) */}
        <AnimatePresence>
          {syncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <FinanceDataFlow 
                phase={syncPhase} 
                itemsProcessed={0} 
                totalItems={0} 
              />
              <TransactionParsingAnimation 
                isActive={syncPhase === "parsing"} 
                currentEmail={currentEmail || undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gmail Account Info */}
        {gmailEmail && !syncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{gmailEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="ml-auto gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync"}
            </Button>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingTransactions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No new transactions to import. Click sync to check for new ones.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Header Controls */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === pendingTransactions.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} of {pendingTransactions.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  ₹{selectedTotal.toLocaleString()}
                </Badge>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7 rounded-r-none"
                    onClick={() => setViewMode("list")}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-7 w-7 rounded-l-none"
                    onClick={() => setViewMode("cards")}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Transaction List/Cards */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <AnimatePresence mode="popLayout">
                {viewMode === "list" ? (
                  <div className="space-y-2 py-2">
                    {pendingTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          selectedIds.has(transaction.id)
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/30 border-transparent hover:bg-muted/50"
                        }`}
                        onClick={() => toggleSelection(transaction.id)}
                      >
                        <Checkbox
                          checked={selectedIds.has(transaction.id)}
                          onCheckedChange={() => toggleSelection(transaction.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {transaction.merchant_name || "Unknown Merchant"}
                            </p>
                            <Badge variant="outline" className="text-[10px] bg-primary/10">
                              {getCategoryFromMerchant(transaction.merchant_name, transaction.id)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(transaction.transaction_date), "MMM d, yyyy")}
                            </span>
                            {transaction.payment_mode && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {paymentModeOverrides[transaction.id] || transaction.payment_mode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            ₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className={`text-[10px] ${getConfidenceColor(transaction.confidence_score)}`}>
                            {Math.round(transaction.confidence_score * 100)}% confidence
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {Object.entries(groupedByCategory).map(([category, txs]) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase">
                            {category}
                          </h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {txs.length} • ₹{txs.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {txs.map((tx) => (
                            <div key={tx.id} onClick={() => toggleSelection(tx.id)}>
                              <CategoryPreviewCard
                                id={tx.id}
                                merchantName={tx.merchant_name || "Unknown"}
                                amount={tx.amount}
                                date={format(parseISO(tx.transaction_date), "MMM d, yyyy")}
                                category={getCategoryFromMerchant(tx.merchant_name, tx.id)}
                                paymentMode={paymentModeOverrides[tx.id] || tx.payment_mode || "UPI"}
                                confidenceScore={tx.confidence_score}
                                onCategoryChange={handleCategoryChange}
                                onPaymentModeChange={handlePaymentModeChange}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>

            {/* Import Button */}
            <div className="pt-4 border-t">
              <Alert className="mb-4 bg-amber-500/10 border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <AlertDescription className="text-xs">
                  Selected transactions will be added to your expenses. Categories are editable and AI learns from your changes.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleImport}
                disabled={importing || selectedIds.size === 0}
                className="w-full gap-2"
                variant="vyom"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Import className="w-4 h-4" />
                )}
                {importing 
                  ? "Importing..." 
                  : `Import ${selectedIds.size} Transaction${selectedIds.size !== 1 ? "s" : ""}`
                }
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinanceFlowPreviewDialog;
