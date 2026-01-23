import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Bookmark,
  Sun,
  Moon,
  Sunset,
  Type,
  Maximize2,
  Minimize2,
  Book,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LibraryItem } from "./LibraryGrid";
import { InlineDictionary } from "./InlineDictionary";
import { ExplainParagraph } from "./ExplainParagraph";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import * as pdfjsLib from "pdfjs-dist";

// Use legacy build which includes worker inline - most reliable for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type ReadingTheme = "day" | "sepia" | "night";
type ReadingMode = "book" | "document";

interface BookReaderProps {
  item: LibraryItem;
  fileUrl: string;
  initialPage?: number;
  initialTheme?: ReadingTheme;
  initialMode?: ReadingMode;
  onClose: () => void;
  onProgressUpdate?: (page: number, progress: number) => void;
  onAddHighlight?: (page: number, text: string, note?: string) => void;
}

const THEME_STYLES: Record<
  ReadingTheme,
  { bg: string; text: string; label: string; icon: React.ElementType; canvasFilter?: string }
> = {
  day: { bg: "bg-background", text: "text-foreground", label: "Day", icon: Sun },
  sepia: {
    bg: "bg-background",
    text: "text-foreground",
    label: "Sepia",
    icon: Sunset,
    canvasFilter: "sepia",
  },
  night: {
    bg: "bg-background",
    text: "text-foreground",
    label: "Night",
    icon: Moon,
    canvasFilter: "invert hue-rotate-180",
  },
};

