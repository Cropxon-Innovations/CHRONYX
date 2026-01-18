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
  MessageSquare,
  Search,
  Download,
  Share2,
  Lock,
  Sun,
  Moon,
  Sunset,
  Type,
  Maximize2,
  Minimize2,
  Book,
  FileText,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LibraryItem } from "./LibraryGrid";

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

const THEME_STYLES: Record<ReadingTheme, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  day: { bg: "bg-white", text: "text-gray-900", label: "Day", icon: Sun },
  sepia: { bg: "bg-amber-50", text: "text-amber-900", label: "Sepia", icon: Sunset },
  night: { bg: "bg-gray-900", text: "text-gray-100", label: "Night", icon: Moon },
};

export const BookReader = ({
  item,
  fileUrl,
  initialPage = 1,
  initialTheme = "day",
  initialMode = "book",
  onClose,
  onProgressUpdate,
  onAddHighlight,
}: BookReaderProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(item.total_pages || 0);
  const [theme, setTheme] = useState<ReadingTheme>(initialTheme);
  const [mode, setMode] = useState<ReadingMode>(initialMode);
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const themeStyle = THEME_STYLES[theme];

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
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  // Simulate loading (replace with actual PDF.js/EPUB.js rendering)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!totalPages) setTotalPages(item.total_pages || 300); // Fallback
    }, 500);
    return () => clearTimeout(timer);
  }, [fileUrl, item.total_pages, totalPages]);

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
          "flex items-center justify-between gap-4 px-4 py-3 border-b transition-opacity duration-300",
          theme === "night" ? "border-gray-800" : "border-gray-200",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              theme === "night" && "hover:bg-gray-800 text-gray-100"
            )}
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
            Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Reading mode toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  theme === "night" && "hover:bg-gray-800 text-gray-100"
                )}
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
                className={cn(
                  "h-8 w-8",
                  theme === "night" && "hover:bg-gray-800 text-gray-100"
                )}
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

                {/* Font size */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Font Size: {fontSize}px
                  </p>
                  <div className="flex items-center gap-3">
                    <Type className="w-3 h-3 text-muted-foreground" />
                    <Slider
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                      min={12}
                      max={24}
                      step={1}
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
            className={cn(
              "h-8 w-8",
              theme === "night" && "hover:bg-gray-800 text-gray-100"
            )}
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
            className={cn(
              "h-8 w-8",
              theme === "night" && "hover:bg-gray-800 text-gray-100"
            )}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Reading Area */}
      <main className="flex-1 flex items-center justify-center overflow-hidden relative">
        {isLoading ? (
          <div className="animate-pulse text-center">
            <div className="w-64 h-96 bg-muted/20 rounded-lg mx-auto mb-4" />
            <p className="text-sm opacity-60">Loading page...</p>
          </div>
        ) : mode === "book" ? (
          /* Book Mode - Page by page */
          <div
            className={cn(
              "w-full max-w-2xl mx-auto px-8 py-12",
              "prose prose-lg dark:prose-invert",
              theme === "sepia" && "prose-amber",
              "transition-all duration-300"
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* Placeholder for actual PDF.js / EPUB.js content */}
            <div className="min-h-[60vh] flex items-center justify-center border border-dashed border-current/20 rounded-lg">
              <div className="text-center opacity-60">
                <p className="text-lg font-medium mb-2">Page {currentPage}</p>
                <p className="text-sm">
                  PDF.js / EPUB.js will render content here
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Document Mode - Scrollable */
          <div className="w-full h-full overflow-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Placeholder for scrollable document view */}
              <div className="min-h-[200vh] border border-dashed border-current/20 rounded-lg flex items-start justify-center pt-20">
                <p className="opacity-60">Scrollable document view</p>
              </div>
            </div>
          </div>
        )}

        {/* Page navigation (Book mode) */}
        {mode === "book" && (
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
