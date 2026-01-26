import { useState, useRef, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Link2,
  Undo2,
  Redo2,
  Pen,
  Type,
  Palette,
  Wand2,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import { CanvasLayer, CanvasLayerRef } from "./CanvasLayer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type EditorMode = "text" | "canvas" | "mixed";

interface UnifiedNoteEditorProps {
  content: string;
  canvasData?: string;
  onChange: (content: string) => void;
  onCanvasChange?: (canvasData: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
  showToolbar?: boolean;
  onAIAssist?: (action: string, content: string) => void;
}

// Toolbar button component
const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
  title,
  disabled = false,
  size = "default",
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
  disabled?: boolean;
  size?: "default" | "sm";
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          size === "sm" ? "h-7 w-7 p-0" : "h-8 w-8 p-0",
          "rounded-lg transition-all duration-200",
          isActive && "bg-primary/10 text-primary shadow-sm"
        )}
      >
        <Icon className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-xs font-medium">
      {title}
    </TooltipContent>
  </Tooltip>
);

export const UnifiedNoteEditor = ({
  content,
  canvasData,
  onChange,
  onCanvasChange,
  placeholder = "Start writing... Type '/' for commands",
  editable = true,
  className,
  minHeight = "400px",
  showToolbar = true,
  onAIAssist,
}: UnifiedNoteEditorProps) => {
  const [mode, setMode] = useState<EditorMode>("text");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<CanvasLayerRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Detect tablet/stylus
  const supportsStylus =
    typeof window !== "undefined" &&
    ("ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      /iPad|iPhone|Android/i.test(navigator.userAgent));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: "rounded-xl max-w-full h-auto my-4 shadow-sm" },
      }),
    ],
    content: "",
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: cn(
          // Base prose styles
          "prose prose-sm dark:prose-invert max-w-none",
          "focus:outline-none",
          // Premium Apple-level spacing and padding
          "px-8 py-6 lg:px-12 lg:py-8",
          // Apple-level typography with refined headings
          "prose-headings:font-semibold prose-headings:tracking-[-0.02em] prose-headings:text-foreground",
          "prose-h1:text-4xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8 prose-h1:leading-[1.15]",
          "prose-h2:text-3xl prose-h2:font-semibold prose-h2:mb-5 prose-h2:mt-7 prose-h2:leading-[1.2]",
          "prose-h3:text-2xl prose-h3:font-semibold prose-h3:mb-4 prose-h3:mt-6 prose-h3:leading-[1.25]",
          "prose-h4:text-xl prose-h4:font-medium prose-h4:mb-3 prose-h4:mt-5 prose-h4:leading-[1.3]",
          // Body text with refined line-height and spacing
          "prose-p:text-foreground prose-p:leading-[1.75] prose-p:mb-4 prose-p:text-[16px]",
          "prose-strong:font-semibold prose-strong:text-foreground",
          "prose-em:italic prose-em:text-foreground/90",
          // Lists with proper spacing
          "prose-ul:my-4 prose-ul:pl-6 prose-ol:my-4 prose-ol:pl-6",
          "prose-li:my-1.5 prose-li:leading-[1.65] prose-li:marker:text-muted-foreground/60",
          // Blockquotes with Apple-style border
          "prose-blockquote:border-l-[3px] prose-blockquote:border-primary/40",
          "prose-blockquote:pl-5 prose-blockquote:py-1 prose-blockquote:italic",
          "prose-blockquote:text-muted-foreground prose-blockquote:my-6",
          "prose-blockquote:not-italic prose-blockquote:font-normal prose-blockquote:text-[15px]",
          // Code blocks with refined styling
          "prose-code:bg-muted/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[14px]",
          "prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:my-6",
          "prose-pre:shadow-sm prose-pre:overflow-x-auto",
          // Tables with clean styling
          "prose-table:border-collapse prose-table:w-full prose-table:my-6",
          "prose-td:border prose-td:border-border/60 prose-td:p-3 prose-td:text-[15px]",
          "prose-th:border prose-th:border-border/60 prose-th:p-3 prose-th:bg-muted/30 prose-th:font-medium prose-th:text-left",
          // Horizontal rules
          "prose-hr:border-border/40 prose-hr:my-8",
          // Links with subtle styling
          "prose-a:text-primary prose-a:no-underline prose-a:hover:underline prose-a:font-medium",
          // Images
          "prose-img:rounded-xl prose-img:shadow-md prose-img:my-6"
        ),
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (view, event) => {
        if (event.key === "/" && !showSlashMenu) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          const containerRect = editorContainerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setSlashPosition({
              top: coords.bottom - containerRect.top + 8,
              left: coords.left - containerRect.left,
            });
          }
          setShowSlashMenu(true);
          setSlashFilter("");
          return false;
        }
        if (event.key === "Escape" && showSlashMenu) {
          setShowSlashMenu(false);
          return true;
        }
        return false;
      },
    },
  });

  // Load content
  useEffect(() => {
    if (editor && content) {
      try {
        let parsed = content;
        if (typeof content === "string") {
          parsed = JSON.parse(content);
          if (typeof parsed === "string") parsed = JSON.parse(parsed);
        }
        const current = JSON.stringify(editor.getJSON());
        const next = JSON.stringify(parsed);
        if (current !== next) {
          editor.commands.setContent(parsed);
        }
      } catch {
        if (typeof content === "string" && content.trim()) {
          editor.commands.setContent(`<p>${content}</p>`);
        }
      }
    }
  }, [content, editor]);

  // Slash command handler
  const executeSlashCommand = useCallback(
    (command: string) => {
      if (!editor) return;

      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 20), from, " ");
      const slashIndex = text.lastIndexOf("/");
      if (slashIndex >= 0) {
        const deleteFrom = from - (text.length - slashIndex);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }

      const commands: Record<string, () => void> = {
        h1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        h4: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
        bullet: () => editor.chain().focus().toggleBulletList().run(),
        numbered: () => editor.chain().focus().toggleOrderedList().run(),
        checklist: () => editor.chain().focus().toggleTaskList().run(),
        quote: () => editor.chain().focus().toggleBlockquote().run(),
        code: () => editor.chain().focus().toggleCodeBlock().run(),
        divider: () => editor.chain().focus().setHorizontalRule().run(),
        table: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        image: () => {
          const url = window.prompt("Enter image URL:");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        },
        callout: () => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "blockquote",
              content: [{ type: "paragraph", content: [{ type: "text", text: "💡 Tip: " }] }],
            })
            .run();
        },
      };

      commands[command]?.();
      setShowSlashMenu(false);
    },
    [editor]
  );

  const slashCommands = [
    { id: "h1", label: "Heading 1", desc: "Large section heading", icon: Heading1, group: "Basic" },
    { id: "h2", label: "Heading 2", desc: "Medium section heading", icon: Heading2, group: "Basic" },
    { id: "h3", label: "Heading 3", desc: "Small section heading", icon: Heading3, group: "Basic" },
    { id: "h4", label: "Heading 4", desc: "Tiny section heading", icon: Heading4, group: "Basic" },
    { id: "bullet", label: "Bullet List", desc: "Create a bullet list", icon: List, group: "Lists" },
    { id: "numbered", label: "Numbered List", desc: "Create a numbered list", icon: ListOrdered, group: "Lists" },
    { id: "checklist", label: "Checklist", desc: "Track tasks and todos", icon: CheckSquare, group: "Lists" },
    { id: "quote", label: "Quote", desc: "Add a blockquote", icon: Quote, group: "Blocks" },
    { id: "code", label: "Code Block", desc: "Add syntax-highlighted code", icon: Code, group: "Blocks" },
    { id: "callout", label: "Callout", desc: "Highlight important info", icon: Quote, group: "Blocks" },
    { id: "divider", label: "Divider", desc: "Visual separator", icon: Minus, group: "Media" },
    { id: "table", label: "Table", desc: "Insert data table", icon: TableIcon, group: "Media" },
    { id: "image", label: "Image", desc: "Embed an image", icon: ImageIcon, group: "Media" },
  ];

  const filteredCommands = slashCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(slashFilter) || cmd.desc.toLowerCase().includes(slashFilter)
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, typeof slashCommands>);

  if (!editor) return null;

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          editor.chain().focus().setImage({ src: reader.result as string }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleCanvasStrokesChange = (strokes: any[]) => {
    onCanvasChange?.(JSON.stringify(strokes));
  };

  return (
    <TooltipProvider>
      <div
        ref={editorContainerRef}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card",
          "transition-all duration-300",
          isFullscreen && "fixed inset-0 z-50 rounded-none",
          className
        )}
      >
        {/* Premium Toolbar */}
        {showToolbar && (
          <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
              {/* Mode Switcher */}
              {supportsStylus && (
                <>
                  <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                    <ToolbarButton
                      onClick={() => setMode("text")}
                      isActive={mode === "text"}
                      icon={Type}
                      title="Text Mode"
                      size="sm"
                    />
                    <ToolbarButton
                      onClick={() => setMode("canvas")}
                      isActive={mode === "canvas"}
                      icon={Pen}
                      title="Draw Mode"
                      size="sm"
                    />
                    <ToolbarButton
                      onClick={() => setMode("mixed")}
                      isActive={mode === "mixed"}
                      icon={Palette}
                      title="Mixed Mode"
                      size="sm"
                    />
                  </div>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                </>
              )}

              {/* Undo/Redo */}
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={Undo2}
                title="Undo ⌘Z"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={Redo2}
                title="Redo ⌘⇧Z"
              />

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Headings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                    <Heading1 className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {[1, 2, 3, 4].map((level) => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()}
                      className={cn(
                        "gap-2",
                        editor.isActive("heading", { level }) && "bg-accent"
                      )}
                    >
                      <span className={cn("font-semibold", `text-${["xl", "lg", "base", "sm"][level - 1]}`)}>
                        H{level}
                      </span>
                      <span className="text-muted-foreground text-xs">Heading {level}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Text Formatting */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                icon={Bold}
                title="Bold ⌘B"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                icon={Italic}
                title="Italic ⌘I"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive("underline")}
                icon={UnderlineIcon}
                title="Underline ⌘U"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                icon={Strikethrough}
                title="Strikethrough"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive("highlight")}
                icon={Highlighter}
                title="Highlight"
              />

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lists */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                icon={List}
                title="Bullet List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                icon={ListOrdered}
                title="Numbered List"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive("taskList")}
                icon={CheckSquare}
                title="Checklist"
              />

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Blocks */}
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive("blockquote")}
                icon={Quote}
                title="Quote"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive("codeBlock")}
                icon={Code}
                title="Code Block"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon={Minus}
                title="Divider"
              />

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Insert */}
              <ToolbarButton
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                isActive={editor.isActive("table")}
                icon={TableIcon}
                title="Table"
              />
              <ToolbarButton onClick={handleImageUpload} icon={ImageIcon} title="Image" />
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt("Enter URL:");
                  if (url) editor.chain().focus().setLink({ href: url }).run();
                }}
                isActive={editor.isActive("link")}
                icon={Link2}
                title="Link"
              />

              <div className="flex-1" />

              {/* AI Assist */}
              {onAIAssist && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-primary">
                      <Wand2 className="w-4 h-4" />
                      <span className="text-xs font-medium">AI Assist</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onAIAssist("summarize", editor.getText())}>
                      Summarize
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAIAssist("expand", editor.getText())}>
                      Expand
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAIAssist("simplify", editor.getText())}>
                      Simplify
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAIAssist("generate_questions", editor.getText())}>
                      Generate Questions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAIAssist("create_outline", editor.getText())}>
                      Create Outline
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Fullscreen */}
              <ToolbarButton
                onClick={() => setIsFullscreen(!isFullscreen)}
                icon={Maximize2}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              />
            </div>
          </div>
        )}

        {/* Floating format bar - appears on text selection */}
        {editor && editor.isActive('textSelection') && null}

        {/* Editor Area */}
        <div className="relative" style={{ minHeight }}>
          {/* Text Editor */}
          {(mode === "text" || mode === "mixed") && (
            <div className={cn(mode === "mixed" && "relative z-10")}>
              <EditorContent editor={editor} />
            </div>
          )}

          {/* Canvas Layer */}
          {(mode === "canvas" || mode === "mixed") && (
            <CanvasLayer
              ref={canvasRef}
              className={cn(
                "absolute inset-0",
                mode === "mixed" ? "pointer-events-auto z-20" : ""
              )}
              initialStrokes={canvasData ? JSON.parse(canvasData) : []}
              onStrokesChange={handleCanvasStrokesChange}
              isOverlay={mode === "mixed"}
            />
          )}
        </div>

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSlashMenu(false)} />
            <div
              className="absolute z-50 w-72 max-h-80 overflow-hidden bg-popover border border-border rounded-xl shadow-2xl animate-fade-in"
              style={{ top: slashPosition.top, left: Math.min(slashPosition.left, 200) }}
            >
              <div className="p-2 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground">Insert Block</p>
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {Object.entries(groupedCommands).map(([group, cmds]) => (
                  <div key={group}>
                    <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </p>
                    {cmds.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => executeSlashCommand(cmd.id)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                        >
                          <div className="p-1.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{cmd.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{cmd.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filteredCommands.length === 0 && (
                  <p className="px-3 py-6 text-sm text-muted-foreground text-center">No commands found</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mode Indicator */}
        {mode !== "text" && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 right-3 z-30 gap-1.5 bg-background/80 backdrop-blur-sm"
          >
            {mode === "canvas" ? <Pen className="w-3 h-3" /> : <Palette className="w-3 h-3" />}
            {mode === "canvas" ? "Drawing" : "Mixed"}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
};
