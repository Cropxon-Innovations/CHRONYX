import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, FileText, Download, Trash2, Eye, Share2, Mail, MessageCircle } from "lucide-react";
import { UploadProgress } from "@/components/ui/upload-progress";

interface InsuranceDocumentsProps {
  insuranceId: string;
}

const DOCUMENT_TYPES = [
  { value: "policy", label: "Policy Document" },
  { value: "premium_receipt", label: "Premium Receipt" },
  { value: "renewal_notice", label: "Renewal Notice" },
  { value: "claim_form", label: "Claim Form" },
  { value: "id_proof", label: "ID Proof" },
  { value: "other", label: "Other" },
];

export const InsuranceDocuments = ({ insuranceId }: InsuranceDocumentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState("policy");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<"idle" | "preparing" | "uploading" | "processing" | "complete" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["insurance-documents", insuranceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurance_documents")
        .select("*")
        .eq("insurance_id", insuranceId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("User not authenticated");
      
      setUploadStage("preparing");
      setUploadProgress(0);
      setUploadMessage("Preparing upload...");
      
      // Use user.id in path for better organization and RLS compliance
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${insuranceId}/${timestamp}_${safeFileName}`;

      setUploadStage("uploading");
      setUploadMessage(`Uploading ${file.name}...`);
      
      // Simulate progress since Supabase doesn't provide native progress events
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("insurance-documents")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        clearInterval(progressInterval);

        if (uploadError) {
          throw uploadError;
        }

        setUploadProgress(95);
        setUploadStage("processing");
        setUploadMessage("Saving document...");

        // Get a signed URL since the bucket is private
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("insurance-documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedUrlError) {
          // Try to get public URL as fallback
          const { data: publicUrlData } = supabase.storage
            .from("insurance-documents")
            .getPublicUrl(filePath);
          
          // Use public URL if signed URL fails
          const finalUrl = signedUrlData?.signedUrl || publicUrlData.publicUrl;
          
          const { error: dbError } = await supabase.from("insurance_documents").insert({
            insurance_id: insuranceId,
            file_name: file.name,
            file_url: finalUrl,
            file_type: file.type,
            document_type: selectedType,
          });

          if (dbError) throw dbError;
        } else {
          const { error: dbError } = await supabase.from("insurance_documents").insert({
            insurance_id: insuranceId,
            file_name: file.name,
            file_url: signedUrlData.signedUrl,
            file_type: file.type,
            document_type: selectedType,
          });

          if (dbError) throw dbError;
        }

        setUploadProgress(100);
        setUploadStage("complete");
        setUploadMessage("Upload complete!");
        
        // Reset after 2 seconds
        setTimeout(() => {
          setUploadStage("idle");
          setUploadProgress(0);
          setUploadMessage("");
        }, 2000);
        
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-documents", insuranceId] });
      toast({ title: "Document uploaded successfully" });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setUploadStage("error");
      setUploadMessage("Upload failed. Please try again.");
      toast({ title: "Upload failed", description: String(error), variant: "destructive" });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStage("idle");
        setUploadProgress(0);
        setUploadMessage("");
      }, 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("insurance_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-documents", insuranceId] });
      toast({ title: "Document deleted" });
    },
    onError: () => {
      toast({ title: "Delete failed", variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File must be less than 20MB", variant: "destructive" });
      return;
    }

    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  const handleShare = (doc: typeof documents[0], method: "whatsapp" | "email") => {
    const message = `Insurance Document: ${doc.file_name}\n${doc.file_url}`;
    
    if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    } else if (method === "email") {
      window.location.href = `mailto:?subject=Insurance Document: ${doc.file_name}&body=${encodeURIComponent(message)}`;
    }
  };

  const handlePreview = (doc: typeof documents[0]) => {
    setPreviewUrl(doc.file_url);
    setPreviewType(doc.file_type);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    return "📎";
  };

  const getDocTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isUploading = uploadStage !== "idle";

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-background border-border">
              <SelectValue placeholder="Document type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input
            ref={fileInputRef}
            type="file"
            id="insurance-doc-upload"
            className="hidden"
            onChange={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={isUploading}
          />
          <label htmlFor="insurance-doc-upload">
            <Button
              variant="outline"
              className="border-border cursor-pointer"
              disabled={isUploading}
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </span>
            </Button>
          </label>
        </div>
        
        {/* Upload Progress */}
        {isUploading && (
          <UploadProgress
            progress={uploadProgress}
            stage={uploadStage}
            message={uploadMessage}
            variant="bar"
            size="md"
            showPercentage={true}
          />
        )}
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No documents uploaded yet
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xl">{getFileIcon(doc.file_type)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDocTypeLabel(doc.document_type)} •{" "}
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePreview(doc)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(doc.file_url, doc.file_name)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={() => handleShare(doc, "whatsapp")}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(doc, "email")}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm("Delete this document?")) {
                      deleteMutation.mutate(doc.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewType === "application/pdf" ? (
              <iframe src={previewUrl || ""} className="w-full h-[70vh]" />
            ) : previewType.startsWith("image/") ? (
              <img
                src={previewUrl || ""}
                alt="Preview"
                className="max-w-full h-auto mx-auto"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Preview not available for this file type
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
