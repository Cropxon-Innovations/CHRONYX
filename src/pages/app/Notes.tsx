import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Archive,
  Trash2,
  Edit2,
  FolderOpen,
  StickyNote,
  Lightbulb,
  BookOpen,
  Brain,
  Sparkles,
  MoreVertical,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  title: string;
  content: string | null;
  folder: string;
  is_pinned: boolean;
  is_archived: boolean;
  color: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const FOLDERS = [
  { name: "General", icon: StickyNote },
  { name: "Ideas", icon: Lightbulb },
  { name: "Projects", icon: FolderOpen },
  { name: "Learning", icon: BookOpen },
  { name: "Brainstorm", icon: Brain },
];

const COLORS = [
  "#ffffff", "#fef3c7", "#dcfce7", "#dbeafe", "#fce7f3", 
  "#f3e8ff", "#fed7aa", "#ccfbf1", "#fecaca", "#e0e7ff"
];

const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formFolder, setFormFolder] = useState("General");
  const [formColor, setFormColor] = useState("#ffffff");
  const [formTags, setFormTags] = useState("");
  
  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);
  
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setNotes(data as Note[]);
    }
    setLoading(false);
  };
  
  const createNote = async () => {
    if (!user || !formTitle.trim()) return;
    
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: formTitle.trim(),
        content: formContent,
        folder: formFolder,
        color: formColor,
        tags: formTags ? formTags.split(",").map(t => t.trim()) : null,
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    } else if (data) {
      setNotes([data as Note, ...notes]);
      resetForm();
      setIsCreating(false);
      toast({ title: "Note created" });
      logActivity(`Created note: ${formTitle.substring(0, 30)}`, "Notes");
    }
  };
  
  const updateNote = async () => {
    if (!editingNote || !formTitle.trim()) return;
    
    const { error } = await supabase
      .from("notes")
      .update({
        title: formTitle.trim(),
        content: formContent,
        folder: formFolder,
        color: formColor,
        tags: formTags ? formTags.split(",").map(t => t.trim()) : null,
      })
      .eq("id", editingNote.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    } else {
      setNotes(notes.map(n => n.id === editingNote.id ? {
        ...n,
        title: formTitle.trim(),
        content: formContent,
        folder: formFolder,
        color: formColor,
        tags: formTags ? formTags.split(",").map(t => t.trim()) : null,
        updated_at: new Date().toISOString(),
      } : n));
      resetForm();
      setEditingNote(null);
      toast({ title: "Note updated" });
    }
  };
  
  const togglePin = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id);
    
    if (!error) {
      setNotes(notes.map(n => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n));
    }
  };
  
  const toggleArchive = async (note: Note) => {
    const { error } = await supabase
      .from("notes")
      .update({ is_archived: !note.is_archived })
      .eq("id", note.id);
    
    if (!error) {
      setNotes(notes.map(n => n.id === note.id ? { ...n, is_archived: !n.is_archived } : n));
      toast({ title: note.is_archived ? "Note unarchived" : "Note archived" });
    }
  };
  
  const deleteNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    const { error } = await supabase.from("notes").delete().eq("id", id);
    
    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
      toast({ title: "Note deleted" });
      if (note) logActivity(`Deleted note: ${note.title.substring(0, 30)}`, "Notes");
    }
  };
  
  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormFolder("General");
    setFormColor("#ffffff");
    setFormTags("");
  };
  
  const openEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content || "");
    setFormFolder(note.folder);
    setFormColor(note.color);
    setFormTags(note.tags?.join(", ") || "");
  };
  
  const filteredNotes = notes.filter(note => {
    if (note.is_archived !== showArchived) return false;
    if (selectedFolder && note.folder !== selectedFolder) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });
  
  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const otherNotes = filteredNotes.filter(n => !n.is_pinned);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Notes & Ideas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture your thoughts, brainstorm ideas, and organize your knowledge
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </header>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {FOLDERS.map(folder => (
            <Button
              key={folder.name}
              variant={selectedFolder === folder.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder(selectedFolder === folder.name ? null : folder.name)}
              className="gap-1"
            >
              <folder.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{folder.name}</span>
            </Button>
          ))}
          <Button
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Notes Grid */}
      <div className="space-y-6">
        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Pin className="w-4 h-4" />
              Pinned
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinnedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => openEdit(note)}
                  onPin={() => togglePin(note)}
                  onArchive={() => toggleArchive(note)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Other Notes */}
        {otherNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Others</h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {otherNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => openEdit(note)}
                  onPin={() => togglePin(note)}
                  onArchive={() => toggleArchive(note)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showArchived ? "No archived notes" : "No notes yet. Create your first note!"}
            </p>
          </div>
        )}
      </div>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingNote} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingNote(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Note title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="text-lg font-medium"
            />
            
            <Textarea
              placeholder="Start writing..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            
            <div className="flex flex-wrap gap-4">
              <Select value={formFolder} onValueChange={setFormFolder}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map(f => (
                    <SelectItem key={f.name} value={f.name}>
                      <span className="flex items-center gap-2">
                        <f.icon className="w-4 h-4" />
                        {f.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Color:</span>
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform",
                      formColor === color ? "scale-125 border-primary" : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <Input
              placeholder="Tags (comma separated)..."
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingNote(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={editingNote ? updateNote : createNote}>
                {editingNote ? "Save Changes" : "Create Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const NoteCard = ({ note, onEdit, onPin, onArchive, onDelete }: NoteCardProps) => {
  const folder = FOLDERS.find(f => f.name === note.folder);
  const FolderIcon = folder?.icon || StickyNote;
  
  return (
    <div
      className="group bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
      style={{ backgroundColor: note.color !== "#ffffff" ? note.color : undefined }}
      onClick={onEdit}
    >
      {/* Pin indicator */}
      {note.is_pinned && (
        <Pin className="absolute top-2 right-2 w-4 h-4 text-primary" />
      )}
      
      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground line-clamp-2">{note.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
                {note.is_pinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                <Archive className="w-4 h-4 mr-2" />
                {note.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {note.content && (
          <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
            {note.content}
          </p>
        )}
        
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {note.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FolderIcon className="w-3 h-3" />
            {note.folder}
          </div>
          <span>{format(new Date(note.updated_at), "MMM d")}</span>
        </div>
      </div>
    </div>
  );
};

export default Notes;
