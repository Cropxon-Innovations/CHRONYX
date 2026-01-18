import { 
  StickyNote, 
  BookOpen, 
  FileText, 
  Wallet, 
  Camera, 
  Receipt, 
  Feather,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NoteType = 
  | "quick_note" 
  | "journal" 
  | "document" 
  | "finance_note" 
  | "memory_note" 
  | "tax_note" 
  | "story";

export interface NoteTypeConfig {
  type: NoteType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const NOTE_TYPES: NoteTypeConfig[] = [
  {
    type: "quick_note",
    label: "Quick Note",
    description: "Capture thoughts instantly",
    icon: StickyNote,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30"
  },
  {
    type: "journal",
    label: "Journal",
    description: "Daily reflections & entries",
    icon: BookOpen,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30"
  },
  {
    type: "document",
    label: "Document",
    description: "Structured content & docs",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30"
  },
  {
    type: "finance_note",
    label: "Finance Note",
    description: "Financial records & insights",
    icon: Wallet,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  {
    type: "memory_note",
    label: "Memory",
    description: "Moments & memories",
    icon: Camera,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30"
  },
  {
    type: "tax_note",
    label: "Tax Note",
    description: "Tax-related records",
    icon: Receipt,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30"
  },
  {
    type: "story",
    label: "Story",
    description: "Personal narratives",
    icon: Feather,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
  }
];

export const getNoteTypeConfig = (type: NoteType): NoteTypeConfig => {
  return NOTE_TYPES.find(t => t.type === type) || NOTE_TYPES[0];
};

interface NoteTypeSelectorProps {
  selectedType: NoteType | null;
  onSelect: (type: NoteType) => void;
}

export const NoteTypeSelector = ({ selectedType, onSelect }: NoteTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {NOTE_TYPES.map((noteType) => {
        const Icon = noteType.icon;
        const isSelected = selectedType === noteType.type;
        
        return (
          <button
            key={noteType.type}
            onClick={() => onSelect(noteType.type)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
              "hover:scale-[1.02] hover:shadow-md",
              isSelected 
                ? "border-primary bg-primary/5 shadow-md" 
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl",
              noteType.bgColor
            )}>
              <Icon className={cn("w-6 h-6", noteType.color)} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">{noteType.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {noteType.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
