import jsPDF from "jspdf";
import { NoteData } from "./NoteCard";
import { getNoteTypeConfig } from "./NoteTypeSelector";
import { format } from "date-fns";

interface ExportOptions {
  includeMetadata?: boolean;
  includeBranding?: boolean;
}

// Extract plain text from TipTap JSON content
const extractPlainText = (node: any, depth = 0): string => {
  if (!node) return "";
  
  let text = "";
  const indent = "  ".repeat(depth);
  
  if (typeof node === "string") return node;
  
  if (node.type === "heading") {
    const level = node.attrs?.level || 1;
    const prefix = "#".repeat(level) + " ";
    text += "\n" + prefix;
  }
  
  if (node.type === "paragraph") {
    text += "\n";
  }
  
  if (node.type === "bulletList") {
    text += "\n";
  }
  
  if (node.type === "listItem") {
    text += indent + "• ";
  }
  
  if (node.type === "taskItem") {
    const checked = node.attrs?.checked ? "[x]" : "[ ]";
    text += indent + checked + " ";
  }
  
  if (node.type === "blockquote") {
    text += "\n> ";
  }
  
  if (node.type === "horizontalRule") {
    text += "\n---\n";
  }
  
  if (node.text) {
    text += node.text;
  }
  
  if (node.content && Array.isArray(node.content)) {
    node.content.forEach((child: any) => {
      text += extractPlainText(child, depth + (node.type === "bulletList" || node.type === "taskList" ? 1 : 0));
    });
  }
  
  return text;
};

// Convert TipTap JSON to Markdown
const convertToMarkdown = (node: any): string => {
  if (!node) return "";
  
  let markdown = "";
  
  if (typeof node === "string") return node;
  
  switch (node.type) {
    case "doc":
      markdown = node.content?.map(convertToMarkdown).join("") || "";
      break;
    case "heading":
      const level = node.attrs?.level || 1;
      markdown = "\n" + "#".repeat(level) + " " + (node.content?.map(convertToMarkdown).join("") || "") + "\n";
      break;
    case "paragraph":
      markdown = "\n" + (node.content?.map(convertToMarkdown).join("") || "") + "\n";
      break;
    case "text":
      let text = node.text || "";
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") text = `**${text}**`;
          if (mark.type === "italic") text = `*${text}*`;
          if (mark.type === "code") text = `\`${text}\``;
        });
      }
      markdown = text;
      break;
    case "bulletList":
      markdown = "\n" + (node.content?.map(convertToMarkdown).join("") || "");
      break;
    case "orderedList":
      markdown = "\n" + (node.content?.map((item: any, i: number) => {
        const content = convertToMarkdown(item);
        return content.replace(/^- /, `${i + 1}. `);
      }).join("") || "");
      break;
    case "listItem":
      markdown = "- " + (node.content?.map(convertToMarkdown).join("").trim() || "") + "\n";
      break;
    case "taskList":
      markdown = "\n" + (node.content?.map(convertToMarkdown).join("") || "");
      break;
    case "taskItem":
      const checked = node.attrs?.checked ? "[x]" : "[ ]";
      markdown = `- ${checked} ` + (node.content?.map(convertToMarkdown).join("").trim() || "") + "\n";
      break;
    case "blockquote":
      markdown = "\n> " + (node.content?.map(convertToMarkdown).join("").trim().replace(/\n/g, "\n> ") || "") + "\n";
      break;
    case "codeBlock":
      markdown = "\n```\n" + (node.content?.map(convertToMarkdown).join("") || "") + "\n```\n";
      break;
    case "horizontalRule":
      markdown = "\n---\n";
      break;
    case "image":
      markdown = `\n![${node.attrs?.alt || "image"}](${node.attrs?.src || ""})\n`;
      break;
    case "table":
      const rows = node.content || [];
      rows.forEach((row: any, rowIndex: number) => {
        const cells = row.content || [];
        markdown += "| " + cells.map((cell: any) => convertToMarkdown(cell).trim()).join(" | ") + " |\n";
        if (rowIndex === 0) {
          markdown += "| " + cells.map(() => "---").join(" | ") + " |\n";
        }
      });
      break;
    case "tableRow":
    case "tableCell":
    case "tableHeader":
      markdown = node.content?.map(convertToMarkdown).join("") || "";
      break;
    default:
      markdown = node.content?.map(convertToMarkdown).join("") || "";
  }
  
  return markdown;
};

