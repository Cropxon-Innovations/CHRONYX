import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Layout, Plus, Star, Eye, Trash2, Send, Check, 
  BookOpen, Target, Award, Clock, Users, FileText,
  ChevronRight, CheckCircle2, Briefcase, Code, Globe
} from "lucide-react";
import { useAdminTemplates, useCreateTemplate, useCreateNotification, useLogAdminActivity } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

// Sample syllabus preview data for different categories
const syllabusPreviewData: Record<string, any> = {
  study: {
    subjects: ["Core Concepts", "Advanced Topics", "Practical Applications"],
    topics: 24,
    resources: 12,
    estimatedTime: "40 hours",
  },
  exam: {
    subjects: ["Prelims", "Mains", "Interview"],
    topics: 50,
    resources: 30,
    estimatedTime: "200+ hours",
  },
  technical: {
    subjects: ["Fundamentals", "System Design", "DSA", "Projects"],
    topics: 80,
    resources: 45,
    estimatedTime: "150 hours",
  },
  finance: {
    subjects: ["Budgeting", "Investments", "Tax Planning"],
    topics: 15,
    resources: 8,
    estimatedTime: "20 hours",
  },
};

// Category configuration for organization
const categoryConfig: Record<string, { icon: any; label: string; color: string }> = {
  government: { icon: Briefcase, label: "Government Exams", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  technical: { icon: Code, label: "Technical Careers", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  international: { icon: Globe, label: "International Exams", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  study: { icon: BookOpen, label: "Study Plans", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  exam: { icon: Target, label: "Exam Prep", color: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  finance: { icon: Layout, label: "Finance", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30" },
  library: { icon: BookOpen, label: "Library", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
};

const AdminTemplates = () => {
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useAdminTemplates();
  const createTemplate = useCreateTemplate();
  const createNotification = useCreateNotification();
  const logActivity = useLogAdminActivity();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "study",
    template_type: "syllabus",
    is_featured: false,
    subjects: "",
    topics_count: 20,
    resources_count: 10,
    estimated_hours: 40,
  });

  // Publish template mutation
  const publishTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("admin_templates")
        .update({ 
          is_active: true,
          published_at: new Date().toISOString()
        })
        .eq("id", templateId);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: async (templateId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      queryClient.invalidateQueries({ queryKey: ["public-templates"] });
      
      // Get template details for notification
      const template = templates?.find(t => t.id === templateId);
      
      // Create notification for all users
      await createNotification.mutateAsync({
        title: "🎉 New Template Available!",
        message: `Check out the new "${template?.title}" template in the Template Library. ${template?.description || ''}`,
        notification_type: "feature",
        target_audience: "all",
        action_url: "/app/study/templates",
        action_label: "View Template",
      });

      // Log activity
      logActivity.mutate({
        action: `Published template: ${template?.title}`,
        target_type: "template",
        target_id: templateId,
      });

      toast.success("Template published and users notified!");
    },
    onError: (error) => {
      console.error("Failed to publish:", error);
      toast.error("Failed to publish template");
    },
  });

  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
  };

  const handlePublish = async () => {
    if (!previewTemplate) return;
    setIsPublishing(true);
    await publishTemplate.mutateAsync(previewTemplate.id);
    setIsPublishing(false);
    setPreviewTemplate(null);
  };

  const handleCreateAndPreview = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a template title");
      return;
    }

    const templateData = {
      subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
      topics_count: formData.topics_count,
      resources_count: formData.resources_count,
      estimated_hours: formData.estimated_hours,
    };
    
    createTemplate.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      template_type: formData.template_type,
      template_data: templateData,
      is_featured: formData.is_featured,
    }, {
      onSuccess: (data) => {
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "study",
          template_type: "syllabus",
          is_featured: false,
          subjects: "",
          topics_count: 20,
          resources_count: 10,
          estimated_hours: 40,
        });
        // Open preview for the new template
        if (data) {
          setPreviewTemplate(data);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Count published as those with published_at set (not just is_active)
  const publishedTemplates = templates?.filter(t => t.published_at !== null)?.length || 0;
  const draftTemplates = templates?.filter(t => t.published_at === null)?.length || 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Layout className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedTemplates}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{draftTemplates}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {templates?.reduce((sum, t) => sum + (t.usage_count || 0), 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Management */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Template Management
              </CardTitle>
              <CardDescription>
                Create, preview, and publish templates for all users
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Fill in the details and preview before publishing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., UPSC Civil Services 2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this template covers..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="study">Study</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.template_type}
                        onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="syllabus">Syllabus</SelectItem>
                          <SelectItem value="exam">Exam Pattern</SelectItem>
                          <SelectItem value="workflow">Workflow</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subjects (comma separated)</Label>
                    <Input
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      placeholder="e.g., History, Geography, Polity"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Topics</Label>
                      <Input
                        type="number"
                        value={formData.topics_count}
                        onChange={(e) => setFormData({ ...formData, topics_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resources</Label>
                      <Input
                        type="number"
                        value={formData.resources_count}
                        onChange={(e) => setFormData({ ...formData, resources_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-input"
                    />
                    <Label htmlFor="featured">Mark as Featured</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAndPreview} 
                    disabled={createTemplate.isPending || !formData.title.trim()}
                  >
                    {createTemplate.isPending ? "Creating..." : "Create & Preview"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Organized by Category */}
          {Object.entries(categoryConfig).map(([categoryKey, config]) => {
            const categoryTemplates = templates?.filter(t => t.category === categoryKey) || [];
            if (categoryTemplates.length === 0) return null;
            
            const Icon = config.icon;
            const publishedCount = categoryTemplates.filter(t => t.published_at !== null).length;
            
            return (
              <div key={categoryKey} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg border ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold">{config.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTemplates.length} total
                  </Badge>
                  <Badge variant="outline" className="text-xs text-primary">
                    {publishedCount} published
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryTemplates.map((template) => (
                    <Card key={template.id} className="border-border/50 overflow-hidden hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{template.title}</h3>
                              {template.is_featured && (
                                <Star className="w-3 h-3 text-primary fill-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {template.description || "No description"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{template.template_type}</Badge>
                          {template.published_at ? (
                            <Badge className="bg-primary/10 text-primary text-[10px] border-0">Published</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Draft</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {template.usage_count || 0} uses
                          </div>
                          <span>
                            {template.published_at ? format(new Date(template.published_at), "MMM d, yyyy") : "Not published"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          {!template.published_at && (
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setPreviewTemplate(template);
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          
          {(!templates || templates.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No templates created yet</p>
              <p className="text-sm">Create your first template to share with all users</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview & Publish Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.is_active ? "Template Preview" : "Preview & Publish"}
              {previewTemplate?.is_featured && (
                <Star className="w-4 h-4 text-primary fill-primary" />
              )}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.is_active 
                ? "This template is already published and visible to users"
                : "Review the template before publishing to all users"
              }
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <ScrollArea className="max-h-[60vh]">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <h3 className="font-semibold text-lg mb-2">{previewTemplate.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {previewTemplate.description || "No description provided"}
                    </p>
                  </div>
                  
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
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium text-sm capitalize">{previewTemplate.template_type}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Topics</p>
                        <p className="font-medium text-sm">
                          {(previewTemplate.template_data as any)?.topics_count || 
                           syllabusPreviewData[previewTemplate.category]?.topics || 20}
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
                          {(previewTemplate.template_data as any)?.estimated_hours || 
                           syllabusPreviewData[previewTemplate.category]?.estimatedTime || "40"} hours
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4 pt-4">
                  <h4 className="font-medium">Included Subjects</h4>
                  <div className="space-y-2">
                    {((previewTemplate.template_data as any)?.subjects || 
                      syllabusPreviewData[previewTemplate.category]?.subjects || 
                      ["Subject 1", "Subject 2", "Subject 3"]
                    ).map((subject: string, idx: number) => (
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
                  <h4 className="font-medium">What Users Will Learn</h4>
                  <div className="space-y-2">
                    {[
                      "Complete understanding of core concepts",
                      "Practical application skills",
                      "Exam-ready preparation framework",
                      "Progress tracking and analytics",
                      "Revision schedules and study plans",
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
            {previewTemplate && !previewTemplate.published_at && (
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? (
                  <>Publishing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish to All Users
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTemplates;