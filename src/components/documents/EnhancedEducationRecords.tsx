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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  GraduationCap, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Edit2,
  FileText,
  Building,
  Award,
  BookOpen,
  School,
  University,
  FileImage,
  FileBadge,
  Printer
} from "lucide-react";

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  course: string | null;
  start_year: number | null;
  end_year: number | null;
  notes: string | null;
  created_at: string;
}

interface EducationDocument {
  id: string;
  education_id: string;
  document_type: string;
  title: string;
  file_url: string;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: "Certificate", icon: Award, color: "text-amber-500" },
  { value: "Marksheet", icon: FileText, color: "text-blue-500" },
  { value: "Degree", icon: GraduationCap, color: "text-purple-500" },
  { value: "Transcript", icon: BookOpen, color: "text-green-500" },
  { value: "ID Card", icon: FileBadge, color: "text-orange-500" },
  { value: "Other", icon: FileImage, color: "text-gray-500" }
];

const DEGREE_ICONS: Record<string, typeof GraduationCap> = {
  "PhD": University,
  "Master": University,
  "Bachelor": GraduationCap,
  "Diploma": Award,
  "High School": School,
  "default": GraduationCap
};

const EnhancedEducationRecords = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EducationRecord | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    course: "",
    start_year: "",
    end_year: "",
    notes: ""
  });
  const [docFormData, setDocFormData] = useState({
    document_type: "Certificate",
    title: "",
    file: null as File | null
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["education-records", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_records")
        .select("*")
        .eq("user_id", user?.id)
        .order("end_year", { ascending: false, nullsFirst: true });
      if (error) throw error;
      return data as EducationRecord[];
    },
    enabled: !!user?.id
  });

  const { data: allDocuments = [] } = useQuery({
    queryKey: ["education-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("education_documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EducationDocument[];
    },
    enabled: !!user?.id
  });

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/education/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("documents")
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const addRecordMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("education_records").insert({
        user_id: user?.id,
        institution: data.institution,
        degree: data.degree,
        course: data.course || null,
        start_year: data.start_year ? parseInt(data.start_year) : null,
        end_year: data.end_year ? parseInt(data.end_year) : null,
        notes: data.notes || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education-records"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Education record added" });
    }
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("education_records")
        .update({
          institution: data.institution,
          degree: data.degree,
          course: data.course || null,
          start_year: data.start_year ? parseInt(data.start_year) : null,
          end_year: data.end_year ? parseInt(data.end_year) : null,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education-records"] });
      setEditingRecord(null);
      resetForm();
      toast({ title: "Record updated" });
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education-records"] });
      toast({ title: "Record deleted" });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ educationId, data }: { educationId: string; data: typeof docFormData }) => {
      if (!data.file) throw new Error("No file selected");
      const fileUrl = await uploadFile(data.file);
      const { error } = await supabase.from("education_documents").insert({
        user_id: user?.id,
        education_id: educationId,
        document_type: data.document_type,
        title: data.title || data.document_type,
        file_url: fileUrl
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education-documents"] });
      setUploadingFor(null);
      setDocFormData({ document_type: "Certificate", title: "", file: null });
      toast({ title: "Document uploaded" });
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education-documents"] });
      toast({ title: "Document deleted" });
    }
  });

  const resetForm = () => {
    setFormData({ institution: "", degree: "", course: "", start_year: "", end_year: "", notes: "" });
  };

  const openEdit = (record: EducationRecord) => {
    setEditingRecord(record);
    setFormData({
      institution: record.institution,
      degree: record.degree,
      course: record.course || "",
      start_year: record.start_year?.toString() || "",
      end_year: record.end_year?.toString() || "",
      notes: record.notes || ""
    });
  };

  const getDocumentsForRecord = (recordId: string) => allDocuments.filter(d => d.education_id === recordId);
  
  const getDocTypeInfo = (type: string) => DOCUMENT_TYPES.find(d => d.value === type) || DOCUMENT_TYPES[5];

  const getDegreeIcon = (degree: string) => {
    for (const [key, Icon] of Object.entries(DEGREE_ICONS)) {
      if (degree.toLowerCase().includes(key.toLowerCase())) return Icon;
    }
    return DEGREE_ICONS.default;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Education Records</h2>
          <p className="text-sm text-muted-foreground">{records.length} qualifications</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Education Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Institution Name</Label>
                <Input value={formData.institution} onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))} placeholder="University / School name" className="rounded-xl" />
              </div>
              <div>
                <Label>Degree / Qualification</Label>
                <Input value={formData.degree} onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))} placeholder="e.g., B.Tech, MBA" className="rounded-xl" />
              </div>
              <div>
                <Label>Course / Specialization</Label>
                <Input value={formData.course} onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))} placeholder="e.g., Computer Science" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Year</Label>
                  <Input type="number" value={formData.start_year} onChange={(e) => setFormData(prev => ({ ...prev, start_year: e.target.value }))} placeholder="2018" className="rounded-xl" />
                </div>
                <div>
                  <Label>End Year</Label>
                  <Input type="number" value={formData.end_year} onChange={(e) => setFormData(prev => ({ ...prev, end_year: e.target.value }))} placeholder="2022" className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="rounded-xl" />
              </div>
              <Button onClick={() => addRecordMutation.mutate(formData)} disabled={!formData.institution || !formData.degree || addRecordMutation.isPending} className="w-full rounded-xl">
                {addRecordMutation.isPending ? "Saving..." : "Save Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Education Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((record) => {
          const docs = getDocumentsForRecord(record.id);
          const DegreeIcon = getDegreeIcon(record.degree);
          const isSelected = selectedRecord === record.id;
          
          return (
            <Card 
              key={record.id} 
              className={`group cursor-pointer transition-all duration-200 rounded-2xl border-2 hover:shadow-lg ${isSelected ? 'border-primary shadow-lg' : 'border-border/50 hover:border-primary/30'}`}
              onClick={() => setSelectedRecord(isSelected ? null : record.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <DegreeIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{record.degree}</h3>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {record.institution}
                    </p>
                    {record.course && <p className="text-xs text-muted-foreground/70 truncate">{record.course}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {record.start_year && record.end_year && (
                        <Badge variant="secondary" className="text-xs rounded-lg">{record.start_year} - {record.end_year}</Badge>
                      )}
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
                      <Button variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this record?")) deleteRecordMutation.mutate(record.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {docs.length > 0 && (
                      <div className="space-y-2">
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
          );
        })}
      </div>

      {records.length === 0 && !isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No education records</p>
          <p className="text-sm">Add your academic history to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Education Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Institution Name</Label>
              <Input value={formData.institution} onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))} className="rounded-xl" />
            </div>
            <div>
              <Label>Degree</Label>
              <Input value={formData.degree} onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))} className="rounded-xl" />
            </div>
            <div>
              <Label>Course</Label>
              <Input value={formData.course} onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Year</Label><Input type="number" value={formData.start_year} onChange={(e) => setFormData(prev => ({ ...prev, start_year: e.target.value }))} className="rounded-xl" /></div>
              <div><Label>End Year</Label><Input type="number" value={formData.end_year} onChange={(e) => setFormData(prev => ({ ...prev, end_year: e.target.value }))} className="rounded-xl" /></div>
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
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Document Type</Label>
              <Select value={docFormData.document_type} onValueChange={(v) => setDocFormData(prev => ({ ...prev, document_type: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
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
            <div>
              <Label>Title</Label>
              <Input value={docFormData.title} onChange={(e) => setDocFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Document title" className="rounded-xl" />
            </div>
            <div>
              <Label>File</Label>
              <Input type="file" ref={fileInputRef} onChange={(e) => setDocFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))} className="rounded-xl" />
            </div>
            <Button onClick={() => uploadingFor && uploadDocMutation.mutate({ educationId: uploadingFor, data: docFormData })} disabled={!docFormData.file || uploadDocMutation.isPending} className="w-full rounded-xl">
              {uploadDocMutation.isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedEducationRecords;
