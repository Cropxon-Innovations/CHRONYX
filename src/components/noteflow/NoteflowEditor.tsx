import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Heading1, 
  Heading2, 
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Code,
  Undo2,
  Redo2,
  Highlighter,
  Strikethrough,
  Link2,
  FileText,
  Grid3X3,
  ChevronDown,
  AlertCircle,
  Lightbulb,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NoteflowEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  minHeight?: string;
  paperStyle?: 'plain' | 'lined' | 'grid';
}

const MenuButton = ({ 
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
    <TooltipContent side="top" className="text-xs font-medium">
      <p>{title}</p>
    </TooltipContent>
  </Tooltip>
);

// Paper style backgrounds
const paperStyles = {
  plain: "",
  lined: "bg-[linear-gradient(transparent_31px,hsl(var(--border)/0.3)_31px)] bg-[size:100%_32px]",
  grid: "bg-[linear-gradient(hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:24px_24px]",
};

export const NoteflowEditor = ({ 
  content, 
  onChange, 
  placeholder = "Start writing... Type '/' for commands",
  editable = true,
  className,
  showToolbar = true,
  minHeight = "300px",
  paperStyle = "plain",
}: NoteflowEditorProps) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline decoration-primary/50 hover:decoration-primary cursor-pointer',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-4 shadow-sm border border-border',
        },
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
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none px-6 py-6',
          // Apple-level typography with proper heading hierarchy
          'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
          'prose-h1:text-4xl prose-h1:font-extrabold prose-h1:mb-6 prose-h1:mt-8 prose-h1:leading-tight',
          'prose-h2:text-3xl prose-h2:font-bold prose-h2:mb-5 prose-h2:mt-7 prose-h2:leading-tight',
          'prose-h3:text-2xl prose-h3:font-semibold prose-h3:mb-4 prose-h3:mt-6',
          'prose-h4:text-xl prose-h4:font-semibold prose-h4:mb-3 prose-h4:mt-5',
          'prose-h5:text-lg prose-h5:font-medium prose-h5:mb-2 prose-h5:mt-4',
          'prose-h6:text-base prose-h6:font-medium prose-h6:mb-2 prose-h6:mt-4 prose-h6:text-muted-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4',
          'prose-strong:font-semibold prose-strong:text-foreground',
          'prose-em:italic prose-em:text-foreground',
          'prose-ul:my-3 prose-ol:my-3',
          'prose-li:my-1 prose-li:marker:text-muted-foreground',
          'prose-blockquote:border-l-4 prose-blockquote:border-primary/50',
          'prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono',
          'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:my-4',
          'prose-table:border-collapse prose-table:w-full prose-table:my-4',
          'prose-td:border prose-td:border-border prose-td:p-3',
          'prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted/50 prose-th:font-semibold prose-th:text-left',
          'prose-hr:border-border prose-hr:my-6',
          // Task list styles
          '[&_.task-list]:list-none [&_.task-list]:pl-0',
          '[&_.task-item]:flex [&_.task-item]:items-start [&_.task-item]:gap-2 [&_.task-item]:my-1',
          '[&_.task-item_input]:mt-1 [&_.task-item_input]:accent-primary',
        ),
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === '/' && !showSlashMenu) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          const containerRect = editorContainerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setSlashMenuPosition({
              top: coords.bottom - containerRect.top + 8,
              left: Math.min(coords.left - containerRect.left, containerRect.width - 300),
            });
          }
          setShowSlashMenu(true);
          setSlashFilter("");
          setSelectedCommandIndex(0);
          return false;
        }

        // Handle arrow navigation in slash menu
        if (showSlashMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedCommandIndex(prev => prev + 1);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedCommandIndex(prev => Math.max(0, prev - 1));
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const filteredCmds = slashCommands.filter(cmd =>
              cmd.label.toLowerCase().includes(slashFilter) ||
              cmd.description.toLowerCase().includes(slashFilter)
            );
            const cmd = filteredCmds[selectedCommandIndex % filteredCmds.length];
            if (cmd) executeSlashCommand(cmd.id);
            return true;
          }
          if (event.key === 'Escape') {
            setShowSlashMenu(false);
            return true;
          }
        }

        return false;
      },
    },
  });

  // Handle slash menu filter
  useEffect(() => {
    if (!showSlashMenu || !editor) return;

    const handleInput = () => {
      const { from } = editor.state.selection;
      const text = editor.state.doc.textBetween(Math.max(0, from - 20), from, ' ');
      const slashIndex = text.lastIndexOf('/');
      if (slashIndex >= 0) {
        setSlashFilter(text.slice(slashIndex + 1).toLowerCase());
        setSelectedCommandIndex(0);
      } else {
        setShowSlashMenu(false);
      }
    };

    editor.on('update', handleInput);
    return () => {
      editor.off('update', handleInput);
    };
  }, [editor, showSlashMenu]);

  // Load initial content
  useEffect(() => {
    if (editor && content) {
      try {
        let parsedContent = content;
        
        if (typeof content === 'string') {
          parsedContent = JSON.parse(content);
          if (typeof parsedContent === 'string') {
            parsedContent = JSON.parse(parsedContent);
          }
        }
        
        const currentContent = JSON.stringify(editor.getJSON());
        const newContent = JSON.stringify(parsedContent);
        
        if (currentContent !== newContent) {
          editor.commands.setContent(parsedContent);
        }
      } catch {
        if (typeof content === 'string' && content.trim() && content !== editor.getText()) {
          editor.commands.setContent(`<p>${content}</p>`);
        }
      }
    }
  }, [content, editor]);

  const executeSlashCommand = useCallback((command: string) => {
    if (!editor) return;

    // Remove the slash and filter text
    const { from } = editor.state.selection;
    const text = editor.state.doc.textBetween(Math.max(0, from - 20), from, ' ');
    const slashIndex = text.lastIndexOf('/');
    if (slashIndex >= 0) {
      const deleteFrom = from - (text.length - slashIndex);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }

    const commands: Record<string, () => void> = {
      h1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      h4: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
      h5: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
      h6: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
      text: () => editor.chain().focus().setParagraph().run(),
      bullet: () => editor.chain().focus().toggleBulletList().run(),
      numbered: () => editor.chain().focus().toggleOrderedList().run(),
      checklist: () => editor.chain().focus().toggleTaskList().run(),
      quote: () => editor.chain().focus().toggleBlockquote().run(),
      code: () => editor.chain().focus().toggleCodeBlock().run(),
      divider: () => editor.chain().focus().setHorizontalRule().run(),
      table: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      image: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
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
      },
      callout_info: () => {
        editor.chain().focus().insertContent({
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ℹ️ Info: ' }] }],
        }).run();
      },
      callout_tip: () => {
        editor.chain().focus().insertContent({
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '💡 Tip: ' }] }],
        }).run();
      },
      callout_warning: () => {
        editor.chain().focus().insertContent({
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '⚠️ Warning: ' }] }],
        }).run();
      },
    };

    commands[command]?.();
    setShowSlashMenu(false);
  }, [editor]);

  const slashCommands = [
    { id: 'text', label: 'Text', description: 'Plain paragraph text', icon: FileText, group: 'Basic' },
    { id: 'h1', label: 'Heading 1', description: 'Large title heading', icon: Heading1, group: 'Headings' },
    { id: 'h2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2, group: 'Headings' },
    { id: 'h3', label: 'Heading 3', description: 'Small section heading', icon: Heading3, group: 'Headings' },
    { id: 'h4', label: 'Heading 4', description: 'Subsection heading', icon: Heading4, group: 'Headings' },
    { id: 'h5', label: 'Heading 5', description: 'Minor heading', icon: Heading5, group: 'Headings' },
    { id: 'h6', label: 'Heading 6', description: 'Smallest heading', icon: Heading6, group: 'Headings' },
    { id: 'bullet', label: 'Bullet List', description: 'Create a bullet list', icon: List, group: 'Lists' },
    { id: 'numbered', label: 'Numbered List', description: 'Create a numbered list', icon: ListOrdered, group: 'Lists' },
    { id: 'checklist', label: 'Checklist', description: 'Create a task checklist', icon: CheckSquare, group: 'Lists' },
    { id: 'quote', label: 'Quote', description: 'Add a blockquote', icon: Quote, group: 'Blocks' },
    { id: 'code', label: 'Code Block', description: 'Add a code block', icon: Code, group: 'Blocks' },
    { id: 'callout_info', label: 'Info Callout', description: 'Information callout', icon: Info, group: 'Callouts' },
    { id: 'callout_tip', label: 'Tip Callout', description: 'Helpful tip callout', icon: Lightbulb, group: 'Callouts' },
    { id: 'callout_warning', label: 'Warning Callout', description: 'Warning callout', icon: AlertTriangle, group: 'Callouts' },
    { id: 'divider', label: 'Divider', description: 'Add a horizontal divider', icon: Minus, group: 'Media' },
    { id: 'table', label: 'Table', description: 'Insert a 3×3 table', icon: TableIcon, group: 'Media' },
    { id: 'image', label: 'Image', description: 'Upload an image', icon: ImageIcon, group: 'Media' },
  ];

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter) ||
    cmd.description.toLowerCase().includes(slashFilter)
  );

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, typeof slashCommands>);

  if (!editor) {
    return (
      <div className={cn("border border-border rounded-2xl overflow-hidden bg-card animate-pulse", className)}>
        <div className="h-12 bg-muted/30" />
        <div className="p-6" style={{ minHeight }}>
          <div className="h-4 bg-muted rounded w-3/4 mb-3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <TooltipProvider>
      <div 
        ref={editorContainerRef}
        className={cn(
          "border border-border rounded-2xl overflow-hidden bg-card relative",
          "transition-all duration-300",
          className
        )}
      >
        {/* Premium Toolbar - Responsive */}
        {showToolbar && (
          <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-0.5 p-2 overflow-x-auto scrollbar-hide">
              {/* Undo/Redo */}
              <MenuButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={Undo2}
                title="Undo (⌘Z)"
              />
              <MenuButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={Redo2}
                title="Redo (⌘⇧Z)"
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
                <DropdownMenuContent align="start" className="w-48">
                  {[1, 2, 3, 4, 5, 6].map((level) => {
                    const icons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];
                    const Icon = icons[level - 1];
                    const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
                    return (
                      <DropdownMenuItem
                        key={level}
                        onClick={() => editor.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run()}
                        className={cn(
                          "gap-2",
                          editor.isActive("heading", { level }) && "bg-accent"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className={cn("font-semibold", sizes[level - 1])}>
                          Heading {level}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={cn("gap-2", !editor.isActive("heading") && "bg-accent")}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Paragraph</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
              
              {/* Text Formatting */}
              <div className="hidden sm:flex items-center gap-0.5">
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  isActive={editor.isActive('bold')}
                  icon={Bold}
                  title="Bold (⌘B)"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  isActive={editor.isActive('italic')}
                  icon={Italic}
                  title="Italic (⌘I)"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  isActive={editor.isActive('underline')}
                  icon={UnderlineIcon}
                  title="Underline (⌘U)"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  isActive={editor.isActive('strike')}
                  icon={Strikethrough}
                  title="Strikethrough"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  isActive={editor.isActive('highlight')}
                  icon={Highlighter}
                  title="Highlight"
                />
                <MenuButton
                  onClick={addLink}
                  isActive={editor.isActive('link')}
                  icon={Link2}
                  title="Add Link"
                />
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />
              
              {/* Lists */}
              <div className="hidden md:flex items-center gap-0.5">
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  isActive={editor.isActive('bulletList')}
                  icon={List}
                  title="Bullet List"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  isActive={editor.isActive('orderedList')}
                  icon={ListOrdered}
                  title="Numbered List"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleTaskList().run()}
                  isActive={editor.isActive('taskList')}
                  icon={CheckSquare}
                  title="Checklist"
                />
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-1 hidden lg:block" />
              
              {/* Blocks */}
              <div className="hidden lg:flex items-center gap-0.5">
                <MenuButton
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  isActive={editor.isActive('blockquote')}
                  icon={Quote}
                  title="Quote"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  isActive={editor.isActive('codeBlock')}
                  icon={Code}
                  title="Code Block"
                />
                <MenuButton
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  icon={Minus}
                  title="Divider"
                />
              </div>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Insertions */}
              <MenuButton
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                isActive={editor.isActive('table')}
                icon={TableIcon}
                title="Insert Table"
              />
              <MenuButton
                onClick={() => executeSlashCommand('image')}
                icon={ImageIcon}
                title="Insert Image"
              />

              {/* Mobile menu indicator */}
              <div className="sm:hidden ml-auto">
                <Badge variant="outline" className="text-[10px]">
                  Type / for more
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Editor Content with Paper Style */}
        <div className={cn("relative", paperStyles[paperStyle])}>
          <EditorContent editor={editor} />
        </div>

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <div
            className="absolute z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden w-72 max-h-80"
            style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
          >
            <div className="p-2 border-b border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">
                Insert block · Type to filter
              </p>
            </div>
            <div className="overflow-y-auto max-h-64 p-1">
              {Object.entries(groupedCommands).length > 0 ? (
                Object.entries(groupedCommands).map(([group, commands], groupIndex) => (
                  <div key={group}>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    {commands.map((cmd, cmdIndex) => {
                      const Icon = cmd.icon;
                      const flatIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                      const isSelected = flatIndex === (selectedCommandIndex % filteredCommands.length);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => executeSlashCommand(cmd.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                            isSelected ? "bg-accent" : "hover:bg-accent/50"
                          )}
                        >
                          <div className="p-1.5 rounded-lg bg-muted">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No commands found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Click outside to close slash menu */}
        {showSlashMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSlashMenu(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

// Callout block component for future use
export const CalloutBlock = ({ 
  type = 'info', 
  children 
}: { 
  type?: 'info' | 'tip' | 'warning' | 'error';
  children: React.ReactNode;
}) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    tip: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400',
  };

  const icons = {
    info: Info,
    tip: Lightbulb,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-xl border my-4',
      styles[type]
    )}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
};
