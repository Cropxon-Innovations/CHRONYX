import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search as SearchIcon, 
  FileText, 
  Image, 
  BookOpen, 
  Wallet, 
  Shield, 
  Activity,
  Calendar,
  Loader2,
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  GraduationCap,
  Trophy,
  Users,
  Hourglass,
  Receipt,
  TrendingUp,
  PieChart,
  Heart,
  Lock,
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  module: string;
  date: string;
  link: string;
  snippet?: string;
}

interface ModuleLink {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const MODULES: ModuleLink[] = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard, description: "Overview of your life", color: "text-primary" },
  { path: "/app/todos", label: "Todos", icon: CheckSquare, description: "Manage daily tasks", color: "text-emerald-500" },
  { path: "/app/notes", label: "Notes", icon: StickyNote, description: "Quick notes & ideas", color: "text-amber-500" },
  { path: "/app/study", label: "Study", icon: GraduationCap, description: "Track study progress", color: "text-blue-500" },
  { path: "/app/achievements", label: "Achievements", icon: Trophy, description: "Your accomplishments", color: "text-yellow-500" },
  { path: "/app/memory", label: "Memory", icon: Image, description: "Photos & memories", color: "text-purple-500" },
  { path: "/app/documents", label: "Documents", icon: FileText, description: "Important documents", color: "text-slate-500" },
  { path: "/app/social", label: "Social", icon: Users, description: "Social profiles", color: "text-pink-500" },
  { path: "/app/lifespan", label: "Lifespan", icon: Hourglass, description: "Time perspective", color: "text-cyan-500" },
  { path: "/app/expenses", label: "Expenses", icon: Receipt, description: "Track spending", color: "text-red-500" },
  { path: "/app/income", label: "Income", icon: TrendingUp, description: "Income sources", color: "text-green-500" },
  { path: "/app/reports", label: "Reports", icon: PieChart, description: "Financial reports", color: "text-indigo-500" },
  { path: "/app/loans", label: "Loans", icon: Wallet, description: "Loan management", color: "text-orange-500" },
  { path: "/app/insurance", label: "Insurance", icon: Heart, description: "Insurance policies", color: "text-rose-500" },
  { path: "/app/vault", label: "Vault", icon: Lock, description: "Secure storage", color: "text-violet-500" },
];

