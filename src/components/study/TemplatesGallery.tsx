import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Layout, Star, Eye, Clock, Users, FileText, BookOpen, Target, 
  Search, Briefcase, Globe, GraduationCap, Code, ChevronRight,
  CheckCircle2, Sparkles, Plus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TemplateData {
  subjects?: string[];
  topics_count?: number;
  estimated_hours?: number;
  outcomes?: string[];
}

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  template_type: string;
  template_data: TemplateData;
  is_featured: boolean;
  is_active: boolean;
  published_at: string | null;
  usage_count: number;
}

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  government: { icon: Briefcase, label: "Government Exams", color: "bg-amber-500/10 text-amber-600" },
  technical: { icon: Code, label: "Technical Careers", color: "bg-blue-500/10 text-blue-600" },
  international: { icon: Globe, label: "International Exams", color: "bg-purple-500/10 text-purple-600" },
  study: { icon: GraduationCap, label: "Study Plans", color: "bg-emerald-500/10 text-emerald-600" },
  exam: { icon: Target, label: "Exam Prep", color: "bg-rose-500/10 text-rose-600" },
};

const TemplatesGallery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Fetch published templates from admin_templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["public-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_templates")
        .select("*")
        .eq("is_active", true)
        .not("published_at", "is", null)
        .order("is_featured", { ascending: false })
        .order("title");
      
      if (error) throw error;
      return data as Template[];
    },
  });

  // Check which templates user already has
  const { data: userTemplates = [] } = useQuery({
    queryKey: ["user-study-templates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_study_templates")
        .select("template_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(t => t.template_id);
    },
    enabled: !!user,
  });

  // Add template to user collection
  const addTemplateMutation = useMutation({
    mutationFn: async (template: Template) => {
      if (!user) throw new Error("Not authenticated");
      
      const subjects = template.template_data?.subjects || [];
      const topicsCount = template.template_data?.topics_count || subjects.length * 5;
      
      // Insert into user_study_templates
      const { data: userTemplate, error } = await supabase
        .from("user_study_templates")
        .insert({
          user_id: user.id,
          template_id: template.id,
          template_name: template.title,
          template_category: template.category,
          template_subcategory: template.template_type,
          template_icon: categoryConfig[template.category]?.icon === Briefcase ? "💼" : 
                        categoryConfig[template.category]?.icon === Code ? "💻" : 
                        categoryConfig[template.category]?.icon === Globe ? "🌍" : "📚",
          total_subjects: subjects.length,
          total_topics: topicsCount,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial sections from subjects
      if (subjects.length > 0 && userTemplate) {
        const sectionsToInsert = subjects.map((subject: string, index: number) => ({
          user_id: user.id,
          user_template_id: userTemplate.id,
          section_type: "subject",
          title: subject,
          order_index: index,
        }));

        await supabase
          .from("user_template_sections")
          .insert(sectionsToInsert);
      }

      // Increment usage count on the template
      await supabase
        .from("admin_templates")
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq("id", template.id);

      return userTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      toast.success("Template added to My Templates!");
      setPreviewTemplate(null);
    },
    onError: (error: any) => {
      console.error("Error adding template:", error);
      if (error.code === "23505") {
        toast.error("You already have this template in your collection");
      } else {
        toast.error("Failed to add template");
      }
    },
  });

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group templates by category
  const groupedTemplates = Object.entries(categoryConfig).reduce((acc, [key]) => {
    const categoryTemplates = filteredTemplates.filter(t => t.category === key);
    if (categoryTemplates.length > 0) {
      acc[key] = categoryTemplates;
    }
    return acc;
  }, {} as Record<string, Template[]>);

  // Get category counts
  const categoryCounts = Object.entries(categoryConfig).reduce((acc, [key]) => {
    acc[key] = templates.filter(t => t.category === key).length;
    return acc;
  }, {} as Record<string, number>);

  const handleUseTemplate = (template: Template) => {
    if (!user) {
      toast.error("Please log in to use templates");
      return;
    }
    if (userTemplates.includes(template.id)) {
      toast.info("Template already in your collection");
      setPreviewTemplate(null);
      return;
    }
    addTemplateMutation.mutate(template);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPublished = templates.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Templates Gallery
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalPublished} published templates available • Choose a template to start your study journey
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          All ({totalPublished})
        </Button>
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = categoryCounts[key] || 0;
          if (count === 0) return null;
          return (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {totalPublished === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layout className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No Published Templates Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Templates will appear here once the admin publishes them. Check back soon for official study plans and exam preparation guides.
            </p>
          </CardContent>
        </Card>
      ) : selectedCategory === "all" ? (
        // Show grouped by category
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([categoryKey, categoryTemplates]) => {
            const config = categoryConfig[categoryKey];
            if (!config) return null;
            const Icon = config.icon;
            
            return (
              <div key={categoryKey} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold">{config.label}</h3>
                  <Badge variant="secondary" className="text-xs">{categoryTemplates.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPreview={() => setPreviewTemplate(template)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show filtered list
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.title}
              {previewTemplate?.is_featured && (
                <Star className="w-4 h-4 text-primary fill-primary" />
              )}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description || "Start your learning journey with this structured template"}
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <ScrollArea className="max-h-[50vh]">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p className="font-medium text-sm capitalize">{previewTemplate.category}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Topics</p>
                        <p className="font-medium text-sm">
                          {previewTemplate.template_data?.topics_count || 20}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Duration</p>
                        <p className="font-medium text-sm">
                          {previewTemplate.template_data?.estimated_hours || 40} hours
                        </p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Users</p>
                        <p className="font-medium text-sm">{previewTemplate.usage_count || 0} enrolled</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4 pt-4">
                  <h4 className="font-medium">Included Subjects</h4>
                  <div className="space-y-2">
                    {(previewTemplate.template_data?.subjects || ["General Topics"]).map((subject: string, idx: number) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{idx + 1}</span>
                          </div>
                          <span className="text-sm font-medium">{subject}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="outcomes" className="space-y-4 pt-4">
                  <h4 className="font-medium">What You Will Learn</h4>
                  <div className="space-y-2">
                    {[
                      "Complete understanding of core concepts",
                      "Practical application skills",
                      "Exam-ready preparation framework",
                      "Progress tracking and analytics",
                      "Structured revision schedules",
                    ].map((outcome, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => previewTemplate && handleUseTemplate(previewTemplate)}>
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({ 
  template, 
  onPreview 
}: { 
  template: Template; 
  onPreview: () => void;
}) => {
  const config = categoryConfig[template.category];
  
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group" onClick={onPreview}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {template.title}
              </h3>
              {template.is_featured && (
                <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {template.description || "Structured learning path"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {config && (
            <Badge className={`${config.color} text-[10px] border-0`}>
              {config.label}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {template.template_data?.topics_count || 20} topics
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {template.template_data?.estimated_hours || 40}h
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {template.usage_count || 0} users
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
        >
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
      </CardContent>
    </Card>
  );
};

export default TemplatesGallery;
