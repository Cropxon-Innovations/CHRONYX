import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Plus, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  MoreHorizontal,
  FileText,
  Folder,
  Save,
  Eye,
  Settings,
  MessageSquare,
  Sparkles,
  Clock,
  BookOpen,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookEditor from "./BookEditor";
import ChapterVersionHistory from "./ChapterVersionHistory";
import AIAssistPanel from "./AIAssistPanel";
import ChapterComments from "./ChapterComments";
import CoverDesigner from "./CoverDesigner";

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  description: string | null;
  cover_url: string | null;
  status: "draft" | "writing" | "editing" | "review" | "published";
  genre: string | null;
  word_count: number;
  reading_time_minutes: number;
  settings: any;
}

interface Chapter {
  id: string;
  book_id: string;
  title: string;
  content: any;
  order_index: number;
  status: string;
  word_count: number;
  reading_time_minutes: number;
  notes: string | null;
  isExpanded?: boolean;
}

interface BookAuthoringStudioProps {
  book: Book;
  onBack: () => void;
  onBookUpdate: (book: Book) => void;
}

const statusColors = {
  draft: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  review: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  final: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

const BookAuthoringStudio = ({ book, onBack, onBookUpdate }: BookAuthoringStudioProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"settings" | "ai" | "comments" | "cover">("settings");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchChapters();
  }, [book.id]);

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from("book_chapters")
      .select("*")
      .eq("book_id", book.id)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching chapters:", error);
    } else {
      const chaptersWithExpanded = (data || []).map(c => ({ ...c, isExpanded: true }));
      setChapters(chaptersWithExpanded);
      if (chaptersWithExpanded.length > 0 && !selectedChapter) {
        setSelectedChapter(chaptersWithExpanded[0]);
      }
    }
    setLoading(false);
  };

  const addChapter = async () => {
    const { data, error } = await supabase
      .from("book_chapters")
      .insert({
        book_id: book.id,
        title: `Chapter ${chapters.length + 1}`,
        order_index: chapters.length,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add chapter", variant: "destructive" });
    } else if (data) {
      const newChapter = { ...data, isExpanded: true };
      setChapters([...chapters, newChapter]);
      setSelectedChapter(newChapter);
      toast({ title: "Chapter added" });
    }
  };

  const updateChapter = async (id: string, updates: Partial<Chapter>) => {
    const { error } = await supabase
      .from("book_chapters")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update chapter", variant: "destructive" });
    } else {
      setChapters(chapters.map(c => c.id === id ? { ...c, ...updates } : c));
      if (selectedChapter?.id === id) {
        setSelectedChapter({ ...selectedChapter, ...updates });
      }
    }
  };

  const deleteChapter = async (id: string) => {
    const { error } = await supabase
      .from("book_chapters")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete chapter", variant: "destructive" });
    } else {
      const newChapters = chapters.filter(c => c.id !== id);
      setChapters(newChapters);
      if (selectedChapter?.id === id) {
        setSelectedChapter(newChapters[0] || null);
      }
      toast({ title: "Chapter deleted" });
    }
  };

  const saveContent = useCallback(async (content: any, wordCount: number) => {
    if (!selectedChapter) return;
    
    setIsSaving(true);
    const readingTime = Math.ceil(wordCount / 200); // ~200 words per minute
    
    const { error } = await supabase
      .from("book_chapters")
      .update({
        content,
        word_count: wordCount,
        reading_time_minutes: readingTime,
      })
      .eq("id", selectedChapter.id);

    if (!error) {
      setLastSaved(new Date());
      setChapters(chapters.map(c => 
        c.id === selectedChapter.id 
          ? { ...c, content, word_count: wordCount, reading_time_minutes: readingTime } 
          : c
      ));
      setSelectedChapter({ 
        ...selectedChapter, 
        content, 
        word_count: wordCount, 
        reading_time_minutes: readingTime 
      });
    }
    setIsSaving(false);
  }, [selectedChapter, chapters]);

  const createVersion = async () => {
    if (!selectedChapter) return;
    
    const { data: versions } = await supabase
      .from("book_chapter_versions")
      .select("version_number")
      .eq("chapter_id", selectedChapter.id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    const { error } = await supabase
      .from("book_chapter_versions")
      .insert({
        chapter_id: selectedChapter.id,
        version_number: nextVersion,
        content: selectedChapter.content,
        word_count: selectedChapter.word_count,
        change_description: `Version ${nextVersion}`,
      });

    if (error) {
      toast({ title: "Error", description: "Failed to create version", variant: "destructive" });
    } else {
      toast({ title: `Version ${nextVersion} saved` });
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);
  const totalReadingTime = chapters.reduce((sum, c) => sum + c.reading_time_minutes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading book...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-medium text-foreground">{book.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{totalWords.toLocaleString()} words</span>
              <span>•</span>
              <span>{totalReadingTime} min read</span>
              <span>•</span>
              <span>{chapters.length} chapters</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
          )}
          <Button variant="outline" size="sm" onClick={createVersion}>
            <Save className="w-4 h-4 mr-1" />
            Save Version
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
            <Clock className="w-4 h-4 mr-1" />
            History
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Outline */}
        <div className={cn(
          "border-r border-border bg-muted/30 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-12" : "w-64"
        )}>
          <div className="flex items-center justify-between p-2 border-b border-border">
            {!sidebarCollapsed && <span className="text-xs font-medium text-muted-foreground uppercase">Outline</span>}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            {!sidebarCollapsed && (
              <div className="p-2 space-y-1">
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                      selectedChapter?.id === chapter.id 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-accent text-foreground"
                    )}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={chapter.title}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateChapter(chapter.id, { title: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs bg-transparent border-none p-0 focus-visible:ring-0"
                      />
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>{chapter.word_count} words</span>
                        <Badge variant="outline" className={cn("text-[9px] px-1 py-0", statusColors[chapter.status])}>
                          {chapter.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateChapter(chapter.id, { status: "draft" })}>
                          Mark as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateChapter(chapter.id, { status: "review" })}>
                          Mark as Review
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateChapter(chapter.id, { status: "final" })}>
                          Mark as Final
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => deleteChapter(chapter.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {!sidebarCollapsed && (
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={addChapter}>
                <Plus className="w-4 h-4 mr-2" />
                Add Chapter
              </Button>
            </div>
          )}
        </div>

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedChapter ? (
            <BookEditor
              chapter={selectedChapter}
              onSave={saveContent}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chapter or create a new one to start writing</p>
                <Button variant="outline" className="mt-4" onClick={addChapter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Chapter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Utility Panel */}
        <div className="w-72 border-l border-border bg-muted/30 flex flex-col">
          <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 m-2">
              <TabsTrigger value="settings" className="text-xs px-2">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs px-2">
                <Sparkles className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs px-2">
                <MessageSquare className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="cover" className="text-xs px-2">
                <Palette className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings" className="flex-1 p-4 mt-0 overflow-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Chapter Status</Label>
                  {selectedChapter && (
                    <Select 
                      value={selectedChapter.status} 
                      onValueChange={(v) => updateChapter(selectedChapter.id, { status: v as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div>
                  <Label className="text-xs">Chapter Notes</Label>
                  <textarea
                    value={selectedChapter?.notes || ""}
                    onChange={(e) => selectedChapter && updateChapter(selectedChapter.id, { notes: e.target.value })}
                    className="mt-1 w-full h-24 text-sm rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Add notes for this chapter..."
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Book Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Words</span>
                      <span className="font-medium">{totalWords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">{chapters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading Time</span>
                      <span className="font-medium">{totalReadingTime} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Draft</span>
                      <span className="font-medium">{chapters.filter(c => c.status === "draft").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final</span>
                      <span className="font-medium">{chapters.filter(c => c.status === "final").length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="flex-1 mt-0 overflow-auto">
              <AIAssistPanel 
                chapter={selectedChapter} 
                onApplyChange={(newContent) => {
                  if (selectedChapter) {
                    saveContent(newContent, selectedChapter.word_count);
                  }
                }}
              />
            </TabsContent>
            
            <TabsContent value="comments" className="flex-1 mt-0 overflow-auto">
              <ChapterComments chapterId={selectedChapter?.id} />
            </TabsContent>
            
            <TabsContent value="cover" className="flex-1 mt-0 overflow-auto">
              <CoverDesigner 
                book={book} 
                onUpdate={(coverUrl) => onBookUpdate({ ...book, cover_url: coverUrl })} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <ChapterVersionHistory 
            chapterId={selectedChapter?.id} 
            onRestore={(content) => {
              if (selectedChapter) {
                saveContent(content, selectedChapter.word_count);
                setShowVersionHistory(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookAuthoringStudio;
