import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  ArrowLeft, BookOpen, Calendar, FileText, Settings, 
  Clock, Target, CheckCircle2, Edit2, Save, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyllabusChecklist } from "./SyllabusChecklist";
import { StudyScheduleView } from "./StudyScheduleView";
import { StudyNotesPanel } from "./StudyNotesPanel";
import { TemplateSettingsModal } from "./TemplateSettingsModal";

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
  template: UserTemplate;
  onBack: () => void;
}

export const StudyWorkspace = ({ template, onBack }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("syllabus");
  const [showSettings, setShowSettings] = useState(false);

  // Fetch template sections with progress
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["template-sections", template.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_template_sections")
        .select("*")
        .eq("user_template_id", template.id)
        .order("order_index");
      
      if (error) throw error;
      return data;
    },
    enabled: !!template.id,
  });

  // Fetch template data (editable content)
  const { data: templateData } = useQuery({
    queryKey: ["template-data", template.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_template_data")
        .select("*")
        .eq("user_template_id", template.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!template.id,
  });

  // Fetch linked notes
  const { data: notes = [] } = useQuery({
    queryKey: ["template-notes", template.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_section_notes")
        .select("*")
        .eq("user_template_id", template.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!template.id,
  });

  // Calculate progress
  const completedSections = sections.filter(s => s.is_completed).length;
  const progressPercent = sections.length > 0 
    ? Math.round((completedSections / sections.length) * 100) 
    : template.progress_percent;

  // Update progress in template
  const updateProgressMutation = useMutation({
    mutationFn: async (newProgress: number) => {
      const { error } = await supabase
        .from("user_study_templates")
        .update({ progress_percent: newProgress, updated_at: new Date().toISOString() })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-study-templates"] });
    },
  });

  // Update progress when sections change
  const handleSectionUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["template-sections", template.id] });
    // Recalculate and update progress
    const newProgress = sections.length > 0 
      ? Math.round((sections.filter(s => s.is_completed).length / sections.length) * 100)
      : 0;
    updateProgressMutation.mutate(newProgress);
  }, [sections, template.id, queryClient, updateProgressMutation]);

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              {template.template_icon}
            </div>
            <div>
              <h1 className="text-xl font-bold">{template.template_name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {template.template_category}
                </Badge>
                {template.template_year && (
                  <span>• {template.template_year}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-32">
              <Progress value={progressPercent} className="h-2" />
            </div>
            <span className="font-medium">{progressPercent}%</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{template.total_subjects}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{template.total_topics}</p>
                <p className="text-xs text-muted-foreground">Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSections}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notes.length}</p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="syllabus" className="gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Syllabus</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Timetable</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="mt-6">
          <SyllabusChecklist 
            templateId={template.id}
            sections={sections}
            isLoading={sectionsLoading}
            onUpdate={handleSectionUpdate}
          />
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <StudyScheduleView 
            templateId={template.id}
            sections={sections}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <StudyNotesPanel 
            templateId={template.id}
            sections={sections}
            notes={notes}
          />
        </TabsContent>
      </Tabs>

      {/* Settings Modal */}
      <TemplateSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        template={template}
        templateData={templateData}
      />
    </div>
  );
};
