import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Plus, FileText, Search, MoreHorizontal, Edit2, Trash2, 
  Pin, PinOff, Link2, Tag, Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TiptapEditor } from "@/components/notes/TiptapEditor";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
  section_type: string;
  parent_section_id: string | null;
}

interface Note {
  id: string;
  title: string;
  content: any;
  note_type: string;
  tags: string[];
  is_pinned: boolean;
  section_id: string | null;
  schedule_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  templateId: string;
  sections: Section[];
  notes: Note[];
}

const noteTypes = [
  { value: "general", label: "General", color: "bg-muted" },
  { value: "summary", label: "Summary", color: "bg-blue-500/10" },
  { value: "flashcard", label: "Flashcard", color: "bg-amber-500/10" },
  { value: "question", label: "Q&A", color: "bg-purple-500/10" },
];

export const StudyNotesPanel = ({ templateId, sections, notes }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    note_type: "general",
    section_id: "",
    tags: [] as string[],
  });

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pinned notes first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Save note
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        user_id: user!.id,
        user_template_id: templateId,
        title: data.title,
        content: data.content ? JSON.parse(data.content) : {},
        note_type: data.note_type,
        section_id: data.section_id === "none" || !data.section_id ? null : data.section_id,
        tags: data.tags,
      };

      if (data.id) {
        const { error } = await supabase
          .from("study_section_notes")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("study_section_notes")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-notes", templateId] });
      setShowEditor(false);
      setSelectedNote(null);
      setIsCreating(false);
      resetForm();
      toast.success(selectedNote ? "Note updated" : "Note created");
    },
  });

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("study_section_notes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-notes", templateId] });
      setShowEditor(false);
      setSelectedNote(null);
      toast.success("Note deleted");
    },
  });

  // Toggle pin
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("study_section_notes")
        .update({ is_pinned: pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-notes", templateId] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      note_type: "general",
      section_id: "none",
      tags: [],
    });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedNote(null);
    resetForm();
    setShowEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setFormData({
      title: note.title,
      content: JSON.stringify(note.content),
      note_type: note.note_type,
      section_id: note.section_id || "none",
      tags: note.tags || [],
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    saveMutation.mutate(selectedNote ? { ...formData, id: selectedNote.id } : formData);
  };

  // Get linked section name
  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return null;
    const section = sections.find(s => s.id === sectionId);
    return section?.title;
  };

  // Get root sections for linking
  const rootSections = sections.filter(s => !s.parent_section_id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Notes List */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-border/50">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes ({notes.length})
              </CardTitle>
              <Button size="sm" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-2">
                {sortedNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs">Create your first note</p>
                  </div>
                ) : (
                  sortedNotes.map((note) => {
                    const typeConfig = noteTypes.find(t => t.value === note.note_type);
                    const linkedSection = getSectionName(note.section_id);

                    return (
                      <div
                        key={note.id}
                        className={cn(
                          "p-3 rounded-lg border border-border/50 cursor-pointer transition-colors hover:border-primary/30",
                          selectedNote?.id === note.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleEditNote(note)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {note.is_pinned && (
                                <Pin className="w-3 h-3 text-primary fill-primary" />
                              )}
                              <h4 className="font-medium text-sm truncate">{note.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className={cn("text-[10px]", typeConfig?.color)}>
                                {typeConfig?.label}
                              </Badge>
                              {linkedSection && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Link2 className="w-2 h-2 mr-1" />
                                  {linkedSection}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(note.updated_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                togglePinMutation.mutate({ id: note.id, pinned: !note.is_pinned });
                              }}>
                                {note.is_pinned ? (
                                  <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                                ) : (
                                  <><Pin className="w-4 h-4 mr-2" /> Pin</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMutation.mutate(note.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Note Editor */}
      <div className="lg:col-span-2">
        {showEditor ? (
          <Card className="border-border/50">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Input
                  placeholder="Note title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-medium border-0 px-0 focus-visible:ring-0"
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.note_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, note_type: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.section_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, section_id: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Link to section..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No link</SelectItem>
                      {rootSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <TiptapEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Start writing your notes... Use headings, lists, tables, and more."
                className="min-h-[400px]"
              />
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditor(false);
                    setSelectedNote(null);
                    setIsCreating(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {selectedNote ? "Save Changes" : "Create Note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-border/50 h-full min-h-[400px] flex items-center justify-center">
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-2">Select or Create a Note</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Create rich notes with headings, lists, tables, images and more. Link notes to syllabus sections for easy organization.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
