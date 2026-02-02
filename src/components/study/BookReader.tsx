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
  Presentation,
  RotateCcw,
  ZoomIn,
  ZoomOut,
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
import ePub, { Book as EpubBook, Rendition } from "epubjs";

// Use legacy build which includes worker inline - most reliable for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type ReadingTheme = "day" | "sepia" | "night";
type ReadingMode = "book" | "document" | "presentation";

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
  { bg: string; text: string; label: string; icon: React.ElementType; canvasFilter?: string; epubStyles: { body: object } }
> = {
  day: { 
    bg: "bg-white", 
    text: "text-gray-900", 
    label: "Day", 
    icon: Sun,
    epubStyles: { body: { background: "#ffffff !important", color: "#1a1a1a !important" } }
  },
  sepia: {
    bg: "bg-[#f4ecd8]",
    text: "text-[#5c4b37]",
    label: "Sepia",
    icon: Sunset,
    canvasFilter: "sepia(20%)",
    epubStyles: { body: { background: "#f4ecd8 !important", color: "#5c4b37 !important" } }
  },
  night: {
    bg: "bg-[#1a1a1a]",
    text: "text-[#e0e0e0]",
    label: "Night",
    icon: Moon,
    canvasFilter: "invert(1) hue-rotate(180deg)",
    epubStyles: { body: { background: "#1a1a1a !important", color: "#e0e0e0 !important" } }
  },
};

