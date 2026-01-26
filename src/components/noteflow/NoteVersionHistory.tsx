import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  History,
  RotateCcw,
  Eye,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  createdAt: Date;
  wordCount: number;
  changeType: "created" | "edited" | "restored" | "auto-saved";
}

interface NoteVersionHistoryProps {
  noteId: string;
  currentContent: string;
  versions: NoteVersion[];
  onRestore: (versionId: string) => void;
  onPreview: (version: NoteVersion) => void;
  isLoading?: boolean;
}

const VersionItem = ({
  version,
  isFirst,
  isLast,
  onPreview,
  onRestore,
}: {
  version: NoteVersion;
  isFirst: boolean;
  isLast: boolean;
  onPreview: () => void;
  onRestore: () => void;
}) => {
  const changeTypeColors = {
    created: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    edited: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    restored: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "auto-saved": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  };

  const changeTypeLabels = {
    created: "Created",
    edited: "Edited",
    restored: "Restored",
    "auto-saved": "Auto-saved",
  };

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          "relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
          isFirst
            ? "bg-primary border-primary"
            : "bg-background border-border"
        )}
      >
        {isFirst ? (
          <Clock className="w-3 h-3 text-primary-foreground" />
        ) : (
          <FileText className="w-3 h-3 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-[10px] font-medium", changeTypeColors[version.changeType])}
              >
                {changeTypeLabels[version.changeType]}
              </Badge>
              {isFirst && (
                <Badge variant="outline" className="text-[10px]">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-foreground mt-1">
              {format(version.createdAt, "MMM d, yyyy 'at' h:mm a")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDistanceToNow(version.createdAt, { addSuffix: true })} •{" "}
              {version.wordCount.toLocaleString()} words
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onPreview}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onRestore}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Restore
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NoteVersionHistory = ({
  noteId,
  currentContent,
  versions,
  onRestore,
  onPreview,
  isLoading = false,
}: NoteVersionHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
          {versions.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
              {versions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            View and restore previous versions of your note
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-160px)] mt-6 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No version history</h3>
              <p className="text-sm text-muted-foreground">
                Changes to your note will be saved here automatically
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {versions.map((version, index) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isFirst={index === 0}
                  isLast={index === versions.length - 1}
                  onPreview={() => onPreview(version)}
                  onRestore={() => onRestore(version.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
