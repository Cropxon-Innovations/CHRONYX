import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getNoteTypeConfig, NoteType } from "./NoteTypeSelector";
import { getEmotionConfig, Emotion } from "./EmotionSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit2,
  MoreVertical,
  Link2,
  Clock,
} from "lucide-react";

export interface NoteData {
  id: string;
  title: string;
  content: string | null;
  content_json: any;
  type: NoteType;
  folder: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  color: string | null;
  tags: string[] | null;
  emotion: Emotion | null;
  location: string | null;
  linked_entities: any[];
  created_at: string;
  updated_at: string;
}

interface NoteCardProps {
  note: NoteData;
  onEdit: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export const NoteCard = ({ note, onEdit, onPin, onArchive, onDelete }: NoteCardProps) => {
  const typeConfig = getNoteTypeConfig(note.type || "quick_note");
  const TypeIcon = typeConfig.icon;
  const emotionConfig = note.emotion ? getEmotionConfig(note.emotion) : null;

  // Extract preview text from content_json
  const getPreviewText = (): string => {
    if (note.content_json) {
      try {
        const json = typeof note.content_json === 'string' 
          ? JSON.parse(note.content_json) 
          : note.content_json;
        return extractText(json).slice(0, 150);
      } catch {
        return "";
      }
    }
    return note.content?.slice(0, 150) || "";
  };

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node;
    if (node.text) return node.text + " ";
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join("");
    }
    return "";
  };

  const previewText = getPreviewText();
  const linkedCount = note.linked_entities?.length || 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col p-4 rounded-2xl border border-border bg-card",
        "hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer",
        "min-h-[180px]"
      )}
      onClick={onEdit}
    >
      {/* Pin Indicator */}
      {note.is_pinned && (
        <Pin className="absolute top-3 right-3 w-4 h-4 text-primary" />
      )}

      {/* Type Badge & Menu */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", typeConfig.bgColor)}>
            <TypeIcon className={cn("w-3.5 h-3.5", typeConfig.color)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {typeConfig.label}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }}>
              {note.is_pinned ? (
                <>
                  <PinOff className="w-4 h-4 mr-2" />
                  Unpin
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              {note.is_archived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 mr-2" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
        {note.title || "Untitled"}
      </h3>

      {/* Preview */}
      {previewText && (
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {previewText}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {emotionConfig && (
            <div className={cn("p-1 rounded", emotionConfig.bgColor)}>
              <emotionConfig.icon className={cn("w-3 h-3", emotionConfig.color)} />
            </div>
          )}
          
          {linkedCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Link2 className="w-3 h-3" />
              {linkedCount}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {format(new Date(note.updated_at), "MMM d")}
        </div>
      </div>
    </div>
  );
};
