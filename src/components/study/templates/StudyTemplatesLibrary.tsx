import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  BookOpen, 
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Award,
  Check,
  ChevronRight,
  Eye,
  FolderOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface UserTemplate {
  id: string;
  template_id: string;
  template_name: string;
  template_category: string;
  template_subcategory: string | null;
  template_level: string;
  template_year: number | null;
  template_icon: string;
  total_subjects: number;
  total_topics: number;
  is_active: boolean;
  progress_percent: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface Props {
  onSelectTemplate: (template: UserTemplate) => void;
  activeTemplateId?: string;
}

export const StudyTemplatesLibrary = ({ onSelectTemplate, activeTemplateId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [deletingTemplate, setDeletingTemplate] = useState<UserTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<UserTemplate | null>(null);
  
  // Fetch ONLY user's saved templates from database (no static templates)
  const { data: userTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["user-study-templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_study_templates")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as UserTemplate[];
    },
    enabled: !!user,
  });

  // Fetch sections for preview
  const { data: previewSections = [] } = useQuery({
    queryKey: ["template-sections-preview", previewTemplate?.id],
    queryFn: async () => {
      if (!previewTemplate) return [];
      const { data, error } = await supabase
        .from("user_template_sections")
        .select("*")
        .eq("user_template_id", previewTemplate.id)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!previewTemplate,
  });

  // Delete user template (also deletes related sections, notes, schedules via cascade or manual)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete related data first
      await supabase.from("user_template_sections").delete().eq("user_template_id", id);
      await supabase.from("user_template_data").delete().eq("user_template_id", id);
      await supabase.from("study_section_notes").delete().eq("user_template_id", id);
      await supabase.from("user_study_schedule").delete().eq("user_template_id", id);
      
      // Then delete the template
      const { error } = await supabase
        .from("user_study_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast({ title: "Template removed successfully" });
      setDeletingTemplate(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({ title: "Failed to remove template", variant: "destructive" });
    },
  });

  // Duplicate template with all sections
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: UserTemplate) => {
      // Create the duplicated template
      const { data: newTemplate, error } = await supabase
        .from("user_study_templates")
        .insert({
          user_id: user!.id,
          template_id: `${template.template_id}-copy-${Date.now()}`,
          template_name: `${template.template_name} (Copy)`,
          template_category: template.template_category,
          template_subcategory: template.template_subcategory,
          template_level: template.template_level,
          template_year: template.template_year,
          template_icon: template.template_icon,
          total_subjects: template.total_subjects,
          total_topics: template.total_topics,
          progress_percent: 0,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Fetch and duplicate sections
      const { data: originalSections } = await supabase
        .from("user_template_sections")
        .select("*")
        .eq("user_template_id", template.id)
        .order("order_index");

      if (originalSections && originalSections.length > 0) {
        const sectionsToInsert = originalSections.map(section => ({
          user_id: user!.id,
          user_template_id: newTemplate.id,
          title: section.title,
          section_type: section.section_type,
          order_index: section.order_index,
          is_completed: false,
          status: "not_started",
        }));

        await supabase.from("user_template_sections").insert(sectionsToInsert);
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast({ title: "Template duplicated successfully" });
    },
    onError: (error) => {
      console.error("Duplicate error:", error);
      toast({ title: "Failed to duplicate template", variant: "destructive" });
    },
  });

  // Filter user templates based on search
  const filteredUserTemplates = useMemo(() => {
    if (!search) return userTemplates;
    return userTemplates.filter(t => 
      t.template_name.toLowerCase().includes(search.toLowerCase()) ||
      t.template_category.toLowerCase().includes(search.toLowerCase())
    );
  }, [userTemplates, search]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "intermediate": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "advanced": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "full-prep": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "government": return "bg-amber-500/10 text-amber-600";
      case "technical": return "bg-blue-500/10 text-blue-600";
      case "international": return "bg-purple-500/10 text-purple-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Your subscribed study templates ({userTemplates.length})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* User Templates Grid */}
      {filteredUserTemplates.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold mb-2">No Templates Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            {search 
              ? "No templates match your search."
              : "You haven't subscribed to any templates yet. Browse the Templates Gallery to find and add templates to your collection."
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredUserTemplates.map((template) => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card 
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
                    activeTemplateId === template.id && "border-primary ring-1 ring-primary/20"
                  )}
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {template.template_icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm line-clamp-1">{template.template_name}</h3>
                        <Badge variant="outline" className={cn("text-[10px] mt-1", getCategoryColor(template.template_category))}>
                          {template.template_category}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewTemplate(template); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateTemplateMutation.mutate(template); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setDeletingTemplate(template); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>{template.total_subjects} subjects</span>
                    <span>•</span>
                    <span>{template.total_topics} topics</span>
                    {template.template_year && (
                      <>
                        <span>•</span>
                        <span>{template.template_year}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{template.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${template.progress_percent}%` }}
                      />
                    </div>
                  </div>
                  
                  {template.progress_percent === 100 && (
                    <Badge className="mt-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <Check className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deletingTemplate?.template_name}" from your collection. Your progress, notes, and schedules will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTemplate && deleteTemplateMutation.mutate(deletingTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplateMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{previewTemplate?.template_icon}</span>
              {previewTemplate?.template_name}
            </DialogTitle>
            <DialogDescription>
              Preview your template structure and progress
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="syllabus">Syllabus ({previewSections.length})</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="overview" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-medium text-sm capitalize">{previewTemplate.template_category}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FolderOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Subjects</p>
                        <p className="font-medium text-sm">{previewTemplate.total_subjects}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Topics</p>
                        <p className="font-medium text-sm">{previewTemplate.total_topics}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="font-medium text-sm">{previewTemplate.progress_percent}%</p>
                      </div>
                    </div>
                  </div>

                  {previewTemplate.template_year && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Year</p>
                      <p className="font-medium">{previewTemplate.template_year}</p>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-semibold">{previewTemplate.progress_percent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${previewTemplate.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="syllabus" className="space-y-2 mt-0">
                  {previewSections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sections added yet</p>
                      <p className="text-xs">Open the template to add subjects and topics</p>
                    </div>
                  ) : (
                    previewSections.map((section, idx) => (
                      <div 
                        key={section.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                          </div>
                          <div>
                            <span className="font-medium text-sm">{section.title}</span>
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              {section.section_type}
                            </Badge>
                          </div>
                        </div>
                        {section.is_completed && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => {
              if (previewTemplate) {
                onSelectTemplate(previewTemplate);
                setPreviewTemplate(null);
              }
            }}>
              Open Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