const Search = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter modules based on query
  const filteredModules = query.trim() 
    ? MODULES.filter(m => 
        m.label.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase())
      )
    : MODULES;

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery, user?.id],
    queryFn: async () => {
      if (!debouncedQuery.trim() || !user) return [];
      
      const searchTerm = `%${debouncedQuery.toLowerCase()}%`;
      const allResults: SearchResult[] = [];

      // Search memories
      const { data: memories } = await supabase
        .from("memories")
        .select("id, title, description, file_name, created_date")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},file_name.ilike.${searchTerm}`)
        .limit(10);
      
      memories?.forEach(m => {
        allResults.push({
          id: m.id,
          title: m.title || m.file_name,
          module: "Memories",
          date: m.created_date,
          link: "/app/memory",
          snippet: m.description || undefined,
        });
      });

      // Search study topics
      const { data: topics } = await supabase
        .from("syllabus_topics")
        .select("id, subject, chapter_name, topic_name, notes, created_at")
        .or(`subject.ilike.${searchTerm},chapter_name.ilike.${searchTerm},topic_name.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(10);
      
      topics?.forEach(t => {
        allResults.push({
          id: t.id,
          title: `${t.subject} - ${t.topic_name}`,
          module: "Study",
          date: t.created_at?.split("T")[0] || "",
          link: "/app/study",
          snippet: t.chapter_name,
        });
      });

      // Search expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("id, category, notes, expense_date, amount")
        .or(`category.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(10);
      
      expenses?.forEach(e => {
        allResults.push({
          id: e.id,
          title: `${e.category} - ₹${e.amount}`,
          module: "Expenses",
          date: e.expense_date,
          link: "/app/expenses",
          snippet: e.notes || undefined,
        });
      });

      // Search income
      const { data: income } = await supabase
        .from("income_entries")
        .select("id, notes, income_date, amount, income_sources(source_name)")
        .or(`notes.ilike.${searchTerm}`)
        .limit(10);
      
      income?.forEach(i => {
        const sourceName = (i.income_sources as any)?.source_name;
        allResults.push({
          id: i.id,
          title: sourceName ? `${sourceName} - ₹${i.amount}` : `Income - ₹${i.amount}`,
          module: "Income",
          date: i.income_date,
          link: "/app/income",
          snippet: i.notes || undefined,
        });
      });

      // Search loans
      const { data: loans } = await supabase
        .from("loans")
        .select("id, bank_name, loan_type, loan_account_number, notes, start_date")
        .or(`bank_name.ilike.${searchTerm},loan_type.ilike.${searchTerm},loan_account_number.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(10);
      
      loans?.forEach(l => {
        allResults.push({
          id: l.id,
          title: `${l.bank_name} - ${l.loan_type}`,
          module: "Loans",
          date: l.start_date,
          link: "/app/loans",
          snippet: l.notes || undefined,
        });
      });

      // Search insurance
      const { data: insurances } = await supabase
        .from("insurances")
        .select("id, policy_name, provider, policy_number, notes, start_date")
        .or(`policy_name.ilike.${searchTerm},provider.ilike.${searchTerm},policy_number.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(10);
      
      insurances?.forEach(ins => {
        allResults.push({
          id: ins.id,
          title: `${ins.policy_name} - ${ins.provider}`,
          module: "Insurance",
          date: ins.start_date,
          link: "/app/insurance",
          snippet: ins.notes || undefined,
        });
      });

      // Search todos
      const { data: todos } = await supabase
        .from("todos")
        .select("id, text, date, status")
        .ilike("text", searchTerm)
        .limit(10);
      
      todos?.forEach(t => {
        allResults.push({
          id: t.id,
          title: t.text,
          module: "Todos",
          date: t.date,
          link: "/app/todos",
          snippet: `Status: ${t.status}`,
        });
      });

      // Search achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("id, title, description, category, achieved_at")
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .limit(10);
      
      achievements?.forEach(a => {
        allResults.push({
          id: a.id,
          title: a.title,
          module: "Achievements",
          date: a.achieved_at,
          link: "/app/achievements",
          snippet: a.description || undefined,
        });
      });

      // Search activity logs
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("id, action, module, created_at")
        .or(`action.ilike.${searchTerm},module.ilike.${searchTerm}`)
        .limit(10);
      
      activities?.forEach(a => {
        allResults.push({
          id: a.id,
          title: a.action,
          module: "Activity",
          date: a.created_at?.split("T")[0] || "",
          link: "/app/activity",
          snippet: `Module: ${a.module}`,
        });
      });

      // Sort by date descending
      return allResults.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
    enabled: !!debouncedQuery.trim() && !!user,
  });

  // Group results by module
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.module]) acc[result.module] = [];
    acc[result.module].push(result);
    return acc;
  }, {});

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "Memories": return <Image className="w-4 h-4" />;
      case "Study": return <BookOpen className="w-4 h-4" />;
      case "Expenses":
      case "Income":
      case "Loans": return <Wallet className="w-4 h-4" />;
      case "Insurance": return <Shield className="w-4 h-4" />;
      case "Activity": return <Activity className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-light text-foreground tracking-wide">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Find anything across your life system</p>
      </header>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search modules, memories, documents, finances..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
          autoFocus
        />
      </div>

      {/* Quick Module Navigation */}
      {!debouncedQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Quick Navigation
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {filteredModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.div
                    key={module.path}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link to={module.path}>
                      <Card className="group hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer h-full">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                          <div className={cn(
                            "w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform",
                            module.color
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{module.label}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Filtered Modules when searching */}
      {query && !debouncedQuery && filteredModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <p className="text-sm text-muted-foreground">Go to module:</p>
          {filteredModules.slice(0, 5).map((module) => {
            const Icon = module.icon;
            return (
              <motion.button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                whileHover={{ x: 4 }}
              >
                <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", module.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{module.label}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : debouncedQuery && results.length === 0 ? (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No results found for "{debouncedQuery}"</p>
          {filteredModules.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Try visiting:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {filteredModules.slice(0, 3).map((module) => (
                  <Link
                    key={module.path}
                    to={module.path}
                    className="text-sm text-primary hover:underline"
                  >
                    {module.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : Object.keys(groupedResults).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([module, moduleResults]) => (
            <div key={module}>
              <div className="flex items-center gap-2 mb-3">
                {getModuleIcon(module)}
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {module}
                </h2>
                <span className="text-xs text-muted-foreground">({moduleResults.length})</span>
              </div>
              <div className="space-y-2">
                {moduleResults.map((result) => (
                  <Link key={result.id} to={result.link}>
                    <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.snippet && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {result.snippet}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            {result.date}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Search;