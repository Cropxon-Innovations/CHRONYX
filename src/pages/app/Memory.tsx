import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  Image, 
  Video, 
  Upload, 
  FolderPlus, 
  Grid3X3, 
  List, 
  Calendar,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Download,
  Plus,
  Filter,
  SortAsc,
  FolderOpen,
  Layers
} from "lucide-react";
import { format } from "date-fns";

type Memory = {
  id: string;
  title: string | null;
  description: string | null;
  media_type: "photo" | "video";
  file_url: string;
  thumbnail_url: string | null;
  file_name: string;
  created_date: string;
  collection_id: string | null;
  folder_id: string | null;
  is_locked: boolean;
};

type Collection = {
  id: string;
  name: string;
  folder_id: string | null;
};

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  is_locked: boolean;
};

const Memory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "photo" | "video">("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newCollectionDialogOpen, setNewCollectionDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch memories
  const { data: memories = [], isLoading: memoriesLoading } = useQuery({
    queryKey: ["memories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_date", { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
    enabled: !!user,
  });

  // Fetch collections
  const { data: collections = [] } = useQuery({
    queryKey: ["memory_collections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memory_collections")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Collection[];
    },
    enabled: !!user,
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["memory_folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memory_folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });

  // Upload memory mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files, title }: { files: File[]; title: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      const uploadedMemories = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Saving memory ${i + 1} of ${files.length}...`);
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const memoryId = crypto.randomUUID();
        const ext = file.name.split(".").pop();
        const datePart = format(now, "yyyy-MM-dd");
        const titlePart = title || "memory";
        const fileName = `${datePart}_${titlePart.replace(/\s+/g, "_")}_${memoryId.slice(0, 8)}.${ext}`;
        
        const storagePath = `${user.id}/${year}/${month}/${memoryId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("memories")
          .upload(storagePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from("memories")
          .getPublicUrl(storagePath);
        
        const mediaType = file.type.startsWith("video") ? "video" : "photo";
        
        const { error: dbError } = await supabase.from("memories").insert({
          user_id: user.id,
          title: title || null,
          media_type: mediaType,
          file_url: urlData.publicUrl,
          file_name: fileName,
          file_size: file.size,
          created_date: datePart,
        });
        
        if (dbError) throw dbError;
        
        uploadedMemories.push(memoryId);
      }
      
      return uploadedMemories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadTitle("");
      setUploadProgress(null);
      toast({ title: "Memories saved" });
    },
    onError: (error) => {
      setUploadProgress(null);
      toast({ title: "Upload failed", description: String(error), variant: "destructive" });
    },
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("memory_collections").insert({
        user_id: user.id,
        name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory_collections"] });
      setNewCollectionDialogOpen(false);
      setNewCollectionName("");
      toast({ title: "Collection created" });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("memory_folders").insert({
        user_id: user.id,
        name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory_folders"] });
      setNewFolderDialogOpen(false);
      setNewFolderName("");
      toast({ title: "Folder created" });
    },
  });

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("memories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      setSelectedMemory(null);
      toast({ title: "Memory deleted" });
    },
  });

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadDialogOpen(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Filter and sort memories
  const filteredMemories = memories
    .filter((m) => {
      if (filterType !== "all" && m.media_type !== filterType) return false;
      if (filterCollection !== "all" && m.collection_id !== filterCollection) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      }
      return (a.title || a.file_name).localeCompare(b.title || b.file_name);
    });

  const stats = {
    total: memories.length,
    photos: memories.filter((m) => m.media_type === "photo").length,
    videos: memories.filter((m) => m.media_type === "video").length,
    collections: collections.length,
  };

  return (
    <div 
      className="space-y-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-foreground">Memory</h1>
          <p className="text-sm text-muted-foreground mt-1">Your private archive</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Memory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {uploadFiles.length === 0 ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Choose files or drag here</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                    />
                  </label>
                ) : (
                  <div className="p-4 bg-accent/30 rounded-lg">
                    <p className="text-sm font-medium">{uploadFiles.length} file(s) selected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadFiles.map((f) => f.name).join(", ")}
                    </p>
                  </div>
                )}
                <Input
                  placeholder="Title (optional)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                />
                {uploadProgress && (
                  <p className="text-sm text-muted-foreground text-center">{uploadProgress}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => uploadMutation.mutate({ files: uploadFiles, title: uploadTitle })}
                  disabled={uploadFiles.length === 0 || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Saving..." : "Save Memory"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={newCollectionDialogOpen} onOpenChange={setNewCollectionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Layers className="w-4 h-4 mr-2" />
                Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => createCollectionMutation.mutate(newCollectionName)}
                  disabled={!newCollectionName.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <DialogFooter>
                <Button
                  onClick={() => createFolderMutation.mutate(newFolderName)}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-light">{stats.photos}</p>
                <p className="text-xs text-muted-foreground">Photos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-light">{stats.videos}</p>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-light">{stats.collections}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-light">{folders.length}</p>
                <p className="text-xs text-muted-foreground">Folders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterType} onValueChange={(v: "all" | "photo" | "video") => setFilterType(v)}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCollection} onValueChange={setFilterCollection}>
          <SelectTrigger className="w-40">
            <Layers className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: "date" | "name") => setSortBy(v)}>
          <SelectTrigger className="w-32">
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <div className="flex items-center gap-1 border border-border rounded-md p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Memory Grid/List */}
      {memoriesLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading memories...</div>
      ) : filteredMemories.length === 0 ? (
        <Card className="bg-card/30 border-dashed">
          <CardContent className="py-12 text-center">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No memories yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Drag and drop photos or videos here
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="group relative aspect-square bg-accent/20 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary/20 transition-all"
              onClick={() => setSelectedMemory(memory)}
            >
              {memory.media_type === "photo" ? (
                <img
                  src={memory.file_url}
                  alt={memory.title || memory.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-accent/40">
                  <Video className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{memory.title || format(new Date(memory.created_date), "MMM d, yyyy")}</p>
              </div>
              {memory.is_locked && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-white drop-shadow" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMemories.map((memory) => (
            <Card
              key={memory.id}
              className="cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => setSelectedMemory(memory)}
            >
              <CardContent className="p-3 flex items-center gap-4">
                <div className="w-16 h-16 bg-accent/30 rounded-md overflow-hidden flex-shrink-0">
                  {memory.media_type === "photo" ? (
                    <img src={memory.file_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{memory.title || memory.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(memory.created_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {memory.media_type}
                </Badge>
                {memory.is_locked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Memory Detail Dialog */}
      <Dialog open={!!selectedMemory} onOpenChange={() => setSelectedMemory(null)}>
        <DialogContent className="max-w-3xl">
          {selectedMemory && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMemory.title || selectedMemory.file_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedMemory.media_type === "photo" ? (
                  <img
                    src={selectedMemory.file_url}
                    alt=""
                    className="w-full max-h-[60vh] object-contain rounded-lg bg-accent/10"
                  />
                ) : (
                  <video
                    src={selectedMemory.file_url}
                    controls
                    className="w-full max-h-[60vh] rounded-lg bg-accent/10"
                  />
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedMemory.created_date), "MMMM d, yyyy")}
                </div>
                {selectedMemory.description && (
                  <p className="text-sm">{selectedMemory.description}</p>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedMemory.file_url} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(selectedMemory.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Memory;
