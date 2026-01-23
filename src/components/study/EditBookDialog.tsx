import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Upload, X, ImageIcon } from "lucide-react";
import { LibraryItem } from "./LibraryGrid";
import { cn } from "@/lib/utils";

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
  }) => void;
  isSaving?: boolean;
}

export const EditBookDialog = ({
  open,
  onOpenChange,
  item,
  onSave,
  isSaving,
}: EditBookDialogProps) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setAuthor(item.author || "");
      setTotalPages(item.total_pages?.toString() || "");
      setNotes((item as any).notes || "");
      setTags((item as any).tags?.join(", ") || "");
      setCoverPreview(item.cover_url || null);
      setCoverFile(null);
    }
  }, [item]);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
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

  const handleSubmit = () => {
    if (!item || !title.trim()) return;

    onSave({
      id: item.id,
      title: title.trim(),
      author: author.trim(),
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      notes: notes.trim() || undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      coverFile: coverFile || undefined,
    });
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
              {/* Cover Preview */}
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
            <Label htmlFor="edit-author">Author</Label>
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
            <Label htmlFor="edit-pages">Total Pages</Label>
            <Input
              id="edit-pages"
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Optional"
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
              placeholder="Comma-separated tags"
              className="bg-card"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes about this item..."
              className="bg-card min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};