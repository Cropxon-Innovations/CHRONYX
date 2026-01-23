/**
 * Professional PDF Export for Notes
 * Premium Apple-grade styling with CHRONYX branding
 */
import jsPDF from "jspdf";
import { NoteData } from "./NoteCard";
import { getNoteTypeConfig } from "./NoteTypeSelector";
import { format } from "date-fns";
import {
  BRAND,
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  PDF_MARGINS,
  generateDocumentId,
} from "@/lib/premiumPDF";

interface PDFExportOptions {
  includeLinkedData?: boolean;
  includeTimestamps?: boolean;
  addWatermark?: boolean;
  hidePrivateMetadata?: boolean;
}

// Extract plain text from TipTap JSON content
const extractPlainText = (node: any): string => {
  if (!node) return "";
  let text = "";

  if (typeof node === "string") return node;

  if (node.type === "heading") {
    text += "\n\n";
  }

  if (node.type === "paragraph") {
    text += "\n";
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    text += "\n";
  }

  if (node.type === "listItem") {
    text += "  • ";
  }

  if (node.type === "taskItem") {
    const checked = node.attrs?.checked ? "☑" : "☐";
    text += `  ${checked} `;
  }

  if (node.type === "blockquote") {
    text += "\n  │ ";
  }

  if (node.type === "horizontalRule") {
    text += "\n───────────\n";
  }

  if (node.text) {
    text += node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child: any) => {
      text += extractPlainText(child);
    });
  }

  return text;
};

