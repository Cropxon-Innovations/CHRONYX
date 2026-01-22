import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bookmark,
  Sun,
  Moon,
  BookOpen,
  List,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  cover_url: string | null;
}

interface Chapter {
  id: string;
  title: string;
  content: any;
  order_index: number;
  word_count: number;
}

interface BookReaderProps {
  book: Book;
  onBack: () => void;
}

type ReadingTheme = "light" | "sepia" | "dark";
type ReadingMode = "scroll" | "paginated";

const themeStyles: Record<ReadingTheme, { bg: string; text: string; accent: string }> = {
  light: { bg: "bg-white", text: "text-gray-900", accent: "text-gray-600" },
  sepia: { bg: "bg-[#f4ecd8]", text: "text-[#5b4636]", accent: "text-[#8b7355]" },
  dark: { bg: "bg-[#1a1a1a]", text: "text-[#e0e0e0]", accent: "text-[#888]" },
};

const BookReader = ({ book, onBack }: BookReaderProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>("scroll");
  const [theme, setTheme] = useState<ReadingTheme>("light");
  const [fontSize, setFontSize] = useState(18);
  const [lineSpacing, setLineSpacing] = useState(1.8);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    fetchChapters();
    fetchProgress();
  }, [book.id]);

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from("book_chapters")
      .select("*")
      .eq("book_id", book.id)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setChapters(data);
    }
    setLoading(false);
  };

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("book_reading_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .single();

    if (data) {
      setProgress(data.progress_percentage || 0);
      if (data.reading_settings) {
        const settings = data.reading_settings as any;
        if (settings.theme) setTheme(settings.theme);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.lineSpacing) setLineSpacing(settings.lineSpacing);
      }
    }
  };

  const saveProgress = useCallback(async () => {
    if (!user) return;
    const currentChapter = chapters[currentChapterIndex];
    const progressPercentage = ((currentChapterIndex + 1) / chapters.length) * 100;

    await supabase
      .from("book_reading_progress")
      .upsert({
        user_id: user.id,
        book_id: book.id,
        current_chapter_id: currentChapter?.id,
        progress_percentage: progressPercentage,
        reading_settings: { theme, fontSize, lineSpacing },
        last_read_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,book_id",
      });
  }, [user, book.id, currentChapterIndex, chapters, theme, fontSize, lineSpacing]);

  useEffect(() => {
    const timer = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timer);
  }, [currentChapterIndex, saveProgress]);

  const goToChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentPage(0);
    setShowToc(false);
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentPage(0);
    }
  };

  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setCurrentPage(0);
    }
  };

  const toggleBookmark = () => {
    const currentId = chapters[currentChapterIndex]?.id;
    if (!currentId) return;
    
    if (bookmarks.includes(currentId)) {
      setBookmarks(bookmarks.filter(b => b !== currentId));
    } else {
      setBookmarks([...bookmarks, currentId]);
    }
  };

  const renderContent = (content: any): React.ReactNode => {
    if (!content || !content.content) return null;

    return content.content.map((node: any, index: number) => {
      switch (node.type) {
        case "heading":
          const HeadingTag = `h${node.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag
              key={index}
              className={cn(
                "font-serif font-bold mb-4",
                node.attrs?.level === 1 && "text-3xl mt-8",
                node.attrs?.level === 2 && "text-2xl mt-6",
                node.attrs?.level === 3 && "text-xl mt-4",
                node.attrs?.level === 4 && "text-lg mt-4"
              )}
            >
              {node.content?.map((c: any) => c.text).join("") || ""}
            </HeadingTag>
          );
        case "paragraph":
          return (
            <p key={index} className="mb-4" style={{ lineHeight: lineSpacing }}>
              {node.content?.map((c: any, i: number) => {
                let text = c.text || "";
                if (c.marks) {
                  c.marks.forEach((mark: any) => {
                    if (mark.type === "bold") text = <strong key={i}>{text}</strong>;
                    if (mark.type === "italic") text = <em key={i}>{text}</em>;
                    if (mark.type === "code") text = <code key={i} className="bg-muted px-1 rounded">{text}</code>;
                  });
                }
                return text;
              }) || ""}
            </p>
          );
        case "bulletList":
          return (
            <ul key={index} className="list-disc list-inside mb-4 space-y-1">
              {node.content?.map((item: any, i: number) => (
                <li key={i}>{item.content?.[0]?.content?.[0]?.text || ""}</li>
              ))}
            </ul>
          );
        case "orderedList":
          return (
            <ol key={index} className="list-decimal list-inside mb-4 space-y-1">
              {node.content?.map((item: any, i: number) => (
                <li key={i}>{item.content?.[0]?.content?.[0]?.text || ""}</li>
              ))}
            </ol>
          );
        case "blockquote":
          return (
            <blockquote key={index} className="border-l-4 border-primary pl-4 italic my-4">
              {node.content?.map((c: any, i: number) => renderContent({ content: [c] }))}
            </blockquote>
          );
        case "codeBlock":
          return (
            <pre key={index} className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm">
              {node.content?.map((c: any) => c.text).join("\n") || ""}
            </pre>
          );
        case "image":
          return (
            <img
              key={index}
              src={node.attrs?.src}
              alt={node.attrs?.alt || ""}
              className="max-w-full h-auto rounded-lg my-4 mx-auto"
            />
          );
        case "horizontalRule":
          return <hr key={index} className="my-8 border-t border-current opacity-20" />;
        default:
          return null;
      }
    });
  };

  const currentChapter = chapters[currentChapterIndex];
  const styles = themeStyles[theme];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading book...</div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No content yet</h3>
        <p className="text-sm text-muted-foreground mb-4">This book doesn't have any chapters</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", styles.bg)}>
      {/* Top Bar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 border-b transition-colors",
        styles.bg,
        theme === "dark" ? "border-gray-800" : "border-gray-200"
      )}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className={styles.text}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className={cn("font-medium text-sm", styles.text)}>{book.title}</h1>
            <p className={cn("text-xs", styles.accent)}>{currentChapter?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TOC */}
          <Sheet open={showToc} onOpenChange={setShowToc}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={styles.text}>
                <List className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn(styles.bg, styles.text)}>
              <SheetHeader>
                <SheetTitle className={styles.text}>Table of Contents</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-1">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => goToChapter(index)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
                        currentChapterIndex === index 
                          ? "bg-primary/10 text-primary" 
                          : cn("hover:bg-accent/50", styles.text)
                      )}
                    >
                      {bookmarks.includes(chapter.id) && <Bookmark className="w-3 h-3 fill-current" />}
                      <span className="flex-1">{chapter.title}</span>
                      <span className={cn("text-xs", styles.accent)}>{chapter.word_count} words</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Bookmark */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleBookmark}
            className={styles.text}
          >
            <Bookmark className={cn(
              "w-5 h-5",
              bookmarks.includes(currentChapter?.id) && "fill-current"
            )} />
          </Button>

          {/* Settings */}
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={styles.text}>
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className={cn(styles.bg, styles.text)}>
              <SheetHeader>
                <SheetTitle className={styles.text}>Reading Settings</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Theme */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Theme</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-colors",
                        theme === "light" ? "border-primary bg-primary/10" : "border-gray-300"
                      )}
                    >
                      <Sun className="w-5 h-5 mx-auto text-gray-700" />
                    </button>
                    <button
                      onClick={() => setTheme("sepia")}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-colors bg-[#f4ecd8]",
                        theme === "sepia" ? "border-primary" : "border-[#d4c4a8]"
                      )}
                    >
                      <BookOpen className="w-5 h-5 mx-auto text-[#5b4636]" />
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex-1 py-3 rounded-lg border transition-colors bg-[#1a1a1a]",
                        theme === "dark" ? "border-primary" : "border-gray-700"
                      )}
                    >
                      <Moon className="w-5 h-5 mx-auto text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Font Size</label>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="flex-1 text-center">{fontSize}px</span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Line Spacing</label>
                  <Slider
                    value={[lineSpacing]}
                    onValueChange={([value]) => setLineSpacing(value)}
                    min={1.2}
                    max={2.4}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span>Compact</span>
                    <span>Relaxed</span>
                  </div>
                </div>

                {/* Reading Mode */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Reading Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={readingMode === "scroll" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setReadingMode("scroll")}
                    >
                      Scroll
                    </Button>
                    <Button
                      variant={readingMode === "paginated" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setReadingMode("paginated")}
                    >
                      Pages
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fixed top-[49px] left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-40">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="pt-16 pb-20">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div 
            className="max-w-2xl mx-auto px-6 py-8"
            style={{ fontSize: `${fontSize}px` }}
          >
            <h1 className={cn("text-3xl font-serif font-bold mb-8", styles.text)}>
              {currentChapter?.title}
            </h1>
            <div className={styles.text}>
              {currentChapter && renderContent(currentChapter.content)}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Navigation */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-t transition-colors",
        styles.bg,
        theme === "dark" ? "border-gray-800" : "border-gray-200"
      )}>
        <Button
          variant="ghost"
          onClick={goToPrevChapter}
          disabled={currentChapterIndex === 0}
          className={cn("gap-2", styles.text)}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <span className={cn("text-sm", styles.accent)}>
          Chapter {currentChapterIndex + 1} of {chapters.length}
        </span>

        <Button
          variant="ghost"
          onClick={goToNextChapter}
          disabled={currentChapterIndex === chapters.length - 1}
          className={cn("gap-2", styles.text)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default BookReader;
