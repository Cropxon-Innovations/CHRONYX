import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Search,
  FileText,
  CheckSquare,
  CreditCard,
  Shield,
  BookOpen,
  Calendar,
  Settings,
  User,
  Home,
  Wallet,
  Building2,
  Heart,
  Sparkles,
  X,
  ArrowRight,
  Clock,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "page" | "note" | "todo" | "expense" | "loan" | "insurance";
  icon: React.ElementType;
  path: string;
  color?: string;
}

// Static pages/routes
const staticPages: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", subtitle: "Overview & analytics", type: "page", icon: Home, path: "/app/dashboard", color: "text-blue-500" },
  { id: "notes", title: "Noteflow", subtitle: "Your intelligent notes", type: "page", icon: FileText, path: "/app/notes", color: "text-purple-500" },
  { id: "todos", title: "Todos", subtitle: "Tasks & checklists", type: "page", icon: CheckSquare, path: "/app/todos", color: "text-green-500" },
  { id: "study", title: "Study", subtitle: "Learning & progress", type: "page", icon: BookOpen, path: "/app/study", color: "text-amber-500" },
  { id: "finances", title: "FinanceFlow", subtitle: "Expense tracking", type: "page", icon: Wallet, path: "/app/finances", color: "text-emerald-500" },
  { id: "loans", title: "Loans & EMI", subtitle: "Loan management", type: "page", icon: CreditCard, path: "/app/loans", color: "text-orange-500" },
  { id: "insurance", title: "Insurance", subtitle: "Policy tracker", type: "page", icon: Shield, path: "/app/insurance", color: "text-cyan-500" },
  { id: "calendar", title: "Calendar", subtitle: "Schedule & events", type: "page", icon: Calendar, path: "/app/calendar", color: "text-pink-500" },
  { id: "family", title: "Family", subtitle: "Family tree & memories", type: "page", icon: Heart, path: "/app/family", color: "text-rose-500" },
  { id: "business", title: "Business", subtitle: "Business profiles", type: "page", icon: Building2, path: "/app/business", color: "text-indigo-500" },
  { id: "profile", title: "Profile", subtitle: "Account & subscription", type: "page", icon: User, path: "/app/profile", color: "text-violet-500" },
  { id: "settings", title: "Settings", subtitle: "Preferences", type: "page", icon: Settings, path: "/app/settings", color: "text-gray-500" },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem("chronyx-recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("chronyx-recent-searches", JSON.stringify(updated));
  };

  // Search logic
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(staticPages.slice(0, 6));
      return;
    }

    setIsSearching(true);
    const q = searchQuery.toLowerCase();

    // Filter static pages
    const pageResults = staticPages.filter(
      page => 
        page.title.toLowerCase().includes(q) || 
        page.subtitle?.toLowerCase().includes(q)
    );

    // Search notes
    const noteResults: SearchResult[] = [];
    if (user) {
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${searchQuery}%`)
        .limit(5);
      
      notes?.forEach(note => {
        noteResults.push({
          id: note.id,
          title: note.title || "Untitled Note",
          subtitle: "Note",
          type: "note",
          icon: FileText,
          path: `/app/notes?id=${note.id}`,
          color: "text-purple-500",
        });
      });

      // Search todos - using 'title' field which may not exist, use text field instead
      const { data: todos } = await supabase
        .from("todos")
        .select("id, text, status")
        .eq("user_id", user.id)
        .ilike("text", `%${searchQuery}%`)
        .limit(5);
      
      todos?.forEach(todo => {
        noteResults.push({
          id: todo.id,
          title: todo.text,
          subtitle: todo.status === "done" ? "Completed Todo" : "Todo",
          type: "todo",
          icon: CheckSquare,
          path: `/app/todos`,
          color: "text-green-500",
        });
      });
    }

    setResults([...pageResults.slice(0, 4), ...noteResults]);
    setIsSearching(false);
    setSelectedIndex(0);
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      performSearch("");
    }
  }, [open, performSearch]);

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) {
      saveRecentSearch(query);
    }
    navigate(result.path);
    onOpenChange(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("chronyx-recent-searches");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden rounded-2xl border-border/50 shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, notes, todos..."
            className="border-0 shadow-none focus-visible:ring-0 text-base px-0 bg-transparent"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Badge variant="outline" className="shrink-0 gap-1 text-xs">
            <Command className="w-3 h-3" />K
          </Badge>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearRecentSearches}
                  >
                    Clear
                  </Button>
                </div>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(search)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-accent text-left"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {!query && (
              <div className="mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                  Quick Actions
                </span>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 ? (
              <div className="space-y-0.5">
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left group",
                        index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg bg-muted/50 shrink-0",
                        result.color
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isSearching ? "Searching..." : "No results found"}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
