import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Briefcase, 
  Upload, 
  Eye, 
  Download,
  Trash2, 
  Edit2,
  FileText,
  Building2,
  Calendar,
  Clock,
  LayoutGrid,
  GitBranch,
  FileCheck,
  FileSignature,
  Receipt,
  File,
  MapPin
} from "lucide-react";
import { format, differenceInMonths, differenceInYears } from "date-fns";

interface WorkRecord {
  id: string;
  company_name: string;
  role: string;
  employment_type: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  notes: string | null;
  created_at: string;
}

interface WorkDocument {
  id: string;
  work_history_id: string;
  document_type: string;
  title: string;
  file_url: string;
  created_at: string;
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const DOCUMENT_TYPES = [
  { value: "Offer Letter", icon: FileSignature, color: "text-green-500" },
  { value: "Experience Letter", icon: FileCheck, color: "text-blue-500" },
  { value: "Relieving Letter", icon: FileText, color: "text-purple-500" },
  { value: "Payslip", icon: Receipt, color: "text-amber-500" },
  { value: "Appointment Letter", icon: FileSignature, color: "text-teal-500" },
  { value: "Other", icon: File, color: "text-gray-500" }
];

const COMPANY_COLORS = [
  "from-blue-500/20 to-blue-600/10",
  "from-purple-500/20 to-purple-600/10",
  "from-green-500/20 to-green-600/10",
  "from-amber-500/20 to-amber-600/10",
  "from-rose-500/20 to-rose-600/10",
  "from-cyan-500/20 to-cyan-600/10"
];

const EnhancedWorkHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("timeline");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    role: "",
    employment_type: "Full-time",
    start_date: "",
    end_date: "",
    is_current: false,
    notes: ""
  });
  const [docFormData, setDocFormData] = useState({
    document_type: "Offer Letter",
    title: "",
    file: null as File | null
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["work-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as WorkRecord[];
    },
    enabled: !!user?.id
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ["work-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WorkDocument[];
    },
    enabled: !!user?.id
  });

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/work/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("documents").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
    return publicUrl;
  };

  const addRecordMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("work_history").insert({
        user_id: user?.id,
        company_name: data.company_name,
        role: data.role,
        employment_type: data.employment_type,
        start_date: data.start_date,
        end_date: data.is_current ? null : data.end_date || null,
        is_current: data.is_current,
        notes: data.notes || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-history"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Work history added" });
    }
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("work_history")
        .update({
          company_name: data.company_name,
          role: data.role,
          employment_type: data.employment_type,
          start_date: data.start_date,
          end_date: data.is_current ? null : data.end_date || null,
          is_current: data.is_current,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-history"] });
      setEditingRecord(null);
      resetForm();
      toast({ title: "Record updated" });
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-history"] });
      toast({ title: "Record deleted" });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ workId, data }: { workId: string; data: typeof docFormData }) => {
      if (!data.file) throw new Error("No file selected");
      const fileUrl = await uploadFile(data.file);
      const { error } = await supabase.from("work_documents").insert({
        user_id: user?.id,
        work_history_id: workId,
        document_type: data.document_type,
        title: data.title || data.document_type,
        file_url: fileUrl
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-documents"] });
      setUploadingFor(null);
      setDocFormData({ document_type: "Offer Letter", title: "", file: null });
      toast({ title: "Document uploaded" });
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-documents"] });
      toast({ title: "Document deleted" });
    }
  });

  const resetForm = () => {
    setFormData({ company_name: "", role: "", employment_type: "Full-time", start_date: "", end_date: "", is_current: false, notes: "" });
  };

  const openEdit = (record: WorkRecord) => {
    setEditingRecord(record);
    setFormData({
      company_name: record.company_name,
      role: record.role,
      employment_type: record.employment_type,
      start_date: record.start_date,
      end_date: record.end_date || "",
      is_current: record.is_current || false,
      notes: record.notes || ""
    });
  };

  const getDocumentsForRecord = (recordId: string) => allDocuments.filter(d => d.work_history_id === recordId);
  const getDocTypeInfo = (type: string) => DOCUMENT_TYPES.find(d => d.value === type) || DOCUMENT_TYPES[5];

  const getDuration = (startDate: string, endDate: string | null, isCurrent: boolean | null) => {
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : endDate ? new Date(endDate) : new Date();
    const years = differenceInYears(end, start);
    const months = differenceInMonths(end, start) % 12;
    if (years > 0) return `${years}y ${months}m`;
    return `${months}m`;
  };

  const totalExperience = records.reduce((total, record) => {
    const start = new Date(record.start_date);
    const end = record.is_current ? new Date() : record.end_date ? new Date(record.end_date) : new Date();
    return total + differenceInMonths(end, start);
  }, 0);

  const totalYears = Math.floor(totalExperience / 12);
  const remainingMonths = totalExperience % 12;

  const getCompanyColor = (index: number) => COMPANY_COLORS[index % COMPANY_COLORS.length];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Work & Career Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Total Experience: <span className="font-medium text-foreground">{totalYears > 0 ? `${totalYears} years ` : ""}{remainingMonths} months</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-xl p-1">
            <Button variant={viewMode === "timeline" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("timeline")} className="rounded-lg">
              <GitBranch className="h-4 w-4 mr-1" /> Timeline
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-lg">
              <LayoutGrid className="h-4 w-4 mr-1" /> Grid
            </Button>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Employment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Company Name</Label><Input value={formData.company_name} onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))} placeholder="Company name" className="rounded-xl" /></div>
                <div><Label>Role / Designation</Label><Input value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} placeholder="e.g., Software Engineer" className="rounded-xl" /></div>
                <div>
                  <Label>Employment Type</Label>
                  <Select value={formData.employment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, employment_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="rounded-xl" /></div>
                  <div><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} disabled={formData.is_current} className="rounded-xl" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="is_current" checked={formData.is_current} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_current: !!checked }))} />
                  <Label htmlFor="is_current" className="text-sm">Currently working here</Label>
                </div>
                <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="rounded-xl" /></div>
                <Button onClick={() => addRecordMutation.mutate(formData)} disabled={!formData.company_name || !formData.role || !formData.start_date || addRecordMutation.isPending} className="w-full rounded-xl">
                  {addRecordMutation.isPending ? "Saving..." : "Save Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          
          <div className="space-y-6">
            {records.map((record, index) => {
              const docs = getDocumentsForRecord(record.id);
              const isSelected = selectedRecord === record.id;
              
              return (
                <div key={record.id} className="relative pl-16">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-4 border-background ${record.is_current ? 'bg-green-500' : 'bg-primary'} shadow-lg`} />
                  
                  {/* Date badge */}
                  <div className="absolute left-0 top-12 text-xs text-muted-foreground font-medium writing-mode-vertical hidden sm:block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    {format(new Date(record.start_date), "MMM yyyy")}
                  </div>
                  
                  <Card 
                    className={`transition-all duration-200 rounded-2xl border-2 cursor-pointer hover:shadow-lg ${isSelected ? 'border-primary shadow-lg' : 'border-border/50 hover:border-primary/30'}`}
                    onClick={() => setSelectedRecord(isSelected ? null : record.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCompanyColor(index)} flex items-center justify-center shrink-0`}>
                          <Building2 className="h-7 w-7 text-foreground/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{record.role}</h3>
                            {record.is_current && <Badge className="bg-green-500/20 text-green-600 border-green-500/30 rounded-lg">Current</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {record.company_name}
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs rounded-lg flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(record.start_date), "MMM yyyy")} - {record.is_current ? "Present" : record.end_date ? format(new Date(record.end_date), "MMM yyyy") : "N/A"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs rounded-lg flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {getDuration(record.start_date, record.end_date, record.is_current)}
                            </Badge>
                            <Badge variant="outline" className="text-xs rounded-lg">{record.employment_type}</Badge>
                            <Badge variant="outline" className="text-xs rounded-lg">{docs.length} docs</Badge>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                          {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); openEdit(record); }}>
                              <Edit2 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); setUploadingFor(record.id); }}>
                              <Upload className="h-3 w-3 mr-1" /> Upload Doc
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this record?")) deleteRecordMutation.mutate(record.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {docs.length > 0 && (
                            <div className="grid gap-2">
                              {docs.map(doc => {
                                const docInfo = getDocTypeInfo(doc.document_type);
                                const DocIcon = docInfo.icon;
                                return (
                                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <DocIcon className={`h-4 w-4 shrink-0 ${docInfo.color}`} />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{doc.title}</p>
                                        <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, "_blank"); }}>
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); const a = document.createElement('a'); a.href = doc.file_url; a.download = doc.title; a.click(); }}>
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteDocMutation.mutate(doc.id); }}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record, index) => {
            const docs = getDocumentsForRecord(record.id);
            const isSelected = selectedRecord === record.id;
            
            return (
              <Card 
                key={record.id} 
                className={`transition-all duration-200 rounded-2xl border-2 cursor-pointer hover:shadow-lg ${isSelected ? 'border-primary shadow-lg' : 'border-border/50 hover:border-primary/30'}`}
                onClick={() => setSelectedRecord(isSelected ? null : record.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCompanyColor(index)} flex items-center justify-center shrink-0`}>
                      <Briefcase className="h-6 w-6 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{record.role}</h3>
                        {record.is_current && <div className="w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{record.company_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs rounded-lg">{getDuration(record.start_date, record.end_date, record.is_current)}</Badge>
                        <Badge variant="outline" className="text-xs rounded-lg">{docs.length} docs</Badge>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); openEdit(record); }}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); setUploadingFor(record.id); }}>
                          <Upload className="h-3 w-3 mr-1" /> Upload
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteRecordMutation.mutate(record.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {docs.length > 0 && docs.slice(0, 3).map(doc => {
                        const docInfo = getDocTypeInfo(doc.document_type);
                        const DocIcon = docInfo.icon;
                        return (
                          <div key={doc.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl">
                            <DocIcon className={`h-4 w-4 ${docInfo.color}`} />
                            <span className="text-xs truncate flex-1">{doc.title}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); window.open(doc.file_url, "_blank"); }}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {records.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No work history</p>
          <p className="text-sm">Add your career timeline to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Employment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Company Name</Label><Input value={formData.company_name} onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))} className="rounded-xl" /></div>
            <div><Label>Role</Label><Input value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} className="rounded-xl" /></div>
            <div>
              <Label>Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, employment_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} disabled={formData.is_current} className="rounded-xl" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="edit_is_current" checked={formData.is_current} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_current: !!checked }))} />
              <Label htmlFor="edit_is_current" className="text-sm">Currently working here</Label>
            </div>
            <Button onClick={() => editingRecord && updateRecordMutation.mutate({ ...formData, id: editingRecord.id })} disabled={updateRecordMutation.isPending} className="w-full rounded-xl">
              {updateRecordMutation.isPending ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={!!uploadingFor} onOpenChange={() => setUploadingFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Document Type</Label>
              <Select value={docFormData.document_type} onValueChange={(v) => setDocFormData(prev => ({ ...prev, document_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                        {type.value}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={docFormData.title} onChange={(e) => setDocFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Document title" className="rounded-xl" /></div>
            <div><Label>File</Label><Input type="file" onChange={(e) => setDocFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))} className="rounded-xl" /></div>
            <Button onClick={() => uploadingFor && uploadDocMutation.mutate({ workId: uploadingFor, data: docFormData })} disabled={!docFormData.file || uploadDocMutation.isPending} className="w-full rounded-xl">
              {uploadDocMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedWorkHistory;
