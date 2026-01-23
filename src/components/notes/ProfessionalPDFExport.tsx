import jsPDF from "jspdf";
import { NoteData } from "./NoteCard";
import { getNoteTypeConfig } from "./NoteTypeSelector";
import { format } from "date-fns";

// Professional PDF Export with CA-grade typography
// Using DM Sans for headings and Crimson Pro-style for body

interface PDFExportOptions {
  includeLinkedData?: boolean;
  includeTimestamps?: boolean;
  addWatermark?: boolean;
  hidePrivateMetadata?: boolean;
}

// Type scale configuration (in points)
const TYPE_SCALE = {
  documentTitle: { size: 22, weight: "bold" },
  sectionHeading: { size: 14, weight: "bold" },
  subheading: { size: 11, weight: "bold" },
  bodyText: { size: 11, weight: "normal" },
  smallNotes: { size: 9, weight: "normal" },
  metadata: { size: 8, weight: "normal" },
};

// Colors (soft, professional)
const COLORS = {
  title: [30, 30, 30] as [number, number, number],
  heading: [40, 40, 40] as [number, number, number],
  body: [50, 50, 50] as [number, number, number],
  muted: [100, 100, 100] as [number, number, number],
  divider: [229, 231, 235] as [number, number, number], // #E5E7EB
  calloutBg: [249, 250, 251] as [number, number, number],
  calloutBorder: [156, 163, 175] as [number, number, number],
  watermark: [220, 220, 220] as [number, number, number],
};

