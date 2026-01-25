import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Plus, ChevronRight, ChevronDown, Clock, FileText, 
  MoreHorizontal, Edit2, Trash2, Link2, GripVertical,
  BookOpen, Target, CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  user_id: string;
  user_template_id: string;
  section_type: string;
  parent_section_id: string | null;
  title: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  time_spent_minutes: number;
  status: string;
  linked_note_id: string | null;
}

interface Props {
  templateId: string;
  sections: Section[];
  isLoading: boolean;
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  revised: "bg-purple-500/10 text-purple-600",
  mastered: "bg-amber-500/10 text-amber-600",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  revised: "Revised",
  mastered: "Mastered",
};

export const SyllabusChecklist = ({ templateId, sections, isLoading, onUpdate }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingToParent, setAddingToParent] = useState<string | null>(null);

  // Group sections by parent
  const rootSections = sections.filter(s => !s.parent_section_id);
  const getChildren = (parentId: string) => sections.filter(s => s.parent_section_id === parentId);

  // Toggle section completion
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("user_template_sections")
        .update({
          is_completed: completed,
          status: completed ? "completed" : "not_started",
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ["template-sections", templateId] });
      onUpdate();
      if (completed) {
        toast.success("Section completed! 🎉");
      }
    },
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("user_template_sections")
        .update({
          status,
          is_completed: status === "completed" || status === "revised" || status === "mastered",
          completed_at: ["completed", "revised", "mastered"].includes(status) ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-sections", templateId] });
      onUpdate();
    },
  });

  // Add new section
  const addSectionMutation = useMutation({
    mutationFn: async ({ title, parentId }: { title: string; parentId: string | null }) => {
      const maxOrder = sections
        .filter(s => s.parent_section_id === parentId)
        .reduce((max, s) => Math.max(max, s.order_index), -1);

      const { error } = await supabase
        .from("user_template_sections")
        .insert({
          user_id: user!.id,
          user_template_id: templateId,
          title,
          parent_section_id: parentId,
          section_type: parentId ? "topic" : "subject",
          order_index: maxOrder + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-sections", templateId] });
      setNewSectionTitle("");
      setAddingToParent(null);
      toast.success("Section added");
    },
  });

  // Delete section
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_template_sections")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-sections", templateId] });
      onUpdate();
      toast.success("Section removed");
    },
  });

  // Log time
  const logTimeMutation = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const section = sections.find(s => s.id === id);
      const newTime = (section?.time_spent_minutes || 0) + minutes;
      
      const { error } = await supabase
        .from("user_template_sections")
        .update({
          time_spent_minutes: newTime,
          status: section?.status === "not_started" ? "in_progress" : section?.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-sections", templateId] });
      toast.success("Time logged");
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSection = (parentId: string | null = null) => {
    if (!newSectionTitle.trim()) return;
    addSectionMutation.mutate({ title: newSectionTitle, parentId });
  };

  // Calculate progress for a section
  const getSectionProgress = (sectionId: string) => {
    const children = getChildren(sectionId);
    if (children.length === 0) return 0;
    const completed = children.filter(c => c.is_completed).length;
    return Math.round((completed / children.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg mb-2">No Syllabus Sections Yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Start building your study plan by adding subjects and topics
          </p>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <Input
              placeholder="Add first subject..."
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
            />
            <Button onClick={() => handleAddSection()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new subject */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add new subject..."
              value={addingToParent === null ? newSectionTitle : ""}
              onChange={(e) => {
                setNewSectionTitle(e.target.value);
                setAddingToParent(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              className="flex-1"
            />
            <Button 
              onClick={() => handleAddSection()}
              disabled={!newSectionTitle.trim() || addingToParent !== null}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sections List */}
      <div className="space-y-2">
        {rootSections.map((section) => {
          const children = getChildren(section.id);
          const progress = getSectionProgress(section.id);
          const isExpanded = expandedSections.has(section.id);

          return (
            <Card key={section.id} className="border-border/50 overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(section.id)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      {children.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
                      <Checkbox
                        checked={section.is_completed}
                        onCheckedChange={(checked) => {
                          toggleCompletionMutation.mutate({ 
                            id: section.id, 
                            completed: checked === true 
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          section.is_completed && "line-through text-muted-foreground"
                        )}>
                          {section.title}
                        </span>
                        <Badge className={cn("text-[10px]", statusColors[section.status])}>
                          {statusLabels[section.status]}
                        </Badge>
                      </div>
                      {children.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progress} className="h-1 w-24" />
                          <span className="text-xs text-muted-foreground">
                            {children.filter(c => c.is_completed).length}/{children.length} topics
                          </span>
                        </div>
                      )}
                    </div>

                    {section.time_spent_minutes > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {Math.floor(section.time_spent_minutes / 60)}h {section.time_spent_minutes % 60}m
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => logTimeMutation.mutate({ id: section.id, minutes: 30 })}>
                          <Clock className="w-4 h-4 mr-2" />
                          Log 30 min
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => logTimeMutation.mutate({ id: section.id, minutes: 60 })}>
                          <Clock className="w-4 h-4 mr-2" />
                          Log 1 hour
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <DropdownMenuItem 
                            key={key}
                            onClick={() => updateStatusMutation.mutate({ id: section.id, status: key })}
                          >
                            <div className={cn("w-2 h-2 rounded-full mr-2", statusColors[key].split(" ")[0])} />
                            {label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteSectionMutation.mutate(section.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 ml-10">
                    {/* Child topics */}
                    {children.map((child) => (
                      <div 
                        key={child.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                      >
                        <Checkbox
                          checked={child.is_completed}
                          onCheckedChange={(checked) => {
                            toggleCompletionMutation.mutate({ 
                              id: child.id, 
                              completed: checked === true 
                            });
                          }}
                        />
                        <span className={cn(
                          "flex-1 text-sm",
                          child.is_completed && "line-through text-muted-foreground"
                        )}>
                          {child.title}
                        </span>
                        <Badge className={cn("text-[10px] opacity-0 group-hover:opacity-100", statusColors[child.status])}>
                          {statusLabels[child.status]}
                        </Badge>
                        {child.time_spent_minutes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {child.time_spent_minutes}m
                          </span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => logTimeMutation.mutate({ id: child.id, minutes: 15 })}
                          >
                            <Clock className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteSectionMutation.mutate(child.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add topic input */}
                    {addingToParent === section.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Topic name..."
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddSection(section.id);
                            if (e.key === "Escape") {
                              setAddingToParent(null);
                              setNewSectionTitle("");
                            }
                          }}
                          autoFocus
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleAddSection(section.id)}>
                          Add
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setAddingToParent(null);
                            setNewSectionTitle("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => {
                          setAddingToParent(section.id);
                          setNewSectionTitle("");
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add topic
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
