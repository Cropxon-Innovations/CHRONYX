import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe,
  Search,
  BookOpen,
  User,
  Eye,
  Download,
  Star,
  Filter,
  Sparkles,
  ShoppingCart,
} from "lucide-react";
import { LibraryFormat } from "./LibraryGrid";
import { ContentPurchaseDialog } from "./ContentPurchaseDialog";
import { toast } from "sonner";

interface PublicBook {
  id: string;
  title: string;
  author: string | null;
  format: LibraryFormat;
  cover_url: string | null;
  total_pages: number | null;
  category: string | null;
  notes: string | null;
  is_paid: boolean;
  price: number;
  created_at: string;
  view_count?: number;
  user_id: string;
}

interface KnowledgeHubProps {
  onSelectBook?: (book: PublicBook) => void;
}

export const KnowledgeHub = ({ onSelectBook }: KnowledgeHubProps) => {
  const [books, setBooks] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedForPurchase, setSelectedForPurchase] = useState<PublicBook | null>(null);
  const { user } = useAuth();

  const categories = [
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "interview", label: "Interview", icon: "🎯" },
    { value: "personal", label: "Personal Growth", icon: "🌱" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "business", label: "Business", icon: "💼" },
    { value: "creative", label: "Creative", icon: "✨" },
  ];

  useEffect(() => {
    fetchPublicBooks();
    if (user) fetchPurchasedContent();
  }, [selectedCategory, user]);

  const fetchPublicBooks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("library_items")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;

      setBooks((data || []).map(item => ({
        id: item.id,
        title: item.title,
        author: item.author,
        format: (item.format || 'pdf') as LibraryFormat,
        cover_url: item.cover_url,
        total_pages: item.total_pages,
        category: item.category,
        notes: item.notes,
        is_paid: item.is_paid || false,
        price: item.price || 0,
        created_at: item.created_at,
        user_id: item.user_id,
      })));
    } catch (error) {
      console.error("Error fetching public books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedContent = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('content_purchases')
        .select('content_id')
        .eq('buyer_id', user.id)
        .eq('status', 'completed');
      
      setPurchasedIds((data || []).map(p => p.content_id));
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const handleBookClick = (book: PublicBook) => {
    // If it's the creator's own content, or free, or already purchased
    if (book.user_id === user?.id || !book.is_paid || purchasedIds.includes(book.id)) {
      onSelectBook?.(book);
    } else {
      // Show purchase dialog
      setSelectedForPurchase(book);
      setPurchaseDialogOpen(true);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Knowledge Hub</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Discover and read books shared by the Chronyx community. Learn, grow, and share your knowledge.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Categories */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No books found
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedCategory
              ? "Try a different category or search term"
              : "Be the first to publish to the Knowledge Hub!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card border border-border"
              onClick={() => handleBookClick(book)}
            >
              {/* Cover */}
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center p-3">
                  <BookOpen className="w-10 h-10 text-primary/40 mb-3" />
                  <p className="text-xs font-medium text-foreground text-center line-clamp-3 px-1">
                    {book.title}
                  </p>
                </div>
              )}

              {/* Price Badge */}
              {book.is_paid ? (
                purchasedIds.includes(book.id) ? (
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                    Owned
                  </Badge>
                ) : (
                  <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
                    ₹{book.price}
                  </Badge>
                )
              ) : (
                <Badge variant="secondary" className="absolute top-2 right-2">
                  Free
                </Badge>
              )}

              {/* Category Badge */}
              {book.category && (
                <Badge
                  variant="outline"
                  className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm"
                >
                  {book.category}
                </Badge>
              )}

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                <p className="text-xs font-medium text-white truncate">
                  {book.title}
                </p>
                {book.author && (
                  <p className="text-[10px] text-white/70 truncate flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {book.author}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {book.total_pages && (
                    <span className="text-[10px] text-white/50">
                      {book.total_pages} pages
                    </span>
                  )}
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      {selectedForPurchase && (
        <ContentPurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          item={selectedForPurchase}
          onPurchaseComplete={() => {
            fetchPurchasedContent();
            toast.success("Content unlocked!");
          }}
        />
      )}
    </div>
  );
};
