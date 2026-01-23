import { useState, useRef, useEffect } from "react";
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
import { 
  Loader2, 
  Upload, 
  Check, 
  X, 
  Camera, 
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Circle,
  AlertCircle
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

interface ExtractedPolicyData {
  policy_name?: string;
  provider?: string;
  policy_number?: string;
  policy_type?: string;
  premium_amount?: string;
  sum_assured?: string;
  start_date?: string;
  renewal_date?: string;
  insured_name?: string;
  premium_frequency?: string;
}

interface PolicyDocumentScannerProps {
  onDataExtracted: (data: ExtractedPolicyData & { document_url?: string }) => void;
}

type ProcessStep = 'idle' | 'uploading' | 'converting' | 'scanning' | 'extracting' | 'review' | 'complete';

const PROCESS_STEPS = [
  { id: 'uploading', label: 'Uploading' },
  { id: 'converting', label: 'Processing' },
  { id: 'scanning', label: 'Scanning' },
  { id: 'extracting', label: 'Extracting' },
  { id: 'review', label: 'Review' },
];

const PolicyDocumentScanner = ({ onDataExtracted }: PolicyDocumentScannerProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessStep>('idle');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPolicyData | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
      setIsMobileOrTablet(isMobile || isTablet);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Read file as ArrayBuffer safely (clone to avoid detached buffer issues)
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          // Clone the ArrayBuffer to prevent "detached" issues
          const cloned = reader.result.slice(0);
          resolve(cloned);
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Convert PDF page to image using canvas
  const convertPdfPageToImage = async (pdfData: ArrayBuffer, pageNum: number = 1): Promise<Blob> => {
    // Clone the buffer to prevent detached issues
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    const page = await pdf.getPage(pageNum);
    
    // Use higher scale for better OCR quality
    const scale = 2.5;
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert PDF to image'));
        }
      }, 'image/png', 1.0);
    });
  };

  // Extract text from ALL PDF pages (not just first 5)
  const extractTextFromPdf = async (pdfData: ArrayBuffer): Promise<string> => {
    // Clone the buffer to prevent detached issues
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    let fullText = '';
    
    // Process ALL pages - insurance docs can have important info on any page
    const totalPages = pdf.numPages;
    console.log(`Processing ${totalPages} PDF pages...`);
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += `--- Page ${i} ---\n` + pageText + '\n\n';
    }
    
    console.log(`Extracted ${fullText.length} characters from ${totalPages} pages`);
    return fullText;
  };

  // OCR all PDF pages for better extraction
  const ocrAllPdfPages = async (pdfData: ArrayBuffer, onProgress: (progress: number) => void): Promise<string> => {
    const dataClone = pdfData.slice(0);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(dataClone) }).promise;
    const totalPages = Math.min(pdf.numPages, 8); // Limit to first 8 pages for performance
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

  const extractPolicyDetails = (text: string): ExtractedPolicyData => {
    const data: ExtractedPolicyData = {};
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const fullText = text.toLowerCase();

    // Enhanced Policy Number patterns for Indian insurers
    const policyPatterns = [
      /policy\s*(?:no|number|#|id)[:\s.]*([A-Z0-9\-\/]{6,})/i,
      /certificate\s*(?:no|number)[:\s.]*([A-Z0-9\-\/]{6,})/i,
      /(?:policy|certificate)[:\s]*([A-Z]{2,}\d{10,})/i,
      /(?:member\s*id|uhid)[:\s.]*([A-Z0-9\-\/]+)/i,
      /registration\s*(?:no|number)[:\s.]*([A-Z0-9\-\/]+)/i,
      /proposal\s*(?:no|number)[:\s.]*([A-Z0-9\-\/]+)/i,
    ];
    for (const pattern of policyPatterns) {
      const match = text.match(pattern);
      if (match && match[1].length >= 6) {
        data.policy_number = match[1].trim().toUpperCase();
        break;
      }
    }

    // Enhanced Provider/Company patterns - especially for Care Health
    const providerPatterns = [
      /(Care\s*Health\s*Insurance)/i,
      /(Religare\s*Health\s*Insurance)/i,
      /(?:insurer|company|provider|underwritten\s*by)[:\s]*([A-Za-z\s]+(?:Insurance|Assurance|Life|Health))/i,
      /(ICICI\s*(?:Prudential|Lombard)[\s\w]*(?:Insurance|Life|Health)?)/i,
      /(HDFC\s*(?:Life|Ergo)[\s\w]*(?:Insurance)?)/i,
      /(SBI\s*(?:Life|General)[\s\w]*(?:Insurance)?)/i,
      /(LIC\s*(?:of\s*India)?)/i,
      /(Bajaj\s*Allianz[\s\w]*(?:Insurance)?)/i,
      /(Tata\s*AIA[\s\w]*(?:Life)?)/i,
      /(Max\s*(?:Life|Bupa)[\s\w]*(?:Insurance)?)/i,
      /(Star\s*Health[\s\w]*(?:Insurance)?)/i,
      /(Reliance[\s\w]*(?:Insurance|General)?)/i,
      /(New\s*India\s*Assurance)/i,
      /(Oriental\s*Insurance)/i,
      /(United\s*India\s*Insurance)/i,
      /(Niva\s*Bupa[\s\w]*(?:Insurance)?)/i,
      /(Aditya\s*Birla[\s\w]*(?:Insurance|Health)?)/i,
      /(Kotak[\s\w]*(?:Life|General)?)/i,
      /(Acko[\s\w]*(?:Insurance)?)/i,
      /(Digit[\s\w]*(?:Insurance)?)/i,
      /(Go\s*Digit[\s\w]*(?:Insurance)?)/i,
      /(ManipalCigna[\s\w]*(?:Health)?)/i,
      /(Chola\s*MS[\s\w]*(?:Insurance)?)/i,
    ];
    for (const pattern of providerPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.provider = (match[1]?.trim() || match[0].trim()).replace(/\s+/g, ' ');
        break;
      }
    }

    // Enhanced Sum Assured patterns
    const sumPatterns = [
      /sum\s*(?:assured|insured)[:\s]*(?:Rs\.?|INR|₹|Rupees)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?)?/i,
      /(?:coverage|cover|si)\s*(?:amount)?[:\s]*(?:Rs\.?|INR|₹|Rupees)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakhs?|lacs?)?/i,
      /(?:total\s*)?(?:coverage|si|sum\s*insured)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)/i,
      /base\s*(?:si|sum\s*insured)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)/i,
    ];
    for (const pattern of sumPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = match[1].replace(/,/g, '');
        if (/lakhs?|lacs?/i.test(match[0])) {
          amount = String(parseFloat(amount) * 100000);
        }
        data.sum_assured = amount;
        break;
      }
    }

    // Enhanced Premium patterns
    const premiumPatterns = [
      /(?:total\s*)?(?:premium|annual\s*premium)[:\s]*(?:Rs\.?|INR|₹|Rupees)?\s*([\d,]+(?:\.\d+)?)/i,
      /(?:premium\s*(?:amount|payable))[:\s]*(?:Rs\.?|INR|₹|Rupees)?\s*([\d,]+(?:\.\d+)?)/i,
      /(?:gross\s*premium)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)/i,
      /(?:net\s*premium)[:\s]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d+)?)/i,
    ];
    for (const pattern of premiumPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.premium_amount = match[1].replace(/,/g, '');
        break;
      }
    }

    // Premium frequency
    if (/annual|yearly/i.test(fullText)) {
      data.premium_frequency = 'Annual';
    } else if (/half[\s-]?yearly|semi[\s-]?annual/i.test(fullText)) {
      data.premium_frequency = 'Half-Yearly';
    } else if (/quarterly/i.test(fullText)) {
      data.premium_frequency = 'Quarterly';
    } else if (/monthly/i.test(fullText)) {
      data.premium_frequency = 'Monthly';
    }

    // Start date patterns
    const startPatterns = [
      /(?:commencement|start|effective|policy\s*(?:start|from)|risk\s*start|inception)\s*date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(?:from|start|effective)\s*[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /policy\s*period[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s*(?:to|till|-)/i,
    ];
    for (const pattern of startPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.start_date = parseDate(match[1]);
        break;
      }
    }

    // Renewal/Expiry date patterns
    const renewalPatterns = [
      /(?:renewal|expiry|maturity|valid\s*(?:till|upto|until)|policy\s*(?:to|end))\s*(?:date)?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(?:to|till|upto|until)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    ];
    for (const pattern of renewalPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.renewal_date = parseDate(match[1]);
        break;
      }
    }

    // Insured name patterns
    const namePatterns = [
      /(?:insured\s*name|proposer|policy\s*holder|life\s*assured|member\s*name)[:\s]*([A-Z][a-zA-Z\s]{2,40})/i,
      /(?:name\s*of\s*(?:the\s*)?(?:insured|proposer|member))[:\s]*([A-Z][a-zA-Z\s]{2,40})/i,
    ];
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.insured_name = match[1].trim();
        break;
      }
    }

    // Enhanced Policy Type detection
    const typeKeywords: Record<string, RegExp> = {
      'Health': /health|medical|mediclaim|hospitalization|optima|secure|freedom|care\s*(?:advantage|supreme|heart|plus)/i,
      'Term Life': /term\s*(?:life|insurance|plan)|life\s*cover|ismart|saral\s*jeevan/i,
      'Life': /life\s*insurance|endowment|whole\s*life|ulip|money\s*back/i,
      'Car': /motor\s*car|car\s*insurance|private\s*car|comprehensive\s*(?:motor|car)/i,
      'Bike': /two\s*wheeler|bike|motorcycle|scooter/i,
      'Home': /home|house|dwelling|household|property\s*insurance/i,
      'Travel': /travel|overseas|international|trip/i,
      'Critical Illness': /critical\s*illness|cancer|heart\s*care/i,
      'Personal Accident': /personal\s*accident|pa\s*cover|accidental/i,
      'Property': /property|commercial|shop|office|fire\s*insurance/i,
      'Child Plan': /child|education\s*plan|children|sukanya/i,
      'Super Top-up': /super\s*top[\s-]?up|top[\s-]?up/i,
    };
    for (const [type, pattern] of Object.entries(typeKeywords)) {
      if (pattern.test(text)) {
        data.policy_type = type;
        break;
      }
    }

    // Try to extract policy name from meaningful lines
    const policyNamePatterns = [
      /(?:policy|plan|product)\s*(?:name|type)[:\s]*([^\n]{5,60})/i,
      /(?:scheme|product)[:\s]*([^\n]{5,60})/i,
    ];
    for (const pattern of policyNamePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.policy_name = match[1].replace(/[^\w\s\-]/g, '').trim();
        break;
      }
    }

    // Fallback: look for policy name in first meaningful lines
    if (!data.policy_name) {
      for (const line of lines.slice(0, 15)) {
        if (line.length > 10 && line.length < 80 && 
            /(?:policy|plan|scheme|insurance|health|care|optima|secure)/i.test(line) &&
            !/@|www\.|\.com|phone|tel|fax|email|address/i.test(line)) {
          data.policy_name = line.replace(/[^\w\s\-()]/g, '').trim();
          break;
        }
      }
    }

    return data;
  };

  const parseDate = (dateStr: string): string => {
    try {
      let parts: string[] = [];
      
      if (dateStr.includes('/')) {
        parts = dateStr.split('/');
      } else if (dateStr.includes('-')) {
        parts = dateStr.split('-');
      }
      
      if (parts.length === 3) {
        let day = parts[0];
        let month = parts[1];
        let year = parts[2];
        
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1];
          day = parts[2];
        }
        
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    } catch (e) {
      console.error("Date parse error:", e);
    }
    return '';
  };

  const uploadDocument = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('insurance-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('insurance-documents')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support PDF, JPG, PNG, WEBP up to 20MB
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png|webp)$/)) {
      toast.error("Unsupported file type. Use PDF, JPG, PNG, or WEBP.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    // Reset states
    setExtractedData(null);
    setUploadedDocumentUrl(null);
    setErrorMessage(null);
    setOpen(true);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    try {
      // Step 1: Uploading
      setCurrentStep('uploading');
      setProgress(0);
      
      const docUrl = await uploadDocument(file);
      setUploadedDocumentUrl(docUrl);
      setProgress(100);

      let extractedText = '';
      let previewBlob: Blob | null = null;

      if (isPdf) {
        // Step 2: Converting PDF
        setCurrentStep('converting');
        setProgress(0);

        // Read file safely
        const arrayBuffer = await readFileAsArrayBuffer(file);
        
        // First try to extract text directly from PDF
        try {
          extractedText = await extractTextFromPdf(arrayBuffer);
          setProgress(50);
          
          // If text extraction yields good results, skip OCR
          if (extractedText.length > 500) {
            console.log("PDF text extraction successful:", extractedText.substring(0, 500));
            
            // Still convert first page for preview
            previewBlob = await convertPdfPageToImage(arrayBuffer, 1);
            const previewUrlStr = URL.createObjectURL(previewBlob);
            setPreviewUrl(previewUrlStr);
            setProgress(100);
          } else {
            // Text extraction didn't work well, need OCR
            console.log("PDF text extraction insufficient, using OCR...");
            previewBlob = await convertPdfPageToImage(arrayBuffer, 1);
            const previewUrlStr = URL.createObjectURL(previewBlob);
            setPreviewUrl(previewUrlStr);
            setProgress(100);
            extractedText = ''; // Reset to trigger OCR
          }
        } catch (pdfError) {
          console.error("PDF text extraction error:", pdfError);
          // Try converting to image for OCR
          previewBlob = await convertPdfPageToImage(arrayBuffer, 1);
          const previewUrlStr = URL.createObjectURL(previewBlob);
          setPreviewUrl(previewUrlStr);
          setProgress(100);
        }
      } else {
        // For images, create preview directly
        const previewUrlStr = URL.createObjectURL(file);
        setPreviewUrl(previewUrlStr);
        previewBlob = file;
      }

      // Step 3: OCR Scanning (if needed) - now scans ALL pages
      if (!extractedText || extractedText.length < 200) {
        setCurrentStep('scanning');
        setProgress(0);
        
        if (isPdf && previewBlob) {
          // For PDFs, OCR all pages
          const arrayBuffer = await readFileAsArrayBuffer(file);
          extractedText = await ocrAllPdfPages(arrayBuffer, setProgress);
        } else {
          // For images, single OCR
          const result = await Tesseract.recognize(file, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
              }
            },
          });
          extractedText = result.data.text;
        }
      }

      // Step 4: Extracting
      setCurrentStep('extracting');
      setProgress(50);
      
      console.log("Full extracted text:", extractedText);

      const data = extractPolicyDetails(extractedText);
      setExtractedData(data);
      setProgress(100);

      // Step 5: Review
      setCurrentStep('review');

      if (Object.keys(data).length === 0) {
        toast.warning("Could not extract details automatically. Please enter manually.");
      } else {
        const fieldsFound = Object.keys(data).filter(k => data[k as keyof ExtractedPolicyData]);
        toast.success(`Extracted ${fieldsFound.length} fields. Review and confirm.`);
      }
    } catch (error) {
      console.error("Processing error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to process document");
      toast.error("Failed to process document. Please try again.");
      setCurrentStep('idle');
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted({
        ...extractedData,
        document_url: uploadedDocumentUrl || undefined,
      });
      setCurrentStep('complete');
      setTimeout(() => {
        setOpen(false);
        resetState();
        toast.success("Policy details applied to form");
      }, 500);
    }
  };

  const handleCancel = () => {
    resetState();
  };

  const resetState = () => {
    setExtractedData(null);
    setPreviewUrl(null);
    setUploadedDocumentUrl(null);
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

  return (
    <>
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setOpen(true);
            resetState();
          }}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Scan Policy Document
        </Button>
        {isMobileOrTablet && (
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Scan
            </Button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        setOpen(isOpen);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Scan Policy Document
            </DialogTitle>
            <DialogDescription>
              Upload a policy document (PDF, JPG, PNG, WEBP - max 20MB) to auto-extract details
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
                          {status === 'complete' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : status === 'active' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </div>
                        <span className={`text-[10px] mt-1 text-center ${
                          status === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < PROCESS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${
                          getStepStatus(PROCESS_STEPS[index + 1].id) !== 'pending' 
                            ? 'bg-emerald-500' 
                            : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {['uploading', 'converting', 'scanning', 'extracting'].includes(currentStep) && (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {currentStep === 'uploading' ? 'Uploading document...' : 
                       currentStep === 'converting' ? 'Processing PDF...' :
                       currentStep === 'scanning' ? 'Running OCR scan...' : 'Extracting details...'}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {currentStep === 'idle' && (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Policy Document
                  </Button>
                  {isMobileOrTablet && (
                    <Button
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Scan with Camera
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, JPG, PNG, WEBP (max 20MB)
                </p>
              </div>
            )}

            {previewUrl && currentStep === 'review' && (
              <div className="space-y-4">
                <div className="max-h-48 overflow-hidden rounded-lg border border-border relative group">
                  <img 
                    src={previewUrl} 
                    alt="Document preview" 
                    className="w-full h-auto object-contain bg-muted/30"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="gap-1"
                      onClick={() => window.open(previewUrl, '_blank')}
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </Button>
                    {uploadedDocumentUrl && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="gap-1"
                        onClick={() => window.open(uploadedDocumentUrl, '_blank')}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {extractedData && Object.keys(extractedData).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Extracted Details (Editable)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Policy Name</Label>
                        <Input 
                          value={extractedData.policy_name || ''} 
                          onChange={(e) => setExtractedData({...extractedData, policy_name: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter policy name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Provider</Label>
                        <Input 
                          value={extractedData.provider || ''} 
                          onChange={(e) => setExtractedData({...extractedData, provider: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter provider"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Policy Number</Label>
                        <Input 
                          value={extractedData.policy_number || ''} 
                          onChange={(e) => setExtractedData({...extractedData, policy_number: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter policy number"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Policy Type</Label>
                        <Input 
                          value={extractedData.policy_type || ''} 
                          onChange={(e) => setExtractedData({...extractedData, policy_type: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter policy type"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sum Assured (₹)</Label>
                        <Input 
                          value={extractedData.sum_assured || ''} 
                          onChange={(e) => setExtractedData({...extractedData, sum_assured: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter sum assured"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Premium Amount (₹)</Label>
                        <Input 
                          value={extractedData.premium_amount || ''} 
                          onChange={(e) => setExtractedData({...extractedData, premium_amount: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Enter premium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input 
                          type="date"
                          value={extractedData.start_date || ''} 
                          onChange={(e) => setExtractedData({...extractedData, start_date: e.target.value})}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Renewal Date</Label>
                        <Input 
                          type="date"
                          value={extractedData.renewal_date || ''} 
                          onChange={(e) => setExtractedData({...extractedData, renewal_date: e.target.value})}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleConfirm} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Apply to Form
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {extractedData && Object.keys(extractedData).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Could not extract details from this document.</p>
                    <p className="text-xs mt-1">Please enter the policy details manually.</p>
                    <Button variant="outline" onClick={handleCancel} className="mt-3">
                      Try Another Document
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PolicyDocumentScanner;
