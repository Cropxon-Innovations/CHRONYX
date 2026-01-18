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
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive, 
  icon: Icon, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  icon: React.ElementType; 
  title: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-accent text-accent-foreground"
    )}
    title={title}
  >
    <Icon className="w-4 h-4" />
  </Button>
);

export const TiptapEditor = ({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  editable = true,
  className 
}: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: false,
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
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none min-h-[200px] p-4',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-table:border prose-table:border-border',
          'prose-td:border prose-td:border-border prose-td:p-2',
          'prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted'
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      try {
        const parsedContent = JSON.parse(content);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsedContent)) {
          editor.commands.setContent(parsedContent);
        }
      } catch {
        // If content is plain text, set it directly
        if (content !== editor.getText()) {
          editor.commands.setContent(`<p>${content}</p>`);
        }
      }
    }
  }, [content, editor]);

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
    <div className={cn("border border-border rounded-2xl overflow-hidden bg-card", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
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
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
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
        
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          title="Quote"
        />
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          title="Divider"
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
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

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

// Callout extension component for custom blocks
export const CalloutBlock = ({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) => {
  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200',
  };

  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border", colors[type])}>
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
};
