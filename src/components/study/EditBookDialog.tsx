import { useState, useEffect } from "react";
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
import { Edit2 } from "lucide-react";
import { LibraryItem } from "./LibraryGrid";

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

  useEffect(() => {
    if (item) {
      setTitle(item.title || "");
      setAuthor(item.author || "");
      setTotalPages(item.total_pages?.toString() || "");
      setNotes((item as any).notes || "");
      setTags((item as any).tags?.join(", ") || "");
    }
  }, [item]);

  const handleSubmit = () => {
    if (!item || !title.trim()) return;

    onSave({
      id: item.id,
      title: title.trim(),
      author: author.trim(),
      totalPages: totalPages ? parseInt(totalPages) : undefined,
      notes: notes.trim() || undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-primary" />
            Edit Book Details
          </DialogTitle>
          <DialogDescription>
            Update the information for this item in your library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="bg-card"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-author">Author</Label>
            <Input
              id="edit-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="bg-card"
            />
          </div>

          <div className="grid gap-2">
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

          <div className="grid gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
              className="bg-card"
            />
          </div>

          <div className="grid gap-2">
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

        <DialogFooter>
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
