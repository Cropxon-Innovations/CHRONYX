import { AlertTriangle, Info, Shield, Scale, FileCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TaxLegalDisclaimerProps {
  variant?: "minimal" | "full" | "comprehensive";
}

export function TaxLegalDisclaimer({ variant = "minimal" }: TaxLegalDisclaimerProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-start gap-2 p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          TAXYN provides tax <strong>estimates</strong> for informational purposes only. 
          Final responsibility lies with the taxpayer. Consult a qualified CA for complex cases.
        </p>
      </div>
    );
  }

  if (variant === "comprehensive") {
    return (
      <div className="space-y-4">
        <Alert className="bg-amber-500/5 border-amber-500/20">
          <Shield className="w-4 h-4 text-amber-600" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">Legal Disclaimer & Compliance Notice</AlertTitle>
          <AlertDescription className="text-xs text-amber-600/80 dark:text-amber-300/70 mt-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="platform" className="border-amber-500/20">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-3 h-3" />
                    Platform Classification
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs space-y-2">
                  <p>TAXYN by CHRONYX is classified as a <strong>Tax Return Preparation Software</strong> under Indian tax regulations.</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>We are NOT a Chartered Accountant firm</li>
                    <li>We are NOT a Tax Return Intermediary (unless explicitly stated)</li>
                    <li>Calculations are based on publicly available Income Tax Act provisions</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="liability" className="border-amber-500/20">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Scale className="w-3 h-3" />
                    User Responsibility & Liability
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs space-y-2">
                  <p><strong>Final responsibility of correctness lies with the taxpayer.</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Users must verify all computed values before filing</li>
                    <li>TAXYN is not liable for penalties, interest, or losses from incorrect filing</li>
                    <li>Complex cases (business income, capital gains, foreign income) require CA review</li>
                    <li>All changes are logged for audit trail purposes</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="data" className="border-amber-500/20">
                <AccordionTrigger className="text-xs py-2 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Data Protection & Privacy
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-xs space-y-2">
                  <p>Your tax data is protected with enterprise-grade security:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Encryption at rest and in transit</li>
                    <li>No employee can view raw tax data without audit log</li>
                    <li>Data retained as per statutory requirements</li>
                    <li>Right to delete available post filing period</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span>© {new Date().getFullYear()} ORIGINX LABS PVT. LTD.</span>
          </div>
          <span>India Tax Compliance • IT Act 1961</span>
        </div>
      </div>
    );
  }

  return (
    <Alert className="bg-amber-500/5 border-amber-500/20">
      <Shield className="w-4 h-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-400">Important Disclaimer</AlertTitle>
      <AlertDescription className="text-xs text-amber-600/80 dark:text-amber-300/70 space-y-2 mt-2">
        <p>
          <strong>TAXYN</strong> by CHRONYX provides tax calculations, projections, and informational insights 
          based on user-provided data and publicly available tax rules.
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>TAXYN is <strong>not a Chartered Accountant (CA)</strong> and does not provide legal or professional tax advice.</li>
          <li>Final tax liability may vary based on individual circumstances, documentation, and changes in tax laws.</li>
          <li>Users are advised to consult a qualified tax professional or Chartered Accountant before filing official tax returns.</li>
          <li><strong>Final responsibility of correctness lies with the taxpayer.</strong></li>
        </ul>
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px]">
            © {new Date().getFullYear()} ORIGINX LABS PVT. LTD. • IT Act 1961 Compliant
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}