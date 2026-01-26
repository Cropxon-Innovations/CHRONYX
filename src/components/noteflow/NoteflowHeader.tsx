import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Sparkles, 
  Plus, 
  LayoutGrid, 
  Clock, 
  StickyNote,
  FolderTree,
  Search,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NoteflowViewMode = "grid" | "timeline" | "sticky" | "folders";

interface NoteflowHeaderProps {
  viewMode: NoteflowViewMode;
  onViewModeChange: (mode: NoteflowViewMode) => void;
  onCreateNote: () => void;
  onOpenSearch: () => void;
  onOpenSettings?: () => void;
  noteCount: number;
}

export const NoteflowHeader = ({
  viewMode,
  onViewModeChange,
  onCreateNote,
  onOpenSearch,
  onOpenSettings,
  noteCount,
}: NoteflowHeaderProps) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-70" />
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Noteflow
            </h1>
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0 font-semibold"
            >
              BETA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your intelligent knowledge workspace — {noteCount} notes
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSearch}
              className="h-9 px-3"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Search</span>
              <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">
                ⌘K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Search notes (⌘K)</p>
          </TooltipContent>
        </Tooltip>

        {/* View Toggle */}
        <div className="flex items-center border border-border rounded-xl p-1 bg-card/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "sticky" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("sticky")}
                className="h-8 w-8 p-0"
              >
                <StickyNote className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sticky Notes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("timeline")}
                className="h-8 w-8 p-0"
              >
                <Clock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Timeline</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === "folders" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("folders")}
                className="h-8 w-8 p-0"
              >
                <FolderTree className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Folders</TooltipContent>
          </Tooltip>
        </div>

        {/* Settings */}
        {onOpenSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="h-9 w-9 p-0"
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        )}

        {/* Create Button */}
        <Button onClick={onCreateNote} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Note</span>
        </Button>
      </div>
    </header>
  );
};
