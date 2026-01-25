import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  RefreshCw,
  MessageSquare,
  Send,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { LibraryFormat } from "./LibraryGrid";
import { ContentPurchaseDialog } from "./ContentPurchaseDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  view_count: number;
  user_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  allow_download: boolean;
  average_rating: number;
  rating_count: number;
  sample_pages: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface KnowledgeHubProps {
  onSelectBook?: (book: PublicBook) => void;
}

export const KnowledgeHub = ({ onSelectBook }: KnowledgeHubProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedForPurchase, setSelectedForPurchase] = useState<PublicBook | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const categories = [
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "interview", label: "Interview", icon: "🎯" },
    { value: "personal", label: "Personal Growth", icon: "🌱" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "business", label: "Business", icon: "💼" },
    { value: "creative", label: "Creative", icon: "✨" },
  ];

  // Fetch all public books from ALL users
  const { data: books = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["hub-public-books", selectedCategory],
    queryFn: async () => {
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

      return (data || []).map(item => ({
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
        view_count: item.view_count || 0,
        user_id: item.user_id,
        creator_name: item.creator_name,
        creator_avatar: item.creator_avatar,
        allow_download: item.allow_download ?? true,
        average_rating: Number(item.average_rating) || 0,
        rating_count: item.rating_count || 0,
        sample_pages: item.sample_pages || 5,
      })) as PublicBook[];
    },
  });

  // Fetch purchased content IDs
  const { data: purchasedIds = [] } = useQuery({
    queryKey: ["hub-purchased", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('content_purchases')
        .select('content_id')
        .eq('buyer_id', user.id)
        .eq('status', 'completed');
      return (data || []).map(p => p.content_id);
    },
    enabled: !!user,
  });

  // Fetch comments for selected book
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["book-comments", selectedBook?.id],
    queryFn: async () => {
      if (!selectedBook) return [];
      const { data, error } = await supabase
        .from('content_comments')
        .select('*')
        .eq('content_id', selectedBook.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user profiles for comments
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        
        profileMap = new Map((profiles || []).map(p => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
      }
      
      return (data || []).map(c => ({
        ...c,
        user_name: profileMap.get(c.user_id)?.display_name || 'Anonymous',
        user_avatar: profileMap.get(c.user_id)?.avatar_url,
      }));
    },
    enabled: !!selectedBook,
  });

  // Fetch user's rating for selected book
  const { data: existingRating } = useQuery({
    queryKey: ["user-rating", selectedBook?.id, user?.id],
    queryFn: async () => {
      if (!selectedBook || !user) return null;
      const { data } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('content_id', selectedBook.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.rating || 0;
    },
    enabled: !!selectedBook && !!user,
  });

  useEffect(() => {
    if (existingRating) setUserRating(existingRating);
  }, [existingRating]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedBook) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('content_comments')
        .insert({
          content_id: selectedBook.id,
          user_id: user.id,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  // Rate content mutation
  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user || !selectedBook) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('content_ratings')
        .upsert({
          content_id: selectedBook.id,
          user_id: user.id,
          rating,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'content_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hub-public-books"] });
      queryClient.invalidateQueries({ queryKey: ["user-rating"] });
      toast.success("Rating submitted!");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });

  // Increment view count
  const incrementView = async (bookId: string) => {
    try {
      const currentBook = books.find(b => b.id === bookId);
      await supabase
        .from('library_items')
        .update({ view_count: (currentBook?.view_count || 0) + 1 })
        .eq('id', bookId);
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  };

  const handleBookClick = (book: PublicBook) => {
    setSelectedBook(book);
    setDetailDialogOpen(true);
    incrementView(book.id);
  };

  const handleReadSample = (book: PublicBook) => {
    onSelectBook?.(book);
    setDetailDialogOpen(false);
  };

  const handlePurchase = (book: PublicBook) => {
    setSelectedForPurchase(book);
    setPurchaseDialogOpen(true);
    setDetailDialogOpen(false);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Hub refreshed!");
  };

  const canAccess = (book: PublicBook) => {
    return book.user_id === user?.id || !book.is_paid || purchasedIds.includes(book.id);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.creator_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number, interactive = false, size = "w-4 h-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size,
              "transition-colors cursor-pointer",
              (interactive ? (hoverRating || userRating) : rating) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            )}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => {
              if (interactive && user) {
                setUserRating(star);
                rateMutation.mutate(star);
              }
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Knowledge Hub</h2>
                <Badge variant="secondary" className="ml-2">
                  {books.length} Books
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Digital marketplace for books, PDFs, and study materials shared by the Chronyx community.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search books, authors, publishers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
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
            <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No books found</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCategory ? "Try a different category or search term" : "Be the first to publish to the Knowledge Hub!"}
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
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center p-3">
                  <BookOpen className="w-10 h-10 text-primary/40 mb-3" />
                  <p className="text-xs font-medium text-foreground text-center line-clamp-3 px-1">{book.title}</p>
                </div>
              )}

              {/* Price Badge */}
              {book.is_paid ? (
                purchasedIds.includes(book.id) || book.user_id === user?.id ? (
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {book.user_id === user?.id ? "Your Book" : "Owned"}
                  </Badge>
                ) : (
                  <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">₹{book.price}</Badge>
                )
              ) : (
                <Badge variant="secondary" className="absolute top-2 right-2">Free</Badge>
              )}

              {/* Category Badge */}
              {book.category && (
                <Badge variant="outline" className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm">
                  {book.category}
                </Badge>
              )}

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                <p className="text-xs font-medium text-white truncate">{book.title}</p>
                {book.creator_name && (
                  <p className="text-[10px] text-white/70 truncate flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {book.creator_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {book.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-white/70">{book.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {book.total_pages && (
                    <span className="text-[10px] text-white/50">{book.total_pages} pages</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-start gap-4">
                  {selectedBook.cover_url ? (
                    <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-20 h-28 object-cover rounded-lg shadow" />
                  ) : (
                    <div className="w-20 h-28 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{selectedBook.title}</h3>
                    {selectedBook.author && (
                      <p className="text-sm text-muted-foreground">by {selectedBook.author}</p>
                    )}
                    
                    {/* Publisher Info */}
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={selectedBook.creator_avatar || undefined} />
                        <AvatarFallback className="text-xs">{selectedBook.creator_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        Published by <span className="font-medium text-foreground">{selectedBook.creator_name || "Anonymous"}</span>
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(selectedBook.average_rating)}
                      <span className="text-sm text-muted-foreground">
                        {selectedBook.average_rating.toFixed(1)} ({selectedBook.rating_count} {selectedBook.rating_count === 1 ? 'rating' : 'ratings'})
                      </span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Book Info */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <FileText className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">{selectedBook.total_pages || '?'}</p>
                    <p className="text-xs text-muted-foreground">Pages</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <Eye className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">{selectedBook.view_count}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">{format(new Date(selectedBook.created_at), 'MMM d')}</p>
                    <p className="text-xs text-muted-foreground">Published</p>
                  </div>
                </div>

                {/* Description */}
                {selectedBook.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">{selectedBook.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => handleReadSample(selectedBook)} className="flex-1 gap-2">
                    <Eye className="w-4 h-4" />
                    {canAccess(selectedBook) ? "Read Full" : `Read Sample (${selectedBook.sample_pages} pages)`}
                  </Button>
                  
                  {!canAccess(selectedBook) && selectedBook.is_paid && (
                    <Button variant="secondary" onClick={() => handlePurchase(selectedBook)} className="flex-1 gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Buy ₹{selectedBook.price}
                    </Button>
                  )}
                  
                  {canAccess(selectedBook) && selectedBook.allow_download && (
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                </div>

                {/* Rate this book */}
                {user && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium mb-2">Rate this book</h4>
                      <div className="flex items-center gap-2">
                        {renderStars(userRating, true, "w-6 h-6")}
                        {userRating > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            Your rating: {userRating}/5
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comments Section */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments ({comments.length})
                  </h4>
                  
                  {user && (
                    <div className="flex gap-2 mb-4">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button
                        size="icon"
                        onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    ) : (
                      comments.map((comment: Comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user_avatar} />
                            <AvatarFallback className="text-xs">{comment.user_name?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comment.user_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      {selectedForPurchase && (
        <ContentPurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          item={selectedForPurchase}
          onPurchaseComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["hub-purchased"] });
            toast.success("Content unlocked!");
          }}
        />
      )}
    </div>
  );
};
