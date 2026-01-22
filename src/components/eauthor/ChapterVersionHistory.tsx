import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Version {
  id: string;
  version_number: number;
  content: any;
  word_count: number;
  change_description: string | null;
  created_at: string;
}

interface ChapterVersionHistoryProps {
  chapterId: string | undefined;
  onRestore: (content: any) => void;
}

const ChapterVersionHistory = ({ chapterId, onRestore }: ChapterVersionHistoryProps) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (chapterId) {
      fetchVersions();
    }
  }, [chapterId]);

  const fetchVersions = async () => {
    if (!chapterId) return;
    
    const { data, error } = await supabase
      .from("book_chapter_versions")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("version_number", { ascending: false });

    if (!error && data) {
      setVersions(data);
    }
    setLoading(false);
  };

  const extractPreview = (content: any): string => {
    if (!content || !content.content) return "No content";
    
    const text = content.content
      .map((node: any) => {
        if (node.content) {
          return node.content.map((c: any) => c.text || "").join("");
        }
        return "";
      })
      .join(" ")
      .slice(0, 200);
    
    return text ? text + "..." : "No content";
  };

  if (!chapterId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Select a chapter to view version history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading versions...</div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No saved versions yet</p>
        <p className="text-sm mt-1">Save a version to track changes over time</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-96">
      {/* Version List */}
      <ScrollArea className="w-1/3 border-r border-border pr-4">
        <div className="space-y-2">
          {versions.map((version) => (
            <button
              key={version.id}
              onClick={() => setSelectedVersion(version)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedVersion?.id === version.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline">v{version.version_number}</Badge>
                <span className="text-xs text-muted-foreground">
                  {version.word_count} words
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
              {version.change_description && (
                <p className="text-xs text-foreground mt-1 truncate">
                  {version.change_description}
                </p>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Version Preview */}
      <div className="flex-1 flex flex-col">
        {selectedVersion ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Version {selectedVersion.version_number}</h4>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(selectedVersion.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <Button size="sm" onClick={() => onRestore(selectedVersion.content)}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </div>
            <ScrollArea className="flex-1 border border-border rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground italic">
                  {extractPreview(selectedVersion.content)}
                </p>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Select a version to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterVersionHistory;
