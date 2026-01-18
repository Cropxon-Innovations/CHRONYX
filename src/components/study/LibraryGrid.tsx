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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Get format label for display
const getFormatLabel = (format: LibraryFormat): string => {
  return format.toUpperCase();
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
    // Filter by archive status
    if (!showArchived && item.is_archived) return false;
    if (showArchived && !item.is_archived) return false;
    
    // Filter by search query
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button onClick={onUpload} className="gap-2">
          <Upload className="w-4 h-4" />
          Add Book
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {showArchived ? "No archived items" : "Your library is empty"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {showArchived 
              ? "Archived items will appear here" 
              : "Upload PDFs, EPUBs, documents, or slides to your reading room"}
          </p>
          {!showArchived && (
            <Button onClick={onUpload} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card border border-border"
              onClick={() => onItemClick(item)}
            >
              {/* Cover */}
              {item.cover_url ? (
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center p-3">
                  {(() => {
                    const Icon = getFormatIcon(item.format);
                    return <Icon className="w-10 h-10 text-muted-foreground/40 mb-3" />;
                  })()}
                  {/* Show title/author when no cover */}
                  <p className="text-xs font-medium text-foreground text-center line-clamp-3 px-1">
                    {item.title}
                  </p>
                  {item.author && (
                    <p className="text-[10px] text-muted-foreground text-center mt-1 line-clamp-1">
                      {item.author}
                    </p>
                  )}
                </div>
              )}

              {/* Always visible bottom info bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                <p className="text-xs font-medium text-white truncate">
                  {item.title}
                </p>
                {item.author && (
                  <p className="text-[10px] text-white/70 truncate">{item.author}</p>
                )}
                {item.total_pages && item.total_pages > 0 && (
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {item.current_page || 1} / {item.total_pages} pages
                  </p>
                )}
              </div>

              {/* Lock indicator */}
              {item.is_locked && (
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  <Lock className="w-3 h-3 text-foreground" />
                </div>
              )}

              {/* Progress bar */}
              {item.progress_percent !== undefined && item.progress_percent > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-10">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>
              )}

              {/* Actions menu */}
              <div
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover">
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

              {/* Format badge */}
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {getFormatLabel(item.format)}
              </Badge>
            </div>
          ))}

          {/* Add new item card */}
          <div
            onClick={onUpload}
            className="aspect-[2/3] rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
          >
            <Plus className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add Book</span>
          </div>
        </div>
      )}
    </div>
  );
};
