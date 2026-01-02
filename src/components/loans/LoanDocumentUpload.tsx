import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, FileText, Check, X, Loader2 } from "lucide-react";
import { LoanFormData } from "./AddLoanForm";

interface ParsedLoanData {
  bank_name?: string;
  loan_account_number?: string;
  principal_amount?: number;
  interest_rate?: number;
  tenure_months?: number;
  emi_amount?: number;
  start_date?: string;
}

interface LoanDocumentUploadProps {
  onDataExtracted: (data: Partial<LoanFormData>) => void;
  loanId?: string;
}

export const LoanDocumentUpload = ({ onDataExtracted, loanId }: LoanDocumentUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedLoanData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or image file", variant: "destructive" });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(filePath);

      setUploadedUrl(urlData.publicUrl);
      setUploading(false);
      
      // Parse the document
      setParsing(true);
      await parseDocument(file);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", variant: "destructive" });
      setUploading(false);
    }
  };

  const parseDocument = async (file: File) => {
    try {
      // For now, we'll use a simple text extraction approach
      // In a production app, this would call an OCR service
      const text = await extractTextFromFile(file);
      
      // Parse extracted text for loan details
      const extracted = parseExtractedText(text);
      setParsedData(extracted);
      
      toast({ title: "Document parsed", description: "Review the extracted data below" });
    } catch (error) {
      console.error("Parse error:", error);
      toast({ title: "Parsing failed", description: "Could not extract data from document", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    // For images and PDFs, we'll need OCR - for now return placeholder
    // In production, integrate with Tesseract.js or a cloud OCR service
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') {
        // PDF files would need pdf.js or server-side extraction
        resolve("");
      } else {
        // For demo, return empty - in production use Tesseract.js
        resolve("");
      }
    });
  };

  const parseExtractedText = (text: string): ParsedLoanData => {
    const data: ParsedLoanData = {};
    
    // Bank name patterns
    const bankPatterns = [
      /(?:State Bank of India|SBI)/i,
      /(?:HDFC Bank|HDFC)/i,
      /(?:ICICI Bank|ICICI)/i,
      /(?:Axis Bank)/i,
      /(?:Punjab National Bank|PNB)/i,
      /(?:Bank of Baroda)/i,
      /(?:Kotak Mahindra Bank|Kotak)/i,
      /(?:IDFC First Bank|IDFC)/i,
      /(?:Yes Bank)/i,
      /(?:IndusInd Bank)/i,
    ];

    for (const pattern of bankPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.bank_name = match[0];
        break;
      }
    }

    // Loan account number (10-18 digits)
    const accountMatch = text.match(/\b(\d{10,18})\b/);
    if (accountMatch) {
      data.loan_account_number = accountMatch[1];
    }

    // Principal amount
    const principalPatterns = [
      /(?:Loan Amount|Principal|Sanctioned Amount)[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+)/i,
      /(?:Rs\.?|₹|INR)\s*([\d,]+)\s*(?:Lakhs?|Lacs?)/i,
    ];
    for (const pattern of principalPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(/,/g, ''));
        if (text.toLowerCase().includes('lakh') || text.toLowerCase().includes('lac')) {
          amount *= 100000;
        }
        data.principal_amount = amount;
        break;
      }
    }

    // Interest rate
    const rateMatch = text.match(/(\d+\.?\d*)\s*%\s*(?:p\.?a\.?|per annum)/i);
    if (rateMatch) {
      data.interest_rate = parseFloat(rateMatch[1]);
    }

    // Tenure
    const tenureMatch = text.match(/(\d+)\s*(?:months?|mths?)/i);
    if (tenureMatch) {
      data.tenure_months = parseInt(tenureMatch[1]);
    }

    // EMI amount
    const emiMatch = text.match(/EMI[:\s]*(?:Rs\.?|₹|INR)?\s*([\d,]+)/i);
    if (emiMatch) {
      data.emi_amount = parseFloat(emiMatch[1].replace(/,/g, ''));
    }

    return data;
  };

  const handleApprove = () => {
    if (parsedData) {
      onDataExtracted({
        bank_name: parsedData.bank_name,
        loan_account_number: parsedData.loan_account_number,
        principal_amount: parsedData.principal_amount,
        interest_rate: parsedData.interest_rate,
        tenure_months: parsedData.tenure_months,
        emi_amount: parsedData.emi_amount,
        start_date: parsedData.start_date,
      });
      toast({ title: "Data applied to form" });
      setParsedData(null);
      setFileName(null);
    }
  };

  const handleReject = () => {
    setParsedData(null);
    setFileName(null);
    toast({ title: "Extracted data discarded" });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Document Upload
        </CardTitle>
        <CardDescription className="text-xs">
          Upload loan agreement or bank statement to auto-extract details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!fileName ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-2 h-20 hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || parsing}
          >
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upload PDF or Image
              </span>
            </div>
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{fileName}</span>
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {parsing && <span className="text-xs text-muted-foreground">Parsing...</span>}
            </div>

            {parsedData && Object.keys(parsedData).length > 0 && (
              <div className="space-y-3 p-3 bg-accent/30 rounded-lg">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Extracted Data (Review before applying)
                </p>
                <div className="space-y-2 text-sm">
                  {parsedData.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span>{parsedData.bank_name}</span>
                    </div>
                  )}
                  {parsedData.loan_account_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span>{parsedData.loan_account_number}</span>
                    </div>
                  )}
                  {parsedData.principal_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span>₹{parsedData.principal_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {parsedData.interest_rate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate:</span>
                      <span>{parsedData.interest_rate}% p.a.</span>
                    </div>
                  )}
                  {parsedData.tenure_months && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span>{parsedData.tenure_months} months</span>
                    </div>
                  )}
                  {parsedData.emi_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EMI:</span>
                      <span>₹{parsedData.emi_amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleReject}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Discard
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={handleApprove}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            )}

            {parsedData && Object.keys(parsedData).length === 0 && !parsing && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No data could be extracted. Please enter details manually.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
