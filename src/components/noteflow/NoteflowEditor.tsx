import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Heading1, 
  Heading2, 
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Code,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Undo2,
  Redo2,
  Highlighter,
  Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NoteflowEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  showToolbar?: boolean;
  minHeight?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive, 
  icon: Icon, 
  title,
  disabled = false,
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  icon: React.ElementType; 
  title: string;
  disabled?: boolean;
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
          "h-8 w-8 p-0",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      <p>{title}</p>
    </TooltipContent>
  </Tooltip>
);

export const NoteflowEditor = ({ 
  content, 
  onChange, 
  placeholder = "Start writing... Type '/' for commands",
  editable = true,
  className,
  showToolbar = true,
  minHeight = "200px"
}: NoteflowEditorProps) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
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
          'focus:outline-none p-4',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:marker:text-muted-foreground',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic',
          'prose-table:border prose-table:border-border',
          'prose-td:border prose-td:border-border prose-td:p-2',
          'prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:border prose-pre:border-border'
        ),
        style: `min-height: ${minHeight}`,
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === '/' && !showSlashMenu) {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          setSlashMenuPosition({
            top: coords.bottom + 8,
            left: coords.left,
          });
          setShowSlashMenu(true);
          setSlashFilter("");
          return false;
        }

        // Close slash menu on escape
        if (event.key === 'Escape' && showSlashMenu) {
          setShowSlashMenu(false);
          return true;
        }

        return false;
      },
    },
  });

  // Handle slash menu filter
  useEffect(() => {
    if (!showSlashMenu || !editor) return;

    const handleInput = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from - 20, from, ' ');
      const slashIndex = text.lastIndexOf('/');
      if (slashIndex >= 0) {
        setSlashFilter(text.slice(slashIndex + 1).toLowerCase());
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

    switch (command) {
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'h4':
        editor.chain().focus().toggleHeading({ level: 4 }).run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'numbered':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'checklist':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'image':
        const url = window.prompt('Enter image URL:');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
        break;
    }

    setShowSlashMenu(false);
  }, [editor]);

  const slashCommands = [
    { id: 'h1', label: 'Heading 1', description: 'Large section heading', icon: Heading1 },
    { id: 'h2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2 },
    { id: 'h3', label: 'Heading 3', description: 'Small section heading', icon: Heading3 },
    { id: 'h4', label: 'Heading 4', description: 'Tiny section heading', icon: Heading4 },
    { id: 'bullet', label: 'Bullet List', description: 'Create a bullet list', icon: List },
    { id: 'numbered', label: 'Numbered List', description: 'Create a numbered list', icon: ListOrdered },
    { id: 'checklist', label: 'Checklist', description: 'Create a task checklist', icon: CheckSquare },
    { id: 'quote', label: 'Quote', description: 'Add a blockquote', icon: Quote },
    { id: 'code', label: 'Code Block', description: 'Add a code block', icon: Code },
    { id: 'divider', label: 'Divider', description: 'Add a horizontal divider', icon: Minus },
    { id: 'table', label: 'Table', description: 'Insert a table', icon: TableIcon },
    { id: 'image', label: 'Image', description: 'Add an image', icon: ImageIcon },
  ];

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashFilter) ||
    cmd.description.toLowerCase().includes(slashFilter)
  );

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <TooltipProvider>
      <div className={cn("border border-border rounded-2xl overflow-hidden bg-card relative", className)}>
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
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

            {/* Headings */}
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              icon={Heading1}
              title="Heading 1"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              icon={Heading2}
              title="Heading 2"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              icon={Heading3}
              title="Heading 3"
            />
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Text Formatting */}
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
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              icon={Strikethrough}
              title="Strikethrough"
            />
            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              icon={Code}
              title="Inline Code"
            />
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Lists */}
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
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Blocks */}
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
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Insertions */}
            <MenuButton
              onClick={addTable}
              isActive={editor.isActive('table')}
              icon={TableIcon}
              title="Insert Table"
            />
            <MenuButton
              onClick={addImage}
              icon={ImageIcon}
              title="Insert Image"
            />
          </div>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} />

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <div
            className="fixed z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden w-72"
            style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
          >
            <div className="p-2 border-b border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">Insert block</p>
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeSlashCommand(cmd.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-muted">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                        <p className="text-xs text-muted-foreground">{cmd.description}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">No commands found</p>
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

// Callout block component
export const CalloutBlock = ({ 
  children, 
  type = 'info' 
}: { 
  children: React.ReactNode; 
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  const configs = {
    info: { 
      bg: 'bg-blue-50 dark:bg-blue-950/30', 
      border: 'border-blue-200 dark:border-blue-800', 
      text: 'text-blue-800 dark:text-blue-200',
      icon: Info
    },
    warning: { 
      bg: 'bg-amber-50 dark:bg-amber-950/30', 
      border: 'border-amber-200 dark:border-amber-800', 
      text: 'text-amber-800 dark:text-amber-200',
      icon: AlertTriangle
    },
    success: { 
      bg: 'bg-emerald-50 dark:bg-emerald-950/30', 
      border: 'border-emerald-200 dark:border-emerald-800', 
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: CheckCircle
    },
    error: { 
      bg: 'bg-red-50 dark:bg-red-950/30', 
      border: 'border-red-200 dark:border-red-800', 
      text: 'text-red-800 dark:text-red-200',
      icon: AlertCircle
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border", config.bg, config.border, config.text)}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
    </div>
  );
};
