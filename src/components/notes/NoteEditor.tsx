import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UnifiedNoteEditor } from "@/components/noteflow/UnifiedNoteEditor";
import { NoteflowAI } from "@/components/noteflow/NoteflowAI";
import { NoteVersionHistory } from "@/components/noteflow/NoteVersionHistory";
import { PDFExportDialog } from "./PDFExportDialog";
import { exportProfessionalPDF } from "./ProfessionalPDFExport";
import { exportNoteToMarkdown, exportNoteToPlainText, downloadAsFile } from "./NoteExport";
import { NoteType, getNoteTypeConfig } from "./NoteTypeSelector";
import { EmotionSelector, Emotion } from "./EmotionSelector";
import { LinkedEntitySuggestion, LinkedEntity } from "./LinkedEntitySuggestion";
import { NoteflowTagManager } from "@/components/noteflow/NoteflowTagManager";
import { NoteData } from "./NoteCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  X, 
  Save, 
  FileDown, 
  Clock,
  MapPin,
  Link2,
  ChevronLeft,
  MoreHorizontal,
  Pin,
  Archive,
  Trash2,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { NOTE_TYPES } from "./NoteTypeSelector";

interface NoteEditorProps {
  noteId?: string;
  noteType: NoteType;
  initialTitle?: string;
  initialContent?: string;
  initialEmotion?: Emotion;
  initialLocation?: string;
  initialLinkedEntities?: LinkedEntity[];
  initialTags?: string[];
  onSave: (data: {
    title: string;
    content_json: string;
    type: NoteType;
    emotion?: Emotion;
    location?: string;
    linked_entities: LinkedEntity[];
    tags?: string[];
  }) => void;
  onClose: () => void;
  isSaving?: boolean;
  onTypeChange?: (type: NoteType) => void;
}

