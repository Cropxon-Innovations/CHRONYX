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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header with gradient */}
        <div className="p-6 pb-4 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent dark:from-primary/10 dark:via-primary/5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg">
                  {transaction.merchant_name || "Unknown Merchant"}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>FinanceFlow AI Detection</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Amount highlight */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 flex items-center justify-between"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">₹{transaction.amount.toLocaleString()}</span>
              {transaction.currency !== "INR" && (
                <span className="text-sm text-muted-foreground">{transaction.currency}</span>
              )}
            </div>
            <Badge className={`${confidenceInfo.bg} ${confidenceInfo.color} border-0`}>
              {Math.round(transaction.confidence_score * 100)}% {confidenceInfo.label}
            </Badge>
          </motion.div>
        </div>

        <Separator />

        {/* Transaction Details */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Date</span>
                </div>
                <p className="text-sm font-semibold">
                  {format(parseISO(transaction.transaction_date), "EEEE, MMM d, yyyy")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Status</span>
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
              </div>
            </div>

            {/* Category & Payment Mode Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(value) => onCategoryChange(transaction.id, value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  Payment Mode
                </Label>
                <Select
                  value={paymentMode}
                  onValueChange={(value) => onPaymentModeChange(transaction.id, value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Source Info */}
            {transaction.source_platform && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Store className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Source Platform</span>
                </div>
                <p className="text-sm">{transaction.source_platform}</p>
              </div>
            )}

            {/* Email Subject */}
            {transaction.email_subject && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Email Subject</span>
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
              </div>
            )}

            {/* Email Snippet / Invoice Content */}
            {transaction.email_snippet && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Email Content (Preview)</span>
                </div>
                <div className="p-2 rounded bg-background/50 border border-border/30">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {transaction.email_snippet}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  * Extracted from Gmail text content. PDF invoices are not yet supported.
                </p>
              </div>
            )}

            {/* Sender Info */}
            {extractedData.from && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Sender</span>
                </div>
                <p className="text-sm truncate">{extractedData.from}</p>
              </div>
            )}

            {/* Gmail Message ID */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Reference ID</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background/50 px-2 py-1 rounded font-mono flex-1 truncate">
                  {transaction.gmail_message_id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => copyToClipboard(transaction.gmail_message_id)}
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* AI Confidence Explanation */}
            <div className={`p-3 rounded-lg ${confidenceInfo.bg} border border-current/10`}>
              <div className="flex items-start gap-2">
                <Sparkles className={`w-4 h-4 ${confidenceInfo.color} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-xs font-medium ${confidenceInfo.color}`}>
                    AI Confidence: {confidenceInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transaction.confidence_score >= 0.8
                      ? "This transaction was detected with high accuracy from a known merchant pattern."
                      : transaction.confidence_score >= 0.6
                      ? "This transaction was detected with moderate confidence. Please verify the details."
                      : "This transaction has low detection confidence. Manual review recommended."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {!transaction.is_processed && !transaction.is_duplicate && (
          <>
            <Separator />
            <div className="p-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => {
                  onImport(transaction.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Import Transaction
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailDialog;
