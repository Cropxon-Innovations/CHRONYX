import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  BookOpen, 
  Building2, 
  Code2, 
  Globe2,
  Star,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Award,
  Check,
  ChevronRight
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
import { STUDY_TEMPLATES, StudyTemplate, StudyCategory } from "@/hooks/useStudyOnboarding";
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

const categoryTabs = [
  { id: "my-templates", label: "My Templates", icon: BookOpen },
  { id: "government", label: "Government Exams", icon: Building2 },
  { id: "technical", label: "Technical Careers", icon: Code2 },
  { id: "international", label: "International Exams", icon: Globe2 },
];

export const StudyTemplatesLibrary = ({ onSelectTemplate, activeTemplateId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeCategory, setActiveCategory] = useState("my-templates");
  const [search, setSearch] = useState("");
  const [deletingTemplate, setDeletingTemplate] = useState<UserTemplate | null>(null);
  
  // Fetch user's templates
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

  // Add template to user's collection
  const addTemplateMutation = useMutation({
    mutationFn: async (template: StudyTemplate) => {
      const { data, error } = await supabase
        .from("user_study_templates")
        .insert({
          user_id: user!.id,
          template_id: template.id,
          template_name: template.name,
          template_category: template.category,
          template_subcategory: template.subcategory,
          template_level: template.level,
          template_year: template.year,
          template_icon: template.icon,
          total_subjects: template.subjects,
          total_topics: template.topics,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast({ title: "Template added to My Templates!" });
      onSelectTemplate(data);
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast({ title: "Template already in your collection", variant: "destructive" });
      } else {
        toast({ title: "Failed to add template", variant: "destructive" });
      }
    },
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

  // Filter templates
  const filteredOfficialTemplates = useMemo(() => {
    if (activeCategory === "my-templates") return [];
    return STUDY_TEMPLATES.filter(t => {
      if (t.category !== activeCategory) return false;
      if (!search) return true;
      return t.name.toLowerCase().includes(search.toLowerCase()) ||
             t.subcategory.toLowerCase().includes(search.toLowerCase());
    });
  }, [activeCategory, search]);

  const filteredUserTemplates = useMemo(() => {
    if (activeCategory !== "my-templates") return [];
    if (!search) return userTemplates;
    return userTemplates.filter(t => 
      t.template_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeCategory, search, userTemplates]);

  // Check if official template is already added
  const isTemplateAdded = (templateId: string) => {
    return userTemplates.some(t => t.template_id === templateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Study Templates</h2>
          <p className="text-sm text-muted-foreground">Choose from curated templates or manage your collection</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-muted/30 border border-border p-1 h-auto flex-wrap">
          {categoryTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="data-[state=active]:bg-card gap-2"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* My Templates */}
        <TabsContent value="my-templates" className="mt-6">
          {templatesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-8 w-8 bg-muted rounded mb-3" />
                  <div className="h-5 w-3/4 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : filteredUserTemplates.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-2">No templates yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse official templates and add them to your collection
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveCategory("government")}
                className="gap-2"
              >
                Browse Templates
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredUserTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <UserTemplateCard
                      template={template}
                      isActive={activeTemplateId === template.id}
                      onSelect={() => onSelectTemplate(template)}
                      onDuplicate={() => duplicateTemplateMutation.mutate(template)}
                      onDelete={() => setDeletingTemplate(template)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Official Templates */}
        {["government", "technical", "international"].map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOfficialTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <OfficialTemplateCard
                    template={template}
                    isAdded={isTemplateAdded(template.id)}
                    onAdd={() => addTemplateMutation.mutate(template)}
                    isAdding={addTemplateMutation.isPending}
                  />
                </motion.div>
              ))}
            </div>
            
            {filteredOfficialTemplates.length === 0 && (
              <Card className="p-8 text-center border-dashed">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-foreground mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deletingTemplate?.template_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the template from your collection. Any study progress associated with this template will remain.
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

// User Template Card Component
const UserTemplateCard = ({ 
  template, 
  isActive,
  onSelect, 
  onDuplicate, 
  onDelete 
}: {
  template: UserTemplate;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5",
        isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"
      )}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-2xl">{template.template_icon}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-1 line-clamp-1">
          {template.template_name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {template.template_subcategory || template.template_category}
        </p>

        {/* Progress */}
        {template.progress_percent > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{template.progress_percent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${template.progress_percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{template.total_subjects} subjects • {template.total_topics} topics</span>
          {isActive && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
              Active
            </Badge>
          )}
        </div>

        {/* Completion badge */}
        {template.completed_at && (
          <div className="mt-3 pt-3 border-t border-border">
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Award className="w-3 h-3" />
              Completed
            </Badge>
          </div>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      )}
    </Card>
  );
};

// Official Template Card Component
const OfficialTemplateCard = ({ 
  template, 
  isAdded,
  onAdd,
  isAdding
}: {
  template: StudyTemplate;
  isAdded: boolean;
  onAdd: () => void;
  isAdding: boolean;
}) => {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 border-border hover:border-primary/30">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-2xl">{template.icon}</div>
          <div className="flex gap-1 flex-wrap justify-end">
            {template.isPopular && (
              <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Star className="w-3 h-3" />
                Popular
              </Badge>
            )}
            {template.isNew && (
              <Badge variant="secondary" className="text-xs gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                New
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-1">
          {template.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {template.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className={cn(
            "px-1.5 py-0.5 rounded capitalize",
            template.level === 'beginner' ? 'bg-emerald-500/10 text-emerald-600' :
            template.level === 'intermediate' ? 'bg-blue-500/10 text-blue-600' :
            template.level === 'advanced' ? 'bg-purple-500/10 text-purple-600' :
            'bg-amber-500/10 text-amber-600'
          )}>
            {template.level.replace('-', ' ')}
          </span>
          <span>•</span>
          <span>{template.year}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{template.subjects} subjects • {template.topics} topics</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.lastUpdated}
          </span>
        </div>

        {/* Action */}
        <Button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          disabled={isAdded || isAdding}
          className="w-full gap-2"
          variant={isAdded ? "secondary" : "default"}
          size="sm"
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              Added
            </>
          ) : isAdding ? (
            "Adding..."
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Use Template
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default StudyTemplatesLibrary;