const MODE_CONFIG = {
  book: {
    icon: Book,
    label: "Book Mode",
    description: "Page-by-page reading with swipe navigation",
  },
  document: {
    icon: FileText,
    label: "Document Mode",
    description: "Continuous vertical scrolling",
  },
  presentation: {
    icon: Presentation,
    label: "Presentation Mode",
    description: "Full-screen immersive slides",
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
  const [fontSize, setFontSize] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // EPUB specific state
  const [epubBook, setEpubBook] = useState<EpubBook | null>(null);
  const [epubRendition, setEpubRendition] = useState<Rendition | null>(null);
  const [isEpub, setIsEpub] = useState(false);
  const [epubProgress, setEpubProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState("");
  const [epubReady, setEpubReady] = useState(false);
  
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
  const epubViewRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const progress = isEpub ? epubProgress : (totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0);
  const themeStyle = THEME_STYLES[theme];

  // Detect if on mobile/tablet
  const isMobileOrTablet = typeof window !== "undefined" && 
    (window.innerWidth < 1024 || 'ontouchstart' in window);

  // Determine file type
  const actualFileUrl = fileUrl || (item as any).file_url;
  const fileExt = actualFileUrl?.split('.').pop()?.toLowerCase() || item.format;

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

  // Retry PDF loading
  const retryLoadPdf = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // Cleanup EPUB on unmount
  useEffect(() => {
    return () => {
      if (epubBook) {
        try {
          epubBook.destroy();
        } catch (e) {
          console.warn("EPUB cleanup warning:", e);
        }
      }
    };
  }, [epubBook]);

  // Load EPUB
  useEffect(() => {
    if (!actualFileUrl || fileExt !== 'epub') return;
    
    setIsEpub(true);
    setIsLoading(true);
    setRenderError(null);
    setEpubReady(false);

    let book: EpubBook | null = null;
    let rendition: Rendition | null = null;
    let isMounted = true;

    const loadEpub = async () => {
      try {
        // Create new EPUB book instance
        book = ePub(actualFileUrl);
        
        if (!isMounted) return;
        setEpubBook(book);

        // Wait for book to be ready
        await book.ready;
        
        if (!isMounted) return;

        // Wait for container to be available
        const waitForContainer = () => new Promise<HTMLDivElement>((resolve) => {
          const check = () => {
            if (epubViewRef.current) {
              resolve(epubViewRef.current);
            } else {
              requestAnimationFrame(check);
            }
          };
          check();
        });

        const container = await waitForContainer();
        if (!isMounted) return;

        // Clear any existing content
        container.innerHTML = '';

        // Calculate dimensions based on mode
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width || window.innerWidth - 80;
        const height = containerRect.height || window.innerHeight - 200;

        // Create rendition with proper settings based on mode
        rendition = book.renderTo(container, {
          width: width,
          height: height,
          spread: mode === "book" && !isMobileOrTablet ? "auto" : "none",
          flow: mode === "document" ? "scrolled-doc" : "paginated",
          manager: mode === "document" ? "continuous" : "default",
          allowScriptedContent: false,
        });

        if (!isMounted) return;
        setEpubRendition(rendition);

        // Register and apply theme
        const themeCSS = `
          body { 
            background: ${theme === 'day' ? '#ffffff' : theme === 'sepia' ? '#f4ecd8' : '#1a1a1a'} !important;
            color: ${theme === 'day' ? '#1a1a1a' : theme === 'sepia' ? '#5c4b37' : '#e0e0e0'} !important;
            font-family: 'Georgia', serif !important;
            line-height: 1.8 !important;
            padding: 20px !important;
            margin: 0 !important;
          }
          p, div, span, h1, h2, h3, h4, h5, h6 {
            color: inherit !important;
          }
          a { color: ${theme === 'night' ? '#88c0d0' : '#0066cc'} !important; }
        `;
        
        rendition.themes.register('custom', { body: themeCSS });
        rendition.themes.select('custom');
        rendition.themes.fontSize(`${fontSize}%`);

        // Display the book
        await rendition.display();

        if (!isMounted) return;

        // Track progress
        rendition.on("relocated", (location: any) => {
          if (!isMounted) return;
          if (location?.start) {
            const prog = Math.round((location.start.percentage || 0) * 100);
            setEpubProgress(prog);
            setCurrentPage(location.start.index || 1);
            onProgressUpdate?.(location.start.index || 1, prog);
          }
        });

        // Track chapter changes
        rendition.on("rendered", (section: any) => {
          if (!isMounted || !book) return;
          const chapter = book.navigation?.toc?.find(
            (tocItem: any) => section.href?.includes(tocItem.href)
          );
          if (chapter) {
            setCurrentChapter(chapter.label);
          }
        });

        // Generate locations for page count
        try {
          await book.locations.generate(1024);
          if (isMounted) {
            setTotalPages(book.locations.length() || 100);
          }
        } catch (e) {
          console.warn("Could not generate locations:", e);
          if (isMounted) setTotalPages(100);
        }

        if (isMounted) {
          setIsLoading(false);
          setEpubReady(true);
        }
      } catch (error) {
        console.error("Error loading EPUB:", error);
        if (isMounted) {
          setRenderError(`Failed to load EPUB: ${error instanceof Error ? error.message : "Unknown error"}`);
          setIsLoading(false);
        }
      }
    };

    loadEpub();

    return () => {
      isMounted = false;
      if (rendition) {
        try {
          rendition.destroy();
        } catch (e) {
          console.warn("Rendition cleanup warning:", e);
        }
      }
    };
  }, [actualFileUrl, fileExt, retryCount, mode, isMobileOrTablet]);

  // Update EPUB theme when theme changes
  useEffect(() => {
    if (epubRendition && isEpub && epubReady) {
      const themeCSS = `
        body { 
          background: ${theme === 'day' ? '#ffffff' : theme === 'sepia' ? '#f4ecd8' : '#1a1a1a'} !important;
          color: ${theme === 'day' ? '#1a1a1a' : theme === 'sepia' ? '#5c4b37' : '#e0e0e0'} !important;
          font-family: 'Georgia', serif !important;
          line-height: 1.8 !important;
          padding: 20px !important;
        }
        p, div, span, h1, h2, h3, h4, h5, h6 { color: inherit !important; }
      `;
      try {
        epubRendition.themes.register('custom', { body: themeCSS });
        epubRendition.themes.select('custom');
      } catch (e) {
        console.warn("Theme update warning:", e);
      }
    }
  }, [theme, epubRendition, isEpub, epubReady]);

  // Update EPUB font size
  useEffect(() => {
    if (epubRendition && isEpub && epubReady) {
      try {
        epubRendition.themes.fontSize(`${fontSize}%`);
      } catch (e) {
        console.warn("Font size update warning:", e);
      }
    }
  }, [fontSize, epubRendition, isEpub, epubReady]);

  // Handle mode change for EPUB - requires re-render
  const handleModeChange = (newMode: ReadingMode) => {
    if (isEpub && epubRendition) {
      // Destroy and recreate rendition for mode change
      setEpubReady(false);
      setMode(newMode);
      setRetryCount(prev => prev + 1);
    } else {
      setMode(newMode);
    }
  };

  // Load PDF document
  useEffect(() => {
    if (!actualFileUrl || fileExt === 'epub') return;

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
  }, [actualFileUrl, item.format, retryCount, fileExt]);

  // Render current PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || isEpub) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        
        // Calculate scale based on mode
        let actualScale = scale;
        if (mode === "presentation") {
          // Fit to screen in presentation mode
          const viewport = page.getViewport({ scale: 1 });
          const containerWidth = window.innerWidth - 100;
          const containerHeight = window.innerHeight - 150;
          const scaleX = containerWidth / viewport.width;
          const scaleY = containerHeight / viewport.height;
          actualScale = Math.min(scaleX, scaleY);
        }
        
        const viewport = page.getViewport({ scale: actualScale });
        
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
  }, [pdfDoc, currentPage, scale, isEpub, mode]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    // Only auto-hide in presentation mode
    if (mode === "presentation") {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [mode]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetControlsTimer]);

  // Touch handlers for swipe gestures (Book and Presentation modes)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode === "document") return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (mode === "document" || !touchStart) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (mode === "document" || !touchStart || !touchEnd) return;
    
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
    if (isEpub && epubRendition && epubReady) {
      epubRendition.next();
      return;
    }
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
    if (isEpub && epubRendition && epubReady) {
      epubRendition.prev();
      return;
    }
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
  }, [currentPage, totalPages, isFullscreen, onClose, resetControlsTimer, isEpub, epubRendition, epubReady]);

  // Update progress on page change (PDF only)
  useEffect(() => {
    if (!isEpub && totalPages > 0) {
      const newProgress = Math.round((currentPage / totalPages) * 100);
      onProgressUpdate?.(currentPage, newProgress);
    }
  }, [currentPage, totalPages, onProgressUpdate, isEpub]);

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
    if (isEpub && epubRendition && epubReady) {
      epubRendition.prev();
      return;
    }
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (isEpub && epubRendition && epubReady) {
      epubRendition.next();
      return;
    }
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPage = (page: number) => {
    if (isEpub && epubRendition && epubBook && epubReady) {
      try {
        const cfi = epubBook.locations.cfiFromPercentage(page / totalPages);
        epubRendition.display(cfi);
      } catch (e) {
        console.warn("Navigation warning:", e);
      }
      return;
    }
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

  // Get theme-specific background for container
  const getContainerBg = () => {
    if (theme === "day") return "bg-gray-100";
    if (theme === "sepia") return "bg-[#e8dcc8]";
    return "bg-[#0f0f0f]";
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col transition-colors duration-300",
        getContainerBg()
      )}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <header
        className={cn(
          "flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-b transition-all duration-300",
          theme === "night" ? "bg-[#1a1a1a] border-gray-800" : theme === "sepia" ? "bg-[#f4ecd8] border-[#d4c4a8]" : "bg-white border-gray-200",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "rounded-xl text-xs sm:text-sm",
              theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <ChevronLeft className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Library</span>
          </Button>
        </div>

        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className={cn(
            "text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-md mx-auto",
            theme === "night" ? "text-gray-200" : "text-gray-800"
          )}>
            {item.title}
          </h1>
          <p className={cn(
            "text-[10px] sm:text-xs",
            theme === "night" ? "text-gray-500" : "text-gray-500"
          )}>
            {isEpub ? (currentChapter || `${progress}%`) : `Page ${currentPage} of ${totalPages || "..."}`}
          </p>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Reading mode toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
                  theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {(() => {
                  const ModeIcon = MODE_CONFIG[mode].icon;
                  return ModeIcon ? <ModeIcon className="w-4 h-4" /> : null;
                })()}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={cn(
              "w-56 sm:w-64 p-2 rounded-xl",
              theme === "night" ? "bg-gray-900 border-gray-800" : "bg-white"
            )}>
              <p className={cn(
                "text-xs mb-2 px-2 font-medium",
                theme === "night" ? "text-gray-400" : "text-gray-500"
              )}>Reading Mode</p>
              {(Object.entries(MODE_CONFIG) as [ReadingMode, typeof MODE_CONFIG.book][]).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleModeChange(key)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      mode === key 
                        ? theme === "night" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
                        : theme === "night" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{config.label}</p>
                      <p className={cn(
                        "text-xs truncate",
                        theme === "night" ? "text-gray-500" : "text-gray-500"
                      )}>{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>

          {/* Theme & Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
                  theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={cn(
              "w-64 sm:w-72 p-4 rounded-xl",
              theme === "night" ? "bg-gray-900 border-gray-800" : "bg-white"
            )}>
              <div className="space-y-4">
                {/* Theme selector */}
                <div>
                  <p className={cn(
                    "text-xs mb-2 font-medium",
                    theme === "night" ? "text-gray-400" : "text-gray-500"
                  )}>Theme</p>
                  <div className="flex gap-2">
                    {Object.entries(THEME_STYLES).map(([key, style]) => {
                      const Icon = style.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setTheme(key as ReadingTheme)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border transition-all",
                            theme === key
                              ? "border-primary bg-primary/10 shadow-sm"
                              : theme === "night" ? "border-gray-700 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", theme === "night" ? "text-gray-300" : "text-gray-600")} />
                          <span className={cn(
                            "text-[10px] sm:text-xs font-medium",
                            theme === "night" ? "text-gray-300" : "text-gray-700"
                          )}>{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size (for EPUB) / Zoom (for PDF) */}
                <div>
                  <p className={cn(
                    "text-xs mb-2 font-medium",
                    theme === "night" ? "text-gray-400" : "text-gray-500"
                  )}>
                    {isEpub ? `Font Size: ${fontSize}%` : `Zoom: ${Math.round(scale * 100)}%`}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => isEpub ? setFontSize(Math.max(80, fontSize - 10)) : setScale(Math.max(0.5, scale - 0.1))}
                      className="h-8 w-8"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <Slider
                      value={isEpub ? [fontSize] : [scale]}
                      onValueChange={([v]) => isEpub ? setFontSize(v) : setScale(v)}
                      min={isEpub ? 80 : 0.5}
                      max={isEpub ? 200 : 3}
                      step={isEpub ? 10 : 0.1}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => isEpub ? setFontSize(Math.min(200, fontSize + 10)) : setScale(Math.min(3, scale + 0.1))}
                      className="h-8 w-8"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </Button>
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
              "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
              theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
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
              "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
              theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Reading Area */}
      <main 
        ref={contentRef}
        className={cn(
          "flex-1 relative transition-all duration-300",
          mode === "document" ? "overflow-y-auto" : "overflow-hidden",
          mode === "presentation" && "flex items-center justify-center"
        )}
        style={{
          display: mode === "document" ? "block" : "flex",
          alignItems: mode !== "document" ? "center" : undefined,
          justifyContent: mode !== "document" ? "center" : undefined,
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
              <Loader2 className={cn(
                "w-8 h-8 animate-spin mx-auto mb-4",
                theme === "night" ? "text-gray-400" : "text-gray-400"
              )} />
              <p className={cn(
                "text-sm mb-2",
                theme === "night" ? "text-gray-400" : "text-gray-500"
              )}>
                {isEpub ? "Loading EPUB..." : "Loading document..."}
              </p>
              {!isEpub && downloadProgress > 0 && downloadProgress < 100 && (
                <div className="w-48 mx-auto mt-3">
                  <div className={cn(
                    "h-1.5 rounded-full overflow-hidden",
                    theme === "night" ? "bg-gray-800" : "bg-gray-200"
                  )}>
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className={cn(
                    "text-xs mt-2",
                    theme === "night" ? "text-gray-500" : "text-gray-400"
                  )}>
                    {downloadProgress < 95 ? `Downloading... ${downloadProgress}%` : 'Processing PDF...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : renderError ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-center max-w-md px-4">
              <FileText className={cn(
                "w-12 h-12 mx-auto mb-4",
                theme === "night" ? "text-gray-600" : "text-gray-300"
              )} />
              <p className={cn(
                "text-sm mb-4",
                theme === "night" ? "text-gray-400" : "text-gray-500"
              )}>{renderError}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="default" onClick={retryLoadPdf} className="rounded-xl">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={onClose} className="rounded-xl">
                  Back to Library
                </Button>
              </div>
            </div>
          </div>
        ) : isEpub ? (
          // EPUB Reader
          <div 
            ref={epubViewRef}
            className={cn(
              "w-full mx-auto transition-all duration-300",
              mode === "book" && "max-w-3xl px-4 sm:px-8",
              mode === "document" && "max-w-4xl",
              mode === "presentation" && "max-w-5xl px-4",
              themeStyle.bg
            )}
            style={{ 
              height: mode === "document" ? "auto" : "calc(100vh - 140px)",
              minHeight: mode === "document" ? "calc(100vh - 140px)" : undefined,
            }}
          />
        ) : (
          // PDF Reader
          <div 
            className={cn(
              "relative transition-transform duration-200 p-4",
              getPageAnimationClass(),
              mode === "document" && "mx-auto",
              mode === "presentation" && "flex items-center justify-center"
            )}
          >
            <canvas
              ref={canvasRef}
              className={cn(
                "max-w-full rounded-lg transition-all duration-300",
                mode === "book" && "shadow-2xl",
                mode === "presentation" && "shadow-none"
              )}
              style={{
                filter: themeStyle.canvasFilter,
                maxHeight: mode === "presentation" ? "calc(100vh - 120px)" : undefined,
              }}
            />
            
            {/* Swipe hint for mobile in book/presentation mode */}
            {(mode === "book" || mode === "presentation") && isMobileOrTablet && currentPage === 1 && (
              <div className={cn(
                "absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 backdrop-blur-sm rounded-full text-xs animate-fade-in",
                theme === "night" ? "bg-gray-800/80 text-gray-300" : "bg-white/80 text-gray-600"
              )}>
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
        {(mode === "book" || mode === "presentation") && !isLoading && !renderError && !isMobileOrTablet && (
          <>
            <button
              onClick={goToPreviousPage}
              disabled={!isEpub && currentPage <= 1}
              className={cn(
                "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full transition-all",
                showControls ? "opacity-100" : "opacity-0",
                (!isEpub && currentPage <= 1) 
                  ? "opacity-30 cursor-not-allowed" 
                  : theme === "night" ? "hover:bg-gray-800" : "hover:bg-white/80"
              )}
            >
              <ChevronLeft className={cn("w-5 h-5 sm:w-6 sm:h-6", theme === "night" ? "text-gray-300" : "text-gray-700")} />
            </button>
            <button
              onClick={goToNextPage}
              disabled={!isEpub && currentPage >= totalPages}
              className={cn(
                "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full transition-all",
                showControls ? "opacity-100" : "opacity-0",
                (!isEpub && currentPage >= totalPages) 
                  ? "opacity-30 cursor-not-allowed" 
                  : theme === "night" ? "hover:bg-gray-800" : "hover:bg-white/80"
              )}
            >
              <ChevronRight className={cn("w-5 h-5 sm:w-6 sm:h-6", theme === "night" ? "text-gray-300" : "text-gray-700")} />
            </button>
          </>
        )}

        {/* Tap zones for mobile navigation */}
        {(mode === "book" || mode === "presentation") && isMobileOrTablet && !isLoading && !renderError && (
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
          "flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-t transition-all duration-300",
          theme === "night" ? "bg-[#1a1a1a] border-gray-800" : theme === "sepia" ? "bg-[#f4ecd8] border-[#d4c4a8]" : "bg-white border-gray-200",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousPage}
          disabled={!isEpub && currentPage <= 1}
          className={cn(
            "rounded-xl text-xs sm:text-sm",
            theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Progress slider */}
        <div className="flex-1 flex items-center gap-2 sm:gap-4 max-w-xs sm:max-w-md">
          <Slider
            value={[isEpub ? epubProgress : currentPage]}
            onValueChange={([val]) => goToPage(isEpub ? Math.round((val / 100) * totalPages) : val)}
            min={isEpub ? 0 : 1}
            max={isEpub ? 100 : (totalPages || 1)}
            step={1}
            className="flex-1"
          />
          <span className={cn(
            "text-xs sm:text-sm flex-shrink-0 min-w-[2.5rem] sm:min-w-[3rem] text-center font-medium",
            theme === "night" ? "text-gray-400" : "text-gray-500"
          )}>
            {progress}%
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextPage}
          disabled={!isEpub && currentPage >= totalPages}
          className={cn(
            "rounded-xl text-xs sm:text-sm",
            theme === "night" ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:ml-1" />
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
