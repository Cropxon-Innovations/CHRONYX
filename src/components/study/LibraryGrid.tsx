import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Plus,
  Search,
  Upload,
  Lock,
  MoreVertical,
  Trash2,
  Download,
  Share2,
  Edit2,
  Archive,
  FileSpreadsheet,
  Presentation,
  File,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

export type LibraryFormat = "pdf" | "epub" | "doc" | "docx" | "ppt" | "pptx" | "xls" | "xlsx" | "txt" | "other";

export interface LibraryItem {
  id: string;
  title: string;
  author?: string;
  format: LibraryFormat;
  file_url?: string;
  cover_url?: string;
  total_pages?: number;
  current_page?: number;
  progress_percent?: number;
  is_locked?: boolean;
  is_archived?: boolean;
  last_read_at?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
}

interface LibraryGridProps {
  items: LibraryItem[];
  onItemClick: (item: LibraryItem) => void;
  onUpload: () => void;
  onEdit?: (item: LibraryItem) => void;
  onDelete?: (item: LibraryItem) => void;
  onArchive?: (item: LibraryItem) => void;
  onLock?: (item: LibraryItem) => void;
  onShare?: (item: LibraryItem) => void;
  onDownload?: (item: LibraryItem) => void;
  isLoading?: boolean;
  showArchived?: boolean;
  className?: string;
}

// Get icon for file format
const getFormatIcon = (format: LibraryFormat) => {
  switch (format) {
    case "epub":
      return BookOpen;
    case "doc":
    case "docx":
      return FileText;
    case "ppt":
    case "pptx":
      return Presentation;
    case "xls":
    case "xlsx":
      return FileSpreadsheet;
    case "pdf":
      return FileText;
    default:
      return File;
  }
};

// Get format accent color (using semantic tokens where possible)
const getFormatAccent = (format: LibraryFormat) => {
  switch (format) {
    case "pdf":
      return "text-red-600 dark:text-red-400";
    case "epub":
      return "text-emerald-600 dark:text-emerald-400";
    case "doc":
    case "docx":
      return "text-blue-600 dark:text-blue-400";
    case "ppt":
    case "pptx":
      return "text-orange-600 dark:text-orange-400";
    case "xls":
    case "xlsx":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-muted-foreground";
  }
};

// Get spine color for book effect
const getSpineColor = (format: LibraryFormat) => {
  switch (format) {
    case "pdf":
      return "from-red-600/30 to-red-800/50";
    case "epub":
      return "from-emerald-600/30 to-emerald-800/50";
    case "doc":
    case "docx":
      return "from-blue-600/30 to-blue-800/50";
    case "ppt":
    case "pptx":
      return "from-orange-600/30 to-orange-800/50";
    default:
      return "from-muted-foreground/20 to-muted-foreground/40";
  }
};

export const LibraryGrid = ({
  items,
  onItemClick,
  onUpload,
  onEdit,
  onDelete,
  onArchive,
  onLock,
  onShare,
  onDownload,
  isLoading,
  showArchived = false,
  className,
}: LibraryGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    if (!showArchived && item.is_archived) return false;
    if (showArchived && !item.is_archived) return false;
    
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header - Apple Books style */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted/50 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <Button onClick={onUpload} className="gap-2 h-11 rounded-2xl shadow-sm">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Add to Library</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Grid - Premium Kindle/Apple Books shelf style */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-1.5 px-1">
                <div className="h-3 bg-muted rounded-lg animate-pulse w-3/4" />
                <div className="h-2 bg-muted rounded-lg animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Stacked books effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 rotate-6 transform" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/15 -rotate-3 transform" />
            <div className="relative w-full h-full rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {showArchived ? "No archived books" : "Your library awaits"}
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            {showArchived 
              ? "Archived items will appear here" 
              : "Upload PDFs, eBooks, documents, and more to build your personal reading collection"}
          </p>
          {!showArchived && (
            <Button onClick={onUpload} size="lg" className="gap-2 rounded-2xl shadow-md">
              <Plus className="w-5 h-5" />
              Add Your First Book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative"
            >
              {/* Book cover with premium 3D effect */}
              <div
                className="relative aspect-[3/4] cursor-pointer"
                onClick={() => onItemClick(item)}
                style={{ perspective: "1000px" }}
              >
                {/* Shadow layer - gives depth */}
                <div 
                  className="absolute inset-0 translate-x-1.5 translate-y-2 rounded-xl bg-foreground/10 blur-md transition-all duration-300 group-hover:translate-x-3 group-hover:translate-y-4 group-hover:blur-lg" 
                />
                
                {/* Main book cover */}
                <div 
                  className={cn(
                    "relative w-full h-full rounded-xl overflow-hidden transition-all duration-300",
                    "border border-border/50 shadow-lg",
                    "group-hover:scale-[1.02] group-hover:-translate-y-1 group-hover:shadow-xl"
                  )}
                  style={{ 
                    transformStyle: "preserve-3d",
                    transform: "rotateY(-3deg)",
                  }}
                >
                  {/* Cover image or placeholder */}
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-card via-card to-muted">
                      {(() => {
                        const Icon = getFormatIcon(item.format);
                        return <Icon className={cn("w-12 h-12 mb-4 opacity-40", getFormatAccent(item.format))} />;
                      })()}
                      <p className="text-xs font-medium text-foreground text-center line-clamp-3 leading-relaxed px-2">
                        {item.title}
                      </p>
                      {item.author && (
                        <p className="text-[10px] text-muted-foreground text-center mt-2 line-clamp-1 px-2">
                          {item.author}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Book spine effect - left edge */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-3",
                    "bg-gradient-to-r",
                    getSpineColor(item.format)
                  )} />
                  
                  {/* Glossy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Progress indicator at bottom */}
                  {item.progress_percent !== undefined && item.progress_percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-background/60 backdrop-blur-sm">
                      <div
                        className="h-full bg-primary rounded-r-full transition-all duration-300"
                        style={{ width: `${item.progress_percent}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Lock indicator */}
                  {item.is_locked && (
                    <div className="absolute top-3 right-3 p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-md">
                      <Lock className="w-3.5 h-3.5 text-foreground" />
                    </div>
                  )}
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-5">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 px-4 text-xs rounded-full shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background"
                      onClick={() => onItemClick(item)}
                    >
                      Read Now
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 rounded-full shadow-lg bg-background/95 backdrop-blur-sm hover:bg-background"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover w-44">
                        <DropdownMenuItem onClick={() => onEdit?.(item)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(item)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare?.(item)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onLock?.(item)}>
                          <Lock className="w-4 h-4 mr-2" />
                          {item.is_locked ? "Unlock" : "Lock"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onArchive?.(item)}>
                          <Archive className="w-4 h-4 mr-2" />
                          {item.is_archived ? "Restore" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(item)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Book info - below cover like Apple Books */}
              <div className="mt-3 px-1">
                <h3 className="text-sm font-medium text-foreground truncate leading-tight">
                  {item.title}
                </h3>
                {item.author && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.author}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="text-[10px] h-5 px-2 rounded-lg uppercase font-semibold tracking-wide"
                  >
                    {item.format}
                  </Badge>
                  {item.progress_percent !== undefined && item.progress_percent > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {item.progress_percent}%
                    </span>
                  )}
                  {item.last_read_at && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(item.last_read_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add new item card */}
          <div
            onClick={onUpload}
            className="group cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-4 transition-all duration-300 bg-muted/10 hover:bg-muted/30 group-hover:scale-[1.02] group-hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Add Book
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
