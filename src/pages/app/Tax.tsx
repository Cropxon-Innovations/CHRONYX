import { TaxWizard } from "@/components/tax/TaxWizard";
import { TaxLegalDisclaimer } from "@/components/tax/TaxLegalDisclaimer";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Calendar } from "lucide-react";

const Tax = () => {
  // Get current FY label
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const fyLabel = currentMonth >= 3 
    ? `FY ${currentYear}-${(currentYear + 1).toString().slice(-2)}` 
    : `FY ${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light text-foreground tracking-wide">
              Tax Dashboard
            </h1>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-violet-500/10 text-violet-500 border-violet-500/30">
              <FlaskConical className="w-2.5 h-2.5 mr-0.5" />
              BETA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {fyLabel} • Indian Income Tax Calculator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Calendar className="w-3 h-3" />
            {fyLabel}
          </Badge>
        </div>
      </header>

      {/* Step-by-Step Tax Wizard */}
      <TaxWizard />

      {/* Legal Disclaimer */}
      <TaxLegalDisclaimer />
    </div>
  );
};

export default Tax;
