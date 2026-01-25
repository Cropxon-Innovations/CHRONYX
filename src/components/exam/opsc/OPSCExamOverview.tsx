import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, Calendar, ExternalLink, Edit2, Save, X,
  FileText, Users, Award, Clock, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { OPSC_EXAM_INFO, MAINS_TOTAL } from "./OPSCExamData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ExamDates {
  notification_date?: string;
  application_start?: string;
  application_end?: string;
  prelims_date?: string;
  mains_date?: string;
  interview_start?: string;
  interview_end?: string;
}

export const OPSCExamOverview: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editDates, setEditDates] = useState<ExamDates>({});

  // Fetch or create exam master record
  const { data: examMaster, isLoading } = useQuery({
    queryKey: ["opsc-exam-master", user?.id],
    queryFn: async () => {
      // First try to find existing
      let { data, error } = await supabase
        .from("exam_master")
        .select("*")
        .eq("user_id", user?.id)
        .eq("exam_type", "opsc")
        .eq("exam_year", "2026-2027")
        .maybeSingle();

      if (!data) {
        // Create new record
        const { data: newData, error: insertError } = await supabase
          .from("exam_master")
          .insert({
            user_id: user?.id,
            exam_type: "opsc",
            exam_name: OPSC_EXAM_INFO.name,
            exam_year: "2026-2027",
            conducting_body: OPSC_EXAM_INFO.conductingBody,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const updateDatesMutation = useMutation({
    mutationFn: async (dates: ExamDates) => {
      const { error } = await supabase
        .from("exam_master")
        .update(dates)
        .eq("id", examMaster?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opsc-exam-master"] });
      toast.success("Exam dates updated");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Failed to update dates");
    },
  });

  const handleEditStart = () => {
    setEditDates({
      notification_date: examMaster?.notification_date || "",
      application_start: examMaster?.application_start || "",
      application_end: examMaster?.application_end || "",
      prelims_date: examMaster?.prelims_date || "",
      mains_date: examMaster?.mains_date || "",
      interview_start: examMaster?.interview_start || "",
      interview_end: examMaster?.interview_end || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateDatesMutation.mutate(editDates);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "TBA";
    try {
      return format(new Date(dateStr), "PPP");
    } catch {
      return "TBA";
    }
  };

  return (
    <div className="space-y-6">
      {/* Exam Information Card */}
      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{OPSC_EXAM_INFO.name}</h2>
                <p className="text-muted-foreground">{OPSC_EXAM_INFO.conductingBody}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={OPSC_EXAM_INFO.officialWebsite} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Official Website
              </a>
            </Button>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Exam Cycles Covered</Label>
                <div className="flex gap-2 mt-1">
                  {OPSC_EXAM_INFO.examCycles.map((year) => (
                    <Badge key={year} variant="secondary">{year}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Examination Stages</Label>
                <div className="space-y-2 mt-2">
                  {OPSC_EXAM_INFO.stages.map((stage, idx) => (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {idx + 1}
                      </div>
                      <span className="text-sm">{stage.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Marks Breakup</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-bold text-primary">{MAINS_TOTAL.meritTotal}</p>
                    <p className="text-xs text-muted-foreground">Mains Merit</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-bold text-primary">{MAINS_TOTAL.interviewMarks}</p>
                    <p className="text-xs text-muted-foreground">Interview</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-lg font-bold text-primary">{MAINS_TOTAL.finalTotal}</p>
                    <p className="text-xs text-muted-foreground">Final Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Important Dates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Important Dates</Label>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" onClick={handleEditStart}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateDatesMutation.isPending}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Notification Date</Label>
                        <Input
                          type="date"
                          value={editDates.notification_date || ""}
                          onChange={(e) => setEditDates({ ...editDates, notification_date: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Application Start</Label>
                        <Input
                          type="date"
                          value={editDates.application_start || ""}
                          onChange={(e) => setEditDates({ ...editDates, application_start: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Application End</Label>
                        <Input
                          type="date"
                          value={editDates.application_end || ""}
                          onChange={(e) => setEditDates({ ...editDates, application_end: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Prelims Date</Label>
                        <Input
                          type="date"
                          value={editDates.prelims_date || ""}
                          onChange={(e) => setEditDates({ ...editDates, prelims_date: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Mains Date</Label>
                        <Input
                          type="date"
                          value={editDates.mains_date || ""}
                          onChange={(e) => setEditDates({ ...editDates, mains_date: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Interview Start</Label>
                        <Input
                          type="date"
                          value={editDates.interview_start || ""}
                          onChange={(e) => setEditDates({ ...editDates, interview_start: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <DateRow icon={FileText} label="Notification" value={formatDate(examMaster?.notification_date)} />
                    <DateRow icon={Calendar} label="Application Window" value={`${formatDate(examMaster?.application_start)} - ${formatDate(examMaster?.application_end)}`} />
                    <DateRow icon={Clock} label="Prelims" value={formatDate(examMaster?.prelims_date)} highlight />
                    <DateRow icon={FileText} label="Mains" value={formatDate(examMaster?.mains_date)} />
                    <DateRow icon={Users} label="Interview" value={`${formatDate(examMaster?.interview_start)} - ${formatDate(examMaster?.interview_end)}`} />
                  </>
                )}
              </div>

              {examMaster?.updated_at && (
                <p className="text-xs text-muted-foreground mt-4">
                  Last updated: {format(new Date(examMaster.updated_at), "PPp")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Award className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Posts Offered</p>
                <p className="text-sm text-muted-foreground">OAS, OFS, OPS & Allied Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Age Limit</p>
                <p className="text-sm text-muted-foreground">21-32 years (relaxation applicable)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CheckCircle2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Qualification</p>
                <p className="text-sm text-muted-foreground">Bachelor's Degree from recognized university</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DateRow: React.FC<{ icon: any; label: string; value: string; highlight?: boolean }> = ({ 
  icon: Icon, label, value, highlight 
}) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className={`text-sm ${highlight ? "text-primary font-semibold" : "text-muted-foreground"}`}>{value}</span>
  </div>
);
