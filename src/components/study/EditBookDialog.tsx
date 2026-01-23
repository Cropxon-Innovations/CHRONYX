import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Upload, X, ImageIcon, FileText, Loader2 } from "lucide-react";
import { LibraryItem } from "./LibraryGrid";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem | null;
  onSave: (data: {
    id: string;
    title: string;
    author: string;
    totalPages?: number;
    notes?: string;
    tags?: string[];
    coverFile?: File;
    coverUrl?: string;
  }) => void;
  isSaving?: boolean;
}

// Helper to extract metadata from PDF
const extractPdfMetadata = async (url: string): Promise<{ pages?: number; author?: string }> => {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const metadata = await pdf.getMetadata();
    
    return {
      pages: pdf.numPages,
      author: (metadata?.info as any)?.Author || undefined,
    };
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);
    return {};
  }
};

export const EditBookDialog = ({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: EditBookDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isExtractingMeta, setIsExtractingMeta] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NOTES_LIMIT = 200;

  // Fetch full item data from database when dialog opens
  useEffect(() => {
    if (item && open) {
      fetchFullItemData();
    }
  }, [item, open]);

  const fetchFullItemData = async () => {
    if (!item?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("id", item.id)
        .single();
      
      if (error) throw error;
      
      setTitle(data.title || "");
      setAuthor(data.author || "");
      setTotalPages(data.total_pages?.toString() || "");
      setNotes(data.notes || "");
      setTags(data.tags?.join(", ") || "");
      setCoverPreview(data.cover_url || null);
      setCoverFile(null);
      
      // Auto-fetch metadata if pages/author missing and it's a PDF
      if ((!data.total_pages || !data.author) && data.file_url && data.format === 'pdf') {
        setIsExtractingMeta(true);
        const metadata = await extractPdfMetadata(data.file_url);
        
        if (metadata.pages && !data.total_pages) {
          setTotalPages(metadata.pages.toString());
        }
        if (metadata.author && !data.author) {
          setAuthor(metadata.author);
        }
        setIsExtractingMeta(false);
      }
    } catch (error) {
      console.error("Error fetching item data:", error);
      // Fall back to passed item data
      setTitle(item.title || "");
      setAuthor(item.author || "");
      setTotalPages(item.total_pages?.toString() || "");
      setNotes((item as any).notes || "");
      setTags((item as any).tags?.join(", ") || "");
      setCoverPreview(item.cover_url || null);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!item || !title.trim() || !user) return;

    let finalCoverUrl = coverPreview;

    // If a new cover file was selected, upload it
    if (coverFile) {
      try {
        const coverPath = `${user.id}/covers/${Date.now()}_cover.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("library")
          .upload(coverPath, coverFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("library")
            .getPublicUrl(coverPath);
          finalCoverUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error("Cover upload error:", error);
      }
    }

    onSave({
      id: item.id,
      title: title.trim(),
      author: author.trim(),
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      notes: notes.trim().slice(0, NOTES_LIMIT) || undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      coverFile: coverFile || undefined,
      coverUrl: finalCoverUrl || undefined,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= NOTES_LIMIT) {
      setNotes(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            Edit Book Details
          </DialogTitle>
          <DialogDescription>
            Update the information for this item in your library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Cover Image Upload */}
          <div className="space-y-3">
            <Label>Book Cover</Label>
            <div className="flex items-start gap-4">
              <div 
                className={cn(
                  "relative w-24 h-32 rounded-lg border-2 border-dashed border-border overflow-hidden",
                  "flex items-center justify-center bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img 
                    src={coverPreview} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground">Add cover</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Cover
                </Button>
                {coverPreview && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={removeCover}
                    className="gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  Recommended: 300×400px, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="bg-card"
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-author">Author</Label>
              {isExtractingMeta && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-detecting...
                </span>
              )}
            </div>
            <Input
              id="edit-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="bg-card"
            />
          </div>

          {/* Total Pages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-pages">Total Pages</Label>
              {isExtractingMeta && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Counting...
                </span>
              )}
            </div>
            <Input
              id="edit-pages"
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Auto-detected from PDF"
              className="bg-card"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., programming, javascript, tutorial"
              className="bg-card"
            />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(",").map((tag, i) => tag.trim() && (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes with character limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-notes">Notes</Label>
              <span className={cn(
                "text-xs",
                notes.length > NOTES_LIMIT * 0.9 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {notes.length}/{NOTES_LIMIT}
              </span>
            </div>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Brief notes about this item..."
              className="bg-card min-h-[60px] resize-none"
              maxLength={NOTES_LIMIT}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
