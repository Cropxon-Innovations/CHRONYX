/**
 * FinanceFlow Export Component
 * Premium PDF, CSV, Excel export with CHRONYX branding
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BRAND,
  PDF_COLORS,
  PDF_MARGINS,
  generateDocumentId,
  addPremiumHeader,
  addPremiumFooter,
  addWatermark,
} from "@/lib/premiumPDF";

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  payment_mode: string;
  confidence_score: number;
  email_subject: string;
  source_platform: string;
  transaction_type: 'debit' | 'credit';
  raw_extracted_data: {
    category?: string;
    referenceId?: string;
    accountMask?: string;
    description?: string;
    channel?: string;
  };
  created_at: string;
}

interface FinanceFlowExportProps {
  transactions: Transaction[];
  period: string;
  dateRange: { start: Date; end: Date };
}

const FinanceFlowExport = ({ transactions, period, dateRange }: FinanceFlowExportProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
    }
  };

  const calculateSummary = () => {
    const debits = transactions.filter(t => t.transaction_type === 'debit');
    const credits = transactions.filter(t => t.transaction_type === 'credit');
    return {
      totalTransactions: transactions.length,
      totalDebits: debits.reduce((sum, t) => sum + Number(t.amount), 0),
      totalCredits: credits.reduce((sum, t) => sum + Number(t.amount), 0),
      debitCount: debits.length,
      creditCount: credits.length,
    };
  };

  const exportAsPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const documentId = generateDocumentId("FFL");
      const summary = calculateSummary();

      // Add premium header
      let yPos = addPremiumHeader(pdf, "FinanceFlow Transaction Report", getPeriodLabel(), documentId);

      // Add watermark
      addWatermark(pdf, "CHRONYX", 0.05);

      // Summary section
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...PDF_COLORS.heading);
      pdf.text("Summary", PDF_MARGINS.left, yPos);
      yPos += 8;

      // Summary cards
      const summaryData = [
        ["Total Transactions", String(summary.totalTransactions)],
        ["Total Debits", `${formatCurrency(summary.totalDebits)} (${summary.debitCount} txns)`],
        ["Total Credits", `${formatCurrency(summary.totalCredits)} (${summary.creditCount} txns)`],
        ["Net Flow", formatCurrency(summary.totalCredits - summary.totalDebits)],
      ];

      autoTable(pdf, {
        startY: yPos,
        head: [["Metric", "Value"]],
        body: summaryData,
        theme: "plain",
        headStyles: {
          fillColor: PDF_COLORS.secondary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 10,
          textColor: PDF_COLORS.body,
        },
        alternateRowStyles: {
          fillColor: PDF_COLORS.cardBg,
        },
        margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
        tableWidth: 100,
      });

      yPos = (pdf as any).lastAutoTable.finalY + 15;

      // Transaction table
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...PDF_COLORS.heading);
      pdf.text("Transaction Details", PDF_MARGINS.left, yPos);
      yPos += 8;

      const tableData = transactions.map(tx => [
        format(parseISO(tx.transaction_date), "dd MMM yyyy"),
        tx.merchant_name || "Unknown",
        tx.raw_extracted_data?.category || "Other",
        tx.payment_mode,
        tx.transaction_type === 'credit' ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount),
        tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1),
      ]);

      autoTable(pdf, {
        startY: yPos,
        head: [["Date", "Merchant", "Category", "Mode", "Amount", "Type"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: PDF_COLORS.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: PDF_COLORS.body,
        },
        alternateRowStyles: {
          fillColor: PDF_COLORS.cardBg,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 20, halign: "center" },
        },
        margin: { left: PDF_MARGINS.left, right: PDF_MARGINS.right },
        didDrawPage: (data) => {
          addPremiumFooter(pdf, data.pageNumber, undefined, false);
        },
      });

      // Final footer on last page
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        addPremiumFooter(pdf, i, pageCount, i === pageCount);
      }

      // Save
      const fileName = `chronyx-financeflow-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(fileName);

      toast({ title: "PDF exported successfully" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportAsCSV = () => {
    setExporting(true);
    try {
      const headers = ["Date", "Time", "Merchant", "Category", "Payment Mode", "Amount", "Type", "Reference ID", "Description"];
      const rows = transactions.map(tx => [
        format(parseISO(tx.transaction_date), "yyyy-MM-dd"),
        format(new Date(tx.created_at), "HH:mm:ss"),
        tx.merchant_name || "Unknown",
        tx.raw_extracted_data?.category || "Other",
        tx.payment_mode,
        tx.amount.toFixed(2),
        tx.transaction_type,
        tx.raw_extracted_data?.referenceId || "",
        tx.raw_extracted_data?.description || "",
      ]);

      const csvContent = [
        `# CHRONYX FinanceFlow Export`,
        `# Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
        `# Period: ${getPeriodLabel()}`,
        `# Transactions: ${transactions.length}`,
        ``,
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chronyx-financeflow-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "CSV exported successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const exportAsExcel = () => {
    setExporting(true);
    try {
      // Create Excel-compatible XML
      const summary = calculateSummary();
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>CHRONYX FinanceFlow Export</Title>
    <Author>${BRAND.company}</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Size="12"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="SubHeader">
      <Font ss:Bold="1" ss:Size="10"/>
      <Interior ss:Color="#6366F1" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="₹#,##0.00"/>
    </Style>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="16"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Transactions">
    <Table>
      <Column ss:Width="80"/>
      <Column ss:Width="60"/>
      <Column ss:Width="120"/>
      <Column ss:Width="100"/>
      <Column ss:Width="80"/>
      <Column ss:Width="100"/>
      <Column ss:Width="60"/>
      <Column ss:Width="150"/>
      <Row>
        <Cell ss:StyleID="Title"><Data ss:Type="String">CHRONYX FinanceFlow Report</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Period: ${getPeriodLabel()}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}</Data></Cell>
      </Row>
      <Row/>
      <Row ss:StyleID="SubHeader">
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Time</Data></Cell>
        <Cell><Data ss:Type="String">Merchant</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Mode</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="String">Amount</Data></Cell>
        <Cell><Data ss:Type="String">Type</Data></Cell>
        <Cell><Data ss:Type="String">Reference</Data></Cell>
      </Row>
      ${transactions.map(tx => `
      <Row>
        <Cell><Data ss:Type="String">${format(parseISO(tx.transaction_date), "yyyy-MM-dd")}</Data></Cell>
        <Cell><Data ss:Type="String">${format(new Date(tx.created_at), "HH:mm")}</Data></Cell>
        <Cell><Data ss:Type="String">${(tx.merchant_name || "Unknown").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Data></Cell>
        <Cell><Data ss:Type="String">${tx.raw_extracted_data?.category || "Other"}</Data></Cell>
        <Cell><Data ss:Type="String">${tx.payment_mode}</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${tx.amount}</Data></Cell>
        <Cell><Data ss:Type="String">${tx.transaction_type}</Data></Cell>
        <Cell><Data ss:Type="String">${tx.raw_extracted_data?.referenceId || ""}</Data></Cell>
      </Row>`).join("")}
      <Row/>
      <Row ss:StyleID="Header">
        <Cell ss:MergeAcross="1"><Data ss:Type="String">Summary</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Transactions</Data></Cell>
        <Cell><Data ss:Type="Number">${summary.totalTransactions}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Debits</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalDebits}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Total Credits</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalCredits}</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">Net Flow</Data></Cell>
        <Cell ss:StyleID="Currency"><Data ss:Type="Number">${summary.totalCredits - summary.totalDebits}</Data></Cell>
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;

      const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chronyx-financeflow-${format(new Date(), "yyyy-MM-dd")}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Excel exported successfully" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8" disabled={exporting || transactions.length === 0}>
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2 text-destructive" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsCSV} className="cursor-pointer">
          <File className="w-4 h-4 mr-2 text-emerald-600" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsExcel} className="cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FinanceFlowExport;