// Parse content JSON safely
const parseContentJson = (content: any): any => {
  if (!content) return null;
  if (typeof content === "object") return content;
  try {
    let parsed = JSON.parse(content);
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch {
    return null;
  }
};

export const exportProfessionalPDF = (
  note: NoteData,
  options: PDFExportOptions = {}
) => {
  const {
    includeLinkedData = true,
    includeTimestamps = true,
    addWatermark = false,
    hidePrivateMetadata = false,
  } = options;

  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  const documentId = generateDocumentId("NOTE");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGINS.left - PDF_MARGINS.right;
  let yPos = PDF_MARGINS.top;
  let pageNumber = 1;

  // Helper: Add new page
  const addNewPage = () => {
    addFooter();
    pdf.addPage();
    pageNumber++;
    yPos = PDF_MARGINS.top + 10;
    if (addWatermark) addWatermarkToPage();
  };

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - PDF_MARGINS.bottom - 30) {
      addNewPage();
    }
  };

  // Helper: Add watermark
  const addWatermarkToPage = () => {
    pdf.setFontSize(48);
    pdf.setTextColor(...PDF_COLORS.watermark);
    pdf.text("PRIVATE & CONFIDENTIAL", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
  };

  // Helper: Add premium footer with signatures
  const addFooter = () => {
    const footerY = pageHeight - 35;

    // Divider line
    pdf.setDrawColor(...PDF_COLORS.divider);
    pdf.setLineWidth(0.3);
    pdf.line(PDF_MARGINS.left, footerY, pageWidth - PDF_MARGINS.right, footerY);

    // Signature section
    const sigY = footerY + 5;
    const leftSigX = PDF_MARGINS.left + 15;
    const rightSigX = pageWidth - PDF_MARGINS.right - 50;

    // Left signature - CEO
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text("Digitally Verified by", leftSigX, sigY);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.text(BRAND.founder.name, leftSigX, sigY + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(BRAND.founder.title, leftSigX, sigY + 8);

    // Right signature - MD
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.text("Authorized by", rightSigX, sigY);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.text(BRAND.director.name, rightSigX, sigY + 4);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(BRAND.director.title, rightSigX, sigY + 8);

    // Bottom branding
    const brandY = pageHeight - 10;

    pdf.setFontSize(6);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(BRAND.tagline, PDF_MARGINS.left, brandY);
    pdf.text(BRAND.company, PDF_MARGINS.left, brandY + 3);

    // Page number
    pdf.text(`Page ${pageNumber}`, pageWidth / 2, brandY, { align: "center" });

    // Document ID
    pdf.text(`Doc ID: ${documentId}`, pageWidth - PDF_MARGINS.right, brandY, {
      align: "right",
    });
    pdf.text(
      format(new Date(), "dd/MM/yyyy HH:mm"),
      pageWidth - PDF_MARGINS.right,
      brandY + 3,
      { align: "right" }
    );
  };

  // Helper: Draw section divider
  const drawDivider = () => {
    checkPageBreak(20);
    yPos += 6;
    pdf.setDrawColor(...PDF_COLORS.divider);
    pdf.setLineWidth(0.5);
    pdf.line(PDF_MARGINS.left, yPos, pageWidth - PDF_MARGINS.right, yPos);
    yPos += 6;
  };

  // Helper: Draw callout box
  const drawCallout = (text: string) => {
    checkPageBreak(25);
    yPos += 4;

    const lines = pdf.splitTextToSize(text, contentWidth - 15);
    const boxHeight = lines.length * 5 + 10;

    // Left border (accent)
    pdf.setDrawColor(...PDF_COLORS.secondary);
    pdf.setLineWidth(2);
    pdf.line(PDF_MARGINS.left, yPos, PDF_MARGINS.left, yPos + boxHeight);

    // Background
    pdf.setFillColor(...PDF_COLORS.cardBg);
    pdf.rect(PDF_MARGINS.left + 2, yPos, contentWidth - 2, boxHeight, "F");

    // Text
    pdf.setFontSize(PDF_TYPOGRAPHY.small.size);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.text(lines, PDF_MARGINS.left + 8, yPos + 6);

    yPos += boxHeight + 4;
  };

  // Start PDF generation
  if (addWatermark) addWatermarkToPage();

  // ===== PREMIUM HEADER SECTION =====

  // Dark header band
  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.rect(0, 0, pageWidth, 40, "F");

  // Accent line
  pdf.setFillColor(...PDF_COLORS.secondary);
  pdf.rect(0, 40, pageWidth, 2, "F");

  // Brand name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text("CHRONYX", PDF_MARGINS.left, 18);

  // Document type
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(180, 180, 180);
  pdf.text(`${typeConfig.label.toUpperCase()} DOCUMENT`, PDF_MARGINS.left, 28);

  // Document ID
  pdf.setFontSize(7);
  pdf.text(`ID: ${documentId}`, PDF_MARGINS.left, 35);

  // Right side - Date
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  pdf.text(
    format(new Date(note.created_at), "MMMM d, yyyy"),
    pageWidth - PDF_MARGINS.right,
    18,
    { align: "right" }
  );

  if (includeTimestamps) {
    pdf.setFontSize(7);
    pdf.text(
      format(new Date(note.created_at), "h:mm a"),
      pageWidth - PDF_MARGINS.right,
      25,
      { align: "right" }
    );
  }

  yPos = 55;

  // ===== TITLE SECTION =====

  pdf.setFontSize(PDF_TYPOGRAPHY.title.size);
  pdf.setTextColor(...PDF_COLORS.title);
  pdf.setFont("helvetica", "bold");

  const titleLines = pdf.splitTextToSize(note.title || "Untitled", contentWidth);
  titleLines.forEach((line: string) => {
    checkPageBreak(12);
    pdf.text(line, PDF_MARGINS.left, yPos);
    yPos += 10;
  });

  // Emotion & Location (if present and not hidden)
  if (!hidePrivateMetadata && (note.emotion || note.location)) {
    yPos += 2;
    pdf.setFontSize(PDF_TYPOGRAPHY.small.size);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.setFont("helvetica", "normal");

    const metaParts: string[] = [];
    if (note.emotion) {
      const emotionEmojis: Record<string, string> = {
        happy: "😊",
        grateful: "🙏",
        calm: "😌",
        productive: "💪",
        anxious: "😰",
        sad: "😢",
        frustrated: "😤",
        excited: "🎉",
      };
      metaParts.push(`Mood: ${emotionEmojis[note.emotion] || ""} ${note.emotion}`);
    }
    if (note.location) {
      metaParts.push(`📍 ${note.location}`);
    }

    pdf.text(metaParts.join("  •  "), PDF_MARGINS.left, yPos);
    yPos += 6;
  }

  drawDivider();

  // ===== CONTENT SECTION =====

  const contentJson = parseContentJson(note.content_json);
  let contentText = "";

  if (contentJson) {
    contentText = extractPlainText(contentJson).trim();
  } else if (note.content) {
    contentText = note.content;
  }

  if (contentText) {
    pdf.setFontSize(PDF_TYPOGRAPHY.body.size);
    pdf.setTextColor(...PDF_COLORS.body);
    pdf.setFont("helvetica", "normal");

    const lineHeight = 6.5;
    const lines = pdf.splitTextToSize(contentText, contentWidth);

    lines.forEach((line: string) => {
      checkPageBreak(lineHeight + 2);
      pdf.text(line, PDF_MARGINS.left, yPos);
      yPos += lineHeight;
    });
  }

  // ===== LINKED ENTITIES SECTION =====

  if (
    includeLinkedData &&
    note.linked_entities &&
    Array.isArray(note.linked_entities) &&
    note.linked_entities.length > 0
  ) {
    yPos += 10;
    drawDivider();

    // Section heading
    pdf.setFontSize(PDF_TYPOGRAPHY.sectionHeading.size);
    pdf.setTextColor(...PDF_COLORS.heading);
    pdf.setFont("helvetica", "bold");
    pdf.text("Linked Information", PDF_MARGINS.left, yPos);
    yPos += 10;

    note.linked_entities.forEach((entity: any) => {
      checkPageBreak(15);
      const entityText = `This note is linked to your ${entity.type}: ${entity.label}`;
      drawCallout(entityText);
    });
  }

  // ===== TAGS SECTION =====

  if (note.tags && note.tags.length > 0) {
    checkPageBreak(20);
    yPos += 6;

    pdf.setFontSize(PDF_TYPOGRAPHY.small.size);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Tags: ${note.tags.join(", ")}`, PDF_MARGINS.left, yPos);
    yPos += 6;
  }

  // ===== TIMESTAMP FOOTER (optional) =====

  if (
    includeTimestamps &&
    note.updated_at &&
    note.updated_at !== note.created_at
  ) {
    checkPageBreak(15);
    yPos += 8;

    pdf.setFontSize(PDF_TYPOGRAPHY.meta.size);
    pdf.setTextColor(...PDF_COLORS.muted);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      `Last updated: ${format(new Date(note.updated_at), "MMMM d, yyyy 'at' h:mm a")}`,
      PDF_MARGINS.left,
      yPos
    );
  }

  // Add footer to last page
  addFooter();

  // Generate filename
  const sanitizedTitle = (note.title || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .substring(0, 50);
  const fileName = `chronyx-${sanitizedTitle}-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  // Save the PDF
  pdf.save(fileName);

  return fileName;
};

// Export options dialog component
export interface ExportDialogProps {
  onExport: (options: PDFExportOptions) => void;
  onClose: () => void;
}
