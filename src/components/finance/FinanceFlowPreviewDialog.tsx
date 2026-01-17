import { useState, useEffect } from "react";
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
  Import
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

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
  confidence_score: number;
  is_processed: boolean;
  is_duplicate: boolean;
}

interface FinanceFlowPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  amazon: "Shopping",
  flipkart: "Shopping",
  swiggy: "Food",
  zomato: "Food",
  uber: "Transport",
  ola: "Transport",
  netflix: "Entertainment",
  spotify: "Entertainment",
  hotstar: "Entertainment",
  jio: "Utilities",
  airtel: "Utilities",
  vodafone: "Utilities",
  phonepe: "Others",
  paytm: "Others",
  gpay: "Others",
  razorpay: "Others",
};

const FinanceFlowPreviewDialog = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: FinanceFlowPreviewDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchPendingTransactions();
      fetchGmailEmail();
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
      // Select all by default
      setSelectedIds(new Set(data?.map(t => t.id) || []));
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("gmail-sync", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Sync Complete",
        description: `Found ${response.data.processed} transactions.`,
      });

      fetchPendingTransactions();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
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

  const getCategoryFromMerchant = (merchant: string | null): string => {
    if (!merchant) return "Others";
    const lower = merchant.toLowerCase();
    for (const [key, category] of Object.entries(CATEGORY_MAP)) {
      if (lower.includes(key)) return category;
    }
    return "Others";
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
      
      // Create expenses from selected transactions
      const expenses = selectedTransactions.map(t => ({
        user_id: user!.id,
        amount: t.amount,
        category: getCategoryFromMerchant(t.merchant_name),
        expense_date: t.transaction_date,
        payment_mode: t.payment_mode || "UPI",
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

      if (insertError) {
        throw insertError;
      }

      // Mark transactions as processed
      const { error: updateError } = await supabase
        .from("auto_imported_transactions")
        .update({ 
          is_processed: true,
          updated_at: new Date().toISOString()
        })
        .in("id", Array.from(selectedIds));

      if (updateError) {
        console.error("Update error:", updateError);
      }

      // Get current sync count and update
      const { data: currentSettings } = await supabase
        .from("gmail_sync_settings")
        .select("total_synced_count")
        .eq("user_id", user!.id)
        .single();

      const currentCount = currentSettings?.total_synced_count || 0;
      
      await supabase
        .from("gmail_sync_settings")
        .update({ 
          total_synced_count: currentCount + selectedIds.size,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user!.id);

      toast({
        title: "Import Successful",
        description: `Imported ${selectedIds.size} transactions.`,
      });

      onImportComplete();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import transactions.",
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
            Review detected transactions from Gmail before importing
          </DialogDescription>
        </DialogHeader>

        {/* Gmail Account Info */}
        {gmailEmail && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
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
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No new transactions to import. Click sync to check for new ones.
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
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
              <Badge variant="secondary">
                ₹{pendingTransactions
                  .filter(t => selectedIds.has(t.id))
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </Badge>
            </div>

            {/* Transaction List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 py-2">
                {pendingTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
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
                          Auto
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(transaction.transaction_date), "MMM d, yyyy")}
                        </span>
                        {transaction.source_platform && (
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {transaction.source_platform}
                          </span>
                        )}
                        {transaction.payment_mode && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {transaction.payment_mode}
                          </span>
                        )}
                      </div>
                      {transaction.email_subject && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {transaction.email_subject}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        ₹{transaction.amount.toLocaleString()}
                      </p>
                      <p className={`text-[10px] ${getConfidenceColor(transaction.confidence_score)}`}>
                        {Math.round(transaction.confidence_score * 100)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Import Button */}
            <div className="pt-4 border-t">
              <Alert className="mb-4 bg-amber-500/10 border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <AlertDescription className="text-xs">
                  Selected transactions will be added to your expenses. You can edit or delete them anytime.
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
