import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Check, 
  Clock, 
  ChevronUp, 
  ChevronDown,
  Calendar,
  IndianRupee,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { formatCurrency } from "@/components/loans/LoanSummaryCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EmiScheduleItem {
  id: string;
  loan_id: string;
  emi_month: number;
  emi_date: string;
  emi_amount: number;
  principal_component: number;
  interest_component: number;
  remaining_principal: number;
  payment_status: string | null;
  paid_date: string | null;
  payment_method: string | null;
}

interface Loan {
  id: string;
  bank_name: string;
  loan_type: string;
  loan_account_number: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  status: string | null;
}

interface FloatingEmiCardProps {
  loans: Loan[];
  allEmis: EmiScheduleItem[];
  onMarkPaid: (emiId: string, paidDate: string, paymentMethod: string) => void;
  isLoading: boolean;
  /** Optional: lets the Loans page place this card without fixed positioning */
  className?: string;
}

const FloatingEmiCard = ({ loans, allEmis, onMarkPaid, isLoading, className }: FloatingEmiCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<EmiScheduleItem | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  // Get this month's EMIs
  const thisMonthEmis = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return allEmis.filter(emi => {
      const emiDate = parseISO(emi.emi_date);
      return isWithinInterval(emiDate, { start: monthStart, end: monthEnd });
    }).sort((a, b) => parseISO(a.emi_date).getTime() - parseISO(b.emi_date).getTime());
  }, [allEmis]);

  // Calculate summary
  const summary = useMemo(() => {
    const pendingEmis = thisMonthEmis.filter(e => e.payment_status === "Pending");
    const paidEmis = thisMonthEmis.filter(e => e.payment_status === "Paid");
    
    const totalDue = pendingEmis.reduce((sum, e) => sum + Number(e.emi_amount), 0);
    const totalPaid = paidEmis.reduce((sum, e) => sum + Number(e.emi_amount), 0);

    return {
      totalDue,
      totalPaid,
      pendingCount: pendingEmis.length,
      paidCount: paidEmis.length,
      pendingEmis,
      paidEmis,
    };
  }, [thisMonthEmis]);

  const getLoanDetails = (loanId: string) => {
    return loans.find(l => l.id === loanId);
  };

  const handleMarkPaid = () => {
    if (!selectedEmi) return;
    onMarkPaid(selectedEmi.id, paymentDate, paymentMethod);
    setShowPaymentDialog(false);
    setSelectedEmi(null);
  };

  const openPaymentDialog = (emi: EmiScheduleItem) => {
    setSelectedEmi(emi);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setShowPaymentDialog(true);
  };

  if (loans.length === 0 || thisMonthEmis.length === 0) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`w-full ${className ?? ""}`}
      >
        <Card className="bg-card/95 backdrop-blur-lg border-border shadow-2xl">
          <CardHeader 
            className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {format(new Date(), "MMMM yyyy")} EMIs
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {summary.pendingCount} pending • {summary.paidCount} paid
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(summary.totalDue, "INR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Due</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 px-4 pb-4 max-h-80 overflow-y-auto">
                  {/* Summary Row */}
                  <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-500">
                        {formatCurrency(summary.totalPaid, "INR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" />
                        Paid
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange-500">
                        {formatCurrency(summary.totalDue, "INR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </p>
                    </div>
                  </div>

                  {/* Pending EMIs */}
                  {summary.pendingEmis.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Pending EMIs
                      </h4>
                      {summary.pendingEmis.map(emi => {
                        const loan = getLoanDetails(emi.loan_id);
                        return (
                          <div 
                            key={emi.id} 
                            className="flex items-center justify-between p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {loan?.bank_name} - {loan?.loan_type}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(emi.emi_date), "dd MMM")}
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  EMI #{emi.emi_month}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-sm font-semibold flex items-center">
                                  <IndianRupee className="w-3 h-3" />
                                  {Number(emi.emi_amount).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                                onClick={() => openPaymentDialog(emi)}
                                disabled={isLoading}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Pay
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Paid EMIs */}
                  {summary.paidEmis.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        Paid EMIs
                      </h4>
                      {summary.paidEmis.map(emi => {
                        const loan = getLoanDetails(emi.loan_id);
                        return (
                          <div 
                            key={emi.id} 
                            className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {loan?.bank_name} - {loan?.loan_type}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-green-500" />
                                {emi.paid_date && format(parseISO(emi.paid_date), "dd MMM")}
                                {emi.payment_method && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    {emi.payment_method}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-green-500 flex items-center">
                                <IndianRupee className="w-3 h-3" />
                                {Number(emi.emi_amount).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {thisMonthEmis.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No EMIs scheduled for this month
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark EMI as Paid</DialogTitle>
            <DialogDescription>
              {selectedEmi && getLoanDetails(selectedEmi.loan_id) && (
                <>
                  {getLoanDetails(selectedEmi.loan_id)?.bank_name} - 
                  EMI #{selectedEmi.emi_month} of {formatCurrency(Number(selectedEmi.emi_amount), "INR")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Auto-Debit">Auto-Debit</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleMarkPaid}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Mark as Paid"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingEmiCard;
