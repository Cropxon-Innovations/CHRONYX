import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface TaxCalculation {
  financial_year: string;
  regime: string;
  gross_total_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_on_income: number;
  rebate_87a: number;
  tax_after_rebate: number;
  surcharge: number;
  surcharge_rate?: number;
  cess: number;
  total_tax_liability: number;
  effective_rate: number;
  alternate_regime_tax: number;
  is_optimal: boolean;
  savings_vs_alternate: number;
  slab_breakdown: Array<{
    min_amount: number;
    max_amount: number | null;
    rate_percentage: number;
    taxable_in_slab: number;
    tax_in_slab: number;
  }>;
  standard_deduction?: number;
}

interface TaxPDFData {
  calculation: TaxCalculation;
  incomes: Array<{
    income_type: string;
    gross_amount: number;
    description?: string;
  }>;
  deductions: Record<string, number>;
  auditScore: number;
  auditFlags: Array<{
    severity: string;
    title: string;
    description: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    impact_amount: number;
  }>;
  userName?: string;
  userEmail?: string;
}

// Format currency with proper INR symbol (Rs. for PDF compatibility)
const formatINR = (amount: number): string => {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  return `Rs. ${formatted}`;
};

const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateTaxPDF = async (data: TaxPDFData): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = margin;

  // Enterprise color palette - minimal, professional
  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [51, 51, 51];
  const mediumGray: [number, number, number] = [102, 102, 102];
  const lightGray: [number, number, number] = [153, 153, 153];
  const bgGray: [number, number, number] = [245, 245, 245];
  const accentBlue: [number, number, number] = [0, 51, 102]; // Dark blue for headers
  const successGreen: [number, number, number] = [0, 128, 0];
  const dangerRed: [number, number, number] = [180, 0, 0];

  // Helper functions
  const addText = (text: string, x: number, y: number, options: { 
    fontSize?: number; 
    color?: [number, number, number]; 
    fontStyle?: string; 
    align?: "left" | "center" | "right" 
  } = {}) => {
    const { fontSize = 9, color = darkGray, fontStyle = "normal", align = "left" } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", fontStyle);
    doc.text(text, x, y, { align });
  };

  const drawLine = (y: number, thickness: number = 0.3) => {
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(thickness);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const drawThickLine = (y: number) => {
    doc.setDrawColor(...black);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const addNewPageIfNeeded = (requiredSpace: number = 35) => {
    if (yPos + requiredSpace > pageHeight - 25) {
      doc.addPage();
      yPos = margin + 5;
      return true;
    }
    return false;
  };

  // ================== HEADER ==================
  // Top border line
  doc.setFillColor(...accentBlue);
  doc.rect(0, 0, pageWidth, 3, "F");

  yPos = 15;

  // Company header
  addText("CHRONYX", margin, yPos, { fontSize: 18, color: black, fontStyle: "bold" });
  addText("TAX COMPUTATION STATEMENT", pageWidth - margin, yPos, { fontSize: 10, color: mediumGray, align: "right" });
  
  yPos += 6;
  addText("Cropxon Innovations Pvt. Ltd.", margin, yPos, { fontSize: 8, color: mediumGray });
  addText(`Assessment Year: ${data.calculation.financial_year.replace("FY", "AY ").replace("_", "-")}`, pageWidth - margin, yPos, { fontSize: 9, color: darkGray, fontStyle: "bold", align: "right" });

  yPos += 8;
  drawThickLine(yPos);
  yPos += 8;

  // ================== ASSESSEE DETAILS ==================
  addText("ASSESSEE DETAILS", margin, yPos, { fontSize: 10, fontStyle: "bold", color: black });
  yPos += 6;

  const assesseeData = [
    ["Name", data.userName || "Not Provided", "Financial Year", data.calculation.financial_year.replace("_", "-").replace("FY", "FY ")],
    ["Email", data.userEmail || "Not Provided", "Tax Regime", data.calculation.regime.toUpperCase() + " REGIME"],
    ["Document Type", "Tax Computation", "Generated On", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
  ];

  autoTable(doc, {
    startY: yPos,
    body: assesseeData,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;
  drawLine(yPos);
  yPos += 8;

  // ================== INCOME SUMMARY ==================
  addText("PART A: COMPUTATION OF TOTAL INCOME", margin, yPos, { fontSize: 10, fontStyle: "bold", color: black });
  yPos += 8;

  addText("A.1 INCOME PARTICULARS", margin, yPos, { fontSize: 9, fontStyle: "bold", color: accentBlue });
  yPos += 5;

  const incomeRows: any[][] = [];
  let totalIncome = 0;
  data.incomes.forEach((inc, i) => {
    const amount = inc.gross_amount;
    totalIncome += amount;
    incomeRows.push([
      (i + 1).toString(),
      inc.income_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      inc.description || "-",
      formatINR(amount),
    ]);
  });

  autoTable(doc, {
    startY: yPos,
    head: [["S.No", "Particulars of Income", "Description", "Amount (Rs.)"]],
    body: incomeRows,
    foot: [["", "", "Gross Total Income", formatINR(data.calculation.gross_total_income)]],
    theme: "grid",
    headStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: darkGray },
    footStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 70 },
      3: { cellWidth: 40, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ================== DEDUCTIONS ==================
  if (Object.keys(data.deductions).length > 0) {
    addNewPageIfNeeded(50);
    
    addText("A.2 DEDUCTIONS UNDER CHAPTER VI-A", margin, yPos, { fontSize: 9, fontStyle: "bold", color: accentBlue });
    yPos += 5;

    const deductionInfo: Record<string, { desc: string; limit: number | null }> = {
      "80C": { desc: "Life Insurance, PPF, ELSS, EPF, NSC, etc.", limit: 150000 },
      "80CCD1B": { desc: "Additional NPS Contribution", limit: 50000 },
      "80D": { desc: "Medical Insurance Premium", limit: 75000 },
      "80E": { desc: "Interest on Education Loan", limit: null },
      "24B": { desc: "Interest on Housing Loan", limit: 200000 },
      "HRA": { desc: "House Rent Allowance Exemption", limit: null },
      "STD": { desc: "Standard Deduction", limit: 75000 },
    };

    const deductionRows: any[][] = [];
    let totalDed = 0;
    Object.entries(data.deductions).forEach(([section, amount], i) => {
      const info = deductionInfo[section] || { desc: "Other Deduction", limit: null };
      totalDed += amount;
      deductionRows.push([
        (i + 1).toString(),
        `Section ${section}`,
        info.desc,
        info.limit ? formatINR(info.limit) : "No Limit",
        formatINR(amount),
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [["S.No", "Section", "Description", "Max Limit", "Claimed (Rs.)"]],
      body: deductionRows,
      foot: [["", "", "", "Total Deductions", formatINR(data.calculation.total_deductions)]],
      theme: "grid",
      headStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: darkGray },
      footStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ================== TAX COMPUTATION ==================
  addNewPageIfNeeded(80);
  doc.addPage();
  yPos = margin + 5;

  // Header for new page
  doc.setFillColor(...accentBlue);
  doc.rect(0, 0, pageWidth, 3, "F");
  
  addText("PART B: COMPUTATION OF TAX LIABILITY", margin, yPos, { fontSize: 10, fontStyle: "bold", color: black });
  yPos += 10;

  addText("B.1 TAX SLAB COMPUTATION", margin, yPos, { fontSize: 9, fontStyle: "bold", color: accentBlue });
  yPos += 5;

  const slabRows = data.calculation.slab_breakdown.map((slab) => {
    const range = slab.max_amount
      ? `Rs. ${formatNumber(slab.min_amount)} to Rs. ${formatNumber(slab.max_amount)}`
      : `Above Rs. ${formatNumber(slab.min_amount)}`;
    return [
      range,
      `${slab.rate_percentage}%`,
      formatINR(slab.taxable_in_slab),
      formatINR(slab.tax_in_slab),
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Income Slab", "Rate", "Taxable Amount", "Tax (Rs.)"]],
    body: slabRows,
    theme: "grid",
    headStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: darkGray },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 45, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ================== TAX COMPUTATION SUMMARY ==================
  addText("B.2 TAX COMPUTATION SUMMARY", margin, yPos, { fontSize: 9, fontStyle: "bold", color: accentBlue });
  yPos += 5;

  const computationRows: [string, string][] = [
    ["Gross Total Income", formatINR(data.calculation.gross_total_income)],
    ["Less: Deductions under Chapter VI-A", `(-) ${formatINR(data.calculation.total_deductions)}`],
    ["Total Taxable Income", formatINR(data.calculation.taxable_income)],
    ["Tax on Total Income", formatINR(data.calculation.tax_on_income)],
  ];

  if (data.calculation.rebate_87a > 0) {
    computationRows.push(["Less: Rebate under Section 87A", `(-) ${formatINR(data.calculation.rebate_87a)}`]);
  }

  computationRows.push(["Tax after Rebate", formatINR(data.calculation.tax_after_rebate)]);

  if (data.calculation.surcharge > 0) {
    computationRows.push([`Add: Surcharge @ ${data.calculation.surcharge_rate || 0}%`, `(+) ${formatINR(data.calculation.surcharge)}`]);
  }

  computationRows.push(["Add: Health & Education Cess @ 4%", `(+) ${formatINR(data.calculation.cess)}`]);

  autoTable(doc, {
    startY: yPos,
    body: computationRows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: "right" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (cellData) => {
      // Highlight deductions in different style
      const text = cellData.cell.text[0] || "";
      if (text.includes("Less:")) {
        cellData.cell.styles.textColor = mediumGray;
      }
      if (text.includes("Add:")) {
        cellData.cell.styles.textColor = darkGray;
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 3;

  // Total Tax Box
  doc.setFillColor(...bgGray);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 14, "F");
  doc.setDrawColor(...black);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 14, "S");

  const taxPayable = data.calculation.total_tax_liability;
  const isRefund = taxPayable < 0;
  
  addText("TOTAL TAX PAYABLE", margin + 5, yPos + 9, { fontSize: 11, fontStyle: "bold", color: black });
  addText(
    isRefund ? `(-) ${formatINR(Math.abs(taxPayable))} (REFUND)` : formatINR(taxPayable),
    pageWidth - margin - 5,
    yPos + 9,
    { fontSize: 12, fontStyle: "bold", color: isRefund ? successGreen : dangerRed, align: "right" }
  );

  yPos += 20;

  // Effective Rate
  addText(`Effective Tax Rate: ${data.calculation.effective_rate}%`, margin, yPos, { fontSize: 8, color: mediumGray });
  addText(`Monthly Equivalent: ${formatINR(Math.round(taxPayable / 12))}`, pageWidth - margin, yPos, { fontSize: 8, color: mediumGray, align: "right" });

  yPos += 12;

  // ================== REGIME COMPARISON ==================
  addNewPageIfNeeded(60);
  drawThickLine(yPos);
  yPos += 8;

  addText("PART C: REGIME COMPARISON ANALYSIS", margin, yPos, { fontSize: 10, fontStyle: "bold", color: black });
  yPos += 8;

  const currentRegime = data.calculation.regime.toUpperCase();
  const alternateRegime = data.calculation.regime === "new" ? "OLD" : "NEW";
  const currentTax = data.calculation.total_tax_liability;
  const alternateTax = data.calculation.alternate_regime_tax;
  const optimalRegime = data.calculation.is_optimal ? currentRegime : alternateRegime;
  const savings = Math.abs(data.calculation.savings_vs_alternate);

  const comparisonRows = [
    [currentRegime + " REGIME (Selected)", formatINR(currentTax), data.calculation.is_optimal ? "OPTIMAL" : "-"],
    [alternateRegime + " REGIME", formatINR(alternateTax), !data.calculation.is_optimal ? "OPTIMAL" : "-"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Tax Regime", "Tax Liability", "Recommendation"]],
    body: comparisonRows,
    theme: "grid",
    headStyles: { fillColor: bgGray, textColor: black, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 40, halign: "center" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (cellData) => {
      if (cellData.cell.text[0] === "OPTIMAL") {
        cellData.cell.styles.textColor = successGreen;
        cellData.cell.styles.fontStyle = "bold";
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  if (savings > 0) {
    doc.setFillColor(240, 255, 240);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, "F");
    doc.setDrawColor(...successGreen);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, "S");
    
    addText(`POTENTIAL SAVINGS: ${formatINR(savings)} by choosing ${optimalRegime} REGIME`, margin + 5, yPos + 8, { fontSize: 9, fontStyle: "bold", color: successGreen });
  }

  yPos += 18;

  // ================== AUDIT SCORE ==================
  if (data.auditScore > 0) {
    addNewPageIfNeeded(40);
    
    addText("PART D: COMPLIANCE SCORE", margin, yPos, { fontSize: 10, fontStyle: "bold", color: black });
    yPos += 8;

    const scoreStatus = data.auditScore >= 80 ? "EXCELLENT" : data.auditScore >= 60 ? "GOOD" : "NEEDS REVIEW";
    const scoreColor = data.auditScore >= 80 ? successGreen : data.auditScore >= 60 ? mediumGray : dangerRed;

    const auditData = [
      ["Audit Readiness Score", `${data.auditScore}%`],
      ["Compliance Status", scoreStatus],
      ["Critical Issues", data.auditFlags.filter(f => f.severity === "error").length.toString()],
      ["Warnings", data.auditFlags.filter(f => f.severity === "warning").length.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      body: auditData,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (cellData) => {
        if (cellData.row.index === 0 && cellData.column.index === 1) {
          cellData.cell.styles.fontStyle = "bold";
        }
        if (cellData.row.index === 1 && cellData.column.index === 1) {
          cellData.cell.styles.textColor = scoreColor;
          cellData.cell.styles.fontStyle = "bold";
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // ================== DISCLAIMER ==================
  addNewPageIfNeeded(50);
  drawThickLine(yPos);
  yPos += 8;

  addText("DISCLAIMER", margin, yPos, { fontSize: 9, fontStyle: "bold", color: black });
  yPos += 6;

  const disclaimer = [
    "1. This is a computer-generated tax computation for informational purposes only.",
    "2. This document does not constitute professional tax advice or legal opinion.",
    "3. The computation is based on information provided and may not reflect actual tax liability.",
    "4. Users are advised to consult a qualified Chartered Accountant for accurate tax filing.",
    "5. CHRONYX and Cropxon Innovations Pvt. Ltd. shall not be liable for any discrepancies.",
    "6. Tax laws are subject to change; verify with latest provisions before filing.",
  ];

  disclaimer.forEach((line) => {
    addText(line, margin, yPos, { fontSize: 7, color: mediumGray });
    yPos += 4;
  });

  yPos += 6;

  // ================== SIGNATURE & FOOTER ==================
  drawLine(yPos);
  yPos += 10;

  // Two column footer
  addText("Document Reference:", margin, yPos, { fontSize: 8, fontStyle: "bold", color: darkGray });
  addText("Authorized Signatory:", pageWidth / 2 + 10, yPos, { fontSize: 8, fontStyle: "bold", color: darkGray });
  
  yPos += 5;
  const docRef = `CHRX-TAX-${data.calculation.financial_year}-${Date.now().toString(36).toUpperCase()}`;
  addText(docRef, margin, yPos, { fontSize: 7, color: mediumGray });
  addText("CHRONYX Tax Engine", pageWidth / 2 + 10, yPos, { fontSize: 7, color: mediumGray });
  
  yPos += 4;
  addText(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, yPos, { fontSize: 7, color: mediumGray });
  addText("(Digitally Signed)", pageWidth / 2 + 10, yPos, { fontSize: 7, color: mediumGray });

  // Bottom footer bar
  const footerY = pageHeight - 12;
  doc.setFillColor(...accentBlue);
  doc.rect(0, footerY, pageWidth, 12, "F");
  
  addText("CHRONYX - A Product of Cropxon Innovations Pvt. Ltd.", pageWidth / 2, footerY + 5, { fontSize: 7, color: [255, 255, 255], align: "center" });
  addText("Abhishek Panda | CEO & Director | www.chronyx.in", pageWidth / 2, footerY + 9, { fontSize: 6, color: [200, 200, 200], align: "center" });

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addText(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { fontSize: 7, color: lightGray, align: "right" });
  }

  return doc.output("blob");
};

export const downloadTaxPDF = async (data: TaxPDFData, filename?: string): Promise<void> => {
  const blob = await generateTaxPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `CHRONYX_Tax_Statement_${data.calculation.financial_year}_${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