export const NoteEditor = ({
  noteId,
  noteType,
  initialTitle = "",
  initialContent = "",
  initialEmotion,
  initialLocation = "",
  initialLinkedEntities = [],
  initialTags = [],
  onSave,
  onClose,
  isSaving = false,
}: NoteEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [canvasData, setCanvasData] = useState<string>("");
  const [emotion, setEmotion] = useState<Emotion | undefined>(initialEmotion);
  const [location, setLocation] = useState(initialLocation);
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>(initialLinkedEntities);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<{ name: string; confidence: number; source: "ai" | "recent" | "popular" }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const { toast } = useToast();

  const typeConfig = getNoteTypeConfig(noteType);
  const TypeIcon = typeConfig.icon;

  // Auto-save timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autoSaveStatus === "unsaved") {
        // Auto-save logic could go here
        setAutoSaveStatus("saved");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, title, autoSaveStatus]);

  // Mark as unsaved on content change
  useEffect(() => {
    setAutoSaveStatus("unsaved");
  }, [content, title]);

  // Extract text helper
  const extractTextFromContent = (contentJson: string): string => {
    try {
      const parsed = JSON.parse(contentJson);
      const extractText = (node: any): string => {
        if (typeof node === "string") return node;
        if (node.text) return node.text;
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join(" ");
        }
        return "";
      };
      return extractText(parsed);
    } catch {
      return contentJson;
    }
  };

  const handleSave = () => {
    const finalTitle = title.trim() || `Untitled ${typeConfig.label}`;
    onSave({
      title: finalTitle,
      content_json: content,
      type: noteType,
      emotion: (noteType === "journal" || noteType === "memory_note") ? emotion : undefined,
      location: (noteType === "memory_note") ? location : undefined,
      linked_entities: linkedEntities,
      tags,
    });
  };

  const handleExport = (format: "pdf" | "markdown" | "text") => {
    const noteData: NoteData = {
      id: noteId || "",
      title: title || "Untitled",
      content: "",
      content_json: content,
      type: noteType,
      emotion: emotion,
      location: location,
      linked_entities: linkedEntities,
      tags: tags,
      folder: null,
      color: null,
      is_pinned: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (format) {
      case "pdf":
        setShowPDFExport(true);
        break;
      case "markdown":
        const markdown = exportNoteToMarkdown(noteData);
        const mdFileName = (title || "untitled").toLowerCase().replace(/\s+/g, "-");
        downloadAsFile(markdown, `${mdFileName}.md`, "text/markdown");
        break;
      case "text":
        const text = exportNoteToPlainText(noteData);
        const txtFileName = (title || "untitled").toLowerCase().replace(/\s+/g, "-");
        downloadAsFile(text, `${txtFileName}.txt`, "text/plain");
        break;
    }
  };

  const handlePDFExport = (options: {
    includeLinkedData: boolean;
    includeTimestamps: boolean;
    addWatermark: boolean;
    hidePrivateMetadata: boolean;
  }) => {
    const noteData: NoteData = {
      id: noteId || "",
      title: title || "Untitled",
      content: "",
      content_json: content,
      type: noteType,
      emotion: emotion,
      location: location,
      linked_entities: linkedEntities,
      tags: tags,
      folder: null,
      color: null,
      is_pinned: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    exportProfessionalPDF(noteData, options);
  };

  const handleAddLinkedEntity = (entity: LinkedEntity) => {
    if (!linkedEntities.find(e => e.id === entity.id && e.type === entity.type)) {
      setLinkedEntities([...linkedEntities, entity]);
    }
  };

  const handleRemoveLinkedEntity = (entity: LinkedEntity) => {
    setLinkedEntities(linkedEntities.filter(e => !(e.id === entity.id && e.type === entity.type)));
  };

  const handleAIAssist = async (action: string, text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-note", {
        body: { content: text, action, noteType },
      });
      if (error) throw error;
      
      if (action === "summarize" || action === "expand" || action === "simplify") {
        toast({ title: "AI Result", description: data?.result?.slice(0, 100) + "..." });
      }
    } catch (error) {
      console.error("AI assist error:", error);
    }
  };

  const showEmotionSelector = noteType === "journal" || noteType === "memory_note";
  const isMemoryNote = noteType === "memory_note";

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* Premium Top Bar */}
        <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
            
            {/* Note type selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8">
                  <div className={cn("p-1 rounded-lg", typeConfig.bgColor)}>
                    <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
                  </div>
                  <span className="text-sm font-medium">{typeConfig.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {NOTE_TYPES.map((nt) => {
                  const NtIcon = nt.icon;
                  return (
                    <DropdownMenuItem
                      key={nt.type}
                      onClick={() => {
                        // Type is saved with the note when user saves
                      }}
                      className={cn("gap-2", noteType === nt.type && "bg-primary/10")}
                    >
                      <NtIcon className={cn("w-4 h-4", nt.color)} />
                      {nt.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Auto-save status */}
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {autoSaveStatus === "saved" ? "Saved" : autoSaveStatus === "saving" ? "Saving..." : "Unsaved"}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Noteflow AI */}
            <NoteflowAI 
              noteContent={content}
              noteTitle={title || "Untitled Note"}
              onApplyResult={(result) => {
                toast({ title: "AI Result applied" });
              }}
            />

            {/* Version History */}
            <NoteVersionHistory
              noteId={noteId || ""}
              currentContent={content}
              versions={versions}
              onRestore={(versionId) => {
                toast({ title: "Version restored" });
              }}
              onPreview={(version) => {
                toast({ title: "Previewing version" });
              }}
            />

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("markdown")}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("text")}>
                  Export as Plain Text
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Pin className="w-4 h-4" />
                  Pin Note
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Save button */}
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
            </Button>
          </div>
        </header>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className={cn(
                "text-3xl font-bold border-none shadow-none px-0 h-auto",
                "focus-visible:ring-0 placeholder:text-muted-foreground/40",
                "bg-transparent"
              )}
            />

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3">
              {showEmotionSelector && (
                <EmotionSelector
                  selectedEmotion={emotion}
                  onSelect={setEmotion}
                />
              )}

              {isMemoryNote && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Add location..."
                    className="w-40 h-8 text-sm"
                  />
                </div>
              )}

              {/* Tags */}
              <NoteflowTagManager
                tags={tags}
                onTagsChange={setTags}
                suggestedTags={suggestedTags}
                isAnalyzing={isAnalyzing}
                allTags={[]}
              />

              {/* Linked Entities */}
              {linkedEntities.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  {linkedEntities.map((entity, index) => (
                    <Badge 
                      key={`${entity.type}-${entity.id}-${index}`}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => handleRemoveLinkedEntity(entity)}
                    >
                      {entity.label}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Editor */}
            <UnifiedNoteEditor
              content={content}
              canvasData={canvasData}
              onChange={setContent}
              onCanvasChange={setCanvasData}
              placeholder={`Start writing your ${typeConfig.label.toLowerCase()}...`}
              minHeight="500px"
              onAIAssist={handleAIAssist}
            />

            {/* Smart Linking Suggestions */}
            <LinkedEntitySuggestion
              content={content}
              noteType={noteType}
              linkedEntities={linkedEntities}
              onAddEntity={handleAddLinkedEntity}
            />
          </div>
        </div>

        {/* PDF Export Dialog */}
        <PDFExportDialog
          open={showPDFExport}
          onOpenChange={setShowPDFExport}
          onExport={handlePDFExport}
          noteTitle={title}
        />
      </div>
    </TooltipProvider>
  );
};