export const exportNoteToPDF = (note: NoteData, options: ExportOptions = {}) => {
  const { includeBranding = true } = options;
  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;
  
  // Header with branding
  if (includeBranding) {
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text("CHRONYX Notes", margin, yPos);
    pdf.text("Created in CHRONYX", pageWidth - margin - 40, yPos);
    yPos += 15;
  }
  
  // Title
  pdf.setFontSize(24);
  pdf.setTextColor(30, 30, 30);
  pdf.text(note.title || "Untitled", margin, yPos);
  yPos += 10;
  
  // Type and date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${typeConfig.label} • ${format(new Date(note.created_at), "MMMM d, yyyy")}`, margin, yPos);
  yPos += 15;
  
  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;
  
  // Content
  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 50);
  
  let contentText = "";
  if (note.content_json) {
    try {
      const json = typeof note.content_json === "string" ? JSON.parse(note.content_json) : note.content_json;
      contentText = extractPlainText(json).trim();
    } catch {
      contentText = note.content || "";
    }
  } else {
    contentText = note.content || "";
  }
  
  // Split content into lines that fit the page
  const lines = pdf.splitTextToSize(contentText, pageWidth - margin * 2);
  
  lines.forEach((line: string) => {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.text(line, margin, yPos);
    yPos += 6;
  });
  
  // Footer with branding
  if (includeBranding) {
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Powered by Cropxon Innovations Pvt Ltd", margin, footerY);
    pdf.text(`Page 1`, pageWidth - margin - 15, footerY);
  }
  
  // Save
  const fileName = `${note.title || "untitled"}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  pdf.save(fileName.toLowerCase().replace(/\s+/g, "-"));
};

export const exportNoteToMarkdown = (note: NoteData): string => {
  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  
  let markdown = `# ${note.title || "Untitled"}\n\n`;
  markdown += `> ${typeConfig.label} • ${format(new Date(note.created_at), "MMMM d, yyyy")}\n\n`;
  markdown += `---\n\n`;
  
  if (note.content_json) {
    try {
      const json = typeof note.content_json === "string" ? JSON.parse(note.content_json) : note.content_json;
      markdown += convertToMarkdown(json);
    } catch {
      markdown += note.content || "";
    }
  } else {
    markdown += note.content || "";
  }
  
  markdown += `\n\n---\n\n*Created in CHRONYX*`;
  
  return markdown;
};

export const exportNoteToPlainText = (note: NoteData): string => {
  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  
  let text = `${note.title || "Untitled"}\n`;
  text += `${"=".repeat((note.title || "Untitled").length)}\n\n`;
  text += `${typeConfig.label} • ${format(new Date(note.created_at), "MMMM d, yyyy")}\n\n`;
  
  if (note.content_json) {
    try {
      const json = typeof note.content_json === "string" ? JSON.parse(note.content_json) : note.content_json;
      text += extractPlainText(json);
    } catch {
      text += note.content || "";
    }
  } else {
    text += note.content || "";
  }
  
  return text.trim();
};

export const downloadAsFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const handleExport = (note: NoteData, format: "pdf" | "markdown" | "text") => {
  const baseFileName = (note.title || "untitled").toLowerCase().replace(/\s+/g, "-");
  
  switch (format) {
    case "pdf":
      exportNoteToPDF(note);
      break;
    case "markdown":
      const markdown = exportNoteToMarkdown(note);
      downloadAsFile(markdown, `${baseFileName}.md`, "text/markdown");
      break;
    case "text":
      const text = exportNoteToPlainText(note);
      downloadAsFile(text, `${baseFileName}.txt`, "text/plain");
      break;
  }
};
