import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Loader2 } from "lucide-react";
import { REPAYMENT_MODES } from "./BankLogos";
import { formatCurrency } from "./LoanSummaryCards";
import { format, parseISO } from "date-fns";

interface EmiEntry {
  id: string;
  emi_month: number;
  emi_date: string;
  emi_amount: number;
  payment_status: string;
}

interface BulkEmiPaymentProps {
  schedule: EmiEntry[];
  currency: string;
  onBulkMarkPaid: (emiIds: string[], paidDate: string, paymentMethod: string) => Promise<void>;
  isLoading?: boolean;
}

export const BulkEmiPayment = ({
  schedule,
  currency,
  onBulkMarkPaid,
  isLoading,
}: BulkEmiPaymentProps) => {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Auto Debit");
  const [confirming, setConfirming] = useState(false);

  const pendingEmis = schedule.filter((e) => e.payment_status === "Pending");
  const selectedEmis = pendingEmis.filter((e) => selectedIds.has(e.id));
  const totalAmount = selectedEmis.reduce((sum, e) => sum + Number(e.emi_amount), 0);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingEmis.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingEmis.map((e) => e.id)));
    }
  };

  const handleSelectUpTo = (monthNumber: number) => {
    const upToEmis = pendingEmis.filter((e) => e.emi_month <= monthNumber);
    setSelectedIds(new Set(upToEmis.map((e) => e.id)));
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setConfirming(true);
    try {
      await onBulkMarkPaid(Array.from(selectedIds), paidDate, paymentMethod);
      setOpen(false);
      setSelectedIds(new Set());
    } finally {
      setConfirming(false);
    }
  };

  const handleOpen = () => {
    setSelectedIds(new Set());
    setPaidDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Auto Debit");
    setOpen(true);
  };

  if (pendingEmis.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="border-border"
        disabled={isLoading}
      >
        <CheckSquare className="w-4 h-4 mr-2" />
        Bulk Mark Paid
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-light tracking-wide">Bulk Mark EMIs as Paid</DialogTitle>
            <DialogDescription>
              Select multiple EMIs to mark as paid at once
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {/* Quick Select */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs border-border"
              >
                {selectedIds.size === pendingEmis.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectUpTo(3)}
                className="text-xs border-border"
              >
                Next 3 EMIs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectUpTo(6)}
                className="text-xs border-border"
              >
                Next 6 EMIs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectUpTo(12)}
                className="text-xs border-border"
              >
                Next 12 EMIs
              </Button>
            </div>

            {/* EMI List */}
            <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
              {pendingEmis.slice(0, 36).map((emi) => (
                <label
                  key={emi.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(emi.id)}
                    onCheckedChange={() => handleToggle(emi.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      EMI #{emi.emi_month} - {formatCurrency(Number(emi.emi_amount), currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due: {format(parseISO(emi.emi_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </label>
              ))}
              {pendingEmis.length > 36 && (
                <p className="p-3 text-xs text-muted-foreground text-center">
                  +{pendingEmis.length - 36} more pending EMIs
                </p>
              )}
            </div>

            {/* Payment Details */}
            {selectedIds.size > 0 && (
              <div className="space-y-4 pt-2">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected EMIs:</span>
                    <span className="font-medium">{selectedIds.size}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(totalAmount, currency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Payment Date</Label>
                    <Input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {REPAYMENT_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || confirming || isLoading}
              className="bg-primary text-primary-foreground"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Mark ${selectedIds.size} EMIs as Paid`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
