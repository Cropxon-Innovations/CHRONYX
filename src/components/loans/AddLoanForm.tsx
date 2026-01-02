import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { INDIAN_BANKS, US_BANKS, LOAN_TYPES, REPAYMENT_MODES } from "./BankLogos";

interface AddLoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LoanFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<LoanFormData>;
  mode?: "add" | "edit";
}

export interface LoanFormData {
  country: string;
  bank_name: string;
  bank_logo_url?: string;
  loan_account_number: string;
  loan_type: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  start_date: string;
  repayment_mode: string;
  notes?: string;
}

// Calculate EMI using standard formula
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export const AddLoanForm = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
  mode = "add",
}: AddLoanFormProps) => {
  const [country, setCountry] = useState(initialData?.country || "India");
  const [bankName, setBankName] = useState(initialData?.bank_name || "");
  const [customBank, setCustomBank] = useState("");
  const [loanAccountNumber, setLoanAccountNumber] = useState(initialData?.loan_account_number || "");
  const [loanType, setLoanType] = useState(initialData?.loan_type || "Home");
  const [principal, setPrincipal] = useState(initialData?.principal_amount?.toString() || "");
  const [interestRate, setInterestRate] = useState(initialData?.interest_rate?.toString() || "");
  const [tenure, setTenure] = useState(initialData?.tenure_months?.toString() || "");
  const [emiAmount, setEmiAmount] = useState(initialData?.emi_amount?.toString() || "");
  const [emiOverride, setEmiOverride] = useState(false);
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split("T")[0]);
  const [repaymentMode, setRepaymentMode] = useState(initialData?.repayment_mode || "Auto Debit");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const banks = country === "India" ? INDIAN_BANKS : US_BANKS;

  // Auto-calculate EMI when inputs change
  useEffect(() => {
    if (!emiOverride && principal && interestRate && tenure) {
      const p = parseFloat(principal);
      const r = parseFloat(interestRate);
      const t = parseInt(tenure);
      if (p > 0 && r >= 0 && t > 0) {
        const calculatedEmi = calculateEMI(p, r, t);
        setEmiAmount(calculatedEmi.toFixed(2));
      }
    }
  }, [principal, interestRate, tenure, emiOverride]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBankName = bankName === "custom" ? customBank : bankName;
    
    onSubmit({
      country,
      bank_name: finalBankName,
      loan_account_number: loanAccountNumber,
      loan_type: loanType,
      principal_amount: parseFloat(principal),
      interest_rate: parseFloat(interestRate),
      tenure_months: parseInt(tenure),
      emi_amount: parseFloat(emiAmount),
      start_date: startDate,
      repayment_mode: repaymentMode,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-light tracking-wide">
            {mode === "add" ? "Add New Loan" : "Edit Loan"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter loan details exactly as per your bank statement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Country</Label>
            <Select value={country} onValueChange={(v) => { setCountry(v); setBankName(""); }}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Name */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Bank Name</Label>
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {banks.map((bank) => (
                  <SelectItem key={bank.name} value={bank.name}>
                    {bank.fullName}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Other (Custom)</SelectItem>
              </SelectContent>
            </Select>
            {bankName === "custom" && (
              <Input
                placeholder="Enter bank name"
                value={customBank}
                onChange={(e) => setCustomBank(e.target.value)}
                className="mt-2 bg-background border-border"
              />
            )}
          </div>

          {/* Loan Account Number */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Loan Account Number</Label>
            <Input
              placeholder="Enter account number"
              value={loanAccountNumber}
              onChange={(e) => setLoanAccountNumber(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          {/* Loan Type */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Loan Type</Label>
            <Select value={loanType} onValueChange={setLoanType}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {LOAN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Principal Amount */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Principal Amount ({country === "USA" ? "$" : "₹"})
            </Label>
            <Input
              type="number"
              placeholder="500000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="bg-background border-border"
              required
              min="1"
            />
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Annual Interest Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="9.5"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="bg-background border-border"
              required
              min="0"
            />
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Loan Tenure (months)</Label>
            <Input
              type="number"
              placeholder="240"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="bg-background border-border"
              required
              min="1"
            />
          </div>

          {/* EMI Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                EMI Amount ({country === "USA" ? "$" : "₹"})
              </Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={emiOverride}
                  onChange={(e) => setEmiOverride(e.target.checked)}
                  className="rounded border-border"
                />
                Override calculated EMI
              </label>
            </div>
            <Input
              type="number"
              step="0.01"
              placeholder="42000"
              value={emiAmount}
              onChange={(e) => setEmiAmount(e.target.value)}
              className="bg-background border-border"
              required
              disabled={!emiOverride}
            />
            {emiOverride && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Manual EMI override may cause schedule mismatch with bank
              </p>
            )}
          </div>

          {/* EMI Start Date */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">EMI Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border-border"
              required
            />
          </div>

          {/* Repayment Mode */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Repayment Mode</Label>
            <Select value={repaymentMode} onValueChange={setRepaymentMode}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {REPAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Notes (optional)</Label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background border-border resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !bankName || !loanAccountNumber || !principal || !interestRate || !tenure}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {isLoading ? "Saving..." : mode === "add" ? "Add Loan" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
