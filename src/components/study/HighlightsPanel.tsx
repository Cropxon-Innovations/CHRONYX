import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Highlighter,
  StickyNote,
  Trash2,
  Edit2,
  ChevronRight,
  Search,
  BookOpen,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface Highlight {
  id: string;
  page_number: number;
  text_snippet: string;
  note: string | null;
  color: string;
  created_at: string;
}

interface HighlightsPanelProps {
  itemId: string;
  currentPage: number;
  onGoToPage: (page: number) => void;
  onClose?: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: "yellow", class: "bg-yellow-300/60", border: "border-yellow-400" },
  { name: "green", class: "bg-green-300/60", border: "border-green-400" },
  { name: "blue", class: "bg-blue-300/60", border: "border-blue-400" },
  { name: "pink", class: "bg-pink-300/60", border: "border-pink-400" },
  { name: "purple", class: "bg-purple-300/60", border: "border-purple-400" },
];

export const HighlightsPanel = ({
  itemId,
  currentPage,
  onGoToPage,
  onClose,
}: HighlightsPanelProps) => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user && itemId) fetchHighlights();
  }, [user, itemId]);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from("reading_highlights")
        .select("*")
        .eq("item_id", itemId)
        .eq("user_id", user?.id)
        .order("page_number", { ascending: true });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error("Error fetching highlights:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHighlight = async (id: string) => {
    const { error } = await supabase
      .from("reading_highlights")
      .delete()
      .eq("id", id);

    if (!error) {
      setHighlights((prev) => prev.filter((h) => h.id !== id));
      toast.success("Highlight deleted");
    }
  };

  const updateNote = async (id: string) => {
    const { error } = await supabase
      .from("reading_highlights")
      .update({ note: editNote || null })
      .eq("id", id);

    if (!error) {
      setHighlights((prev) =>
        prev.map((h) => (h.id === id ? { ...h, note: editNote || null } : h))
      );
      setEditingId(null);
      setEditNote("");
      toast.success("Note updated");
    }
  };

  const filteredHighlights = highlights.filter(
    (h) =>
      h.text_snippet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClass = (color: string) => {
    return HIGHLIGHT_COLORS.find((c) => c.name === color)?.class || "bg-yellow-300/60";
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Highlighter className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Highlights & Notes</h3>
          <Badge variant="secondary" className="text-xs">
            {highlights.length}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search highlights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50"
          />
        </div>
      </div>

      {/* Highlights List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Highlighter className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No highlights yet
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Select text while reading to highlight and add notes
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className={cn(
                  "group p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                  getColorClass(highlight.color),
                  "border-transparent hover:border-border"
                )}
              >
                {/* Page indicator */}
                <button
                  onClick={() => onGoToPage(highlight.page_number)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
                >
                  <BookOpen className="w-3 h-3" />
                  Page {highlight.page_number}
                  <ChevronRight className="w-3 h-3" />
                </button>

                {/* Highlighted text */}
                <p className="text-sm text-foreground line-clamp-3 mb-2">
                  "{highlight.text_snippet}"
                </p>

                {/* Note section */}
                {editingId === highlight.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Add a note..."
                      className="h-8 text-sm bg-background"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => updateNote(highlight.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(null);
                        setEditNote("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : highlight.note ? (
                  <div className="flex items-start gap-2 mt-2 p-2 rounded bg-background/50">
                    <StickyNote className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground flex-1">
                      {highlight.note}
                    </p>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(highlight.id);
                      setEditNote(highlight.note || "");
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteHighlight(highlight.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
