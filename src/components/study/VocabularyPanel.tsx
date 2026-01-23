import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BookA,
  Search,
  Trash2,
  Volume2,
  Star,
  StarOff,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string | null;
  phonetic: string | null;
  language: string;
  lookup_count: number;
  source_ref_id: string | null;
  created_at: string;
}

interface VocabularyPanelProps {
  itemId?: string;
  onClose?: () => void;
}

export const VocabularyPanel = ({ itemId, onClose }: VocabularyPanelProps) => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchVocabulary();
  }, [user, itemId]);

  const fetchVocabulary = async () => {
    try {
      let query = supabase
        .from("vocabulary")
        .select("id, word, meaning, phonetic, language, lookup_count, source_ref_id, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (itemId) {
        query = query.eq("source_ref_id", itemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWords((data as VocabularyWord[]) || []);
    } catch (error) {
      console.error("Error fetching vocabulary:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWord = async (id: string) => {
    const { error } = await supabase.from("vocabulary").delete().eq("id", id);

    if (!error) {
      setWords((prev) => prev.filter((w) => w.id !== id));
      toast.success("Word removed");
    }
  };

  const addWord = async () => {
    if (!newWord.trim() || !user) return;

    const { data, error } = await supabase
      .from("vocabulary")
      .insert({
        user_id: user.id,
        word: newWord.trim(),
        meaning: "",
        source_ref_id: itemId || null,
        source_type: itemId ? "library" : "manual",
      })
      .select("id, word, meaning, phonetic, language, lookup_count, source_ref_id, created_at")
      .single();

    if (!error && data) {
      setWords((prev) => [data as VocabularyWord, ...prev]);
      setNewWord("");
      setShowAddForm(false);
      toast.success("Word added to vocabulary");
    }
  };

  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const filteredWords = words.filter((w) =>
    w.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = words.length;
  const frequentCount = words.filter((w) => w.lookup_count > 2).length;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookA className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Vocabulary</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2 p-3 border-b border-border">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3" />
          {totalCount} Words
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Star className="w-3 h-3" />
          {frequentCount} Frequent
        </Badge>
      </div>

      {/* Search & Add */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50"
          />
        </div>
        {showAddForm ? (
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Enter new word..."
              className="h-9"
              onKeyDown={(e) => e.key === "Enter" && addWord()}
              autoFocus
            />
            <Button size="sm" onClick={addWord}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewWord("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" />
            Add Word
          </Button>
        )}
      </div>

      {/* Words List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <BookA className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No vocabulary words yet
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Tap on words while reading to save them to your vocabulary
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredWords.map((word) => (
              <div
                key={word.id}
                className={cn(
                  "group p-3 rounded-lg border transition-all",
                  word.lookup_count > 2
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-muted/30 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{word.word}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => speakWord(word.word)}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                      {word.phonetic && (
                        <span className="text-xs text-muted-foreground">
                          /{word.phonetic}/
                        </span>
                      )}
                    </div>
                    {word.meaning && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {word.meaning}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {word.language || "en"}
                      </Badge>
                      {word.lookup_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          Looked up {word.lookup_count}x
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteWord(word.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
