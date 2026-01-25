import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, BookOpen, Target, Sparkles } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface UserTemplate {
  id: string;
  template_id: string;
  template_name: string;
  template_category: string;
  template_icon: string;
  total_subjects: number;
  total_topics: number;
}

interface TemplateData {
  id: string;
  template_data: Json;
  custom_subjects: Json;
  custom_outcomes: Json;
  is_customized: boolean | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: UserTemplate;
  templateData: TemplateData | null;
}

export const TemplateSettingsModal = ({ open, onOpenChange, template, templateData }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper to safely convert Json to string array
  const toStringArray = (json: Json | null | undefined): string[] => {
    if (!json) return [];
    if (Array.isArray(json)) return json.filter((item): item is string => typeof item === "string");
    return [];
  };

  const [formData, setFormData] = useState({
    name: template.template_name,
    icon: template.template_icon,
    subjects: toStringArray(templateData?.custom_subjects),
    outcomes: toStringArray(templateData?.custom_outcomes),
    newSubject: "",
    newOutcome: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: template.template_name,
        icon: template.template_icon,
        subjects: toStringArray(templateData?.custom_subjects),
        outcomes: toStringArray(templateData?.custom_outcomes),
        newSubject: "",
        newOutcome: "",
      });
    }
  }, [open, template, templateData]);

  // Save template settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Update template name and icon
      const { error: templateError } = await supabase
        .from("user_study_templates")
        .update({
          template_name: formData.name,
          template_icon: formData.icon,
          total_subjects: formData.subjects.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);

      if (templateError) throw templateError;

      // Upsert template data
      const { error: dataError } = await supabase
        .from("user_template_data")
        .upsert({
          user_id: user!.id,
          user_template_id: template.id,
          custom_subjects: formData.subjects,
          custom_outcomes: formData.outcomes,
          is_customized: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_template_id",
        });

      if (dataError) throw dataError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
      queryClient.invalidateQueries({ queryKey: ["template-data", template.id] });
      toast.success("Template settings saved");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving template:", error);
      toast.error("Failed to save settings");
    },
  });

  const handleAddSubject = () => {
    if (!formData.newSubject.trim()) return;
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, prev.newSubject.trim()],
      newSubject: "",
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleAddOutcome = () => {
    if (!formData.newOutcome.trim()) return;
    setFormData(prev => ({
      ...prev,
      outcomes: [...prev.outcomes, prev.newOutcome.trim()],
      newOutcome: "",
    }));
  };

  const handleRemoveOutcome = (index: number) => {
    setFormData(prev => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index),
    }));
  };

  const iconOptions = ["📚", "🎯", "💼", "🌍", "💻", "🔬", "📊", "🎓", "📝", "⚡", "🚀", "🧠"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Template
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              <div>
                <Label className="mb-2 block">Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name..."
                />
              </div>

              <div>
                <Label className="mb-2 block">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        formData.icon === icon 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{template.template_category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="font-medium">{formData.subjects.length || template.total_subjects}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Topics</span>
                  <span className="font-medium">{template.total_topics}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-4 mt-0">
              <div className="flex items-center gap-2">
                <Input
                  value={formData.newSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSubject: e.target.value }))}
                  placeholder="Add new subject..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                />
                <Button onClick={handleAddSubject} disabled={!formData.newSubject.trim()}>
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {formData.subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No custom subjects</p>
                    <p className="text-xs">Add subjects to customize your template</p>
                  </div>
                ) : (
                  formData.subjects.map((subject, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="font-medium text-sm">{subject}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveSubject(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="outcomes" className="space-y-4 mt-0">
              <div className="flex items-center gap-2">
                <Input
                  value={formData.newOutcome}
                  onChange={(e) => setFormData(prev => ({ ...prev, newOutcome: e.target.value }))}
                  placeholder="Add learning outcome..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddOutcome()}
                />
                <Button onClick={handleAddOutcome} disabled={!formData.newOutcome.trim()}>
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {formData.outcomes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No outcomes defined</p>
                    <p className="text-xs">Add what you'll learn from this template</p>
                  </div>
                ) : (
                  formData.outcomes.map((outcome, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveOutcome(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
