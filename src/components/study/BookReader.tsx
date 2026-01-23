import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
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

// Swipe threshold for page navigation
const SWIPE_THRESHOLD = 50;

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
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // AI Features state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState({ x: 0, y: 0 });
  const [showDictionary, setShowDictionary] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const progress = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const themeStyle = THEME_STYLES[theme];

  // Detect if on mobile/tablet
  const isMobileOrTablet = typeof window !== "undefined" && 
    (window.innerWidth < 1024 || 'ontouchstart' in window);

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

  // Retry PDF loading
  const retryLoadPdf = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

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
    setDownloadProgress(0);

    const loadPdf = async () => {
      try {
        // Fetch the PDF with progress tracking
        const response = await fetch(actualFileUrl, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        // Get content length for progress calculation
        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        
        // Read the response with progress
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Unable to read PDF stream');
        }
        
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedBytes += value.length;
          
          // Update progress (cap at 95% until PDF is fully parsed)
          if (totalBytes > 0) {
            const progress = Math.min(95, Math.round((receivedBytes / totalBytes) * 100));
            setDownloadProgress(progress);
          } else {
            // If no content length, show indeterminate progress
            setDownloadProgress(Math.min(90, receivedBytes / 1024 / 10)); // Rough estimate
          }
        }
        
        // Combine chunks into single array buffer
        const allChunks = new Uint8Array(receivedBytes);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        setDownloadProgress(98);
        
        // Load PDF from ArrayBuffer - this bypasses range request issues
        const loadingTask = pdfjsLib.getDocument({
          data: allChunks.buffer,
        });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setDownloadProgress(100);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading PDF:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setRenderError(`Failed to load PDF: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [actualFileUrl, item.format, retryCount]);

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

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode !== "book") return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (mode !== "book" || !touchStart) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (mode !== "book" || !touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    // Check if horizontal swipe (not vertical scrolling)
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > SWIPE_THRESHOLD) {
      if (distanceX > 0) {
        // Swiped left - next page
        goToNextPageWithAnimation("left");
      } else {
        // Swiped right - previous page
        goToPreviousPageWithAnimation("right");
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const goToNextPageWithAnimation = (direction: "left" | "right") => {
    if (currentPage >= totalPages || isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 200);
  };

  const goToPreviousPageWithAnimation = (direction: "left" | "right") => {
    if (currentPage <= 1 || isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(prev => prev - 1);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 200);
  };

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

  // Get animation classes for page transitions
  const getPageAnimationClass = () => {
    if (!isAnimating || !slideDirection) return "";
    return slideDirection === "left" 
      ? "animate-slide-out-left" 
      : "animate-slide-out-right";
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
            className="rounded-xl"
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
                className="h-9 w-9 rounded-xl"
              >
                {mode === "book" ? <Book className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2 bg-popover rounded-xl">
              <p className="text-xs text-muted-foreground mb-2 px-2 font-medium">Reading Mode</p>
              <button
                onClick={() => setMode("book")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  mode === "book" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                <Book className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">Book Mode</p>
                  <p className="text-xs text-muted-foreground">Page by page, swipe to navigate</p>
                </div>
              </button>
              <button
                onClick={() => setMode("document")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mt-1",
                  mode === "document" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                <FileText className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">Document Mode</p>
                  <p className="text-xs text-muted-foreground">Vertical scrolling</p>
                </div>
              </button>
            </PopoverContent>
          </Popover>

          {/* Theme & Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 bg-popover rounded-xl">
              <div className="space-y-4">
                {/* Theme selector */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Theme</p>
                  <div className="flex gap-2">
                    {Object.entries(THEME_STYLES).map(([key, style]) => {
                      const Icon = style.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTheme(key as ReadingTheme)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                            theme === key
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs font-medium">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Zoom */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
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
            className="h-9 w-9 rounded-xl"
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
            className="h-9 w-9 rounded-xl"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Reading Area */}
      <main 
        ref={contentRef}
        className={cn(
          "flex-1 flex items-center justify-center overflow-auto relative p-4",
          mode === "document" && "overflow-y-auto"
        )}
      >
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-60" />
            <p className="text-sm opacity-60 mb-2">Loading document...</p>
            {downloadProgress > 0 && downloadProgress < 100 && (
              <div className="w-48 mx-auto mt-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {downloadProgress < 95 ? `Downloading... ${downloadProgress}%` : 'Processing PDF...'}
                </p>
              </div>
            )}
          </div>
        ) : renderError ? (
          <div className="text-center max-w-md">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm opacity-60 mb-4">{renderError}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="default" onClick={retryLoadPdf} className="rounded-xl">
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose} className="rounded-xl">
                Back to Library
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn("relative transition-transform duration-200", getPageAnimationClass())}>
            <canvas
              ref={canvasRef}
              className={cn(
                "max-w-full shadow-xl rounded-lg",
                themeStyle.canvasFilter
              )}
            />
            
            {/* Swipe hint for mobile in book mode */}
            {mode === "book" && isMobileOrTablet && currentPage === 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground animate-fade-in">
                Swipe left/right to navigate
              </div>
            )}
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

        {/* Page navigation (Book mode - desktop) */}
        {mode === "book" && !isLoading && !renderError && !isMobileOrTablet && (
          <>
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all",
                showControls ? "opacity-100" : "opacity-0",
                currentPage <= 1 
                  ? "opacity-30 cursor-not-allowed" 
                  : "hover:bg-muted"
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
                  : "hover:bg-muted"
              )}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Tap zones for mobile navigation */}
        {mode === "book" && isMobileOrTablet && !isLoading && !renderError && (
          <>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer" 
              onClick={goToPreviousPage}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer" 
              onClick={goToNextPage}
            />
          </>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-t border-border transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className="rounded-xl"
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
          <span className="text-sm opacity-60 flex-shrink-0 min-w-[3rem] text-center font-medium">
            {progress}%
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className="rounded-xl"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </footer>

      {/* Custom CSS for slide animations */}
      <style>{`
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-50px); opacity: 0.5; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(50px); opacity: 0.5; }
        }
        .animate-slide-out-left {
          animation: slideOutLeft 0.2s ease-out;
        }
        .animate-slide-out-right {
          animation: slideOutRight 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
