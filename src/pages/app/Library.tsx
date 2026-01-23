import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LibraryGrid, LibraryItem, LibraryFormat } from "@/components/study/LibraryGrid";
import { AddBookDialog } from "@/components/study/AddBookDialog";
import { EditBookDialog } from "@/components/study/EditBookDialog";
import { BookReader } from "@/components/study/BookReader";
import { HighlightsPanel } from "@/components/study/HighlightsPanel";
import { VocabularyPanel } from "@/components/study/VocabularyPanel";
import { ReadingAnalytics } from "@/components/study/ReadingAnalytics";
import { SharePublishDialog } from "@/components/study/SharePublishDialog";
import { KnowledgeHub } from "@/components/study/KnowledgeHub";
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
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [isEditSaving, setIsEditSaving] = useState(false);
  
  // Reader state
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rightPanel, setRightPanel] = useState<"highlights" | "vocabulary" | "analytics" | null>(null);
  
  // Share/Publish dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareItem, setShareItem] = useState<LibraryItem | null>(null);
  
  // Publications stats
  const [publicationStats, setPublicationStats] = useState({ published: 0, earnings: 0, views: 0 });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLibraryItems();
      fetchPublicationStats();
    }
  }, [user, activeTab]);

  const fetchPublicationStats = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("library_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_public", true);
      
      setPublicationStats({
        published: data?.length || 0,
        earnings: 0, // Would come from creator_payouts table
        views: 0,
      });
    } catch (error) {
      console.error("Error fetching publication stats:", error);
    }
  };

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

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (data: {
    id: string;
    title: string;
    author: string;
    totalPages?: number;
    notes?: string;
    tags?: string[];
    coverFile?: File;
    coverUrl?: string;
  }) => {
    if (!user) return;
    setIsEditSaving(true);

    try {
      // Use coverUrl from dialog (already uploaded there) or existing
      const coverUrl = data.coverUrl || editingItem?.cover_url;

      const { error } = await supabase
        .from("library_items")
        .update({
          title: data.title,
          author: data.author || null,
          total_pages: data.totalPages || null,
          notes: data.notes || null,
          tags: data.tags || null,
          cover_url: coverUrl,
        })
        .eq("id", data.id);

      if (error) throw error;

      toast({ title: "Book updated" });
      setEditDialogOpen(false);
      setEditingItem(null);
      fetchLibraryItems();
    } catch (error) {
      console.error("Error updating book:", error);
      toast({ title: "Error", description: "Failed to update book", variant: "destructive" });
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleShare = (item: LibraryItem) => {
    setShareItem(item);
    setShareDialogOpen(true);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="text-2xl font-medium text-foreground tracking-tight">Library</h1>
              <p className="text-sm text-muted-foreground">Your personal reading collection</p>
            </div>
          </div>
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
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
              <p className="text-2xl font-semibold text-foreground">{publicationStats.published}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Total Earnings</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">₹{publicationStats.earnings}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Views</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{publicationStats.views}</p>
            </div>
          </div>
          
          {/* Published books list */}
          <LibraryGrid
            items={items.filter(i => (i as any).is_public)}
            isLoading={loading}
            onItemClick={handleItemClick}
            onUpload={() => setUploadDialogOpen(true)}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        </TabsContent>

        <TabsContent value="knowledge-hub" className="mt-6">
          <KnowledgeHub
            onSelectBook={(book) => {
              // Open in reader if possible
              if (book.format === 'pdf') {
                setSelectedItem({
                  id: book.id,
                  title: book.title,
                  author: book.author || undefined,
                  format: book.format,
                  cover_url: book.cover_url || undefined,
                  total_pages: book.total_pages || 0,
                  created_at: book.created_at,
                } as LibraryItem);
                setCurrentPage(1);
                setReaderOpen(true);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <AddBookDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      {/* Edit Book Dialog */}
      <EditBookDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleEditSave}
        isSaving={isEditSaving}
      />

      {/* Share/Publish Dialog */}
      {shareItem && (
        <SharePublishDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          item={shareItem}
          onUpdate={() => {
            fetchLibraryItems();
            fetchPublicationStats();
          }}
        />
      )}
    </div>
  );
};

export default Library;
