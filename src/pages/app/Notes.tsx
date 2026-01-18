import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NoteTypeSelector, NoteType } from "@/components/notes/NoteTypeSelector";
import { SmartSections, SmartSection, SMART_SECTIONS } from "@/components/notes/SmartSections";
import { NoteCard, NoteData } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotesTimeline } from "@/components/notes/NotesTimeline";
import { Emotion } from "@/components/notes/EmotionSelector";
import { LinkedEntity } from "@/components/notes/LinkedEntitySuggestion";
import { handleExport } from "@/components/notes/NoteExport";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  LayoutGrid, 
  Clock,
  Sparkles,
  Pin
} from "lucide-react";

type ViewMode = "grid" | "timeline";

const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  // State
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<SmartSection>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Type selection dialog
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<NoteType | null>(null);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes
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
      setNotes(data as unknown as NoteData[]);
    }
    setLoading(false);
  };

  // Filter notes based on section and search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Archive filter
      if (selectedSection === "archived") {
        if (!note.is_archived) return false;
      } else {
        if (note.is_archived) return false;
      }

      // Type filter
      if (selectedSection !== "recent" && selectedSection !== "archived") {
        const sectionConfig = SMART_SECTIONS.find(s => s.id === selectedSection);
        if (sectionConfig?.filterType && note.type !== sectionConfig.filterType) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const contentMatch = note.content?.toLowerCase().includes(query);
        const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(query));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [notes, selectedSection, searchQuery]);

  // Note counts for sections
  const noteCounts = useMemo(() => {
    const counts: Record<SmartSection, number> = {
      recent: notes.filter(n => !n.is_archived).length,
      quick_note: notes.filter(n => !n.is_archived && n.type === "quick_note").length,
      journal: notes.filter(n => !n.is_archived && n.type === "journal").length,
      document: notes.filter(n => !n.is_archived && n.type === "document").length,
      finance_note: notes.filter(n => !n.is_archived && n.type === "finance_note").length,
      memory_note: notes.filter(n => !n.is_archived && n.type === "memory_note").length,
      tax_note: notes.filter(n => !n.is_archived && n.type === "tax_note").length,
      story: notes.filter(n => !n.is_archived && n.type === "story").length,
      archived: notes.filter(n => n.is_archived).length,
    };
    return counts;
  }, [notes]);

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  // Handlers
  const handleCreateNote = (type: NoteType) => {
    setSelectedType(type);
    setEditingNote(null);
    setShowTypeSelector(false);
    setIsEditing(true);
  };

  const handleEditNote = (note: NoteData) => {
    setEditingNote(note);
    setSelectedType(note.type || "quick_note");
    setIsEditing(true);
  };

  const handleSaveNote = async (data: {
    title: string;
    content_json: string;
    type: NoteType;
    emotion?: Emotion;
    location?: string;
    linked_entities: LinkedEntity[];
  }) => {
    if (!user) return;
    setIsSaving(true);

    try {
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from("notes")
          .update({
            title: data.title,
            content_json: data.content_json as any,
            type: data.type,
            emotion: data.emotion || null,
            location: data.location || null,
            linked_entities: data.linked_entities as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNote.id);

        if (error) throw error;

        setNotes(notes.map(n => 
          n.id === editingNote.id 
            ? { ...n, ...data, updated_at: new Date().toISOString() } 
            : n
        ));
        toast({ title: "Note updated" });
      } else {
        // Create new note
        const { data: newNote, error } = await supabase
          .from("notes")
          .insert([{
            user_id: user.id,
            title: data.title,
            content_json: data.content_json as any,
            type: data.type,
            emotion: data.emotion || null,
            location: data.location || null,
            linked_entities: data.linked_entities as any,
          }])
          .select()
          .single();

        if (error) throw error;

        setNotes([newNote as unknown as NoteData, ...notes]);
        toast({ title: "Note created" });
        logActivity(`Created note: ${data.title.substring(0, 30)}`, "Notes");
      }

      setIsEditing(false);
      setEditingNote(null);
      setSelectedType(null);
    } catch (error) {
      console.error("Error saving note:", error);
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinNote = async (note: NoteData) => {
    const { error } = await supabase
      .from("notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id);

    if (!error) {
      setNotes(notes.map(n => 
        n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n
      ));
    }
  };

  const handleArchiveNote = async (note: NoteData) => {
    const { error } = await supabase
      .from("notes")
      .update({ is_archived: !note.is_archived })
      .eq("id", note.id);

    if (!error) {
      setNotes(notes.map(n => 
        n.id === note.id ? { ...n, is_archived: !n.is_archived } : n
      ));
      toast({ title: note.is_archived ? "Note unarchived" : "Note archived" });
    }
  };

  const handleDeleteNote = async (note: NoteData) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", note.id);

    if (!error) {
      setNotes(notes.filter(n => n.id !== note.id));
      toast({ title: "Note deleted" });
      logActivity(`Deleted note: ${note.title?.substring(0, 30)}`, "Notes");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  // Editor view
  if (isEditing && selectedType) {
    return (
      <NoteEditor
        noteId={editingNote?.id}
        noteType={selectedType}
        initialTitle={editingNote?.title || ""}
        initialContent={editingNote?.content_json ? JSON.stringify(editingNote.content_json) : ""}
        initialEmotion={editingNote?.emotion as Emotion | undefined}
        initialLocation={editingNote?.location || ""}
        initialLinkedEntities={(editingNote?.linked_entities as LinkedEntity[]) || []}
        onSave={handleSaveNote}
        onClose={() => {
          setIsEditing(false);
          setEditingNote(null);
          setSelectedType(null);
        }}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-foreground tracking-wide flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            CHRONYX Notes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your private life record — thoughts, memories, finances, and decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-xl p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "timeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("timeline")}
              className="h-8 px-3"
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={() => setShowTypeSelector(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Smart Sections Sidebar */}
        <SmartSections
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          noteCounts={noteCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Notes Area */}
        <div className="flex-1 min-w-0">
          {viewMode === "timeline" ? (
            <NotesTimeline
              notes={filteredNotes}
              onEditNote={handleEditNote}
              onPinNote={handlePinNote}
              onArchiveNote={handleArchiveNote}
              onDeleteNote={handleDeleteNote}
            />
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    Pinned
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => handleEditNote(note)}
                        onPin={() => handlePinNote(note)}
                        onArchive={() => handleArchiveNote(note)}
                        onDelete={() => handleDeleteNote(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Notes */}
              {unpinnedNotes.length > 0 && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Others</h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {unpinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={() => handleEditNote(note)}
                        onPin={() => handlePinNote(note)}
                        onArchive={() => handleArchiveNote(note)}
                        onDelete={() => handleDeleteNote(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">
                    {selectedSection === "archived" ? "No archived notes" : "No notes yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedSection === "archived" 
                      ? "Archived notes will appear here" 
                      : "Create your first note to get started"}
                  </p>
                  {selectedSection !== "archived" && (
                    <Button onClick={() => setShowTypeSelector(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Type Selector Dialog */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Choose Note Type</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-6">
              Select the type of note you want to create. This helps organize your content and enables smart features.
            </p>
            <NoteTypeSelector
              selectedType={null}
              onSelect={handleCreateNote}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
