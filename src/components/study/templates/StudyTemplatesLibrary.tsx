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
import { cn } from "@/lib/utils";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

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

  // Delete user template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_study_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast({ title: "Template removed" });
      setDeletingTemplate(null);
    },
  });

  // Duplicate template
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template: UserTemplate) => {
      const { error } = await supabase
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
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast({ title: "Template duplicated" });
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
              This will remove "{deletingTemplate?.template_name}" from your collection. Your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTemplate && deleteTemplateMutation.mutate(deletingTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
