import { useState } from "react";
import { Shield, Calendar, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Policy {
  id: string;
  name: string;
  type: string;
  premium: number;
  renewalDate: string;
  sumAssured: number;
  documents: { year: number; filename: string }[];
}

const policies: Policy[] = [
  {
    id: "1",
    name: "Life Insurance",
    type: "Term",
    premium: 24000,
    renewalDate: "2025-03-15",
    sumAssured: 10000000,
    documents: [
      { year: 2024, filename: "life_insurance_2024.pdf" },
      { year: 2023, filename: "life_insurance_2023.pdf" },
    ],
  },
  {
    id: "2",
    name: "Health Insurance",
    type: "Family Floater",
    premium: 35000,
    renewalDate: "2025-02-01",
    sumAssured: 1000000,
    documents: [
      { year: 2024, filename: "health_2024.pdf" },
    ],
  },
  {
    id: "3",
    name: "Vehicle Insurance",
    type: "Comprehensive",
    premium: 12000,
    renewalDate: "2025-06-20",
    sumAssured: 800000,
    documents: [],
  },
];

const premiumHistory = [
  { year: 2024, amount: 71000 },
  { year: 2023, amount: 65000 },
  { year: 2022, amount: 58000 },
  { year: 2021, amount: 52000 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const getDaysUntilRenewal = (dateStr: string) => {
  const renewal = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const Insurance = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

  const totalPremium = policies.reduce((acc, p) => acc + p.premium, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Insurance</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your policies and documents</p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Policies</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{policies.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Annual Premium</p>
          <p className="text-3xl font-semibold text-vyom-accent mt-2">{formatCurrency(totalPremium)}</p>
        </div>
      </div>

      {/* Policy Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Policies</h2>
        {policies.map((policy) => {
          const daysUntil = getDaysUntilRenewal(policy.renewalDate);
          const isExpiringSoon = daysUntil <= 30;
          const isSelected = selectedPolicy === policy.id;

          return (
            <div key={policy.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setSelectedPolicy(isSelected ? null : policy.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-vyom-accent-soft flex items-center justify-center">
                      <Shield className="w-5 h-5 text-vyom-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-foreground">{policy.name}</h3>
                      <p className="text-xs text-muted-foreground">{policy.type}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs",
                    isExpiringSoon 
                      ? "bg-vyom-warning/10 text-vyom-warning"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Calendar className="w-3 h-3" />
                    {daysUntil} days
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(policy.sumAssured)}</p>
                    <p className="text-xs text-muted-foreground">Sum Assured</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(policy.premium)}</p>
                    <p className="text-xs text-muted-foreground">Premium</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{policy.renewalDate}</p>
                    <p className="text-xs text-muted-foreground">Renewal</p>
                  </div>
                </div>
              </div>

              {/* Expanded Documents Section */}
              {isSelected && (
                <div className="p-6 pt-0">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </h4>
                    {policy.documents.length > 0 ? (
                      <div className="space-y-2">
                        {policy.documents.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{doc.year}</span>
                            <span className="text-foreground">{doc.filename}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                    <Button variant="vyom" size="sm" className="mt-4 w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Premium History */}
      <section className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Premium History
        </h3>
        <div className="flex items-end gap-4 h-32">
          {premiumHistory.map((item) => {
            const maxAmount = Math.max(...premiumHistory.map(p => p.amount));
            const height = (item.amount / maxAmount) * 100;
            return (
              <div key={item.year} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-vyom-accent rounded-t transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-muted-foreground">{item.year}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Insurance;
