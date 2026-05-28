import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Layers, BookOpen, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectPages } from "@/hooks/useTaskManagement";
import type { TmPage, TmPageType, TmProject } from "./types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<TmPageType, React.ComponentType<{ className?: string }>> = {
  doc: FileText, architecture: Layers, wiki: BookOpen, spec: FileSpreadsheet,
};

interface Props { project: TmProject; canEdit: boolean; }

export const PagesPanel = ({ project, canEdit }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: pages = [] } = useProjectPages(project.id);
  const [selected, setSelected] = useState<TmPage | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pageType, setPageType] = useState<TmPageType>("doc");

  const select = (p: TmPage) => {
    setSelected(p);
    setTitle(p.title);
    setContent(p.content ?? "");
    setPageType(p.page_type);
  };

  const newPage = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("tm_pages").insert({
      project_id: project.id, created_by: user.id, title: "Untitled", page_type: "doc",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tm_pages", project.id] });
    select(data as TmPage);
  };

  const savePage = async () => {
    if (!selected) return;
    const { error } = await supabase.from("tm_pages")
      .update({ title, content, page_type: pageType })
      .eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tm_pages", project.id] });
    toast.success("Saved");
  };

  const deletePage = async (id: string) => {
    await supabase.from("tm_pages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["tm_pages", project.id] });
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[400px]">
      <Card className="overflow-y-auto">
        <CardContent className="p-2">
          {canEdit && (
            <Button variant="ghost" className="w-full justify-start mb-2" onClick={newPage}>
              <Plus className="h-4 w-4 mr-2" /> New page
            </Button>
          )}
          <div className="space-y-1">
            {pages.map((p) => {
              const Icon = TYPE_ICON[p.page_type];
              return (
                <button
                  key={p.id}
                  onClick={() => select(p)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-muted",
                    selected?.id === p.id && "bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{p.title}</span>
                </button>
              );
            })}
            {pages.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No pages yet</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-y-auto">
        <CardContent className="p-6">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" disabled={!canEdit} />
                <Select value={pageType} onValueChange={(v) => setPageType(v as TmPageType)} disabled={!canEdit}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doc">Document</SelectItem>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="wiki">Wiki</SelectItem>
                    <SelectItem value="spec">Spec</SelectItem>
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => deletePage(selected.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEdit}
                placeholder={pageType === "architecture" ? "Describe your system, paste ASCII diagrams or mermaid…" : "Write your document in markdown…"}
                className="min-h-[400px] font-mono text-sm"
              />
              {canEdit && <Button onClick={savePage}>Save page</Button>}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a page or create a new one</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
