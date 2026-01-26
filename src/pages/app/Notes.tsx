import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NoteTypeSelector, NoteType } from "@/components/notes/NoteTypeSelector";
import { NoteCard, NoteData } from "@/components/notes/NoteCard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotesTimeline } from "@/components/notes/NotesTimeline";
import { QuickNotesGrid } from "@/components/notes/QuickNotesGrid";
import { DailyReflection } from "@/components/notes/DailyReflection";
import { Emotion } from "@/components/notes/EmotionSelector";
import { LinkedEntity } from "@/components/notes/LinkedEntitySuggestion";
import { 
  NoteflowHeader, 
  NoteflowSidebar, 
  NoteflowDailyNote,
  NoteflowSearch,
  type NoteflowViewMode,
  type SidebarSection,
  type SmartFilter
} from "@/components/noteflow";
import { cn } from "@/lib/utils";
import { 
  Pin,
  Sparkles,
  Plus,
  FolderTree
} from "lucide-react";
import { isToday, isYesterday, isThisWeek, isThisMonth, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";

const Notes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  // State
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<SidebarSection>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<NoteflowViewMode>("grid");
  const [showSearch, setShowSearch] = useState(false);
  
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

  // Extract all unique tags and folders
  const { allTags, allFolders } = useMemo(() => {
    const tagSet = new Set<string>();
    const folderSet = new Set<string>();
    
    notes.forEach((note) => {
      note.tags?.forEach((tag) => tagSet.add(tag));
      if (note.folder) folderSet.add(note.folder);
    });

    return {
      allTags: Array.from(tagSet).sort(),
      allFolders: Array.from(folderSet).sort(),
    };
  }, [notes]);

  // Calculate counts for sidebar
  const counts = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const filters: Record<SmartFilter, number> = {
      all: notes.filter(n => !n.is_archived).length,
      today: notes.filter(n => !n.is_archived && isToday(new Date(n.updated_at))).length,
      yesterday: notes.filter(n => !n.is_archived && isYesterday(new Date(n.updated_at))).length,
      this_week: notes.filter(n => !n.is_archived && isThisWeek(new Date(n.updated_at))).length,
      this_month: notes.filter(n => !n.is_archived && isThisMonth(new Date(n.updated_at))).length,
      untagged: notes.filter(n => !n.is_archived && (!n.tags || n.tags.length === 0)).length,
      with_links: notes.filter(n => !n.is_archived && n.linked_entities?.length > 0).length,
      archived: notes.filter(n => n.is_archived).length,
    };

    const types: Record<NoteType, number> = {
      quick_note: notes.filter(n => !n.is_archived && n.type === "quick_note").length,
      journal: notes.filter(n => !n.is_archived && n.type === "journal").length,
      document: notes.filter(n => !n.is_archived && n.type === "document").length,
      finance_note: notes.filter(n => !n.is_archived && n.type === "finance_note").length,
      memory_note: notes.filter(n => !n.is_archived && n.type === "memory_note").length,
      tax_note: notes.filter(n => !n.is_archived && n.type === "tax_note").length,
      story: notes.filter(n => !n.is_archived && n.type === "story").length,
    };

    const tags: Record<string, number> = {};
    allTags.forEach((tag) => {
      tags[tag] = notes.filter(n => !n.is_archived && n.tags?.includes(tag)).length;
    });

    const folders: Record<string, number> = {};
    allFolders.forEach((folder) => {
      folders[folder] = notes.filter(n => !n.is_archived && n.folder === folder).length;
    });

    return { filters, types, tags, folders };
  }, [notes, allTags, allFolders]);

  // Filter notes based on section and search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Archive filter
      if (selectedSection === "archived") {
        if (!note.is_archived) return false;
      } else {
        if (note.is_archived) return false;
      }

      // Smart filters
      if (selectedSection === "today" && !isToday(new Date(note.updated_at))) return false;
      if (selectedSection === "yesterday" && !isYesterday(new Date(note.updated_at))) return false;
      if (selectedSection === "this_week" && !isThisWeek(new Date(note.updated_at))) return false;
      if (selectedSection === "this_month" && !isThisMonth(new Date(note.updated_at))) return false;
      if (selectedSection === "untagged" && note.tags && note.tags.length > 0) return false;
      if (selectedSection === "with_links" && (!note.linked_entities || note.linked_entities.length === 0)) return false;

      // Type filter
      const noteTypes: NoteType[] = ["quick_note", "journal", "document", "finance_note", "memory_note", "tax_note", "story"];
      if (noteTypes.includes(selectedSection as NoteType) && note.type !== selectedSection) {
        return false;
      }

      // Tag filter
      if (selectedSection.startsWith("tag:")) {
        const tag = selectedSection.replace("tag:", "");
        if (!note.tags?.includes(tag)) return false;
      }

      // Folder filter
      if (selectedSection.startsWith("folder:")) {
        const folder = selectedSection.replace("folder:", "");
        if (note.folder !== folder) return false;
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

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  // Handlers
  const handleCreateNote = (type?: NoteType) => {
    // Default to quick_note - user can change type/tags in editor
    setSelectedType(type || "quick_note");
    setEditingNote(null);
    setShowTypeSelector(false);
    setIsEditing(true);
  };

  const handleEditNote = (note: NoteData) => {
    setEditingNote(note);
    setSelectedType(note.type || "quick_note");
    setIsEditing(true);
  };

  const handleOpenNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) handleEditNote(note);
  };

  const handleCreateDailyNote = () => {
    // Still create as journal for daily notes, but user can change
    handleCreateNote("journal");
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

  // Prepare search data
  const searchableNotes = useMemo(() => 
    notes.map(n => ({
      id: n.id,
      title: n.title || "Untitled",
      type: n.type || "quick_note",
      tags: n.tags || [],
      updated_at: n.updated_at,
      preview: n.content?.slice(0, 100) || "",
    })), 
    [notes]
  );

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
        initialContent={editingNote?.content_json ? (typeof editingNote.content_json === 'string' ? editingNote.content_json : JSON.stringify(editingNote.content_json)) : ""}
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
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <NoteflowHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateNote={() => handleCreateNote()}
          onOpenSearch={() => setShowSearch(true)}
          noteCount={counts.filters.all}
        />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <NoteflowSidebar
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
            tags={allTags}
            folders={allFolders}
          />

          {/* Notes Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Daily Note Prompt */}
            <NoteflowDailyNote
              onOpenNote={handleOpenNote}
              onCreateDailyNote={handleCreateDailyNote}
            />

            {/* Daily Reflection */}
            <DailyReflection onReflectionSaved={fetchNotes} />

            {viewMode === "sticky" ? (
              <QuickNotesGrid
                notes={notes}
                onNoteClick={handleEditNote}
                onCreateQuickNote={() => handleCreateNote("quick_note")}
              />
            ) : viewMode === "timeline" ? (
              <NotesTimeline
                notes={filteredNotes}
                onEditNote={handleEditNote}
                onPinNote={handlePinNote}
                onArchiveNote={handleArchiveNote}
                onDeleteNote={handleDeleteNote}
              />
            ) : viewMode === "folders" ? (
              // Folder view
              <div className="space-y-6">
                {allFolders.length > 0 ? (
                  allFolders.map((folder) => {
                    const folderNotes = filteredNotes.filter(n => n.folder === folder);
                    if (folderNotes.length === 0) return null;

                    return (
                      <div key={folder}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                          <FolderTree className="w-4 h-4" />
                          {folder}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {folderNotes.map((note) => (
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
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <FolderTree className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">No folders yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Organize your notes by creating folders
                    </p>
                  </div>
                )}

                {/* Unfiled Notes */}
                {(() => {
                  const unfiledNotes = filteredNotes.filter(n => !n.folder);
                  if (unfiledNotes.length === 0) return null;

                  return (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <FolderTree className="w-4 h-4" />
                        Unfiled
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {unfiledNotes.map((note) => (
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
                  );
                })()}
              </div>
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

        {/* Global Search */}
        <NoteflowSearch
          open={showSearch}
          onOpenChange={setShowSearch}
          notes={searchableNotes}
          recentSearches={[]}
          onSelectNote={handleOpenNote}
          onCreateNote={handleCreateNote}
        />

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

        {/* Branding */}
        <div className="fixed bottom-4 right-4 z-10 opacity-50 hover:opacity-80 transition-opacity pointer-events-none">
          <p className="text-[10px] font-medium text-muted-foreground tracking-wider">
            CHRONYX BY <span className="text-primary">OriginX Labs</span>
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Notes;
