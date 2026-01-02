import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
import { 
  Upload, 
  FileText, 
  Trash2, 
  Edit2, 
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Download,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SyllabusDocument {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  progress_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const SimpleSyllabusUploader = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const queryClient = useQueryClient();

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SyllabusDocument | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch syllabus documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["syllabus-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("syllabus_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SyllabusDocument[];
    },
    enabled: !!user,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedFile) throw new Error("Missing data");
      
      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("syllabus")
        .upload(fileName, selectedFile);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from("syllabus")
        .getPublicUrl(fileName);
      
      // Save to database
      const { error: dbError } = await supabase
        .from("syllabus_documents")
        .insert({
          user_id: user.id,
          title: uploadTitle || selectedFile.name,
          description: uploadDescription || null,
          file_url: urlData.publicUrl,
          file_name: selectedFile.name,
          file_type: selectedFile.type || fileExt || "unknown",
          file_size: selectedFile.size,
          progress_percentage: 0,
        });
      
      if (dbError) throw dbError;
      
      return uploadTitle || selectedFile.name;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-documents"] });
      toast({ title: "Syllabus uploaded", description: `"${title}" has been saved` });
      logActivity(`Uploaded syllabus: ${title}`, "Study");
      setSelectedFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setIsUploading(false);
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: String(error), variant: "destructive" });
      setIsUploading(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDoc) throw new Error("No document selected");
      
      const { error } = await supabase
        .from("syllabus_documents")
        .update({
          title: editTitle,
          description: editDescription || null,
          progress_percentage: editProgress,
          notes: editNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingDoc.id);
      
      if (error) throw error;
      return editTitle;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-documents"] });
      toast({ title: "Syllabus updated" });
      logActivity(`Updated syllabus: ${title}`, "Study");
      setEditDialogOpen(false);
      setEditingDoc(null);
    },
    onError: (error) => {
      toast({ title: "Update failed", description: String(error), variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const doc = documents.find(d => d.id === id);
      
      // Delete from storage
      if (doc?.file_url) {
        const path = doc.file_url.split("/syllabus/")[1];
        if (path) {
          await supabase.storage.from("syllabus").remove([path]);
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from("syllabus_documents")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return doc?.title;
    },
    onSuccess: (title) => {
      queryClient.invalidateQueries({ queryKey: ["syllabus-documents"] });
      toast({ title: "Syllabus deleted" });
      logActivity(`Deleted syllabus: ${title}`, "Study");
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const openEdit = (doc: SyllabusDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description || "");
    setEditProgress(doc.progress_percentage);
    setEditNotes(doc.notes || "");
    setEditDialogOpen(true);
  };

  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-muted";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6 pb-6">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center cursor-pointer py-6">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Drop your syllabus here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, or TXT files
              </p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title</label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Enter syllabus title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                  <Textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadTitle("");
                    setUploadDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => uploadMutation.mutate()}
                  disabled={isUploading || !uploadTitle.trim()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Syllabus
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No syllabus documents yet</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Icon and Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                        {doc.progress_percentage >= 100 && (
                          <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(doc.updated_at), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress and Actions */}
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{doc.progress_percentage}%</span>
                      </div>
                      <Progress 
                        value={doc.progress_percentage} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openPreview(doc.file_url)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(doc)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a href={doc.file_url} download={doc.file_name}>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirmId(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Notes preview */}
                {doc.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Syllabus</DialogTitle>
            <DialogDescription>Update details and track your progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Progress: {editProgress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editProgress}
                onChange={(e) => setEditProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add study notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={!editTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[60vh] rounded-lg border"
              title="Document Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this syllabus?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimpleSyllabusUploader;
