import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "./TiptapEditor";
import { HandwritingCanvas } from "./HandwritingCanvas";
import { PDFExportDialog } from "./PDFExportDialog";
import { exportProfessionalPDF } from "./ProfessionalPDFExport";
import { exportNoteToMarkdown, exportNoteToPlainText, downloadAsFile } from "./NoteExport";
import { NoteType, getNoteTypeConfig } from "./NoteTypeSelector";
import { EmotionSelector, Emotion } from "./EmotionSelector";
import { LinkedEntitySuggestion, LinkedEntity } from "./LinkedEntitySuggestion";
import { NoteData } from "./NoteCard";
import { cn } from "@/lib/utils";
import { 
  X, 
  Save, 
  FileDown, 
  Sparkles,
  Clock,
  MapPin,
  Link2,
  Pen,
  Type
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EditorMode = "text" | "handwriting";

interface NoteEditorProps {
  noteId?: string;
  noteType: NoteType;
  initialTitle?: string;
  initialContent?: string;
  initialEmotion?: Emotion;
  initialLocation?: string;
  initialLinkedEntities?: LinkedEntity[];
  onSave: (data: {
    title: string;
    content_json: string;
    type: NoteType;
    emotion?: Emotion;
    location?: string;
    linked_entities: LinkedEntity[];
  }) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export const NoteEditor = ({
  noteId,
  noteType,
  initialTitle = "",
  initialContent = "",
  initialEmotion,
  initialLocation = "",
  initialLinkedEntities = [],
  onSave,
  onClose,
  isSaving = false,
}: NoteEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [emotion, setEmotion] = useState<Emotion | undefined>(initialEmotion);
  const [location, setLocation] = useState(initialLocation);
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>(initialLinkedEntities);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [editorMode, setEditorMode] = useState<EditorMode>("text");
  const [showPDFExport, setShowPDFExport] = useState(false);

  const typeConfig = getNoteTypeConfig(noteType);
  const TypeIcon = typeConfig.icon;

  // Detect if device supports stylus
  const supportsStylus = typeof window !== 'undefined' && (
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 ||
    /iPad|iPhone|Android/i.test(navigator.userAgent)
  );

  // Auto-suggest title based on content
  useEffect(() => {
    if (!title && content) {
      try {
        const parsed = JSON.parse(content);
        const firstText = extractFirstText(parsed);
        if (firstText && firstText.length > 0) {
          // Don't auto-set, just show a suggestion
        }
      } catch {
        // Content might be plain text
      }
    }
  }, [content, title]);

  const extractFirstText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (node.text) return node.text;
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        const text = extractFirstText(child);
        if (text) return text;
      }
    }
    return "";
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
      tags: [],
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
      tags: [],
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

  const showEmotionSelector = noteType === "journal" || noteType === "memory_note";
  const isMemoryNote = noteType === "memory_note";

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
          
          <div className={cn("p-1.5 rounded-lg", typeConfig.bgColor)}>
            <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
          </div>
          
          <Badge variant="secondary" className="flex-shrink-0">
            {typeConfig.label}
          </Badge>
          
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {autoSaveStatus === "saved" ? "All changes saved" : autoSaveStatus === "saving" ? "Saving..." : "Unsaved changes"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Editor Mode Toggle (Tablet/Stylus support) */}
          {supportsStylus && (
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={editorMode === "text" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("text")}
                className="h-8 px-3"
                title="Text Editor"
              >
                <Type className="w-4 h-4" />
              </Button>
              <Button
                variant={editorMode === "handwriting" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorMode("handwriting")}
                className="h-8 px-3"
                title="Handwriting (Stylus)"
              >
                <Pen className="w-4 h-4" />
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
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

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-2xl font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
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

          {/* Editor - Text or Handwriting */}
          {editorMode === "handwriting" ? (
            <HandwritingCanvas
              className="min-h-[400px]"
              onStrokesChange={(strokes) => {
                // Store strokes as JSON in content for now
                // Future: OCR integration
              }}
            />
          ) : (
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder={`Start writing your ${typeConfig.label.toLowerCase()}...`}
            />
          )}

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
  );
};
