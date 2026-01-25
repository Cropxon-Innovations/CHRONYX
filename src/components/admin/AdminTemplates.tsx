import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Layout, Plus, Star, Eye, Trash2 } from "lucide-react";
import { useAdminTemplates, useCreateTemplate } from "@/hooks/useAdmin";
import { format } from "date-fns";

const AdminTemplates = () => {
  const { data: templates, isLoading } = useAdminTemplates();
  const createTemplate = useCreateTemplate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "study",
    template_type: "syllabus",
    is_featured: false,
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    
    createTemplate.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      template_type: formData.template_type,
      template_data: {},
      is_featured: formData.is_featured,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "study",
          template_type: "syllabus",
          is_featured: false,
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

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Template Management
              </CardTitle>
              <CardDescription>
                Create and manage templates visible to all users ({templates?.length || 0} templates)
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Template title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Template description"
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
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-input"
                    />
                    <Label htmlFor="featured">Featured template</Label>
                  </div>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createTemplate.isPending || !formData.title.trim()}
                    className="w-full"
                  >
                    {createTemplate.isPending ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <Card key={template.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{template.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description || "No description"}
                        </p>
                      </div>
                      {template.is_featured && (
                        <Star className="w-4 h-4 text-primary fill-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{template.category}</Badge>
                      <Badge variant="secondary">{template.template_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {template.usage_count || 0} uses
                      </div>
                      <span>
                        {template.published_at ? format(new Date(template.published_at), "MMM d, yyyy") : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Layout className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No templates created yet</p>
                <p className="text-sm">Create your first template to share with all users</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTemplates;
