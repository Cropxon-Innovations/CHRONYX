import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  CheckCircle2,
  Shield,
  Clock,
  IndianRupee,
  Sparkles,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Loader2,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { downloadTaxPDF } from "./TaxPDFGenerator";

interface TaxFilingOptionsProps {
  calculation: any;
  financialYear: string;
  regime: string;
  grossIncome: number;
  deductions: Record<string, number>;
  onClose?: () => void;
}

export function TaxFilingOptions({
  calculation,
  financialYear,
  regime,
  grossIncome,
  deductions,
  onClose
}: TaxFilingOptionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAssisted, setShowAssisted] = useState(false);

  const totalTax = calculation?.total_tax_liability || 0;
  const chronxyFee = Math.max(Math.min(Math.round(totalTax * 0.05), 2500), 999);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      await downloadTaxPDF({
        financial_year: financialYear,
        regime,
        gross_income: grossIncome,
        deductions,
        ...calculation,
      });
      toast.success("Tax computation PDF downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">Ready to File Your Return</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to proceed with your {financialYear.replace('_', ' ').replace('FY', 'FY ')} tax filing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Self Filing Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative h-full border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">DIY</Badge>
                <span className="text-lg font-bold text-emerald-600">FREE</span>
              </div>
              <CardTitle className="text-lg mt-2">Self Filing</CardTitle>
              <CardDescription className="text-xs">
                Download your computation and file on the Income Tax Portal yourself
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {[
                  "Download tax computation PDF",
                  "Pre-filled ITR form data (JSON)",
                  "Step-by-step filing guide",
                  "Validation checklist",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="space-y-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download Computation PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open('https://www.incometax.gov.in/iec/foportal/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to IT Portal
                </Button>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-xs text-muted-foreground">
                You'll need to file the return yourself on the official portal
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Chronyx Assisted Filing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative h-full border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground gap-1">
                <Sparkles className="w-3 h-3" />
                Recommended
              </Badge>
            </div>
            <CardHeader className="pb-3 pt-6">
              <div className="flex items-center justify-between">
                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 text-xs">
                  Assisted
                </Badge>
                <span className="text-lg font-bold text-primary">{formatCurrency(chronxyFee)}</span>
              </div>
              <CardTitle className="text-lg mt-2">Chronyx Filing</CardTitle>
              <CardDescription className="text-xs">
                Let our experts handle your complete tax filing process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {[
                  "Expert review of your computation",
                  "ITR preparation & validation",
                  "E-filing on your behalf",
                  "Acknowledgement delivery",
                  "Post-filing support",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Turnaround</span>
                </div>
                <span className="font-medium">24-48 hours</span>
              </div>

              <Button
                onClick={() => setShowAssisted(true)}
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                <Shield className="w-4 h-4" />
                File with Chronyx
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-xs text-muted-foreground">
                5% of tax or minimum ₹999 • Includes all verification
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your Tax Liability</p>
              <p className="text-2xl font-bold">{formatCurrency(totalTax)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Effective Rate</p>
              <p className="text-xl font-semibold">
                {grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assisted Filing Dialog */}
      <Dialog open={showAssisted} onOpenChange={setShowAssisted}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Chronyx Assisted Filing
            </DialogTitle>
            <DialogDescription>
              Our tax experts will file your return securely
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Filing Fee</span>
                <span className="font-semibold">{formatCurrency(chronxyFee)}</span>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Secure filing via DSC or OTP</p>
                <p>• Full compliance check included</p>
                <p>• Acknowledgement sent to your email</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs">
                This feature is coming soon. For now, please download your computation and file through the IT portal.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAssisted(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button 
                onClick={() => {
                  toast.info("Assisted filing coming soon! Download PDF for now.");
                  setShowAssisted(false);
                }} 
                className="flex-1 gap-2"
                disabled
              >
                <FileCheck className="w-4 h-4" />
                Coming Soon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaxFilingOptions;
