import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Link2, Clock, Shield, Lock } from "lucide-react";

interface PDFExportOptions {
  includeLinkedData: boolean;
  includeTimestamps: boolean;
  addWatermark: boolean;
  hidePrivateMetadata: boolean;
}

interface PDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: PDFExportOptions) => void;
  noteTitle?: string;
}

export const PDFExportDialog = ({
  open,
  onOpenChange,
  onExport,
  noteTitle,
}: PDFExportDialogProps) => {
  const [options, setOptions] = useState<PDFExportOptions>({
    includeLinkedData: true,
    includeTimestamps: true,
    addWatermark: false,
    hidePrivateMetadata: false,
  });

  const handleExport = () => {
    onExport(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Export to PDF
          </DialogTitle>
          <DialogDescription>
            {noteTitle
              ? `Exporting "${noteTitle}" as a professional PDF document.`
              : "Configure your PDF export settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Include Linked Data */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="includeLinkedData"
              checked={options.includeLinkedData}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeLinkedData: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="includeLinkedData"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-muted-foreground" />
                Include linked data
              </Label>
              <p className="text-xs text-muted-foreground">
                Show linked insurance, loans, or other entities
              </p>
            </div>
          </div>

          {/* Include Timestamps */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="includeTimestamps"
              checked={options.includeTimestamps}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeTimestamps: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="includeTimestamps"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                Include timestamps
              </Label>
              <p className="text-xs text-muted-foreground">
                Show creation and last updated dates
              </p>
            </div>
          </div>

          {/* Add Watermark */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="addWatermark"
              checked={options.addWatermark}
              onCheckedChange={(checked) =>
                setOptions({ ...options, addWatermark: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="addWatermark"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-muted-foreground" />
                Add watermark
              </Label>
              <p className="text-xs text-muted-foreground">
                "Private & Confidential" watermark on each page
              </p>
            </div>
          </div>

          {/* Hide Private Metadata */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="hidePrivateMetadata"
              checked={options.hidePrivateMetadata}
              onCheckedChange={(checked) =>
                setOptions({ ...options, hidePrivateMetadata: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="hidePrivateMetadata"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                Hide private metadata
              </Label>
              <p className="text-xs text-muted-foreground">
                Exclude mood, location, and personal tags
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Your document, your control.</strong> PDFs are generated
            locally and include CHRONYX branding by Cropxon Innovations Pvt. Ltd.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
