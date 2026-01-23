import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryGrid, LibraryItem, LibraryFormat } from "@/components/study/LibraryGrid";
import { AddBookDialog } from "@/components/study/AddBookDialog";
import { Button } from "@/components/ui/button";
import { 
  Library as LibraryIcon, 
  Share2, 
  Upload, 
  Globe, 
  DollarSign,
  BarChart3,
  BookOpen
} from "lucide-react";

const Library = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-library");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchLibraryItems();
  }, [user, activeTab]);

  const fetchLibraryItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      setItems((data || []).map(item => ({
        id: item.id,
        title: item.title,
        author: item.author || undefined,
        format: (item.format || 'pdf') as LibraryFormat,
        file_url: item.file_url || undefined,
        cover_url: item.cover_url || undefined,
        total_pages: item.total_pages || 0,
        current_page: 1,
        progress_percent: 0,
        is_locked: item.is_locked || false,
        is_archived: false,
        created_at: item.created_at,
      })));
    } catch (error) {
      console.error("Error fetching library items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (data: { file: File; title: string; author: string; cover?: File; totalPages?: number }) => {
    if (!user) return;
    setIsUploading(true);
    
    try {
      const fileExt = data.file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const filePath = `${user.id}/${Date.now()}_${data.file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("library")
        .upload(filePath, data.file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from("library")
        .getPublicUrl(filePath);
      
      const format = (['pdf', 'epub', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(fileExt) 
        ? fileExt : 'other');
      
      const { error: insertError } = await supabase
        .from("library_items")
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          format,
          file_url: urlData.publicUrl,
          total_pages: data.totalPages || 0,
          file_size: data.file.size,
        });
      
      if (insertError) throw insertError;
      
      toast({ title: "Success", description: "Book added to your library" });
      setUploadDialogOpen(false);
      fetchLibraryItems();
    } catch (error) {
      console.error("Error uploading:", error);
      toast({ title: "Error", description: "Failed to upload book", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleItemClick = (item: LibraryItem) => {
    if (item.file_url) {
      window.open(item.file_url, '_blank');
    }
  };

  const handleDelete = async (item: LibraryItem) => {
    const { error } = await supabase.from("library_items").delete().eq("id", item.id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchLibraryItems();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-2xl font-light text-foreground tracking-wide">Chronyx Library</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Your personal intelligent reading workspace</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="my-library" className="gap-2">
            <LibraryIcon className="w-4 h-4" />
            <span className="hidden sm:inline">My Library</span>
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Shared</span>
          </TabsTrigger>
          <TabsTrigger value="publications" className="gap-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Publications</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge-hub" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-library" className="mt-6">
          <LibraryGrid
            items={items}
            isLoading={loading}
            onItemClick={handleItemClick}
            onUpload={() => setUploadDialogOpen(true)}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <div className="text-center py-16">
            <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Shared With You</h3>
            <p className="text-sm text-muted-foreground">Books shared by others will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="publications" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Published</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">0</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Total Earnings</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">₹0</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Views</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">0</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge-hub" className="mt-6">
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Chronyx Knowledge Hub</h3>
            <p className="text-sm text-muted-foreground mb-4">Discover and read books shared by the community</p>
            <Button variant="outline">Explore Hub</Button>
          </div>
        </TabsContent>
      </Tabs>

      <AddBookDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
      />
    </div>
  );
};

export default Library;
