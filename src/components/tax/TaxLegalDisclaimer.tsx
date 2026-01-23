import { AlertTriangle, Info, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TaxLegalDisclaimerProps {
  variant?: "minimal" | "full";
}

export function TaxLegalDisclaimer({ variant = "minimal" }: TaxLegalDisclaimerProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-start gap-2 p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          CHRONYX provides tax <strong>estimates</strong> for informational purposes only. 
          This is not tax advice. Please consult a qualified CA before filing.
        </p>
      </div>
    );
  }

  return (
    <Alert className="bg-amber-500/5 border-amber-500/20">
      <Shield className="w-4 h-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">Important Disclaimer</AlertTitle>
      <AlertDescription className="text-xs text-amber-600/80 dark:text-amber-300/70 space-y-2 mt-2">
        <p>
          <strong>CHRONYX</strong> provides tax calculations, projections, and informational insights 
          based on user-provided data and publicly available tax rules.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>CHRONYX is <strong>not a Chartered Accountant (CA)</strong> and does not provide legal or professional tax advice.</li>
          <li>Final tax liability may vary based on individual circumstances, documentation, and changes in tax laws.</li>
          <li>Users are advised to consult a qualified tax professional or Chartered Accountant before filing official tax returns.</li>
          <li>CHRONYX does <strong>not file returns</strong> on behalf of users.</li>
        </ul>
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px]">
            © {new Date().getFullYear()} ORIGINX LABS PVT. LTD. • India-compliant
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}