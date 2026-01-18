import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  Download, 
  Trash2, 
  Printer,
  MoreVertical,
  Calendar,
  AlertCircle,
  Lock,
  FileText,
  Image as ImageIcon,
  File,
  Copy,
  Send,
  FileImage,
  FileSpreadsheet,
  FileType,
  FileArchive,
  HardDrive
} from "lucide-react";
import { format, isBefore, addMonths } from "date-fns";

interface Document {
  id: string;
  document_type: string;
  category: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  is_locked: boolean | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

interface DocumentCardProps {
  document: Document;
  categoryIcon?: string;
  categoryColor?: string;
  onDelete: (id: string) => void;
  onPreview: (doc: Document) => void;
}

// Get file extension from filename or URL
const getFileExtension = (url: string, mimeType?: string | null): string => {
  if (mimeType) {
    const ext = mimeType.split('/')[1];
    if (ext) return ext.toUpperCase();
  }
  const urlParts = url.split('.');
  const ext = urlParts[urlParts.length - 1]?.split('?')[0];
  return ext?.toUpperCase() || 'FILE';
};

// Get icon and color based on file type
const getFileTypeInfo = (mimeType?: string | null, url?: string) => {
  const type = mimeType?.toLowerCase() || '';
  const ext = getFileExtension(url || '', mimeType).toLowerCase();
  
  if (type.includes('pdf') || ext === 'pdf') {
    return { icon: FileText, color: '#ef4444', label: 'PDF' };
  }
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return { icon: FileImage, color: '#22c55e', label: ext.toUpperCase() };
  }
  if (type.includes('spreadsheet') || type.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) {
    return { icon: FileSpreadsheet, color: '#22c55e', label: ext.toUpperCase() };
  }
  if (type.includes('word') || type.includes('document') || ['doc', 'docx'].includes(ext)) {
    return { icon: FileType, color: '#3b82f6', label: ext.toUpperCase() };
  }
  if (type.includes('zip') || type.includes('archive') || ['zip', 'rar', '7z'].includes(ext)) {
    return { icon: FileArchive, color: '#f97316', label: ext.toUpperCase() };
  }
  return { icon: File, color: '#6366f1', label: ext.toUpperCase() || 'FILE' };
};

const DocumentCard = ({ document, categoryIcon, categoryColor, onDelete, onPreview }: DocumentCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);

  const fileTypeInfo = getFileTypeInfo(document.file_type, document.file_url);
  const FileIcon = fileTypeInfo.icon;
  const color = categoryColor || fileTypeInfo.color;

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const warningDate = addMonths(now, 3);
    
    if (isBefore(expiry, now)) return "expired";
    if (isBefore(expiry, warningDate)) return "expiring";
    return "valid";
  };

  const expiryStatus = getExpiryStatus(document.expiry_date);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleDownload = async () => {
    try {
      const filePath = document.file_url.split("/documents/")[1];
      if (!filePath) {
        window.open(document.file_url, "_blank");
        return;
      }
      
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60);
      
      if (data?.signedUrl) {
        const link = window.document.createElement("a");
        link.href = data.signedUrl;
        link.download = document.title;
        link.click();
      }
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handlePrint = async () => {
    try {
      const filePath = document.file_url.split("/documents/")[1];
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath || document.file_url, 3600);
      
      if (data?.signedUrl) {
        const printWindow = window.open(data.signedUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => printWindow.print();
        }
      }
    } catch (error) {
      toast({ title: "Print failed", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    
    setSharing(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", shareEmail.trim())
        .single();

      const { error } = await supabase.from("document_shares").insert({
        document_id: document.id,
        shared_by: user?.id,
        shared_with_email: shareEmail.trim(),
        shared_with_user_id: profiles?.id || null,
        access_type: "view"
      });

      if (error) throw error;

      toast({ title: "Document shared successfully" });
      setShareOpen(false);
      setShareEmail("");
    } catch (error: any) {
      toast({ title: "Share failed", description: error.message, variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const filePath = document.file_url.split("/documents/")[1];
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath || document.file_url, 86400);
      
      if (data?.signedUrl) {
        await navigator.clipboard.writeText(data.signedUrl);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error) {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const fileSize = formatFileSize(document.file_size);
  const fileExtension = getFileExtension(document.file_url, document.file_type);

  return (
    <>
      <Card className="group bg-card/60 border-border/40 hover:bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden">
        <CardContent className="p-3">
          {/* Header with Icon & Title */}
          <div className="flex items-start gap-3 mb-2">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${fileTypeInfo.color}15` }}
            >
              <FileIcon className="h-4 w-4" style={{ color: fileTypeInfo.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate leading-tight">{document.title}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{document.document_type}</p>
            </div>
            <div className="flex items-center gap-1">
              {document.is_locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                  <DropdownMenuItem onClick={() => onPreview(document)} className="text-xs">
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload} className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint} className="text-xs">
                    <Printer className="h-3.5 w-3.5 mr-2" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShareOpen(true)} className="text-xs">
                    <Send className="h-3.5 w-3.5 mr-2" />
                    Share with User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink} className="text-xs">
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Copy Link (24h)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      if (confirm("Delete this document?")) {
                        onDelete(document.id);
                      }
                    }}
                    className="text-destructive focus:text-destructive text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* File Info Row */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className="text-[10px] px-1.5 py-0 h-5 rounded-md font-medium"
              style={{ backgroundColor: `${fileTypeInfo.color}15`, color: fileTypeInfo.color }}
            >
              {fileExtension}
            </Badge>
            {fileSize && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <HardDrive className="h-3 w-3" />
                <span>{fileSize}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-1 text-[10px] text-muted-foreground mb-2">
            {document.issue_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>Issued: {format(new Date(document.issue_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {document.expiry_date && (
              <div className="flex items-center gap-1.5">
                {expiryStatus === "expired" && <AlertCircle className="h-3 w-3 text-destructive" />}
                {expiryStatus === "expiring" && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                {expiryStatus === "valid" && <Calendar className="h-3 w-3" />}
                <span className={expiryStatus === "expired" ? "text-destructive" : expiryStatus === "expiring" ? "text-yellow-500" : ""}>
                  Expires: {format(new Date(document.expiry_date), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {expiryStatus && (
            <Badge 
              variant={expiryStatus === "expired" ? "destructive" : expiryStatus === "expiring" ? "secondary" : "outline"}
              className="text-[10px] px-1.5 py-0 h-4 rounded-md mb-2"
            >
              {expiryStatus === "expired" ? "Expired" : expiryStatus === "expiring" ? "Expiring Soon" : "Valid"}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex gap-1.5 pt-2 border-t border-border/30">
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={() => onPreview(document)}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={handleDownload}>
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Share with Chronyx User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>User Email</Label>
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="rounded-xl"
              />
            </div>
            <Button 
              onClick={handleShare} 
              disabled={!shareEmail.trim() || sharing}
              className="w-full rounded-xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {sharing ? "Sharing..." : "Share Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentCard;
