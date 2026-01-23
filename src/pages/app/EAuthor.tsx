import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  BookOpen, 
  Edit3, 
  Eye, 
  Download, 
  Settings,
  Folder,
  Trash2,
  MoreHorizontal,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BookAuthoringStudio from "@/components/eauthor/BookAuthoringStudio";
import BookReader from "@/components/eauthor/BookReader";
import { format } from "date-fns";

type BookStatus = "draft" | "writing" | "editing" | "review" | "published";

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  description: string | null;
  cover_url: string | null;
  status: BookStatus;
  settings: any;
  genre: string | null;
  word_count: number;
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

const castBook = (data: any): Book => ({
  id: data.id,
  title: data.title,
  subtitle: data.subtitle,
  author_name: data.author_name,
  description: data.description,
  cover_url: data.cover_url,
  status: (data.status || 'draft') as BookStatus,
  settings: data.settings || {},
  genre: data.genre,
  word_count: data.word_count || 0,
  reading_time_minutes: data.reading_time_minutes || 0,
  created_at: data.created_at,
  updated_at: data.updated_at,
});

const statusConfig: Record<BookStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-500/20 text-slate-600 dark:text-slate-400" },
  writing: { label: "Writing", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
  editing: { label: "Editing", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400" },
  review: { label: "Review", color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  published: { label: "Published", color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
};

const EAuthor = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"library" | "authoring" | "reading">("library");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", subtitle: "", author_name: "", description: "" });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchBooks();
  }, [user]);

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching books:", error);
    } else {
      setBooks((data || []).map(castBook));
    }
    setLoading(false);
  };

  const createBook = async () => {
    if (!user || !newBook.title.trim()) return;

    const { data, error } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        title: newBook.title.trim(),
        subtitle: newBook.subtitle.trim() || null,
        author_name: newBook.author_name.trim() || user.email?.split("@")[0],
        description: newBook.description.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create book", variant: "destructive" });
    } else if (data) {
      const castedBook = castBook(data);
      setBooks([castedBook, ...books]);
      setCreateDialogOpen(false);
      setNewBook({ title: "", subtitle: "", author_name: "", description: "" });
      toast({ title: "Book created!", description: "Start writing your masterpiece" });
      // Open the book for editing
      setSelectedBook(castedBook);
      setActiveView("authoring");
    }
  };

  const deleteBook = async (id: string) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete book", variant: "destructive" });
    } else {
      setBooks(books.filter(b => b.id !== id));
      toast({ title: "Book deleted" });
    }
  };

  const openBook = (book: Book, view: "authoring" | "reading") => {
    setSelectedBook(book);
    setActiveView(view);
  };

  const handleBackToLibrary = () => {
    setActiveView("library");
    setSelectedBook(null);
    fetchBooks(); // Refresh books list
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authoring Studio View
  if (activeView === "authoring" && selectedBook) {
    return (
      <BookAuthoringStudio 
        book={selectedBook} 
        onBack={handleBackToLibrary}
        onBookUpdate={(updated) => {
          setSelectedBook(updated);
          setBooks(books.map(b => b.id === updated.id ? updated : b));
        }}
      />
    );
  }

  // Reader View
  if (activeView === "reading" && selectedBook) {
    return (
      <BookReader 
        book={selectedBook} 
        onBack={handleBackToLibrary}
      />
    );
  }

  // Library View
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✍️</span>
            <h1 className="text-2xl font-light text-foreground tracking-wide">Chronyx eAuthor</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">From idea to beautifully published books</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Book</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={newBook.subtitle}
                  onChange={(e) => setNewBook({ ...newBook, subtitle: e.target.value })}
                  placeholder="Optional subtitle"
                />
              </div>
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input
                  value={newBook.author_name}
                  onChange={(e) => setNewBook({ ...newBook, author_name: e.target.value })}
                  placeholder="Your name or pen name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Brief description of your book"
                  rows={3}
                />
              </div>
              <Button onClick={createBook} className="w-full" disabled={!newBook.title.trim()}>
                Create Book
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading your library...</div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No books found" : "Your library is empty"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term" : "Start your writing journey by creating your first book"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Book
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Cover */}
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 relative">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <BookOpen className="w-12 h-12 text-primary/40 mb-3" />
                    <h3 className="font-serif text-lg font-medium text-foreground line-clamp-3">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {book.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      by {book.author_name || "Unknown"}
                    </p>
                  </div>
                )}
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="gap-1"
                    onClick={() => openBook(book, "authoring")}
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="gap-1"
                    onClick={() => openBook(book, "reading")}
                  >
                    <Eye className="w-3 h-3" />
                    Read
                  </Button>
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-foreground truncate">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {book.word_count.toLocaleString()} words • {book.reading_time_minutes} min read
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openBook(book, "authoring")}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openBook(book, "reading")}>
                        <Eye className="w-4 h-4 mr-2" />
                        Read
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteBook(book.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={statusConfig[book.status].color}>
                    {statusConfig[book.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {format(new Date(book.updated_at), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sample Books Section */}
      {books.length === 0 && !loading && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={async () => {
                if (!user) return;
                const { data } = await supabase
                  .from("books")
                  .insert({
                    user_id: user.id,
                    title: "Awake While Alive",
                    subtitle: "A Journey of Self-Discovery",
                    author_name: user.email?.split("@")[0],
                    description: "A personal book exploring consciousness, mindfulness, and the art of living fully.",
                    genre: "Personal Development",
                  })
                  .select()
                  .single();
                if (data) {
                  setBooks([castBook(data), ...books]);
                  toast({ title: "Template book created!" });
                }
              }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xl">🧘</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Awake While Alive</h3>
                  <p className="text-sm text-muted-foreground">Personal development book template</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={async () => {
                if (!user) return;
                const { data } = await supabase
                  .from("books")
                  .insert({
                    user_id: user.id,
                    title: "Modern Web Development",
                    subtitle: "From Zero to Full-Stack",
                    author_name: user.email?.split("@")[0],
                    description: "A comprehensive guide to modern web development with code examples and best practices.",
                    genre: "Technology",
                  })
                  .select()
                  .single();
                if (data) {
                  setBooks([castBook(data), ...books]);
                  toast({ title: "Template book created!" });
                }
              }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl">💻</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Technical Programming Book</h3>
                  <p className="text-sm text-muted-foreground">Programming book with code blocks</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EAuthor;
