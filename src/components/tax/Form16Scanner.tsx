import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Upload, 
  Check, 
  X, 
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Building2,
  IndianRupee,
  Calendar,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface ExtractedForm16Data {
  // Personal Details
  employee_name?: string;
  pan?: string;
  employer_name?: string;
  employer_tan?: string;
  assessment_year?: string;
  
  // Salary Components
  basic_salary?: number;
  hra?: number;
  lta?: number;
  special_allowance?: number;
  other_allowances?: number;
  perquisites?: number;
  gross_salary?: number;
  
  // Deductions from Salary
  standard_deduction?: number;
  professional_tax?: number;
  entertainment_allowance?: number;
  
  // Chapter VI-A Deductions
  section_80c?: number;
  section_80ccd_1b?: number;
  section_80d?: number;
  section_80e?: number;
  section_80g?: number;
  section_80tta?: number;
  section_24b?: number;
  hra_exemption?: number;
  
  // TDS Details
  total_tds_deducted?: number;
  tds_q1?: number;
  tds_q2?: number;
  tds_q3?: number;
  tds_q4?: number;
  
  // Computed
  total_income?: number;
  taxable_income?: number;
  confidence_scores?: Record<string, number>;
}

interface Form16ScannerProps {
  onDataExtracted: (data: ExtractedForm16Data) => void;
}

type ProcessStep = 'idle' | 'uploading' | 'converting' | 'scanning' | 'extracting' | 'review' | 'complete';

const PROCESS_STEPS = [
  { id: 'uploading', label: 'Uploading' },
  { id: 'converting', label: 'Processing' },
  { id: 'scanning', label: 'OCR Scan' },
  { id: 'extracting', label: 'Extracting' },
  { id: 'review', label: 'Review' },
];

