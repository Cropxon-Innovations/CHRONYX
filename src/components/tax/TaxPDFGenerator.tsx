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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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
  const margin = 15;
  let yPos = margin;

  const primaryColor: [number, number, number] = [124, 58, 237]; // violet-600
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  const greenColor: [number, number, number] = [22, 163, 74];
  const blueColor: [number, number, number] = [37, 99, 235];

  // Helper functions
  const addText = (text: string, x: number, y: number, options: { fontSize?: number; color?: [number, number, number]; fontStyle?: string; align?: "left" | "center" | "right" } = {}) => {
    const { fontSize = 10, color = textColor, fontStyle = "normal", align = "left" } = options;
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.setFont("helvetica", fontStyle);
    doc.text(text, x, y, { align });
  };

  const drawLine = (y: number, color: [number, number, number] = [229, 231, 235]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const addNewPageIfNeeded = (requiredSpace: number = 40) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ================== PAGE 1: COVER & SUMMARY ==================
  
  // Header with gradient effect
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Logo text
  addText("CHRONYX", margin, 20, { fontSize: 24, color: [255, 255, 255], fontStyle: "bold" });
  addText("TAX COMPUTATION REPORT", margin, 30, { fontSize: 12, color: [255, 255, 255] });
  
  // Financial Year Badge
  const fyText = data.calculation.financial_year.replace("_", "-").replace("FY", "FY ");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 60, 15, 45, 20, 3, 3, "F");
  addText(fyText, pageWidth - 37.5, 27, { fontSize: 10, fontStyle: "bold", align: "center" });

  yPos = 60;

  // Summary Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 70, 3, 3, "F");
  
  yPos += 10;
  addText("INCOME TAX COMPUTATION SUMMARY", margin + 5, yPos, { fontSize: 12, fontStyle: "bold", color: primaryColor });
  
  yPos += 15;
  
  // Three column layout
  const colWidth = (pageWidth - 2 * margin - 10) / 3;
  
  // Gross Income
  addText("Gross Total Income", margin + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(formatCurrency(data.calculation.gross_total_income), margin + 5, yPos + 8, { fontSize: 14, fontStyle: "bold", color: greenColor });
  
  // Total Deductions
  addText("Total Deductions", margin + colWidth + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(formatCurrency(data.calculation.total_deductions), margin + colWidth + 5, yPos + 8, { fontSize: 14, fontStyle: "bold", color: blueColor });
  
  // Tax Payable
  addText("Tax Payable", margin + 2 * colWidth + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(formatCurrency(data.calculation.total_tax_liability), margin + 2 * colWidth + 5, yPos + 8, { fontSize: 14, fontStyle: "bold", color: primaryColor });

  yPos += 25;
  drawLine(yPos, [229, 231, 235]);
  yPos += 10;

  // Taxable Income & Effective Rate
  addText("Taxable Income", margin + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(formatCurrency(data.calculation.taxable_income), margin + 5, yPos + 6, { fontSize: 11, fontStyle: "bold" });
  
  addText("Tax Regime", margin + colWidth + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(data.calculation.regime.toUpperCase() + " REGIME", margin + colWidth + 5, yPos + 6, { fontSize: 11, fontStyle: "bold" });
  
  addText("Effective Tax Rate", margin + 2 * colWidth + 5, yPos, { fontSize: 8, color: mutedColor });
  addText(`${data.calculation.effective_rate}%`, margin + 2 * colWidth + 5, yPos + 6, { fontSize: 11, fontStyle: "bold" });

  yPos = 145;

  // ================== INCOME DETAILS ==================
  addText("INCOME DETAILS", margin, yPos, { fontSize: 11, fontStyle: "bold", color: primaryColor });
  yPos += 8;

  const incomeData = data.incomes.map((inc, i) => [
    (i + 1).toString(),
    inc.income_type.replace(/_/g, " ").toUpperCase(),
    inc.description || "-",
    formatCurrency(inc.gross_amount),
  ]);

  incomeData.push(["", "", "TOTAL INCOME", formatCurrency(data.calculation.gross_total_income)]);

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Income Source", "Description", "Amount (₹)"]],
    body: incomeData,
    theme: "striped",
    headStyles: { fillColor: primaryColor, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.row.index === incomeData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [243, 244, 246];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;
  addNewPageIfNeeded(80);

  // ================== DEDUCTIONS ==================
  if (Object.keys(data.deductions).length > 0) {
    addText("DEDUCTION DETAILS", margin, yPos, { fontSize: 11, fontStyle: "bold", color: primaryColor });
    yPos += 8;

    const deductionDescriptions: Record<string, string> = {
      "80C": "PPF, ELSS, LIC, EPF, Home Loan Principal",
      "80CCD1B": "Additional NPS Contribution",
      "80D": "Health Insurance Premium",
      "80E": "Education Loan Interest",
      "24B": "Home Loan Interest",
      "HRA": "House Rent Allowance Exemption",
      "STD": "Standard Deduction",
    };

    const deductionLimits: Record<string, number> = {
      "80C": 150000,
      "80CCD1B": 50000,
      "80D": 75000,
      "24B": 200000,
      "STD": 75000,
    };

    const deductionData = Object.entries(data.deductions).map(([section, amount], i) => [
      (i + 1).toString(),
      section,
      deductionDescriptions[section] || "Other Deduction",
      deductionLimits[section] ? formatCurrency(deductionLimits[section]) : "-",
      formatCurrency(amount),
    ]);

    deductionData.push(["", "", "", "TOTAL DEDUCTIONS", formatCurrency(data.calculation.total_deductions)]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Section", "Description", "Max Limit", "Claimed (₹)"]],
      body: deductionData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        3: { halign: "right" },
        4: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.row.index === deductionData.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [243, 244, 246];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  addNewPageIfNeeded(100);

  // ================== PAGE 2: TAX COMPUTATION ==================
  doc.addPage();
  yPos = margin;

  addText("TAX COMPUTATION STATEMENT", margin, yPos, { fontSize: 14, fontStyle: "bold", color: primaryColor });
  yPos += 15;

  // Slab-wise Tax Calculation
  addText("Slab-wise Tax Calculation", margin, yPos, { fontSize: 11, fontStyle: "bold" });
  yPos += 8;

  const slabData = data.calculation.slab_breakdown.map((slab) => {
    const range = slab.max_amount
      ? `${formatNumber(slab.min_amount)} - ${formatNumber(slab.max_amount)}`
      : `Above ${formatNumber(slab.min_amount)}`;
    return [range, `${slab.rate_percentage}%`, formatCurrency(slab.taxable_in_slab), formatCurrency(slab.tax_in_slab)];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Income Slab (₹)", "Rate", "Taxable Amount", "Tax (₹)"]],
    body: slabData,
    theme: "grid",
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Tax Computation Summary
  addText("Tax Computation", margin, yPos, { fontSize: 11, fontStyle: "bold" });
  yPos += 10;

  const computationData = [
    ["Gross Total Income", formatCurrency(data.calculation.gross_total_income)],
    ["Less: Total Deductions", `(${formatCurrency(data.calculation.total_deductions)})`],
    ["Taxable Income", formatCurrency(data.calculation.taxable_income)],
    ["Tax on Total Income", formatCurrency(data.calculation.tax_on_income)],
  ];

  if (data.calculation.rebate_87a > 0) {
    computationData.push(["Less: Rebate u/s 87A", `(${formatCurrency(data.calculation.rebate_87a)})`]);
  }

  computationData.push(["Tax after Rebate", formatCurrency(data.calculation.tax_after_rebate)]);

  if (data.calculation.surcharge > 0) {
    computationData.push([`Add: Surcharge (${data.calculation.surcharge_rate || 0}%)`, formatCurrency(data.calculation.surcharge)]);
  }

  computationData.push(["Add: Health & Education Cess (4%)", formatCurrency(data.calculation.cess)]);
  computationData.push(["TOTAL TAX LIABILITY", formatCurrency(data.calculation.total_tax_liability)]);

  autoTable(doc, {
    startY: yPos,
    body: computationData,
    theme: "plain",
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.row.index === computationData.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 12;
        data.cell.styles.fillColor = [243, 244, 246];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // ================== REGIME COMPARISON ==================
  addNewPageIfNeeded(80);
  
  addText("REGIME COMPARISON", margin, yPos, { fontSize: 11, fontStyle: "bold", color: primaryColor });
  yPos += 10;

  const currentRegimeTax = data.calculation.total_tax_liability;
  const alternateRegimeTax = data.calculation.alternate_regime_tax;
  const currentRegime = data.calculation.regime.toUpperCase();
  const alternateRegime = data.calculation.regime === "new" ? "OLD" : "NEW";

  const comparisonData = [
    [currentRegime + " REGIME (Selected)", formatCurrency(currentRegimeTax), data.calculation.is_optimal ? "✓ OPTIMAL" : ""],
    [alternateRegime + " REGIME", formatCurrency(alternateRegimeTax), !data.calculation.is_optimal ? "✓ OPTIMAL" : ""],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Regime", "Tax Liability", "Recommendation"]],
    body: comparisonData,
    theme: "grid",
    headStyles: { fillColor: primaryColor, fontSize: 9 },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" },
      2: { halign: "center" },
    },
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.cell.text[0]?.includes("OPTIMAL")) {
        data.cell.styles.textColor = greenColor;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Savings highlight
  const savings = Math.abs(data.calculation.savings_vs_alternate);
  if (savings > 0) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, "F");
    doc.setDrawColor(...greenColor);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, "S");
    
    addText("💰 TAX SAVINGS", margin + 5, yPos + 10, { fontSize: 9, color: greenColor, fontStyle: "bold" });
    const optimalRegime = data.calculation.is_optimal ? currentRegime : alternateRegime;
    addText(`By choosing ${optimalRegime} regime, you save ${formatCurrency(savings)}`, margin + 5, yPos + 18, { fontSize: 10, fontStyle: "bold" });
  }

  yPos += 40;

  // ================== PAGE 3: AUDIT & RECOMMENDATIONS ==================
  addNewPageIfNeeded(100);
  doc.addPage();
  yPos = margin;

  // Audit Score Section
  addText("AUDIT READINESS SCORE", margin, yPos, { fontSize: 14, fontStyle: "bold", color: primaryColor });
  yPos += 15;

  const scoreColor: [number, number, number] = data.auditScore >= 80 ? greenColor : data.auditScore >= 60 ? [234, 179, 8] : [220, 38, 38];
  const scoreStatus = data.auditScore >= 80 ? "EXCELLENT" : data.auditScore >= 60 ? "GOOD" : "NEEDS ATTENTION";

  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, yPos, 60, 40, 3, 3, "F");
  addText(`${data.auditScore}%`, margin + 30, yPos + 22, { fontSize: 24, fontStyle: "bold", color: scoreColor, align: "center" });
  addText(scoreStatus, margin + 30, yPos + 34, { fontSize: 9, fontStyle: "bold", color: scoreColor, align: "center" });

  addText("Compliance Status", margin + 70, yPos + 10, { fontSize: 10, fontStyle: "bold" });
  addText(`${data.auditFlags.filter(f => f.severity === "error").length} Critical Issues`, margin + 70, yPos + 20, { fontSize: 9, color: [220, 38, 38] });
  addText(`${data.auditFlags.filter(f => f.severity === "warning").length} Warnings`, margin + 70, yPos + 30, { fontSize: 9, color: [234, 179, 8] });

  yPos += 55;

  // Audit Flags
  if (data.auditFlags.length > 0) {
    addText("Compliance Notes", margin, yPos, { fontSize: 11, fontStyle: "bold" });
    yPos += 8;

    const flagData = data.auditFlags.map((flag) => [
      flag.severity.toUpperCase(),
      flag.title,
      flag.description,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Severity", "Issue", "Details"]],
      body: flagData,
      theme: "striped",
      headStyles: { fillColor: [107, 114, 128], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        2: { cellWidth: 70 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.column.index === 0) {
          const text = data.cell.text[0];
          if (text === "ERROR") data.cell.styles.textColor = [220, 38, 38];
          else if (text === "WARNING") data.cell.styles.textColor = [234, 179, 8];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    addNewPageIfNeeded(60);
    addText("TAX SAVING RECOMMENDATIONS", margin, yPos, { fontSize: 11, fontStyle: "bold", color: primaryColor });
    yPos += 8;

    const recData = data.recommendations.slice(0, 5).map((rec, i) => [
      (i + 1).toString(),
      rec.title,
      rec.description,
      rec.impact_amount > 0 ? formatCurrency(rec.impact_amount) : "-",
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Recommendation", "Details", "Potential Savings"]],
      body: recData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8 },
        2: { cellWidth: 60 },
        3: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;
  }

  // ================== FINAL PAGE: DISCLAIMER & SIGNATURE ==================
  addNewPageIfNeeded(100);

  // Disclaimer
  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, "F");
  addText("⚠️ IMPORTANT DISCLAIMER", margin + 5, yPos + 10, { fontSize: 9, fontStyle: "bold" });
  addText(
    "This is a computer-generated tax estimate for informational purposes only. It does not constitute",
    margin + 5,
    yPos + 18,
    { fontSize: 7, color: mutedColor }
  );
  addText(
    "tax advice. Please consult a qualified Chartered Accountant or tax professional for accurate tax",
    margin + 5,
    yPos + 24,
    { fontSize: 7, color: mutedColor }
  );
  addText(
    "filing. CHRONYX and Cropxon Innovations Pvt. Ltd. are not responsible for any discrepancies.",
    margin + 5,
    yPos + 30,
    { fontSize: 7, color: mutedColor }
  );

  yPos += 50;

  // Signature Section
  drawLine(yPos);
  yPos += 15;

  addText("Document Information", margin, yPos, { fontSize: 10, fontStyle: "bold" });
  yPos += 10;

  const now = new Date();
  addText(`Generated On: ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, margin, yPos, { fontSize: 9 });
  addText(`Time: ${now.toLocaleTimeString("en-IN")}`, margin, yPos + 8, { fontSize: 9 });
  if (data.userName) addText(`Prepared For: ${data.userName}`, margin, yPos + 16, { fontSize: 9 });
  if (data.userEmail) addText(`Email: ${data.userEmail}`, margin, yPos + 24, { fontSize: 9 });

  // Right side - Signature
  addText("Digitally Generated & Signed", pageWidth - margin - 60, yPos, { fontSize: 9, color: mutedColor });
  addText("CHRONYX Tax Engine v1.0", pageWidth - margin - 60, yPos + 10, { fontSize: 8, color: mutedColor });
  
  yPos += 35;
  drawLine(yPos);
  yPos += 10;

  // Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 30, pageWidth, 30, "F");
  
  addText("Prepared by CHRONYX", pageWidth / 2, pageHeight - 22, { fontSize: 10, color: [255, 255, 255], fontStyle: "bold", align: "center" });
  addText("A product of Cropxon Innovations Pvt. Ltd.", pageWidth / 2, pageHeight - 15, { fontSize: 8, color: [255, 255, 255], align: "center" });
  addText("Abhishek Panda | CEO & Director", pageWidth / 2, pageHeight - 8, { fontSize: 7, color: [255, 255, 255], align: "center" });

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addText(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 33, { fontSize: 7, color: mutedColor, align: "center" });
  }

  return doc.output("blob");
};

export const downloadTaxPDF = async (data: TaxPDFData, filename?: string): Promise<void> => {
  const blob = await generateTaxPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `CHRONYX_Tax_Report_${data.calculation.financial_year}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
