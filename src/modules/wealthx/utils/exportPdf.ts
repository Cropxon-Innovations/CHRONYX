/**
 * Portfolio PDF export.
 * Renders a branded, printable snapshot of the WealthX portfolio using jsPDF.
 * All monetary values are formatted in INR.
 */
import jsPDF from "jspdf";
import { formatINR, formatCompactINR, formatPct } from "@/lib/inr";
import type { Holding, PortfolioSummary } from "../types";

const BRAND = { r: 16, g: 185, b: 129 }; // emerald-500

export function exportPortfolioPDF(opts: {
  summary: PortfolioSummary;
  holdings: Holding[];
  userName?: string;
}) {
  const { summary, holdings, userName = "Investor" } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  // Header band
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, W, 60, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHRONYX · WealthX", M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Portfolio Report", W - M, 38, { align: "right" });
  y = 90;

  // Investor block
  doc.setTextColor(30);
  doc.setFontSize(11);
  doc.text(`Prepared for: ${userName}`, M, y);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, W - M, y, { align: "right" });
  y += 24;

  // Summary tiles
  const tiles: [string, string][] = [
    ["Current Value",    formatINR(summary.totalValue)],
    ["Invested",         formatINR(summary.totalInvested)],
    ["Profit / Loss",    `${formatINR(summary.profit)}  (${formatPct(summary.profitPct)})`],
    ["XIRR",             `${summary.xirr.toFixed(2)}%`],
    ["CAGR",             `${summary.cagr.toFixed(2)}%`],
    ["Health Score",     `${summary.healthScore}/100`],
  ];
  const tileW = (W - M * 2 - 10) / 2;
  tiles.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = M + col * (tileW + 10);
    const ty = y + row * 56;
    doc.setDrawColor(226);
    doc.setFillColor(250);
    doc.roundedRect(tx, ty, tileW, 48, 6, 6, "FD");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(k.toUpperCase(), tx + 10, ty + 16);
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text(v, tx + 10, ty + 34);
    doc.setFont("helvetica", "normal");
  });
  y += Math.ceil(tiles.length / 2) * 56 + 20;

  // Holdings header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text("Holdings", M, y);
  y += 12;
  doc.setDrawColor(230);
  doc.line(M, y, W - M, y);
  y += 14;

  const cols = [
    { label: "Instrument", x: M,        w: 200, align: "left"  as const },
    { label: "Qty",        x: M + 210,  w: 40,  align: "right" as const },
    { label: "LTP",        x: M + 260,  w: 60,  align: "right" as const },
    { label: "Invested",   x: M + 330,  w: 70,  align: "right" as const },
    { label: "Current",    x: M + 410,  w: 70,  align: "right" as const },
    { label: "Return",     x: M + 490,  w: 60,  align: "right" as const },
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90);
  cols.forEach((c) => doc.text(c.label, c.x + (c.align === "right" ? c.w : 0), y, { align: c.align }));
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);

  holdings.forEach((h) => {
    if (y > H - 60) {
      doc.addPage();
      y = M;
    }
    doc.setFontSize(9);
    doc.text(h.name.slice(0, 34), cols[0].x, y + 12);
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text(`${h.symbol} · ${h.sector}`, cols[0].x, y + 22);
    doc.setTextColor(30);
    doc.setFontSize(9);
    doc.text(String(h.quantity),                       cols[1].x + cols[1].w, y + 12, { align: "right" });
    doc.text(formatINR(h.currentPrice, 2),             cols[2].x + cols[2].w, y + 12, { align: "right" });
    doc.text(formatCompactINR(h.invested),             cols[3].x + cols[3].w, y + 12, { align: "right" });
    doc.text(formatCompactINR(h.currentValue),         cols[4].x + cols[4].w, y + 12, { align: "right" });
    const pos = h.overallChangePct >= 0;
    doc.setTextColor(pos ? 16 : 244, pos ? 185 : 63, pos ? 129 : 94);
    doc.text(formatPct(h.overallChangePct),            cols[5].x + cols[5].w, y + 12, { align: "right" });
    doc.setTextColor(30);
    y += 30;
    doc.setDrawColor(240);
    doc.line(M, y - 4, W - M, y - 4);
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      "This report is generated for informational purposes only and does not constitute investment advice.",
      W / 2, H - 24, { align: "center" }
    );
    doc.text(`Page ${i} of ${pages}`, W - M, H - 12, { align: "right" });
    doc.text("chronyx · wealthx", M, H - 12);
  }

  doc.save(`chronyx-wealthx-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`);
}
