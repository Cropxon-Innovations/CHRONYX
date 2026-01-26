import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Clock, 
  BookOpen, 
  FileText, 
  Wallet, 
  Camera, 
  Receipt, 
  Feather,
  StickyNote,
  Search,
  Archive,
  Calendar,
  Tag,
  Folder,
  ChevronRight,
  Hash,
  Sparkles,
  Filter,
  CalendarDays,
  AlertCircle,
  PenTool,
} from "lucide-react";
import { NoteType } from "@/components/notes/NoteTypeSelector";
import { NoteflowLM } from "./NoteflowLM";

export type SmartFilter = 
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "untagged"
  | "with_links"
  | "archived";

export type SidebarSection = SmartFilter | NoteType | `tag:${string}` | `folder:${string}`;

interface SmartFilterConfig {
  id: SmartFilter;
  label: string;
  icon: React.ElementType;
  color: string;
}

const SMART_FILTERS: SmartFilterConfig[] = [
  { id: "all", label: "All Notes", icon: FileText, color: "text-foreground" },
  { id: "today", label: "Today", icon: CalendarDays, color: "text-blue-500" },
  { id: "yesterday", label: "Yesterday", icon: Calendar, color: "text-indigo-500" },
  { id: "this_week", label: "This Week", icon: Clock, color: "text-purple-500" },
  { id: "this_month", label: "This Month", icon: Calendar, color: "text-pink-500" },
  { id: "untagged", label: "Untagged", icon: AlertCircle, color: "text-orange-500" },
  { id: "with_links", label: "With Links", icon: Sparkles, color: "text-emerald-500" },
  { id: "archived", label: "Archived", icon: Archive, color: "text-muted-foreground" },
];

interface NoteTypeConfig {
  type: NoteType;
  label: string;
  icon: React.ElementType;
  color: string;
}

const NOTE_TYPES: NoteTypeConfig[] = [
  { type: "quick_note", label: "Quick Notes", icon: StickyNote, color: "text-amber-600" },
  { type: "journal", label: "Journals", icon: BookOpen, color: "text-purple-600" },
  { type: "document", label: "Documents", icon: FileText, color: "text-blue-600" },
  { type: "finance_note", label: "Finance", icon: Wallet, color: "text-emerald-600" },
  { type: "memory_note", label: "Memories", icon: Camera, color: "text-pink-600" },
  { type: "tax_note", label: "Tax Notes", icon: Receipt, color: "text-orange-600" },
  { type: "story", label: "Stories", icon: Feather, color: "text-indigo-600" },
];

interface NoteflowSidebarProps {
  selectedSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    filters: Record<SmartFilter, number>;
    types: Record<NoteType, number>;
    tags: Record<string, number>;
    folders: Record<string, number>;
  };
  tags: string[];
  folders: string[];
}

export const NoteflowSidebar = ({
  selectedSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  counts,
  tags,
  folders,
}: NoteflowSidebarProps) => {
  const [isTypesOpen, setIsTypesOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);

  return (
    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* NoteflowLM Feature */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/10">
            <PenTool className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">NoteflowLM</span>
            <Badge variant="outline" className="ml-2 text-[8px] px-1 py-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-500/30">
              BETA
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Transform notes into images, slides & more
        </p>
        <NoteflowLM 
          noteContent=""
          noteTitle="Quick Generation"
          onApplyResult={() => {}}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border/50 focus-visible:ring-primary/30"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-380px)] lg:h-auto">
        <div className="space-y-6 pr-3">
          {/* Smart Filters */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Quick Filters
            </h4>
            {SMART_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedSection === filter.id;
              const count = counts.filters[filter.id] || 0;

              return (
                <button
                  key={filter.id}
                  onClick={() => onSelectSection(filter.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    "text-sm font-medium",
                    isSelected
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-primary" : filter.color)} />
                  <span className="flex-1 text-left truncate">{filter.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full min-w-[24px] text-center",
                      isSelected 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Note Types - Removed per user request */}
          {/* Users now tag notes manually within the editor */}

          {/* Tags */}
          {tags.length > 0 && (
            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                  <ChevronRight className={cn("w-3 h-3 transition-transform", isTagsOpen && "rotate-90")} />
                  Tags
                  <Badge variant="secondary" className="ml-auto text-[10px] py-0">{tags.length}</Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {tags.slice(0, 10).map((tag) => {
                  const isSelected = selectedSection === `tag:${tag}`;
                  const count = counts.tags[tag] || 0;

                  return (
                    <button
                      key={tag}
                      onClick={() => onSelectSection(`tag:${tag}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        "text-sm font-medium",
                        isSelected
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Hash className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-primary" : "text-cyan-500")} />
                      <span className="flex-1 text-left truncate">{tag}</span>
                      {count > 0 && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full min-w-[24px] text-center",
                          isSelected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
                {tags.length > 10 && (
                  <p className="text-xs text-muted-foreground px-3 py-1">
                    +{tags.length - 10} more tags
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Folders */}
          {folders.length > 0 && (
            <Collapsible open={isFoldersOpen} onOpenChange={setIsFoldersOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                  <ChevronRight className={cn("w-3 h-3 transition-transform", isFoldersOpen && "rotate-90")} />
                  Folders
                  <Badge variant="secondary" className="ml-auto text-[10px] py-0">{folders.length}</Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {folders.map((folder) => {
                  const isSelected = selectedSection === `folder:${folder}`;
                  const count = counts.folders[folder] || 0;

                  return (
                    <button
                      key={folder}
                      onClick={() => onSelectSection(`folder:${folder}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        "text-sm font-medium",
                        isSelected
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Folder className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-primary" : "text-yellow-500")} />
                      <span className="flex-1 text-left truncate">{folder}</span>
                      {count > 0 && (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full min-w-[24px] text-center",
                          isSelected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
