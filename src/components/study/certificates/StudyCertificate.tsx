import { useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Award,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface CertificateData {
  id: string;
  certificateNumber: string;
  recipientName: string;
  courseName: string;
  completionDate: Date;
  issuerName: string;
  issuerTitle: string;
}

interface Props {
  certificate: CertificateData;
  onClose?: () => void;
}

export const StudyCertificate = ({ certificate, onClose }: Props) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    // Background gradient effect
    pdf.setFillColor(253, 251, 247);
    pdf.rect(0, 0, width, height, "F");

    // Border
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, width - 20, height - 20);
    
    // Inner border
    pdf.setLineWidth(0.5);
    pdf.rect(15, 15, width - 30, height - 30);

    // Corner decorations
    const cornerSize = 15;
    pdf.setLineWidth(1);
    // Top left
    pdf.line(15, 25, 15 + cornerSize, 25);
    pdf.line(25, 15, 25, 15 + cornerSize);
    // Top right
    pdf.line(width - 15 - cornerSize, 25, width - 15, 25);
    pdf.line(width - 25, 15, width - 25, 15 + cornerSize);
    // Bottom left
    pdf.line(15, height - 25, 15 + cornerSize, height - 25);
    pdf.line(25, height - 15, 25, height - 15 - cornerSize);
    // Bottom right
    pdf.line(width - 15 - cornerSize, height - 25, width - 15, height - 25);
    pdf.line(width - 25, height - 15, width - 25, height - 15 - cornerSize);

    // Header: OriginX Labs
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text("ORIGINX LABS PRIVATE LIMITED", width / 2, 35, { align: "center" });

    // Title
    pdf.setFontSize(36);
    pdf.setTextColor(33, 33, 33);
    pdf.text("Certificate of Completion", width / 2, 55, { align: "center" });

    // Decorative line
    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.8);
    pdf.line(width / 2 - 60, 62, width / 2 + 60, 62);

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text("This is to certify that", width / 2, 80, { align: "center" });

    // Recipient name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(33, 33, 33);
    pdf.text(certificate.recipientName, width / 2, 95, { align: "center" });

    // Completion text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text("has successfully completed the course", width / 2, 110, { align: "center" });

    // Course name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(99, 102, 241);
    pdf.text(certificate.courseName, width / 2, 125, { align: "center" });

    // Date
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Completed on ${format(certificate.completionDate, "MMMM d, yyyy")}`, width / 2, 140, { align: "center" });

    // Signature section
    const sigY = height - 55;
    
    // Signature line
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.5);
    pdf.line(width / 2 - 40, sigY, width / 2 + 40, sigY);

    // Signature text
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(33, 33, 33);
    pdf.text(certificate.issuerName, width / 2, sigY + 8, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(certificate.issuerTitle, width / 2, sigY + 15, { align: "center" });

    // Certificate ID
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Certificate ID: ${certificate.certificateNumber}`, width / 2, height - 25, { align: "center" });
    pdf.text("Verify at: chronyx.originxlabs.com/verify", width / 2, height - 20, { align: "center" });

    // Save
    pdf.save(`${certificate.courseName.replace(/\s+/g, '-')}-Certificate.pdf`);
  };

  const shareURL = `${window.location.origin}/verify/${certificate.certificateNumber}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${certificate.courseName}`,
          text: `I completed ${certificate.courseName} on Chronyx!`,
          url: shareURL
        });
      } catch (err) {
        navigator.clipboard.writeText(shareURL);
      }
    } else {
      navigator.clipboard.writeText(shareURL);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <Card 
        ref={certificateRef}
        className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border-2 border-amber-300/50 dark:border-amber-600/30"
      >
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-amber-400/60" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-amber-400/60" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-amber-400/60" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-amber-400/60" />

        <div className="p-8 sm:p-12 text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4"
          >
            <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              OriginX Labs Private Limited
            </p>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">
              Certificate of Completion
            </h1>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-4"
          >
            <p className="text-muted-foreground">This is to certify that</p>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {certificate.recipientName}
            </h2>
            
            <p className="text-muted-foreground">has successfully completed the course</p>
            
            <h3 className="text-xl sm:text-2xl font-semibold text-primary">
              {certificate.courseName}
            </h3>
            
            <p className="text-sm text-muted-foreground">
              Completed on {format(certificate.completionDate, "MMMM d, yyyy")}
            </p>
          </motion.div>

          {/* Signature */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 pt-6 border-t border-border/30"
          >
            <div className="flex flex-col items-center">
              <div className="w-40 h-0.5 bg-foreground/30 mb-2" />
              <p className="font-semibold text-foreground">{certificate.issuerName}</p>
              <p className="text-sm text-muted-foreground">{certificate.issuerTitle}</p>
            </div>
          </motion.div>

          {/* Certificate ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Verified Certificate
            </span>
            <span className="hidden sm:inline">•</span>
            <span>ID: {certificate.certificateNumber}</span>
          </motion.div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={downloadPDF} className="flex-1 gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        <Button onClick={handleShare} variant="outline" className="flex-1 gap-2">
          <Share2 className="w-4 h-4" />
          Share Certificate
        </Button>
      </div>
    </div>
  );
};

export default StudyCertificate;
