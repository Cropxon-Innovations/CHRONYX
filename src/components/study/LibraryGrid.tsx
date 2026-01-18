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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface LibraryItem {
  id: string;
  title: string;
  author?: string;
  format: "pdf" | "epub";
  cover_url?: string;
  total_pages?: number;
  current_page?: number;
  progress_percent?: number;
  is_locked?: boolean;
  last_read_at?: string;
  created_at: string;
}

interface LibraryGridProps {
  items: LibraryItem[];
  onItemClick: (item: LibraryItem) => void;
  onUpload: () => void;
  onDelete?: (item: LibraryItem) => void;
  onLock?: (item: LibraryItem) => void;
  onShare?: (item: LibraryItem) => void;
  onDownload?: (item: LibraryItem) => void;
  isLoading?: boolean;
  className?: string;
}

export const LibraryGrid = ({
  items,
  onItemClick,
  onUpload,
  onDelete,
  onLock,
  onShare,
  onDownload,
  isLoading,
  className,
}: LibraryGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Your library is empty
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Upload PDFs or EPUBs to create your private reading room
          </p>
          <Button onClick={onUpload} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Book
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
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
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {item.format === "epub" ? (
                    <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                  ) : (
                    <FileText className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Lock indicator */}
              {item.is_locked && (
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  <Lock className="w-3 h-3 text-foreground" />
                </div>
              )}

              {/* Progress bar */}
              {item.progress_percent !== undefined && item.progress_percent > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                  <div
                    className="h-full bg-primary/80"
                    style={{ width: `${item.progress_percent}%` }}
                  />
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-medium text-white truncate">
                  {item.title}
                </p>
                {item.author && (
                  <p className="text-xs text-white/70 truncate">{item.author}</p>
                )}
                {item.current_page && item.total_pages && (
                  <p className="text-xs text-white/50 mt-1">
                    Page {item.current_page} of {item.total_pages}
                  </p>
                )}
              </div>

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
                {item.format}
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