export const BookReader = ({
  item,
  fileUrl,
  initialPage = 1,
  initialTheme = "day",
  initialMode = "book",
  onClose,
  onProgressUpdate,
}: BookReaderProps) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(item.total_pages || 0);
  const [theme, setTheme] = useState<ReadingTheme>(initialTheme);
  const [mode, setMode] = useState<ReadingMode>(initialMode);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  
  // AI Features state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });
  const [showDictionary, setShowDictionary] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const themeStyle = THEME_STYLES[theme];

  // Handle text selection for dictionary/explain
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      
      if (rect) {
        setSelectedText(text);
        setSelectionPos({ x: rect.left, y: rect.bottom });
        
        // Single word = dictionary, multiple words = explain
        if (text.split(/\s+/).length === 1) {
          setShowDictionary(true);
          setShowExplain(false);
        } else if (text.length > 20) {
          setShowExplain(true);
          setShowDictionary(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  const handleSaveToVocabulary = async (word: string, data: any) => {
    if (!user?.id) return;
    
    await supabase.from('vocabulary').insert({
      user_id: user.id,
      word,
      meaning: data.meaning,
      phonetic: data.phonetic,
      synonyms: data.synonyms,
      antonyms: data.antonyms,
      examples: data.examples,
      translation_text: data.translation,
      source_type: 'study_reader',
      source_ref_id: item.id,
    });
  };

  const closeDictionary = () => {
    setShowDictionary(false);
    setSelectedText("");
  };

  const closeExplain = () => {
    setShowExplain(false);
    setSelectedText("");
  };

  // Determine actual file URL
  const actualFileUrl = fileUrl || (item as any).file_url;

  // Load PDF document
  useEffect(() => {
    if (!actualFileUrl) {
      setRenderError("No file URL provided");
      setIsLoading(false);
      return;
    }

    // Check if it's a PDF
    const isPdf = actualFileUrl.toLowerCase().includes('.pdf') || item.format === 'pdf';
    if (!isPdf) {
      setRenderError(`${item.format?.toUpperCase() || 'This format'} viewing is not yet supported. Download to view.`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        // Use conservative settings to avoid CORS/range issues on storage URLs
        const loadingTask = pdfjsLib.getDocument({
          url: actualFileUrl,
          disableRange: true,
          disableStream: true,
        } as any);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setRenderError("Failed to load PDF. The file may be corrupted or inaccessible.");
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [actualFileUrl, item.format]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext("2d")!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        } as any).promise;
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetControlsTimer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        goToPreviousPage();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
      resetControlsTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, isFullscreen, onClose, resetControlsTimer]);

  // Update progress on page change
  useEffect(() => {
    if (totalPages > 0) {
      const newProgress = Math.round((currentPage / totalPages) * 100);
      onProgressUpdate?.(currentPage, newProgress);
    }
  }, [currentPage, totalPages, onProgressUpdate]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        themeStyle.bg,
        themeStyle.text
      )}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Top Bar */}
      <header
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-b border-border transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Library
          </Button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-sm font-medium truncate max-w-md mx-auto">
            {item.title}
          </h1>
          <p className="text-xs opacity-60">
            Page {currentPage} of {totalPages || "..."}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Reading mode toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                {mode === "book" ? <Book className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2 bg-popover">
              <p className="text-xs text-muted-foreground mb-2 px-2">Reading Mode</p>
              <button
                onClick={() => setMode("book")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  mode === "book" ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <Book className="w-4 h-4" />
                Book Mode
              </button>
              <button
                onClick={() => setMode("document")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  mode === "document" ? "bg-accent" : "hover:bg-muted"
                )}
              >
                <FileText className="w-4 h-4" />
                Document Mode
              </button>
            </PopoverContent>
          </Popover>

          {/* Theme & Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 bg-popover">
              <div className="space-y-4">
                {/* Theme selector */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Theme</p>
                  <div className="flex gap-2">
                    {Object.entries(THEME_STYLES).map(([key, style]) => {
                      const Icon = style.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTheme(key as ReadingTheme)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors",
                            theme === key
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Zoom: {Math.round(scale * 100)}%
                  </p>
                  <div className="flex items-center gap-3">
                    <Type className="w-3 h-3 text-muted-foreground" />
                    <Slider
                      value={[scale]}
                      onValueChange={([v]) => setScale(v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <Type className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Reading Area */}
      <main className="flex-1 flex items-center justify-center overflow-auto relative p-4">
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-60" />
            <p className="text-sm opacity-60">Loading document...</p>
          </div>
        ) : renderError ? (
          <div className="text-center max-w-md">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm opacity-60 mb-4">{renderError}</p>
            <Button variant="outline" onClick={onClose}>
              Back to Library
            </Button>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={cn(
                "max-w-full shadow-xl rounded",
                themeStyle.canvasFilter
              )}
            />
          </div>
        )}

        {/* Inline Dictionary */}
        {showDictionary && selectedText && (
          <InlineDictionary
            selectedText={selectedText}
            position={selectionPos}
            onClose={closeDictionary}
            onSaveToVocabulary={handleSaveToVocabulary}
            libraryItemId={item.id}
          />
        )}

        {/* Explain Paragraph */}
        {showExplain && selectedText && (
          <ExplainParagraph
            paragraphText={selectedText}
            libraryItemId={item.id}
            chapterIndex={currentPage}
            position={selectionPos}
            onClose={closeExplain}
          />
        )}

        {/* Page navigation (Book mode) */}
        {mode === "book" && !isLoading && !renderError && (
          <>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all",
                showControls ? "opacity-100" : "opacity-0",
                currentPage <= 1 
                  ? "opacity-30 cursor-not-allowed" 
                  : theme === "night" 
                    ? "hover:bg-gray-800" 
                    : "hover:bg-gray-100"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all",
                showControls ? "opacity-100" : "opacity-0",
                currentPage >= totalPages 
                  ? "opacity-30 cursor-not-allowed" 
                  : theme === "night" 
                    ? "hover:bg-gray-800" 
                    : "hover:bg-gray-100"
              )}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-t transition-opacity duration-300",
          theme === "night" ? "border-gray-800" : "border-gray-200",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className={cn(theme === "night" && "hover:bg-gray-800 text-gray-100")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        {/* Progress slider */}
        <div className="flex-1 flex items-center gap-4 max-w-md">
          <Slider
            value={[currentPage]}
            onValueChange={([page]) => goToPage(page)}
            min={1}
            max={totalPages || 1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm opacity-60 flex-shrink-0 min-w-[3rem] text-center">
            {progress}%
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className={cn(theme === "night" && "hover:bg-gray-800 text-gray-100")}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </footer>
    </div>
  );
};
