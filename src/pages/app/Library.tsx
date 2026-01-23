import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryGrid, LibraryItem, LibraryFormat } from "@/components/study/LibraryGrid";
import { AddBookDialog } from "@/components/study/AddBookDialog";
import { BookReader } from "@/components/study/BookReader";
import { HighlightsPanel } from "@/components/study/HighlightsPanel";
import { VocabularyPanel } from "@/components/study/VocabularyPanel";
import { ReadingAnalytics } from "@/components/study/ReadingAnalytics";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Library as LibraryIcon, 
  Share2, 
  Upload, 
  Globe, 
  DollarSign,
  BarChart3,
  BookOpen,
  Highlighter,
  BookA,
  X,
} from "lucide-react";

const Library = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-library");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Reader state
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rightPanel, setRightPanel] = useState<"highlights" | "vocabulary" | "analytics" | null>(null);
  
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
      
      // Fetch reading state for each item
      const itemIds = (data || []).map(item => item.id);
      const { data: readingStates } = await supabase
        .from("reading_state")
        .select("*")
        .eq("user_id", user?.id)
        .in("item_id", itemIds);
      
      const stateMap = new Map(readingStates?.map(s => [s.item_id, s]) || []);
      
      setItems((data || []).map(item => {
        const state = stateMap.get(item.id);
        return {
          id: item.id,
          title: item.title,
          author: item.author || undefined,
          format: (item.format || 'pdf') as LibraryFormat,
          file_url: item.file_url || undefined,
          cover_url: item.cover_url || undefined,
          total_pages: item.total_pages || 0,
          current_page: state?.last_page || 1,
          progress_percent: state?.progress_percent ? Number(state.progress_percent) : 0,
          is_locked: item.is_locked || false,
          is_archived: false,
          last_read_at: state?.last_read_at || undefined,
          created_at: item.created_at,
        };
      }));
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

      // Upload cover if provided
      let coverUrl: string | undefined;
      if (data.cover) {
        const coverPath = `${user.id}/covers/${Date.now()}_cover.jpg`;
        const { error: coverError } = await supabase.storage
          .from("library")
          .upload(coverPath, data.cover);
        
        if (!coverError) {
          const { data: coverUrlData } = supabase.storage
            .from("library")
            .getPublicUrl(coverPath);
          coverUrl = coverUrlData.publicUrl;
        }
      }
      
      const format = (['pdf', 'epub', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(fileExt) 
        ? fileExt : 'other') as LibraryFormat;
      
      const { error: insertError } = await supabase
        .from("library_items")
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          format,
          file_url: urlData.publicUrl,
          cover_url: coverUrl,
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
    if (item.file_url && item.format === 'pdf') {
      setSelectedItem(item);
      setCurrentPage(item.current_page || 1);
      setReaderOpen(true);
    } else if (item.file_url) {
      // For non-PDF files, open in new tab
      window.open(item.file_url, '_blank');
    }
  };

  const handleProgressUpdate = async (page: number, progress: number) => {
    if (!selectedItem || !user) return;
    setCurrentPage(page);
    
    // Upsert reading state
    const { error } = await supabase
      .from("reading_state")
      .upsert({
        user_id: user.id,
        item_id: selectedItem.id,
        last_page: page,
        progress_percent: progress,
        last_read_at: new Date().toISOString(),
      }, { onConflict: "user_id,item_id" });

    if (!error) {
      // Update local state
      setItems(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, current_page: page, progress_percent: progress }
          : item
      ));
    }
  };

  const handleDelete = async (item: LibraryItem) => {
    const { error } = await supabase.from("library_items").delete().eq("id", item.id);
    if (!error) {
      toast({ title: "Deleted" });
      fetchLibraryItems();
    }
  };

  const handleCloseReader = () => {
    setReaderOpen(false);
    setSelectedItem(null);
    setRightPanel(null);
  };

  // Full-screen reader mode
  if (readerOpen && selectedItem) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex">
        {/* Main Reader */}
        <div className="flex-1 relative">
          <BookReader
            item={{
              id: selectedItem.id,
              title: selectedItem.title,
              author: selectedItem.author,
              total_pages: selectedItem.total_pages,
              format: selectedItem.format,
              created_at: selectedItem.created_at,
            }}
            fileUrl={selectedItem.file_url || ""}
            initialPage={currentPage}
            onProgressUpdate={handleProgressUpdate}
            onClose={handleCloseReader}
          />
          
          {/* Floating action buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button
              variant={rightPanel === "highlights" ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setRightPanel(rightPanel === "highlights" ? null : "highlights")}
            >
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Highlights</span>
            </Button>
            <Button
              variant={rightPanel === "vocabulary" ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setRightPanel(rightPanel === "vocabulary" ? null : "vocabulary")}
            >
              <BookA className="w-4 h-4" />
              <span className="hidden sm:inline">Vocabulary</span>
            </Button>
            <Button
              variant={rightPanel === "analytics" ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setRightPanel(rightPanel === "analytics" ? null : "analytics")}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </Button>
          </div>
        </div>

        {/* Right Panel */}
        {rightPanel && (
          <div className="w-80 border-l border-border bg-card">
            {rightPanel === "highlights" && (
              <HighlightsPanel
                itemId={selectedItem.id}
                currentPage={currentPage}
                onGoToPage={(page) => setCurrentPage(page)}
                onClose={() => setRightPanel(null)}
              />
            )}
            {rightPanel === "vocabulary" && (
              <VocabularyPanel
                itemId={selectedItem.id}
                onClose={() => setRightPanel(null)}
              />
            )}
            {rightPanel === "analytics" && (
              <ReadingAnalytics onClose={() => setRightPanel(null)} />
            )}
          </div>
        )}
      </div>
    );
  }

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
        
        {/* Quick Stats */}
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Reading Stats
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <ReadingAnalytics />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <BookA className="w-4 h-4" />
                Vocabulary
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <VocabularyPanel />
            </SheetContent>
          </Sheet>
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
          
          <div className="text-center py-12">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Publish Your Work</h3>
            <p className="text-sm text-muted-foreground mb-4">Share your books with the Chronyx community</p>
            <Button variant="outline">Start Publishing</Button>
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
