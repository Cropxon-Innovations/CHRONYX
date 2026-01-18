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
  Share2, 
  Printer,
  MoreVertical,
  Calendar,
  AlertCircle,
  Lock,
  FileText,
  Image as ImageIcon,
  File,
  Copy,
  ExternalLink,
  Send
} from "lucide-react";
import { format, isAfter, isBefore, addMonths } from "date-fns";
import { getIconComponent } from "./DocumentCategoryManager";

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

const DocumentCard = ({ document, categoryIcon, categoryColor, onDelete, onPreview }: DocumentCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);

  const IconComponent = getIconComponent(categoryIcon || "FileText");
  const color = categoryColor || "#6366f1";

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

  const getFileIcon = () => {
    const type = document.file_type?.toLowerCase() || "";
    if (type.includes("pdf")) return <FileText className="h-5 w-5" style={{ color }} />;
    if (type.includes("image")) return <ImageIcon className="h-5 w-5" style={{ color }} />;
    return <File className="h-5 w-5" style={{ color }} />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      // Check if user exists
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", shareEmail.trim())
        .single();

      // Create share record
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
        .createSignedUrl(filePath || document.file_url, 86400); // 24 hours
      
      if (data?.signedUrl) {
        await navigator.clipboard.writeText(data.signedUrl);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error) {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <>
      <Card className="group bg-card/50 border-border/50 hover:bg-muted/30 hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${color}15` }}
              >
                {getFileIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate pr-2">{document.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{document.document_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {document.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onPreview(document)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <Send className="h-4 w-4 mr-2" />
                    Share with User
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link (24h)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      if (confirm("Delete this document?")) {
                        onDelete(document.id);
                      }
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground mb-3">
            {document.issue_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Issued: {format(new Date(document.issue_date), "MMM d, yyyy")}</span>
              </div>
            )}
            {document.expiry_date && (
              <div className="flex items-center gap-2">
                {expiryStatus === "expired" && <AlertCircle className="h-3 w-3 text-destructive" />}
                {expiryStatus === "expiring" && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                <span className={expiryStatus === "expired" ? "text-destructive" : expiryStatus === "expiring" ? "text-yellow-500" : ""}>
                  Expires: {format(new Date(document.expiry_date), "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="text-muted-foreground/70">
              {formatFileSize(document.file_size)}
            </div>
          </div>

          {expiryStatus && (
            <Badge 
              variant={expiryStatus === "expired" ? "destructive" : expiryStatus === "expiring" ? "secondary" : "outline"}
              className="mb-3"
            >
              {expiryStatus === "expired" ? "Expired" : expiryStatus === "expiring" ? "Expiring Soon" : "Valid"}
            </Badge>
          )}

          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => onPreview(document)}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
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
              />
            </div>
            <Button 
              onClick={handleShare} 
              disabled={!shareEmail.trim() || sharing}
              className="w-full"
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
