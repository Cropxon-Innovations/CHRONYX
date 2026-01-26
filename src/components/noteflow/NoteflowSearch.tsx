import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  Hash,
  Clock,
  Search,
  Sparkles,
  StickyNote,
  BookOpen,
  Wallet,
  Camera,
  Receipt,
  Feather,
} from "lucide-react";
import { NoteType, getNoteTypeConfig } from "@/components/notes/NoteTypeSelector";

interface SearchableNote {
  id: string;
  title: string;
  type: NoteType;
  tags: string[];
  updated_at: string;
  preview?: string;
}

interface NoteflowSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: SearchableNote[];
  recentSearches: string[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: (type: NoteType) => void;
  onSearchChange?: (query: string) => void;
}

const NOTE_TYPE_ICONS: Record<NoteType, React.ElementType> = {
  quick_note: StickyNote,
  journal: BookOpen,
  document: FileText,
  finance_note: Wallet,
  memory_note: Camera,
  tax_note: Receipt,
  story: Feather,
};

export const NoteflowSearch = ({
  open,
  onOpenChange,
  notes,
  recentSearches,
  onSelectNote,
  onCreateNote,
  onSearchChange,
}: NoteflowSearchProps) => {
  const [query, setQuery] = useState("");

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!query.trim()) {
      return notes.slice(0, 5); // Show recent notes
    }

    const lowerQuery = query.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(lowerQuery);
      const tagMatch = note.tags?.some((t) => t.toLowerCase().includes(lowerQuery));
      const previewMatch = note.preview?.toLowerCase().includes(lowerQuery);
      return titleMatch || tagMatch || previewMatch;
    }).slice(0, 10);
  }, [notes, query]);

  // Extract unique tags from search results
  const matchingTags = useMemo(() => {
    if (!query.trim()) return [];
    
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags?.forEach((tag) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          tagSet.add(tag);
        }
      });
    });
    return Array.from(tagSet).slice(0, 5);
  }, [notes, query]);

  const handleSelect = (noteId: string) => {
    onSelectNote(noteId);
    onOpenChange(false);
    setQuery("");
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    onSearchChange?.(value);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search notes, tags, or create new..."
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center space-y-3">
            <Search className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">No notes found</p>
              {query && (
                <button
                  onClick={() => {
                    onCreateNote("document");
                    onOpenChange(false);
                  }}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Create "{query}" as new note
                </button>
              )}
            </div>
          </div>
        </CommandEmpty>

        {/* Quick Actions */}
        {!query && (
          <>
            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  onCreateNote("quick_note");
                  onOpenChange(false);
                }}
                className="gap-3"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                </div>
                <span>New Quick Note</span>
                <kbd className="ml-auto text-xs text-muted-foreground">⌘N</kbd>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onCreateNote("journal");
                  onOpenChange(false);
                }}
                className="gap-3"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <span>New Journal Entry</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  onCreateNote("document");
                  onOpenChange(false);
                }}
                className="gap-3"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span>New Document</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Matching Tags */}
        {matchingTags.length > 0 && (
          <>
            <CommandGroup heading="Tags">
              {matchingTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={`tag:${tag}`}
                  className="gap-3"
                >
                  <Hash className="w-4 h-4 text-cyan-500" />
                  <span>#{tag}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {notes.filter((n) => n.tags?.includes(tag)).length} notes
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Notes */}
        {filteredNotes.length > 0 && (
          <CommandGroup heading={query ? "Notes" : "Recent Notes"}>
            {filteredNotes.map((note) => {
              const TypeIcon = NOTE_TYPE_ICONS[note.type] || FileText;
              const config = getNoteTypeConfig(note.type);

              return (
                <CommandItem
                  key={note.id}
                  value={note.id}
                  onSelect={() => handleSelect(note.id)}
                  className="gap-3"
                >
                  <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                    <TypeIcon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {note.title || "Untitled"}
                    </p>
                    {note.preview && (
                      <p className="text-xs text-muted-foreground truncate">
                        {note.preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(note.updated_at), "MMM d")}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* AI Search Hint */}
        {query && filteredNotes.length > 0 && (
          <>
            <CommandSeparator />
            <div className="p-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>
                Pro tip: Use AI-powered search to find notes by meaning, not just keywords
              </span>
            </div>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
