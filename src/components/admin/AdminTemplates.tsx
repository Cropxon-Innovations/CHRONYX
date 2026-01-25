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
  ChevronRight, CheckCircle2, Briefcase, Code, Globe,
  Edit2, Save, X
} from "lucide-react";
import { useAdminTemplates, useCreateTemplate, useCreateNotification, useLogAdminActivity } from "@/hooks/useAdmin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "government",
    template_type: "syllabus",
    is_featured: false,
    subjects: "",
    topics_count: 20,
    resources_count: 10,
    estimated_hours: 40,
    outcomes: "",
    prerequisites: "",
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("admin_templates")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      queryClient.invalidateQueries({ queryKey: ["public-templates"] });
      toast.success("Template updated successfully");
      setEditingTemplate(null);
    },
    onError: (error) => {
      console.error("Failed to update:", error);
      toast.error("Failed to update template");
    },
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
      
      const template = templates?.find(t => t.id === templateId);
      
      await createNotification.mutateAsync({
        title: "🎉 New Template Available!",
        message: `Check out the new "${template?.title}" template in the Template Library.`,
        notification_type: "feature",
        target_audience: "all",
        action_url: "/app/study?tab=gallery",
        action_label: "View Template",
      });

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

  // Unpublish (save to draft) mutation
  const unpublishTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("admin_templates")
        .update({ 
          is_active: false,
          published_at: null
        })
        .eq("id", templateId);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      queryClient.invalidateQueries({ queryKey: ["public-templates"] });
      toast.success("Template saved to drafts");
    },
    onError: (error) => {
      console.error("Failed to unpublish:", error);
      toast.error("Failed to save to drafts");
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("admin_templates")
        .delete()
        .eq("id", templateId);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete template");
    },
  });

  const handleEdit = (template: any) => {
    const templateData = template.template_data || {};
    setEditingTemplate({
      ...template,
      subjects: templateData.subjects?.join(", ") || "",
      topics_count: templateData.topics_count || 20,
      resources_count: templateData.resources_count || 10,
      estimated_hours: templateData.estimated_hours || 40,
      outcomes: templateData.outcomes?.join("\n") || "",
      prerequisites: templateData.prerequisites?.join("\n") || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    
    const templateData = {
      subjects: editingTemplate.subjects.split(",").map((s: string) => s.trim()).filter(Boolean),
      topics_count: editingTemplate.topics_count,
      resources_count: editingTemplate.resources_count,
      estimated_hours: editingTemplate.estimated_hours,
      outcomes: editingTemplate.outcomes.split("\n").filter(Boolean),
      prerequisites: editingTemplate.prerequisites.split("\n").filter(Boolean),
    };

    updateTemplate.mutate({
      id: editingTemplate.id,
      data: {
        title: editingTemplate.title,
        description: editingTemplate.description,
        category: editingTemplate.category,
        template_type: editingTemplate.template_type,
        is_featured: editingTemplate.is_featured,
        template_data: templateData,
      }
    });
  };

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

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a template title");
      return;
    }

    const templateData = {
      subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
      topics_count: formData.topics_count,
      resources_count: formData.resources_count,
      estimated_hours: formData.estimated_hours,
      outcomes: formData.outcomes.split("\n").filter(Boolean),
      prerequisites: formData.prerequisites.split("\n").filter(Boolean),
    };
    
    createTemplate.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      template_type: formData.template_type,
      template_data: templateData,
      is_featured: formData.is_featured,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "government",
          template_type: "syllabus",
          is_featured: false,
          subjects: "",
          topics_count: 20,
          resources_count: 10,
          estimated_hours: 40,
          outcomes: "",
          prerequisites: "",
        });
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

  const publishedTemplates = templates?.filter(t => t.published_at !== null)?.length || 0;
  const draftTemplates = templates?.filter(t => t.published_at === null)?.length || 0;

  // Group templates by category
  const categories = ["government", "technical", "international", "study", "exam", "finance", "library"];
  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates?.filter(t => t.category === activeCategory);

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
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <Check className="w-5 h-5 text-emerald-600" />
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
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <FileText className="w-5 h-5 text-amber-600" />
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
                Create, edit, preview, and publish templates for all users
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Fill in all details before saving to drafts
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., UPSC Civil Services 2025"
                      />
                    </div>
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
                          <SelectItem value="government">Government Exams</SelectItem>
                          <SelectItem value="technical">Technical Careers</SelectItem>
                          <SelectItem value="international">International Exams</SelectItem>
                          <SelectItem value="study">Study Plans</SelectItem>
                          <SelectItem value="exam">Exam Prep</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  <div className="space-y-2">
                    <Label>Subjects (comma separated)</Label>
                    <Input
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      placeholder="e.g., History, Geography, Polity, Economy"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Topics Count</Label>
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
                      <Label>Est. Hours</Label>
                      <Input
                        type="number"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Learning Outcomes (one per line)</Label>
                    <Textarea
                      value={formData.outcomes}
                      onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                      placeholder="Master the fundamentals of...&#10;Understand key concepts in...&#10;Apply knowledge to..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prerequisites (one per line)</Label>
                    <Textarea
                      value={formData.prerequisites}
                      onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                      placeholder="Basic understanding of...&#10;Completed previous module..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createTemplate.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Drafts
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Filter Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">All ({templates?.length || 0})</TabsTrigger>
              {categories.map(cat => {
                const count = templates?.filter(t => t.category === cat).length || 0;
                const config = categoryConfig[cat];
                if (count === 0) return null;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs gap-1">
                    <config.icon className="w-3 h-3" />
                    {config.label} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Templates List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredTemplates?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No templates in this category</p>
                </div>
              ) : (
                filteredTemplates?.map((template) => {
                  const config = categoryConfig[template.category] || categoryConfig.study;
                  const isPublished = template.published_at !== null;
                  const templateData = template.template_data || {};
                  
                  return (
                    <Card key={template.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={config.color}>
                                <config.icon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              {template.is_featured && (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                              {isPublished ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Draft
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold mb-1">{template.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {template.description || "No description"}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {(templateData as any)?.subjects?.length > 0 && (
                                <span>{(templateData as any).subjects.length} subjects</span>
                              )}
                              {(templateData as any)?.topics_count && (
                                <span>{(templateData as any).topics_count} topics</span>
                              )}
                              {(templateData as any)?.estimated_hours && (
                                <span>{(templateData as any).estimated_hours}h estimated</span>
                              )}
                              <span>{template.usage_count || 0} uses</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => deleteTemplate.mutate(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template details and content
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editingTemplate.category}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government Exams</SelectItem>
                      <SelectItem value="technical">Technical Careers</SelectItem>
                      <SelectItem value="international">International Exams</SelectItem>
                      <SelectItem value="study">Study Plans</SelectItem>
                      <SelectItem value="exam">Exam Prep</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Subjects (comma separated)</Label>
                <Input
                  value={editingTemplate.subjects}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subjects: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Topics Count</Label>
                  <Input
                    type="number"
                    value={editingTemplate.topics_count}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, topics_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resources</Label>
                  <Input
                    type="number"
                    value={editingTemplate.resources_count}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, resources_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Est. Hours</Label>
                  <Input
                    type="number"
                    value={editingTemplate.estimated_hours}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, estimated_hours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Learning Outcomes (one per line)</Label>
                <Textarea
                  value={editingTemplate.outcomes}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, outcomes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Prerequisites (one per line)</Label>
                <Textarea
                  value={editingTemplate.prerequisites}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, prerequisites: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            {editingTemplate?.published_at ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  unpublishTemplate.mutate(editingTemplate.id);
                  setEditingTemplate(null);
                }}
              >
                Save to Draft
              </Button>
            ) : null}
            <Button onClick={handleSaveEdit} disabled={updateTemplate.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview & Publish Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Review before publishing to all users
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-6 py-4">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                  <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{previewTemplate.title}</h3>
                    <p className="text-muted-foreground mt-1">{previewTemplate.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{(previewTemplate.template_data as any)?.subjects?.length || 0} Subjects</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>{(previewTemplate.template_data as any)?.topics_count || 0} Topics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{(previewTemplate.template_data as any)?.estimated_hours || 0} Hours</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>{(previewTemplate.template_data as any)?.resources_count || 0} Resources</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="syllabus" className="mt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.template_data?.subjects?.map((subject: string, i: number) => (
                        <Badge key={i} variant="outline">{subject}</Badge>
                      )) || <span className="text-muted-foreground text-sm">No subjects defined</span>}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="outcomes" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Learning Outcomes</h4>
                      <ul className="space-y-2">
                        {previewTemplate.template_data?.outcomes?.map((outcome: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{outcome}</span>
                          </li>
                        )) || <li className="text-muted-foreground text-sm">No outcomes defined</li>}
                      </ul>
                    </div>
                    {previewTemplate.template_data?.prerequisites?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Prerequisites</h4>
                        <ul className="space-y-1">
                          {previewTemplate.template_data.prerequisites.map((prereq: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">• {prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            {previewTemplate?.published_at ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  unpublishTemplate.mutate(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
              >
                Unpublish (Save to Draft)
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={isPublishing}>
                <Send className="w-4 h-4 mr-2" />
                {isPublishing ? "Publishing..." : "Publish to Users"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTemplates;
