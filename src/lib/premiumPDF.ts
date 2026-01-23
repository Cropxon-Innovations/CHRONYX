/**
 * CHRONYX Premium PDF Generator
 * Consistent Apple-grade PDF styling across all modules
 * Brand: CHRONYX BY ORIGINX LABS
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ============= BRAND CONSTANTS =============
export const BRAND = {
  name: "CHRONYX",
  company: "OriginX Labs Pvt. Ltd.",
  tagline: "CHRONYX BY ORIGINX LABS",
  website: "originxlabs.com",
  founder: {
    name: "Abhishek Panda",
    title: "Founder & CEO",
  },
  director: {
    name: "Namrata Sahoo",
    title: "Managing Director",
  },
};

// ============= COLORS (RGB) =============
export const PDF_COLORS = {
  // Primary brand colors
  primary: [15, 23, 42] as [number, number, number],       // Dark blue/black
  secondary: [99, 102, 241] as [number, number, number],   // Indigo
  accent: [139, 92, 246] as [number, number, number],      // Purple
  
  // Text colors
  title: [15, 23, 42] as [number, number, number],
  heading: [30, 41, 59] as [number, number, number],
  body: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [148, 163, 184] as [number, number, number],
  
  // UI colors
  divider: [226, 232, 240] as [number, number, number],
  cardBg: [248, 250, 252] as [number, number, number],
  cardBorder: [203, 213, 225] as [number, number, number],
  
  // Status colors
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  
  // Watermark
  watermark: [200, 200, 200] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
};

// ============= TYPOGRAPHY =============
export const PDF_TYPOGRAPHY = {
  hero: { size: 28, weight: "bold" },
  title: { size: 20, weight: "bold" },
  sectionHeading: { size: 14, weight: "bold" },
  subheading: { size: 12, weight: "bold" },
  body: { size: 11, weight: "normal" },
  small: { size: 9, weight: "normal" },
  meta: { size: 8, weight: "normal" },
  watermark: { size: 60, weight: "bold" },
};

// ============= MARGINS =============
export const PDF_MARGINS = {
  left: 25,
  right: 25,
  top: 25,
  bottom: 35,
};

// ============= HELPER FUNCTIONS =============

/**
 * Create a new PDF document with consistent settings
 */
export const createPremiumPDF = (orientation: "portrait" | "landscape" = "portrait") => {
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });
  return pdf;
};

/**
 * Add premium header with CHRONYX branding
 */
export const addPremiumHeader = (
  pdf: jsPDF,
  title: string,
  subtitle?: string,
  documentId?: string
): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPos = PDF_MARGINS.top;

  // Dark header band
  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.rect(0, 0, pageWidth, 45, "F");

  // Accent line
  pdf.setFillColor(...PDF_COLORS.secondary);
  pdf.rect(0, 45, pageWidth, 3, "F");

  // Brand name - CHRONYX
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CHRONYX", PDF_MARGINS.left, 20);

  // Document title
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(200, 200, 200);
  pdf.text(title.toUpperCase(), PDF_MARGINS.left, 30);

  // Subtitle or Document ID
  if (subtitle) {
    pdf.setFontSize(9);
    pdf.text(subtitle, PDF_MARGINS.left, 38);
  }

  // Right side - Date and Document ID
  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  const dateStr = format(new Date(), "dd MMMM yyyy");
  pdf.text(dateStr, pageWidth - PDF_MARGINS.right, 20, { align: "right" });

  if (documentId) {
    pdf.setFontSize(8);
    pdf.text(`ID: ${documentId}`, pageWidth - PDF_MARGINS.right, 28, { align: "right" });
  }

  return 60; // Return Y position after header
};

/**
 * Add CHRONYX watermark to page
 */
export const addWatermark = (pdf: jsPDF, text = "CHRONYX", opacity = 0.08) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(PDF_TYPOGRAPHY.watermark.size);
  pdf.setTextColor(...PDF_COLORS.watermark);
  pdf.text(text, pageWidth / 2, pageHeight / 2, {
    align: "center",
    angle: 45,
  });
};

/**
 * Add confidential watermark
 */
export const addConfidentialWatermark = (pdf: jsPDF) => {
  addWatermark(pdf, "CONFIDENTIAL", 0.1);
};

/**
 * Add premium footer with signatures and branding
 */
export const addPremiumFooter = (
  pdf: jsPDF,
  pageNumber: number,
  totalPages?: number,
  includeSignatures = true
): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerY = pageHeight - PDF_MARGINS.bottom;

  // Divider line
  pdf.setDrawColor(...PDF_COLORS.divider);
  pdf.setLineWidth(0.5);
  pdf.line(PDF_MARGINS.left, footerY, pageWidth - PDF_MARGINS.right, footerY);

  // Signatures section (if included)
  if (includeSignatures) {
    const sigY = footerY + 5;
    const leftSigX = PDF_MARGINS.left + 20;
    const rightSigX = pageWidth - PDF_MARGINS.right - 60;

    // Left signature - CEO
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text("Digitally Verified by", leftSigX, sigY);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.text(BRAND.founder.name, leftSigX, sigY + 5);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(BRAND.founder.title, leftSigX, sigY + 9);

    // Right signature - MD
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.text("Authorized by", rightSigX, sigY);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.text(BRAND.director.name, rightSigX, sigY + 5);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(BRAND.director.title, rightSigX, sigY + 9);
  }

  // Bottom branding
  const brandY = pageHeight - 10;

  // Left - Company info
  pdf.setFontSize(7);
  pdf.setTextColor(...PDF_COLORS.muted);
  pdf.setFont("helvetica", "normal");
  pdf.text(BRAND.tagline, PDF_MARGINS.left, brandY);
  pdf.text(BRAND.company, PDF_MARGINS.left, brandY + 3);

  // Center - Page number
  const pageText = totalPages 
    ? `Page ${pageNumber} of ${totalPages}` 
    : `Page ${pageNumber}`;
  pdf.text(pageText, pageWidth / 2, brandY, { align: "center" });

  // Right - Generation info
  pdf.text("Generated on " + format(new Date(), "dd/MM/yyyy HH:mm"), pageWidth - PDF_MARGINS.right, brandY, { align: "right" });
  pdf.text("Secure Digital Document", pageWidth - PDF_MARGINS.right, brandY + 3, { align: "right" });
};

/**
 * Add a section heading with accent line
 */
export const addSectionHeading = (
  pdf: jsPDF,
  text: string,
  yPos: number,
  color = PDF_COLORS.secondary
): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Accent bar
  pdf.setFillColor(...color);
  pdf.rect(PDF_MARGINS.left, yPos - 2, 4, 12, "F");

  // Heading text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(PDF_TYPOGRAPHY.sectionHeading.size);
  pdf.setTextColor(...PDF_COLORS.heading);
  pdf.text(text, PDF_MARGINS.left + 8, yPos + 6);

  return yPos + 18;
};

/**
 * Add an info card with label-value pairs
 */
export const addInfoCard = (
  pdf: jsPDF,
  items: Array<{ label: string; value: string }>,
  yPos: number,
  columns = 2
): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PDF_MARGINS.left - PDF_MARGINS.right;
  const colWidth = contentWidth / columns;
  const itemHeight = 18;

  let currentY = yPos;
  let col = 0;

  items.forEach((item, index) => {
    const x = PDF_MARGINS.left + (col * colWidth);

    // Background
    pdf.setFillColor(...PDF_COLORS.cardBg);
    pdf.roundedRect(x, currentY, colWidth - 4, itemHeight - 2, 2, 2, "F");

    // Label
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(item.label, x + 4, currentY + 6);

    // Value
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.text(item.value, x + 4, currentY + 13);

    col++;
    if (col >= columns) {
      col = 0;
      currentY += itemHeight;
    }
  });

  // Return final Y position
  return currentY + (col > 0 ? itemHeight : 0);
};

/**
 * Add a professional table with autoTable
 */
export const addPremiumTable = (
  pdf: jsPDF,
  head: string[][],
  body: string[][],
  yPos: number,
  options?: {
    headColor?: [number, number, number];
    alternateRows?: boolean;
  }
): number => {
  const { headColor = PDF_COLORS.secondary, alternateRows = true } = options || {};

  autoTable(pdf, {
    startY: yPos,
    head,
    body,
    theme: alternateRows ? "striped" : "plain",
    headStyles: {
      fillColor: headColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: PDF_COLORS.body,
    },
    alternateRowStyles: alternateRows ? {
      fillColor: PDF_COLORS.cardBg,
    } : undefined,
    margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
    styles: {
      lineColor: PDF_COLORS.divider,
      lineWidth: 0.1,
    },
  });

  return (pdf as any).lastAutoTable.finalY + 10;
};

/**
 * Add amount in INR format with styling
 */
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Add summary box with total
 */
export const addSummaryBox = (
  pdf: jsPDF,
  label: string,
  value: string,
  yPos: number,
  color = PDF_COLORS.secondary
): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const boxWidth = 80;
  const boxX = pageWidth - PDF_MARGINS.right - boxWidth;

  // Box background
  pdf.setFillColor(...color);
  pdf.roundedRect(boxX, yPos, boxWidth, 20, 3, 3, "F");

  // Label
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(label, boxX + 5, yPos + 7);

  // Value
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(value, boxX + 5, yPos + 16);

  return yPos + 28;
};

/**
 * Check if new page needed
 */
export const needsNewPage = (
  pdf: jsPDF,
  yPos: number,
  requiredSpace = 30
): boolean => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  return yPos + requiredSpace > pageHeight - PDF_MARGINS.bottom;
};

/**
 * Generate document ID
 */
export const generateDocumentId = (prefix = "CRX"): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Save PDF with branded filename
 */
export const savePremiumPDF = (
  pdf: jsPDF,
  baseName: string,
  includeDate = true
): string => {
  const sanitizedName = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateStr = includeDate ? `-${format(new Date(), "yyyy-MM-dd")}` : "";
  const fileName = `chronyx-${sanitizedName}${dateStr}.pdf`;
  pdf.save(fileName);
  return fileName;
};
