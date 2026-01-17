import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  Calendar,
  CreditCard,
  Mail,
  FileText,
  IndianRupee,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
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
  } | null;
  category: string;
  paymentMode: string;
  onCategoryChange: (id: string, category: string) => void;
  onPaymentModeChange: (id: string, paymentMode: string) => void;
  onImport: (id: string) => void;
}

const CATEGORIES = [
  "Shopping",
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Education",
  "Subscriptions",
  "Others",
];

const PAYMENT_MODES = ["UPI", "Card", "Bank Transfer", "Cash", "Wallet", "Other"];

const TransactionDetailDialog = ({
  open,
  onOpenChange,
  transaction,
  category,
  paymentMode,
  onCategoryChange,
  onPaymentModeChange,
  onImport,
}: TransactionDetailDialogProps) => {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const getConfidenceInfo = (score: number) => {
    if (score >= 0.8) return { label: "High", color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (score >= 0.6) return { label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "Low", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const confidenceInfo = getConfidenceInfo(transaction.confidence_score);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const extractedData = transaction.raw_extracted_data || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header with gradient - enhanced for dark mode */}
        <div className="p-6 pb-4 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent dark:from-[hsl(230_30%_25%)]/30 dark:via-[hsl(230_25%_35%)]/20 dark:to-transparent border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[hsl(230_30%_40%)]/40 dark:to-[hsl(230_25%_30%)]/30 flex items-center justify-center shadow-lg"
              >
                <Store className="w-6 h-6 text-primary dark:text-[hsl(230_50%_70%)]" />
              </motion.div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  {transaction.merchant_name || "Unknown Merchant"}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>FinanceFlow AI Detection</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Amount highlight with enhanced styling */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-4 flex items-center justify-between"
          >
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-5 h-5 text-foreground/70 mb-0.5" />
              <span className="text-3xl font-bold text-foreground tracking-tight">{transaction.amount.toLocaleString()}</span>
              {transaction.currency !== "INR" && (
                <span className="text-sm text-muted-foreground ml-1">{transaction.currency}</span>
              )}
            </div>
            <Badge className={`${confidenceInfo.bg} ${confidenceInfo.color} border-0 px-3 py-1`}>
              <Sparkles className="w-3 h-3 mr-1" />
              {Math.round(transaction.confidence_score * 100)}% {confidenceInfo.label}
            </Badge>
          </motion.div>
        </div>

        <Separator />

        {/* Transaction Details */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">
            {/* Quick Info Grid - Enhanced dark mode */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Date</span>
                </div>
                <p className="text-sm font-semibold">
                  {format(parseISO(transaction.transaction_date), "EEEE, MMM d, yyyy")}
                </p>
              </motion.div>
              <motion.div 
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {transaction.is_processed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Imported</span>
                    </>
                  ) : transaction.is_duplicate ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Duplicate</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Pending</span>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Category & Payment Mode Selectors - Enhanced styling */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                  <Tag className="w-3 h-3" />
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) => onCategoryChange(transaction.id, value)}
                >
                  <SelectTrigger className="h-10 bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border-border/50 dark:border-[hsl(230_20%_30%)]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[hsl(230_20%_15%)] dark:border-[hsl(230_20%_25%)]">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                  <CreditCard className="w-3 h-3" />
                  Payment Mode
                </Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value) => onPaymentModeChange(transaction.id, value)}
                >
                  <SelectTrigger className="h-10 bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border-border/50 dark:border-[hsl(230_20%_30%)]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[hsl(230_20%_15%)] dark:border-[hsl(230_20%_25%)]">
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Source Info - Dark mode enhanced */}
            {transaction.source_platform && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Source Platform</span>
                </div>
                <p className="text-sm font-medium">{transaction.source_platform}</p>
              </motion.div>
            )}

            {/* Email Subject */}
            {transaction.email_subject && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">Email Subject</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(transaction.email_subject || "")}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{transaction.email_subject}</p>
              </motion.div>
            )}

            {/* Email Snippet / Invoice Content */}
            {transaction.email_snippet && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Email Content Preview</span>
                </div>
                <div className="p-3 rounded-lg bg-background/50 dark:bg-[hsl(230_20%_12%)]/50 border border-border/30 dark:border-[hsl(230_20%_25%)]/30">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {transaction.email_snippet}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Extracted from Gmail text content. PDF invoices are not yet supported.
                </p>
              </motion.div>
            )}

            {/* Sender Info */}
            {extractedData.from && (
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Sender</span>
                </div>
                <p className="text-sm truncate">{extractedData.from}</p>
              </motion.div>
            )}

            {/* Gmail Message ID */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-3 rounded-xl bg-muted/30 dark:bg-[hsl(230_20%_18%)]/50 border border-border/50 dark:border-[hsl(230_20%_30%)]/30"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Reference ID</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background/50 dark:bg-[hsl(230_20%_12%)]/50 px-2 py-1.5 rounded-lg font-mono flex-1 truncate border border-border/30 dark:border-[hsl(230_20%_25%)]/30">
                  {transaction.gmail_message_id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyToClipboard(transaction.gmail_message_id)}
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </motion.div>

            {/* AI Confidence Explanation - Enhanced */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className={`p-4 rounded-xl ${confidenceInfo.bg} border border-current/10`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${confidenceInfo.bg} flex items-center justify-center`}>
                  <Sparkles className={`w-4 h-4 ${confidenceInfo.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${confidenceInfo.color}`}>
                    AI Confidence: {confidenceInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {transaction.confidence_score >= 0.8
                      ? "This transaction was detected with high accuracy from a known merchant pattern."
                      : transaction.confidence_score >= 0.6
                      ? "This transaction was detected with moderate confidence. Please verify the details."
                      : "This transaction has low detection confidence. Manual review recommended."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </ScrollArea>

        {/* Footer Actions - Enhanced */}
        {!transaction.is_processed && !transaction.is_duplicate && (
          <>
            <Separator />
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 flex gap-3 bg-muted/20 dark:bg-[hsl(230_20%_12%)]/50"
            >
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={() => {
                  onImport(transaction.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Import Transaction
              </Button>
            </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailDialog;