// Margins (in mm)
const MARGINS = {
  left: 28,
  right: 28,
  top: 24,
  bottom: 30,
};

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

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  let yPos = MARGINS.top;
  let pageNumber = 1;

  // Helper: Add new page
  const addNewPage = () => {
    addFooter();
    pdf.addPage();
    pageNumber++;
    yPos = MARGINS.top;
    if (addWatermark) addWatermarkToPage();
  };

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - MARGINS.bottom) {
      addNewPage();
    }
  };

  // Helper: Add watermark
  const addWatermarkToPage = () => {
    pdf.setFontSize(48);
    pdf.setTextColor(...COLORS.watermark);
    pdf.text("PRIVATE & CONFIDENTIAL", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
  };

  // Helper: Add footer
  const addFooter = () => {
    const footerY = pageHeight - 12;
    
    // Divider line
    pdf.setDrawColor(...COLORS.divider);
    pdf.setLineWidth(0.3);
    pdf.line(MARGINS.left, footerY - 5, pageWidth - MARGINS.right, footerY - 5);
    
    // Footer text
    pdf.setFontSize(TYPE_SCALE.metadata.size);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont("helvetica", "normal");
    
    // Left side - Branding
    pdf.text("Created with CHRONYX", MARGINS.left, footerY);
    pdf.text("A product by Originx Labs Pvt. Ltd.", MARGINS.left, footerY + 4);
    
    // Right side - Page number and metadata
    pdf.text(`Page ${pageNumber}`, pageWidth - MARGINS.right - 15, footerY);
    pdf.text("Digitally generated • User verified", pageWidth - MARGINS.right - 45, footerY + 4);
  };

  // Helper: Draw section divider
  const drawDivider = () => {
    checkPageBreak(20);
    yPos += 6;
    pdf.setDrawColor(...COLORS.divider);
    pdf.setLineWidth(0.5);
    pdf.line(MARGINS.left, yPos, pageWidth - MARGINS.right, yPos);
    yPos += 6;
  };

  // Helper: Draw callout box
  const drawCallout = (text: string) => {
    checkPageBreak(25);
    yPos += 4;
    
    const lines = pdf.splitTextToSize(text, contentWidth - 15);
    const boxHeight = lines.length * 5 + 10;
    
    // Left border (accent)
    pdf.setDrawColor(...COLORS.calloutBorder);
    pdf.setLineWidth(2);
    pdf.line(MARGINS.left, yPos, MARGINS.left, yPos + boxHeight);
    
    // Background
    pdf.setFillColor(...COLORS.calloutBg);
    pdf.rect(MARGINS.left + 2, yPos, contentWidth - 2, boxHeight, "F");
    
    // Text
    pdf.setFontSize(TYPE_SCALE.smallNotes.size);
    pdf.setTextColor(...COLORS.muted);
    pdf.text(lines, MARGINS.left + 8, yPos + 6);
    
    yPos += boxHeight + 4;
  };

  // Start PDF generation
  if (addWatermark) addWatermarkToPage();

  // ===== HEADER SECTION =====
  
  // Document type badge
  pdf.setFontSize(TYPE_SCALE.metadata.size);
  pdf.setTextColor(...COLORS.muted);
  pdf.setFont("helvetica", "normal");
  pdf.text(typeConfig.label.toUpperCase(), MARGINS.left, yPos);
  
  if (includeTimestamps) {
    pdf.text(
      format(new Date(note.created_at), "MMMM d, yyyy • h:mm a"),
      pageWidth - MARGINS.right,
      yPos,
      { align: "right" }
    );
  }
  yPos += 12;

  // Title
  pdf.setFontSize(TYPE_SCALE.documentTitle.size);
  pdf.setTextColor(...COLORS.title);
  pdf.setFont("helvetica", "bold");
  
  const titleLines = pdf.splitTextToSize(note.title || "Untitled", contentWidth);
  titleLines.forEach((line: string) => {
    checkPageBreak(12);
    pdf.text(line, MARGINS.left, yPos);
    yPos += 10;
  });

  // Emotion & Location (if present and not hidden)
  if (!hidePrivateMetadata && (note.emotion || note.location)) {
    yPos += 2;
    pdf.setFontSize(TYPE_SCALE.smallNotes.size);
    pdf.setTextColor(...COLORS.muted);
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
    
    pdf.text(metaParts.join("  •  "), MARGINS.left, yPos);
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
    pdf.setFontSize(TYPE_SCALE.bodyText.size);
    pdf.setTextColor(...COLORS.body);
    pdf.setFont("helvetica", "normal");
    
    // Line height: 1.5 = ~6.5mm for 11pt
    const lineHeight = 6.5;
    const lines = pdf.splitTextToSize(contentText, contentWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight + 2);
      pdf.text(line, MARGINS.left, yPos);
      yPos += lineHeight;
    });
  }

  // ===== LINKED ENTITIES SECTION =====
  
  if (includeLinkedData && note.linked_entities && Array.isArray(note.linked_entities) && note.linked_entities.length > 0) {
    yPos += 10;
    drawDivider();
    
    // Section heading
    pdf.setFontSize(TYPE_SCALE.sectionHeading.size);
    pdf.setTextColor(...COLORS.heading);
    pdf.setFont("helvetica", "bold");
    pdf.text("Linked Information", MARGINS.left, yPos);
    yPos += 10;
    
    note.linked_entities.forEach((entity: any) => {
      checkPageBreak(15);
      
      const entityText = `This note was linked to your ${entity.type}: ${entity.label}`;
      drawCallout(entityText);
    });
  }

  // ===== TAGS SECTION =====
  
  if (note.tags && note.tags.length > 0) {
    checkPageBreak(20);
    yPos += 6;
    
    pdf.setFontSize(TYPE_SCALE.smallNotes.size);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Tags: ${note.tags.join(", ")}`, MARGINS.left, yPos);
    yPos += 6;
  }

  // ===== TIMESTAMP FOOTER (optional) =====
  
  if (includeTimestamps && note.updated_at && note.updated_at !== note.created_at) {
    checkPageBreak(15);
    yPos += 8;
    
    pdf.setFontSize(TYPE_SCALE.metadata.size);
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont("helvetica", "italic");
    pdf.text(
      `Last updated: ${format(new Date(note.updated_at), "MMMM d, yyyy 'at' h:mm a")}`,
      MARGINS.left,
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
  const fileName = `${sanitizedTitle}-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  // Save the PDF
  pdf.save(fileName);

  return fileName;
};

// Export options dialog component
export interface ExportDialogProps {
  onExport: (options: PDFExportOptions) => void;
  onClose: () => void;
}
