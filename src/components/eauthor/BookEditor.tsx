import { useEffect, useCallback, useState } from "react";
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
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Table as TableIcon,
  ImageIcon,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Chapter {
  id: string;
  title: string;
  content: any;
  word_count: number;
}

interface BookEditorProps {
  chapter: Chapter;
  onSave: (content: any, wordCount: number) => void;
}

const MenuButton = ({
  onClick,
  isActive,
  icon: Icon,
  title,
  disabled,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: React.ElementType;
  title: string;
  disabled?: boolean;
}) => (
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
    title={title}
  >
    <Icon className="w-4 h-4" />
  </Button>
);

const BookEditor = ({ chapter, onSave }: BookEditorProps) => {
  const [wordCount, setWordCount] = useState(chapter.word_count);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your chapter...",
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
          class: "rounded-lg max-w-full h-auto mx-auto my-4",
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-lg dark:prose-invert max-w-none",
          "focus:outline-none min-h-[calc(100vh-16rem)] px-8 py-6",
          "prose-headings:font-serif prose-headings:text-foreground",
          "prose-p:text-foreground prose-p:leading-relaxed prose-p:text-lg",
          "prose-ul:text-foreground prose-ol:text-foreground",
          "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:italic",
          "prose-code:bg-muted prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-muted prose-pre:text-foreground"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const newWordCount = countWords(text);
      setWordCount(newWordCount);
      
      // Auto-save debounced
      const content = editor.getJSON();
      onSave(content, newWordCount);
    },
  });

  // Load content when chapter changes
  useEffect(() => {
    if (editor && chapter.content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(chapter.content);
      
      if (currentContent !== newContent) {
        editor.commands.setContent(chapter.content);
        setWordCount(chapter.word_count);
      }
    }
  }, [chapter.id, editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card sticky top-0 z-10">
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={Undo}
          title="Undo"
        />
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={Redo}
          title="Redo"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          icon={Heading1}
          title="Heading 1"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
          title="Heading 2"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          icon={Heading3}
          title="Heading 3"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          isActive={editor.isActive("heading", { level: 4 })}
          icon={Heading4}
          title="Heading 4"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon={Bold}
          title="Bold"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon={Italic}
          title="Italic"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          icon={Code}
          title="Code"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon={List}
          title="Bullet List"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon={ListOrdered}
          title="Numbered List"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          icon={Quote}
          title="Quote"
        />
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          icon={Code}
          title="Code Block"
        />
        <MenuButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          title="Divider"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <MenuButton onClick={addTable} isActive={editor.isActive("table")} icon={TableIcon} title="Insert Table" />
        <MenuButton onClick={addImage} icon={ImageIcon} title="Insert Image" />

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground px-2">
          {wordCount.toLocaleString()} words • ~{Math.ceil(wordCount / 200)} min read
        </span>
      </div>

      {/* Editor */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default BookEditor;
