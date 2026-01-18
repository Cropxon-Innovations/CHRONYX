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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Upload,
  Search,
  Filter,
  FolderOpen,
  FileText,
  CreditCard,
  Car,
  Home,
  Heart,
  Shield,
  GraduationCap,
  Briefcase,
  Receipt,
  Plane,
  Baby,
  Stethoscope,
  Landmark,
  Scale,
  Building2,
  Grid,
  List
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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    document_type: "",
    custom_type: "",
    title: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
    file: null as File | null
  });

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
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("documents")
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);
    
    return { url: publicUrl, size: file.size, type: file.type };
  };

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!data.file) throw new Error("No file selected");
      
      setUploading(true);
      const { url, size, type } = await uploadFile(data.file);
      
      const docType = data.document_type || data.custom_type || "Document";
      
      const { error } = await supabase.from("documents").insert({
        user_id: user?.id,
        category: data.category,
        document_type: docType,
        title: data.title || docType,
        file_url: url,
        file_size: size,
        file_type: type,
        issue_date: data.issue_date || null,
        expiry_date: data.expiry_date || null,
        notes: data.notes
      });
      
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Documents",
        action: `Uploaded ${data.title || docType}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-documents"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Document uploaded successfully" });
      setUploading(false);
    },
    onError: (error) => {
      setUploading(false);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  });

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
      category: "",
      document_type: "",
      custom_type: "",
      title: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
      file: null
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">All Documents</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} documents stored securely
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DocumentCategoryManager />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v, document_type: "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
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
                    />
                  </div>
                )}

                <div>
                  <Label>Title (optional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Front side, Updated copy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Upload File</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {formData.file ? (
                          <span className="text-primary font-medium">{formData.file.name}</span>
                        ) : (
                          "Click to upload PDF, images, or documents"
                        )}
                      </p>
                      {formData.file && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(formData.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Private notes..."
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={() => addMutation.mutate(formData)}
                  disabled={!formData.category || (!formData.document_type && !formData.custom_type) || !formData.file || uploading}
                  className="w-full"
                >
                  {uploading ? "Uploading securely..." : "Save Document"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
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
            className="flex-shrink-0"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            All
            <Badge variant="outline" className="ml-2">{documents.length}</Badge>
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
                className="flex-shrink-0"
              >
                <Icon className="h-4 w-4 mr-2" style={{ color: cat.color }} />
                {cat.name}
                {count > 0 && <Badge variant="outline" className="ml-2">{count}</Badge>}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="bg-muted/30 animate-pulse">
              <CardContent className="p-4 h-40" />
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground">
              {searchQuery ? "No documents match your search" : "No documents in this category"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!searchQuery && "Upload your first document to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
          : "space-y-3"
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
        <DialogContent className="max-w-4xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            previewType?.includes("image") ? (
              <div className="flex-1 flex items-center justify-center overflow-auto">
                <img src={previewUrl} alt="Document preview" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <iframe src={previewUrl} className="w-full h-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDocuments;