const Form16Scanner = ({ onDataExtracted }: Form16ScannerProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedForm16Data | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result.slice(0));
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const convertPdfPageToImage = async (pdfData: ArrayBuffer, pageNum: number = 1): Promise<Blob> => {
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    const page = await pdf.getPage(pageNum);
    
    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert PDF to image'));
      }, 'image/png', 1.0);
    });
  };

  const extractTextFromPdf = async (pdfData: ArrayBuffer): Promise<string> => {
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
    }
    
    return fullText;
  };

  const ocrAllPdfPages = async (pdfData: ArrayBuffer, onProgress: (progress: number) => void): Promise<string> => {
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    const totalPages = Math.min(pdf.numPages, 10);
    let fullText = '';
    
    for (let i = 1; i <= totalPages; i++) {
      const pageBlob = await convertPdfPageToImage(pdfData, i);
      const result = await Tesseract.recognize(pageBlob, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pageProgress = ((i - 1) / totalPages + m.progress / totalPages) * 100;
            onProgress(Math.round(pageProgress));
          }
        },
      });
      fullText += `--- Page ${i} ---\n` + result.data.text + '\n\n';
    }
    
    return fullText;
  };

  const extractForm16Details = (text: string): ExtractedForm16Data => {
    const data: ExtractedForm16Data = {};
    const confidence: Record<string, number> = {};
    const fullText = text.toLowerCase();

    // Employee/PAN patterns
    const panMatch = text.match(/PAN\s*(?:of\s*(?:the\s*)?(?:Employee|Deductee))?[:\s]*([A-Z]{5}\d{4}[A-Z])/i);
    if (panMatch) { data.pan = panMatch[1].toUpperCase(); confidence.pan = 0.95; }

    const namePatterns = [
      /(?:Name\s*of\s*(?:the\s*)?Employee|Employee\s*Name)[:\s]*([A-Z][a-zA-Z\s]{3,50})/i,
      /(?:Name\s*of\s*(?:the\s*)?Deductee)[:\s]*([A-Z][a-zA-Z\s]{3,50})/i,
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) { data.employee_name = match[1].trim(); confidence.employee_name = 0.9; break; }
    }

    // Employer details
    const employerPatterns = [
      /(?:Name\s*(?:and\s*)?(?:Address\s*)?of\s*(?:the\s*)?(?:Employer|Deductor))[:\s]*([A-Za-z\s]+(?:Ltd|Limited|Pvt|Private|Inc|Corporation|LLP)?)/i,
      /(?:Employer\s*Name)[:\s]*([A-Za-z\s]+(?:Ltd|Limited|Pvt|Private)?)/i,
    ];
    for (const pattern of employerPatterns) {
      const match = text.match(pattern);
      if (match) { data.employer_name = match[1].trim(); confidence.employer_name = 0.85; break; }
    }

    const tanMatch = text.match(/TAN\s*(?:of\s*(?:the\s*)?(?:Deductor|Employer))?[:\s]*([A-Z]{4}\d{5}[A-Z])/i);
    if (tanMatch) { data.employer_tan = tanMatch[1].toUpperCase(); confidence.employer_tan = 0.95; }

    // Assessment Year
    const ayMatch = text.match(/Assessment\s*Year[:\s]*(\d{4}[-–]\d{2,4})/i);
    if (ayMatch) { data.assessment_year = ayMatch[1]; confidence.assessment_year = 0.95; }

    // Salary Components
    const extractAmount = (patterns: RegExp[]): { value: number; confidence: number } | null => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(amount) && amount > 0) return { value: amount, confidence: 0.8 };
        }
      }
      return null;
    };

    // Gross Salary
    const grossPatterns = [
      /(?:Gross\s*Salary|Total\s*Gross\s*Salary)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:1\.\s*Gross\s*Salary)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const gross = extractAmount(grossPatterns);
    if (gross) { data.gross_salary = gross.value; confidence.gross_salary = gross.confidence; }

    // Basic Salary
    const basicPatterns = [
      /(?:Basic\s*Salary|Basic)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:Salary\s*(?:as\s*per\s*)?(?:section\s*)?17\(1\))[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const basic = extractAmount(basicPatterns);
    if (basic) { data.basic_salary = basic.value; confidence.basic_salary = basic.confidence; }

    // HRA
    const hraPatterns = [
      /(?:House\s*Rent\s*Allowance|HRA)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const hra = extractAmount(hraPatterns);
    if (hra) { data.hra = hra.value; confidence.hra = hra.confidence; }

    // Standard Deduction
    const stdDeductionPatterns = [
      /(?:Standard\s*Deduction)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:Deduction\s*u\/s\s*16\(ia\))[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const stdDeduction = extractAmount(stdDeductionPatterns);
    if (stdDeduction) { data.standard_deduction = stdDeduction.value; confidence.standard_deduction = stdDeduction.confidence; }

    // Professional Tax
    const ptPatterns = [
      /(?:Professional\s*Tax|Tax\s*on\s*Employment)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:Deduction\s*u\/s\s*16\(iii\))[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const pt = extractAmount(ptPatterns);
    if (pt) { data.professional_tax = pt.value; confidence.professional_tax = pt.confidence; }

    // Chapter VI-A Deductions
    const sec80cPatterns = [
      /(?:80C|Section\s*80C)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:Deduction\s*u\/s\s*80C)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const sec80c = extractAmount(sec80cPatterns);
    if (sec80c) { data.section_80c = sec80c.value; confidence.section_80c = sec80c.confidence; }

    const sec80ccd1bPatterns = [
      /(?:80CCD\(1B\)|Section\s*80CCD\s*\(1B\))[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const sec80ccd = extractAmount(sec80ccd1bPatterns);
    if (sec80ccd) { data.section_80ccd_1b = sec80ccd.value; confidence.section_80ccd_1b = sec80ccd.confidence; }

    const sec80dPatterns = [
      /(?:80D|Section\s*80D)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const sec80d = extractAmount(sec80dPatterns);
    if (sec80d) { data.section_80d = sec80d.value; confidence.section_80d = sec80d.confidence; }

    const sec24bPatterns = [
      /(?:24\(b\)|Section\s*24\s*\(b\)|Interest\s*on\s*Housing\s*Loan)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const sec24b = extractAmount(sec24bPatterns);
    if (sec24b) { data.section_24b = sec24b.value; confidence.section_24b = sec24b.confidence; }

    // TDS
    const tdsPatterns = [
      /(?:Total\s*Tax\s*Deducted|TDS\s*Deducted|Tax\s*Deducted\s*at\s*Source)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const tds = extractAmount(tdsPatterns);
    if (tds) { data.total_tds_deducted = tds.value; confidence.total_tds_deducted = tds.confidence; }

    // Total/Taxable Income
    const taxablePatterns = [
      /(?:Total\s*Income|Taxable\s*Income)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
      /(?:Net\s*Taxable\s*Income)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i,
    ];
    const taxable = extractAmount(taxablePatterns);
    if (taxable) { data.taxable_income = taxable.value; confidence.taxable_income = taxable.confidence; }

    data.confidence_scores = confidence;
    return data;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Please upload a PDF file (Form 16)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    setExtractedData(null);
    setErrorMessage(null);
    setOpen(true);

    try {
      setCurrentStep('uploading');
      setProgress(20);

      const arrayBuffer = await readFileAsArrayBuffer(file);

      setCurrentStep('converting');
      setProgress(30);

      let extractedText = await extractTextFromPdf(arrayBuffer);
      setProgress(50);

      // Create preview from first page
      const previewBlob = await convertPdfPageToImage(arrayBuffer, 1);
      setPreviewUrl(URL.createObjectURL(previewBlob));

      // If not enough text, use OCR
      if (extractedText.length < 500) {
        setCurrentStep('scanning');
        extractedText = await ocrAllPdfPages(arrayBuffer, setProgress);
      }

      setCurrentStep('extracting');
      setProgress(90);

      const parsed = extractForm16Details(extractedText);
      setExtractedData(parsed);

      setCurrentStep('review');
      setProgress(100);

    } catch (error) {
      console.error("Form 16 parsing error:", error);
      setErrorMessage("Failed to parse Form 16. Please try again or enter details manually.");
      setCurrentStep('idle');
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setCurrentStep('complete');
      setTimeout(() => {
        setOpen(false);
        resetState();
        toast.success("Form 16 data extracted successfully");
      }, 500);
    }
  };

  const resetState = () => {
    setExtractedData(null);
    setPreviewUrl(null);
    setCurrentStep('idle');
    setProgress(0);
    setErrorMessage(null);
  };

  const getStepStatus = (stepId: string): 'pending' | 'active' | 'complete' => {
    const stepOrder = ['uploading', 'converting', 'scanning', 'extracting', 'review'];
    const stepIndex = stepOrder.indexOf(stepId);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentStep === 'complete') return 'complete';
    if (currentStep === 'idle') return 'pending';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => { setOpen(true); resetState(); }}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Upload Form 16
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); setOpen(isOpen); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Form 16 Parser
            </DialogTitle>
            <DialogDescription>
              Upload your Form 16 PDF to auto-extract salary and tax details
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps */}
          {currentStep !== 'idle' && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between gap-1">
                {PROCESS_STEPS.map((step, index) => {
                  const status = getStepStatus(step.id);
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          status === 'complete' ? 'bg-emerald-500 text-white' :
                          status === 'active' ? 'bg-primary text-primary-foreground animate-pulse' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {status === 'complete' ? <CheckCircle2 className="w-4 h-4" /> :
                           status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                           <Circle className="w-3 h-3" />}
                        </div>
                        <span className={`text-[10px] mt-1 ${status === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < PROCESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${getStepStatus(PROCESS_STEPS[index + 1].id) !== 'pending' ? 'bg-emerald-500' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {['uploading', 'converting', 'scanning', 'extracting'].includes(currentStep) && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {currentStep === 'idle' && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Select Form 16 PDF
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Supports Form 16 Part A & Part B (PDF only, max 20MB)</p>
              </div>
            )}

            {currentStep === 'review' && extractedData && (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Personal Details */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-primary" />
                        Personal & Employer Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Employee Name</Label>
                          <Input 
                            value={extractedData.employee_name || ''} 
                            onChange={(e) => setExtractedData({...extractedData, employee_name: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">PAN</Label>
                          <Input 
                            value={extractedData.pan || ''} 
                            onChange={(e) => setExtractedData({...extractedData, pan: e.target.value.toUpperCase()})}
                            className="h-8 text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Employer</Label>
                          <Input 
                            value={extractedData.employer_name || ''} 
                            onChange={(e) => setExtractedData({...extractedData, employer_name: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Assessment Year</Label>
                          <Input 
                            value={extractedData.assessment_year || ''} 
                            onChange={(e) => setExtractedData({...extractedData, assessment_year: e.target.value})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Salary Components */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <IndianRupee className="w-4 h-4 text-primary" />
                        Salary Components
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Gross Salary</Label>
                          <Input 
                            type="number"
                            value={extractedData.gross_salary || ''} 
                            onChange={(e) => setExtractedData({...extractedData, gross_salary: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Basic Salary</Label>
                          <Input 
                            type="number"
                            value={extractedData.basic_salary || ''} 
                            onChange={(e) => setExtractedData({...extractedData, basic_salary: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">HRA Received</Label>
                          <Input 
                            type="number"
                            value={extractedData.hra || ''} 
                            onChange={(e) => setExtractedData({...extractedData, hra: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Standard Deduction</Label>
                          <Input 
                            type="number"
                            value={extractedData.standard_deduction || ''} 
                            onChange={(e) => setExtractedData({...extractedData, standard_deduction: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chapter VI-A Deductions */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-primary" />
                        Chapter VI-A Deductions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Section 80C</Label>
                          <Input 
                            type="number"
                            value={extractedData.section_80c || ''} 
                            onChange={(e) => setExtractedData({...extractedData, section_80c: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Section 80CCD(1B)</Label>
                          <Input 
                            type="number"
                            value={extractedData.section_80ccd_1b || ''} 
                            onChange={(e) => setExtractedData({...extractedData, section_80ccd_1b: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Section 80D (Health)</Label>
                          <Input 
                            type="number"
                            value={extractedData.section_80d || ''} 
                            onChange={(e) => setExtractedData({...extractedData, section_80d: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Section 24(b) (Home Loan)</Label>
                          <Input 
                            type="number"
                            value={extractedData.section_24b || ''} 
                            onChange={(e) => setExtractedData({...extractedData, section_24b: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TDS */}
                  <Card>
                    <CardContent className="pt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        TDS Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Total TDS Deducted</Label>
                          <Input 
                            type="number"
                            value={extractedData.total_tds_deducted || ''} 
                            onChange={(e) => setExtractedData({...extractedData, total_tds_deducted: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Taxable Income</Label>
                          <Input 
                            type="number"
                            value={extractedData.taxable_income || ''} 
                            onChange={(e) => setExtractedData({...extractedData, taxable_income: parseFloat(e.target.value) || 0})}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleConfirm} className="flex-1 gap-2">
                      <Check className="w-4 h-4" />
                      Apply to Tax Wizard
                    </Button>
                    <Button variant="outline" onClick={resetState} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Form16Scanner;
