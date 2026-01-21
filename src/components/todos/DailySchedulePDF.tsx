import { useMemo } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  duration_hours?: number | null;
  priority: "high" | "medium" | "low";
  date: string;
}

interface DailySchedulePDFProps {
  todos: Todo[];
  selectedDate: Date;
}

const SLEEP_HOURS = 6;
const ESSENTIALS_HOURS = 2;
const AVAILABLE_HOURS = 16;

export const DailySchedulePDF = ({ todos, selectedDate }: DailySchedulePDFProps) => {
  const { toast } = useToast();

  const stats = useMemo(() => {
    const timedTodos = todos.filter(t => t.duration_hours && t.duration_hours > 0);
    const allocatedHours = timedTodos.reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const completedHours = timedTodos
      .filter(t => t.status === "done")
      .reduce((sum, t) => sum + (t.duration_hours || 0), 0);
    const completedTasks = todos.filter(t => t.status === "done").length;
    const skippedTasks = todos.filter(t => t.status === "skipped").length;
    const pendingTasks = todos.filter(t => t.status === "pending").length;
    
    return {
      totalTasks: todos.length,
      completedTasks,
      skippedTasks,
      pendingTasks,
      allocatedHours,
      completedHours,
      freeHours: AVAILABLE_HOURS - allocatedHours,
      utilizationPercent: (allocatedHours / AVAILABLE_HOURS) * 100,
      completionPercent: todos.length > 0 ? (completedTasks / todos.length) * 100 : 0,
    };
  }, [todos]);

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const dateStr = format(selectedDate, "EEEE, MMMM d, yyyy");

      // Header
      doc.setFontSize(24);
      doc.setTextColor(60, 60, 60);
      doc.text("Daily Schedule", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(dateStr, 105, 30, { align: "center" });

      // Time Budget Summary
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text("Time Budget (24 Hours)", 14, 45);

      const timeData = [
        ["Sleep", `${SLEEP_HOURS}h`, "Essential rest time"],
        ["Essentials", `${ESSENTIALS_HOURS}h`, "Food, hygiene, self-care"],
        ["Planned Tasks", `${stats.allocatedHours.toFixed(1)}h`, `${stats.utilizationPercent.toFixed(0)}% utilized`],
        ["Free Time", `${stats.freeHours.toFixed(1)}h`, "Unallocated time"],
      ];

      autoTable(doc, {
        startY: 50,
        head: [["Category", "Hours", "Notes"]],
        body: timeData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 14, right: 14 },
      });

      // Task Statistics
      const statsY = (doc as any).lastAutoTable.finalY + 15;
      doc.text("Task Statistics", 14, statsY);

      const statsData = [
        ["Total Tasks", stats.totalTasks.toString()],
        ["Completed", `${stats.completedTasks} (${stats.completionPercent.toFixed(0)}%)`],
        ["Pending", stats.pendingTasks.toString()],
        ["Skipped", stats.skippedTasks.toString()],
        ["Hours Completed", `${stats.completedHours.toFixed(1)}h`],
      ];

      autoTable(doc, {
        startY: statsY + 5,
        head: [["Metric", "Value"]],
        body: statsData,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 },
        columnStyles: { 0: { cellWidth: 80 } },
      });

      // Tasks Table
      const tasksY = (doc as any).lastAutoTable.finalY + 15;
      doc.text("Tasks", 14, tasksY);

      const priorityLabels = { high: "🔴 High", medium: "🟡 Medium", low: "⚪ Low" };
      const statusLabels = { done: "✅ Done", pending: "⏳ Pending", skipped: "⏭️ Skipped" };

      const taskData = todos.map(todo => [
        todo.text,
        priorityLabels[todo.priority],
        statusLabels[todo.status],
        todo.duration_hours ? `${todo.duration_hours}h` : "-",
      ]);

      if (taskData.length > 0) {
        autoTable(doc, {
          startY: tasksY + 5,
          head: [["Task", "Priority", "Status", "Duration"]],
          body: taskData,
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 30 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
          },
        });
      }

      // Visual Timeline
      const timelineY = (doc as any).lastAutoTable.finalY + 15;
      doc.text("24-Hour Timeline", 14, timelineY);

      // Draw timeline bar
      const barY = timelineY + 8;
      const barWidth = 180;
      const barHeight = 12;
      
      // Background
      doc.setFillColor(229, 231, 235);
      doc.rect(14, barY, barWidth, barHeight, "F");

      // Sleep (6h = 25%)
      doc.setFillColor(129, 140, 248);
      doc.rect(14, barY, barWidth * 0.25, barHeight, "F");

      // Essentials (2h = 8.33%)
      doc.setFillColor(52, 211, 153);
      doc.rect(14 + barWidth * 0.25, barY, barWidth * 0.0833, barHeight, "F");

      // Planned tasks
      let currentX = 14 + barWidth * 0.3333;
      todos.filter(t => t.duration_hours).forEach(todo => {
        const width = ((todo.duration_hours || 0) / 24) * barWidth;
        if (todo.status === "done") {
          doc.setFillColor(34, 197, 94);
        } else if (todo.priority === "high") {
          doc.setFillColor(239, 68, 68);
        } else if (todo.priority === "medium") {
          doc.setFillColor(245, 158, 11);
        } else {
          doc.setFillColor(148, 163, 184);
        }
        doc.rect(currentX, barY, width, barHeight, "F");
        currentX += width;
      });

      // Time labels
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("12 AM", 14, barY + barHeight + 6);
      doc.text("6 AM", 14 + barWidth * 0.25, barY + barHeight + 6);
      doc.text("12 PM", 14 + barWidth * 0.5, barY + barHeight + 6);
      doc.text("6 PM", 14 + barWidth * 0.75, barY + barHeight + 6);
      doc.text("12 AM", 14 + barWidth - 10, barY + barHeight + 6);

      // Legend
      const legendY = barY + barHeight + 15;
      doc.setFontSize(8);
      
      doc.setFillColor(129, 140, 248);
      doc.rect(14, legendY, 8, 4, "F");
      doc.text("Sleep", 24, legendY + 3);

      doc.setFillColor(52, 211, 153);
      doc.rect(50, legendY, 8, 4, "F");
      doc.text("Essentials", 60, legendY + 3);

      doc.setFillColor(34, 197, 94);
      doc.rect(95, legendY, 8, 4, "F");
      doc.text("Completed", 105, legendY + 3);

      doc.setFillColor(245, 158, 11);
      doc.rect(140, legendY, 8, 4, "F");
      doc.text("Pending", 150, legendY + 3);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated by Chronyx on ${format(new Date(), "PPp")}`, 105, 285, { align: "center" });

      // Save
      doc.save(`schedule-${format(selectedDate, "yyyy-MM-dd")}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: `Schedule for ${dateStr} has been downloaded.`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generatePDF}>
      <FileDown className="w-4 h-4 mr-2" />
      Export PDF
    </Button>
  );
};

export default DailySchedulePDF;