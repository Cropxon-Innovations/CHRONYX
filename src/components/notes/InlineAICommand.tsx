import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ListTodo,
  Link2,
  Type,
  FileText,
  Wand2,
  ChevronRight,
} from "lucide-react";

export interface AICommand {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: string;
}

const AI_COMMANDS: AICommand[] = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Create a bullet-point summary",
    icon: FileText,
    action: "summarize",
  },
  {
    id: "extract_tasks",
    label: "Extract tasks",
    description: "Find action items and create checklist",
    icon: ListTodo,
    action: "extract_tasks",
  },
  {
    id: "suggest_links",
    label: "Suggest links",
    description: "Find related finances, memories, or taxes",
    icon: Link2,
    action: "suggest_links",
  },
  {
    id: "create_title",
    label: "Create title",
    description: "Generate a title for this note",
    icon: Type,
    action: "create_title",
  },
  {
    id: "convert_formal",
    label: "Convert to formal",
    description: "Make the text more professional",
    icon: Wand2,
    action: "convert_formal",
  },
];

interface InlineAICommandProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onSelectCommand: (command: AICommand) => void;
  filter?: string;
}

export const InlineAICommand = ({
  isOpen,
  position,
  onClose,
  onSelectCommand,
  filter = "",
}: InlineAICommandProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = AI_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.action.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filteredCommands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelectCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelectCommand, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 w-72 bg-popover border border-border rounded-xl shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
      </div>

      {/* Commands */}
      <div className="py-1 max-h-64 overflow-auto">
        {filteredCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            onClick={() => onSelectCommand(cmd)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-left",
              "hover:bg-accent/50 transition-colors",
              index === selectedIndex && "bg-accent/50"
            )}
          >
            <div className="p-1.5 rounded-lg bg-primary/10">
              <cmd.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{cmd.label}</div>
              <div className="text-xs text-muted-foreground truncate">{cmd.description}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
        <span className="text-xs text-muted-foreground">
          ↑↓ Navigate · Enter Select · Esc Close
        </span>
      </div>
    </div>
  );
};

// Floating selection toolbar
interface SelectionToolbarProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onAskAI: () => void;
  onLink: () => void;
  onExtract: () => void;
}

export const SelectionToolbar = ({
  isOpen,
  position,
  onAskAI,
  onLink,
  onExtract,
}: SelectionToolbarProps) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute z-50 flex items-center gap-1 px-1.5 py-1",
        "bg-popover border border-border rounded-lg shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-150"
      )}
      style={{ top: position.top, left: position.left }}
    >
      <button
        onClick={onAskAI}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
        title="Ask AI"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium">AI</span>
      </button>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onLink}
        className="p-1.5 rounded-md hover:bg-accent/50 transition-colors"
        title="Link entity"
      >
        <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <button
        onClick={onExtract}
        className="p-1.5 rounded-md hover:bg-accent/50 transition-colors"
        title="Extract info"
      >
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};
