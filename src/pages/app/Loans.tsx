import TrendChart from "@/components/dashboard/TrendChart";
import { Wallet } from "lucide-react";

interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyEmi: number;
  interestRate: number;
  nextDueDate: string;
}

const loans: Loan[] = [
  {
    id: "1",
    name: "Home Loan",
    totalAmount: 5000000,
    remainingAmount: 3200000,
    monthlyEmi: 42000,
    interestRate: 8.5,
    nextDueDate: "2025-01-05",
  },
  {
    id: "2",
    name: "Car Loan",
    totalAmount: 800000,
    remainingAmount: 320000,
    monthlyEmi: 18500,
    interestRate: 9.2,
    nextDueDate: "2025-01-10",
  },
];

const principalTrend = [
  { name: "Jul", value: 3800000 },
  { name: "Aug", value: 3700000 },
  { name: "Sep", value: 3600000 },
  { name: "Oct", value: 3500000 },
  { name: "Nov", value: 3400000 },
  { name: "Dec", value: 3200000 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const Loans = () => {
  const totalRemaining = loans.reduce((acc, loan) => acc + loan.remainingAmount, 0);
  const totalEmi = loans.reduce((acc, loan) => acc + loan.monthlyEmi, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Loans & EMI</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your debt and payments</p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Outstanding</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly EMI</p>
          <p className="text-3xl font-semibold text-vyom-accent mt-2">{formatCurrency(totalEmi)}</p>
        </div>
      </div>

      {/* Loan Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Loans</h2>
        {loans.map((loan) => {
          const progress = ((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100;
          return (
            <div key={loan.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-vyom-accent-soft flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-vyom-accent" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground">{loan.name}</h3>
                    <p className="text-xs text-muted-foreground">{loan.interestRate}% p.a.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next EMI</p>
                  <p className="text-sm text-foreground">{loan.nextDueDate}</p>
                </div>
              </div>

              {/* Progress Ring (simplified as bar) */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Paid: {formatCurrency(loan.totalAmount - loan.remainingAmount)}</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-vyom-success rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(loan.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(loan.remainingAmount)}</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(loan.monthlyEmi)}</p>
                  <p className="text-xs text-muted-foreground">Monthly EMI</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Principal Reduction Chart */}
      <TrendChart 
        title="Principal Reduction" 
        data={principalTrend}
        color="hsl(150, 30%, 45%)"
      />
    </div>
  );
};

export default Loans;
