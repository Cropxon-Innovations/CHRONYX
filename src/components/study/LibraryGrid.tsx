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

// Get format color
const getFormatColor = (format: LibraryFormat) => {
  switch (format) {
    case "pdf":
      return "from-red-500/20 to-red-600/10 border-red-500/20";
    case "epub":
      return "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20";
    case "doc":
    case "docx":
      return "from-blue-500/20 to-blue-600/10 border-blue-500/20";
    case "ppt":
    case "pptx":
      return "from-orange-500/20 to-orange-600/10 border-orange-500/20";
    case "xls":
    case "xlsx":
      return "from-green-500/20 to-green-600/10 border-green-500/20";
    default:
      return "from-muted to-muted/50 border-border";
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
            className="pl-10 h-11 bg-muted/50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <Button onClick={onUpload} className="gap-2 h-11 rounded-xl shadow-sm">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Add to Library</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Grid - Kindle/Apple Books shelf style */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
              <div className="space-y-1.5 px-1">
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 rotate-6" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/10 -rotate-3" />
            <div className="relative w-full h-full rounded-2xl bg-card border border-border flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">
            {showArchived ? "No archived books" : "Your library awaits"}
          </h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            {showArchived 
              ? "Archived items will appear here" 
              : "Upload PDFs, eBooks, documents, and more to build your personal reading collection"}
          </p>
          {!showArchived && (
            <Button onClick={onUpload} size="lg" className="gap-2 rounded-xl shadow-md">
              <Plus className="w-5 h-5" />
              Add Your First Book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative"
            >
              {/* Book cover with 3D effect */}
              <div
                className="relative aspect-[2/3] cursor-pointer perspective-1000"
                onClick={() => onItemClick(item)}
              >
                {/* Book shadow */}
                <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg bg-foreground/5 blur-sm transition-all duration-300 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:blur-md" />
                
                {/* Main book cover */}
                <div className={cn(
                  "relative w-full h-full rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1",
                  "border shadow-md group-hover:shadow-xl",
                  item.cover_url ? "border-border/50" : `bg-gradient-to-br ${getFormatColor(item.format)}`
                )}>
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-card">
                      {(() => {
                        const Icon = getFormatIcon(item.format);
                        return <Icon className="w-10 h-10 text-muted-foreground/30 mb-3" />;
                      })()}
                      <p className="text-xs font-medium text-foreground text-center line-clamp-3 leading-tight">
                        {item.title}
                      </p>
                      {item.author && (
                        <p className="text-[10px] text-muted-foreground text-center mt-1.5 line-clamp-1">
                          {item.author}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Book spine effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-foreground/10 to-transparent" />
                  
                  {/* Progress indicator at bottom */}
                  {item.progress_percent !== undefined && item.progress_percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50 backdrop-blur-sm">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${item.progress_percent}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Lock indicator */}
                  {item.is_locked && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm">
                      <Lock className="w-3 h-3 text-foreground" />
                    </div>
                  )}
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-full shadow-md bg-background/90 backdrop-blur-sm"
                      onClick={() => onItemClick(item)}
                    >
                      Read
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
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
                          className="text-destructive"
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
              <div className="mt-3 px-0.5">
                <h3 className="text-sm font-medium text-foreground truncate leading-tight">
                  {item.title}
                </h3>
                {item.author && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.author}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 rounded-md uppercase font-medium">
                    {item.format}
                  </Badge>
                  {item.progress_percent !== undefined && item.progress_percent > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {item.progress_percent}%
                    </span>
                  )}
                  {item.last_read_at && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
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
            <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-3 transition-all duration-200 bg-muted/20 hover:bg-muted/40 group-hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add Book</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};