import { useState, useRef, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Upload,
  Search,
  FolderOpen,
  Grid,
  List,
  CloudUpload,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  HardDrive
} from "lucide-react";
import DocumentCard from "./DocumentCard";
import DocumentCategoryManager, { getIconComponent } from "./DocumentCategoryManager";

interface Document {
  id: string;
  document_type: string;
  category: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  is_locked: boolean | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

interface PendingFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

// Get file icon based on type
const getFileIconElement = (file: File) => {
  const type = file.type.toLowerCase();
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (type.includes('image')) return <FileImage className="h-4 w-4 text-green-500" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  return <File className="h-4 w-4 text-blue-500" />;
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

// Get file extension
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toUpperCase() || 'FILE';
};

// Default document types for each category
const DEFAULT_DOCUMENT_TYPES: Record<string, { id: string; name: string; icon: string }[]> = {
  identity: [
    { id: "aadhaar", name: "Aadhaar Card", icon: "CreditCard" },
    { id: "pan", name: "PAN Card", icon: "CreditCard" },
    { id: "passport", name: "Passport", icon: "Plane" },
    { id: "driving_license", name: "Driving License", icon: "Car" },
    { id: "voter_id", name: "Voter ID", icon: "Landmark" },
  ],
  vehicle: [
    { id: "rc", name: "Registration Certificate", icon: "Car" },
    { id: "insurance", name: "Vehicle Insurance", icon: "Shield" },
    { id: "puc", name: "PUC Certificate", icon: "FileText" },
    { id: "permit", name: "Permit", icon: "FileText" },
  ],
  property: [
    { id: "sale_deed", name: "Sale Deed", icon: "Home" },
    { id: "property_tax", name: "Property Tax Receipt", icon: "Receipt" },
    { id: "encumbrance", name: "Encumbrance Certificate", icon: "FileText" },
    { id: "khata", name: "Khata Certificate", icon: "FileText" },
  ],
  medical: [
    { id: "report", name: "Medical Report", icon: "Stethoscope" },
    { id: "prescription", name: "Prescription", icon: "FileText" },
    { id: "vaccination", name: "Vaccination Record", icon: "Heart" },
    { id: "insurance_claim", name: "Insurance Claim", icon: "Shield" },
  ],
  legal: [
    { id: "will", name: "Will", icon: "Scale" },
    { id: "agreement", name: "Agreement", icon: "FileText" },
    { id: "poa", name: "Power of Attorney", icon: "Scale" },
    { id: "affidavit", name: "Affidavit", icon: "FileText" },
  ],
  financial: [
    { id: "bank_statement", name: "Bank Statement", icon: "Landmark" },
    { id: "itr", name: "Income Tax Return", icon: "Receipt" },
    { id: "form16", name: "Form 16", icon: "FileText" },
    { id: "investment", name: "Investment Proof", icon: "Receipt" },
  ],
};

const DEFAULT_CATEGORIES = [
  { id: "identity", name: "Identity", icon: "CreditCard", color: "#6366f1" },
  { id: "vehicle", name: "Vehicle", icon: "Car", color: "#22c55e" },
  { id: "property", name: "Property", icon: "Home", color: "#f97316" },
  { id: "medical", name: "Medical", icon: "Stethoscope", color: "#ef4444" },
  { id: "legal", name: "Legal", icon: "Scale", color: "#8b5cf6" },
  { id: "financial", name: "Financial", icon: "Receipt", color: "#0ea5e9" },
];

const MAX_FILES = 10;

const EnhancedDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    category: "identity",
    document_type: "",
    custom_type: "",
    title: "",
    issue_date: "",
    expiry_date: "",
    notes: ""
  });

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).slice(0, MAX_FILES);
    if (files.length > 0) {
      const newPendingFiles: PendingFile[] = files.map(file => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: 'pending'
      }));
      setPendingFiles(prev => [...prev, ...newPendingFiles].slice(0, MAX_FILES));
      setIsAddOpen(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_FILES - pendingFiles.length);
    if (files.length > 0) {
      const newPendingFiles: PendingFile[] = files.map(file => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: 'pending'
      }));
      setPendingFiles(prev => [...prev, ...newPendingFiles].slice(0, MAX_FILES));
    }
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  // Fetch custom categories
  const { data: customCategories = [] } = useQuery({
    queryKey: ["document-categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .eq("user_id", user?.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as DocumentCategory[];
    },
    enabled: !!user?.id
  });

  // Combine default and custom categories
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color
    }))
  ];

  // Fetch all documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["all-documents", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user?.id
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = activeCategory === "all" || doc.category === activeCategory;
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get document types for selected category
  const getDocumentTypes = (categoryId: string) => {
    if (DEFAULT_DOCUMENT_TYPES[categoryId]) {
      return DEFAULT_DOCUMENT_TYPES[categoryId];
    }
    return [{ id: "custom", name: "Custom Document", icon: "FileText" }];
  };

  const uploadFile = async (file: File): Promise<{ url: string; size: number; type: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("documents")
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);
    
    return { url: publicUrl, size: file.size, type: file.type };
  };

  const uploadAllFiles = async () => {
    if (pendingFiles.length === 0) {
      toast({ title: "No files selected", variant: "destructive" });
      return;
    }

    setUploading(true);
    let completed = 0;

    try {
      for (const pending of pendingFiles) {
        setPendingFiles(prev => prev.map(f => 
          f.id === pending.id ? { ...f, status: 'uploading' } : f
        ));

        const { url, size, type } = await uploadFile(pending.file);
        const docType = formData.document_type || formData.custom_type || pending.file.name.split('.')[0];
        
        await supabase.from("documents").insert({
          user_id: user?.id,
          category: formData.category,
          document_type: docType,
          title: pendingFiles.length === 1 && formData.title ? formData.title : pending.file.name,
          file_url: url,
          file_size: size,
          file_type: type,
          issue_date: formData.issue_date || null,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null
        });

        setPendingFiles(prev => prev.map(f => 
          f.id === pending.id ? { ...f, status: 'done', progress: 100 } : f
        ));

        completed++;
        setUploadProgress((completed / pendingFiles.length) * 100);
      }

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Documents",
        action: `Uploaded ${pendingFiles.length} document(s)`
      });

      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      toast({ title: `${pendingFiles.length} document(s) uploaded successfully` });
      setIsAddOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const doc = documents.find(d => d.id === id);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Documents",
        action: `Deleted ${doc?.title}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      toast({ title: "Document deleted" });
    }
  });

  const resetForm = () => {
    setFormData({
      category: "identity",
      document_type: "",
      custom_type: "",
      title: "",
      issue_date: "",
      expiry_date: "",
      notes: ""
    });
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePreview = async (doc: Document) => {
    try {
      const filePath = doc.file_url.split("/documents/")[1];
      if (!filePath) {
        setPreviewUrl(doc.file_url);
        setPreviewType(doc.file_type || "");
        return;
      }
      
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 3600);
      
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setPreviewType(doc.file_type || "");
      }
    } catch (error) {
      toast({ title: "Preview failed", variant: "destructive" });
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return allCategories.find(c => c.id === categoryId) || { name: categoryId, icon: "FileText", color: "#6366f1" };
  };

  // Count documents per category
  const categoryCounts = allCategories.reduce((acc, cat) => {
    acc[cat.id] = documents.filter(d => d.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total size
  const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

  return (
    <div 
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-primary/10 border-2 border-dashed border-primary rounded-3xl p-16 text-center">
            <CloudUpload className="h-16 w-16 mx-auto mb-4 text-primary animate-bounce" />
            <p className="text-xl font-medium text-primary">Drop files here</p>
            <p className="text-sm text-muted-foreground mt-2">Up to {MAX_FILES} files at a time</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">All Documents</h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{documents.length} documents</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5" />
              {formatFileSize(totalSize)} used
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DocumentCategoryManager />
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddOpen(true)} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Drop Zone */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    pendingFiles.length > 0 ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.gif,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <CloudUpload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop files or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to {MAX_FILES} files • PDF, Images, Documents</p>
                </div>

                {/* Pending Files List */}
                {pendingFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingFiles.map((pf) => (
                      <div 
                        key={pf.id} 
                        className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-xl group"
                      >
                        {getFileIconElement(pf.file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pf.file.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 rounded">
                              {getFileExtension(pf.file.name)}
                            </Badge>
                            <span>{formatFileSize(pf.file.size)}</span>
                          </div>
                        </div>
                        {pf.status === 'uploading' ? (
                          <Progress value={pf.progress} className="w-16 h-1.5" />
                        ) : pf.status === 'done' ? (
                          <Badge variant="secondary" className="text-[10px] rounded-lg">Done</Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); removePendingFile(pf.id); }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v, document_type: "" }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {allCategories.map(cat => {
                        const Icon = getIconComponent(cat.icon);
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {formData.category && (
                  <div>
                    <Label>Document Type</Label>
                    <Select 
                      value={formData.document_type}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, document_type: v }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {getDocumentTypes(formData.category).map(type => (
                          <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                        ))}
                        <SelectItem value="other">Other (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.document_type === "other" && (
                  <div>
                    <Label>Custom Type Name</Label>
                    <Input
                      value={formData.custom_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_type: e.target.value }))}
                      placeholder="Enter document type"
                      className="rounded-xl"
                    />
                  </div>
                )}

                {pendingFiles.length === 1 && (
                  <div>
                    <Label>Title (optional)</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Custom title for this document"
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Private notes..."
                    rows={2}
                    className="rounded-xl"
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                <Button 
                  onClick={uploadAllFiles}
                  disabled={pendingFiles.length === 0 || !formData.category || uploading}
                  className="w-full rounded-xl"
                >
                  {uploading ? "Uploading..." : `Upload ${pendingFiles.length} Document${pendingFiles.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-lg"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-lg"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={activeCategory === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveCategory("all")}
            className="flex-shrink-0 rounded-xl"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            All
            <Badge variant="outline" className="ml-2 rounded-lg">{documents.length}</Badge>
          </Button>
          {allCategories.map(cat => {
            const Icon = getIconComponent(cat.icon);
            const count = categoryCounts[cat.id] || 0;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="flex-shrink-0 rounded-xl"
              >
                <Icon className="h-4 w-4 mr-2" style={{ color: cat.color }} />
                {cat.name}
                {count > 0 && <Badge variant="outline" className="ml-2 rounded-lg">{count}</Badge>}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i} className="bg-muted/30 animate-pulse rounded-2xl">
              <CardContent className="p-3 h-32" />
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="bg-muted/30 rounded-2xl">
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">
              {searchQuery ? "No documents match your search" : "No documents in this category"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!searchQuery && "Drag & drop files or click Add Document"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
          : "space-y-2"
        }>
          {filteredDocuments.map((doc) => {
            const catInfo = getCategoryInfo(doc.category);
            return (
              <DocumentCard
                key={doc.id}
                document={doc}
                categoryIcon={catInfo.icon}
                categoryColor={catInfo.color}
                onDelete={(id) => deleteMutation.mutate(id)}
                onPreview={handlePreview}
              />
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[85vh] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewType?.includes("image") ? (
              <div className="flex-1 flex items-center justify-center overflow-auto">
                <img src={previewUrl} alt="Document preview" className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
            ) : (
              <iframe src={previewUrl} className="w-full h-full rounded-xl" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDocuments;
