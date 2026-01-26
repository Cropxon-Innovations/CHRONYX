import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Trophy,
  Star,
  Coins,
  Sparkles,
  ChevronRight,
  Check,
  Calendar,
  Award,
  Zap,
  TrendingUp,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Resolution {
  id: string;
  year: number;
  title: string;
  description: string | null;
  status: string;
  category: string;
  color: string;
  progress: number;
  points_earned: number;
  achieved_at: string | null;
}

interface WalletData {
  total_points: number;
  total_coins: number;
  redeemable_balance: number;
}

// Year color schemes
const yearColors: Record<number, { bg: string; text: string; gradient: string; border: string }> = {
  2025: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", gradient: "from-violet-500 to-purple-600", border: "border-violet-500/30" },
  2026: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", gradient: "from-blue-500 to-cyan-500", border: "border-blue-500/30" },
  2027: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", gradient: "from-emerald-500 to-teal-500", border: "border-emerald-500/30" },
  2028: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", gradient: "from-amber-500 to-orange-500", border: "border-amber-500/30" },
  2029: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", gradient: "from-rose-500 to-pink-500", border: "border-rose-500/30" },
  2030: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", gradient: "from-indigo-500 to-blue-600", border: "border-indigo-500/30" },
};

const getYearColor = (year: number) => {
  return yearColors[year] || yearColors[2026];
};

const categories = [
  { value: "health", label: "Health & Fitness", icon: "💪" },
  { value: "career", label: "Career & Growth", icon: "📈" },
  { value: "finance", label: "Financial", icon: "💰" },
  { value: "learning", label: "Learning", icon: "📚" },
  { value: "personal", label: "Personal", icon: "🎯" },
  { value: "relationships", label: "Relationships", icon: "❤️" },
  { value: "creativity", label: "Creativity", icon: "🎨" },
  { value: "travel", label: "Travel", icon: "✈️" },
];

export const ResolutionsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newResolution, setNewResolution] = useState({
    title: "",
    description: "",
    category: "personal",
    year: currentYear,
  });

  // Fetch resolutions
  const { data: resolutions = [], isLoading } = useQuery({
    queryKey: ["resolutions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("yearly_resolutions")
        .select("*")
        .eq("user_id", user.id)
        .order("year", { ascending: true })
        .order("priority", { ascending: true });
      if (error) throw error;
      return data as Resolution[];
    },
    enabled: !!user,
  });

  // Fetch wallet
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_wallet")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as WalletData | null;
    },
    enabled: !!user,
  });

  // Add resolution
  const addResolution = useMutation({
    mutationFn: async (resolution: typeof newResolution) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("yearly_resolutions")
        .insert({
          user_id: user.id,
          title: resolution.title,
          description: resolution.description || null,
          category: resolution.category,
          year: resolution.year,
          color: getYearColor(resolution.year).gradient,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
      setIsAddDialogOpen(false);
      setNewResolution({ title: "", description: "", category: "personal", year: currentYear });
      toast.success("Resolution added!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add resolution");
    },
  });

  // Update resolution progress
  const updateProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const updates: any = { progress };
      
      if (progress >= 100) {
        updates.status = "achieved";
        updates.achieved_at = new Date().toISOString();
        updates.points_earned = 100;
        
        // Award points
        await supabase.rpc("add_wallet_points", {
          p_user_id: user!.id,
          p_points: 100,
          p_reason: "Completed yearly resolution",
          p_reference_type: "resolution",
          p_reference_id: id,
        });
      }
      
      const { error } = await supabase
        .from("yearly_resolutions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resolutions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  // Group resolutions by year
  const resolutionsByYear = resolutions.reduce((acc, res) => {
    if (!acc[res.year]) acc[res.year] = [];
    acc[res.year].push(res);
    return acc;
  }, {} as Record<number, Resolution[]>);

  // Years to display (current year to 5 years ahead)
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Resolutions & Goals</h2>
            <p className="text-sm text-muted-foreground">Track your yearly resolutions and 5-year plan</p>
          </div>
        </div>

        {/* Wallet Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {wallet?.total_coins || 0} coins
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {wallet?.total_points || 0} pts
            </span>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Resolution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <Select
                    value={String(newResolution.year)}
                    onValueChange={(v) => setNewResolution({ ...newResolution, year: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newResolution.category}
                    onValueChange={(v) => setNewResolution({ ...newResolution, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal Title</label>
                  <Input
                    value={newResolution.title}
                    onChange={(e) => setNewResolution({ ...newResolution, title: e.target.value })}
                    placeholder="e.g., Run a marathon"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    value={newResolution.description}
                    onChange={(e) => setNewResolution({ ...newResolution, description: e.target.value })}
                    placeholder="Add details about your goal..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addResolution.mutate(newResolution)}
                  disabled={!newResolution.title.trim() || addResolution.isPending}
                >
                  {addResolution.isPending ? "Adding..." : "Add Resolution"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Year Cards - Horizontal Scroll */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {years.map((year) => {
            const yearResolutions = resolutionsByYear[year] || [];
            const colors = getYearColor(year);
            const achievedCount = yearResolutions.filter(r => r.status === "achieved").length;
            const totalPoints = yearResolutions.reduce((acc, r) => acc + r.points_earned, 0);
            
            return (
              <motion.div
                key={year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (year - currentYear) * 0.1 }}
                className={cn(
                  "shrink-0 w-80 rounded-2xl border p-5 transition-all duration-300",
                  colors.bg, colors.border,
                  selectedYear === year && "ring-2 ring-primary shadow-lg"
                )}
                onClick={() => setSelectedYear(year)}
              >
                {/* Year Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={cn("text-2xl font-bold", colors.text)}>{year}</h3>
                    <p className="text-sm text-muted-foreground">
                      {year === currentYear ? "This Year" : year === currentYear + 1 ? "Next Year" : `${year - currentYear} years ahead`}
                    </p>
                  </div>
                  {year === currentYear && (
                    <Badge className={cn("bg-gradient-to-r", colors.gradient, "text-white border-0")}>
                      Current
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold">{yearResolutions.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Goals</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-green-500">{achievedCount}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Done</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-amber-500">{totalPoints}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                  </div>
                </div>

                {/* Resolution List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {yearResolutions.length > 0 ? (
                    yearResolutions.slice(0, 4).map((res) => {
                      const cat = categories.find(c => c.value === res.category);
                      return (
                        <div
                          key={res.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg bg-background/70 border border-border/50",
                            res.status === "achieved" && "bg-green-500/10 border-green-500/30"
                          )}
                        >
                          <span className="text-sm">{cat?.icon || "🎯"}</span>
                          <span className={cn(
                            "text-sm flex-1 truncate",
                            res.status === "achieved" && "line-through text-muted-foreground"
                          )}>
                            {res.title}
                          </span>
                          {res.status === "achieved" ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-muted-foreground">{res.progress}%</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-50" />
                      No goals yet
                    </div>
                  )}
                  {yearResolutions.length > 4 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      +{yearResolutions.length - 4} more
                    </Button>
                  )}
                </div>

                {/* Add Goal Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("w-full mt-3 gap-2", colors.border)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewResolution({ ...newResolution, year });
                    setIsAddDialogOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Add Goal for {year}
                </Button>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Selected Year Details */}
      {resolutionsByYear[selectedYear]?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {selectedYear} Goals
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {resolutionsByYear[selectedYear].map((res) => {
              const cat = categories.find(c => c.value === res.category);
              const colors = getYearColor(res.year);
              
              return (
                <motion.div
                  key={res.id}
                  layout
                  className={cn(
                    "p-4 rounded-xl border bg-card",
                    res.status === "achieved" && "bg-green-500/5 border-green-500/30"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        colors.bg
                      )}>
                        <span className="text-lg">{cat?.icon || "🎯"}</span>
                      </div>
                      <div>
                        <h4 className={cn(
                          "font-semibold",
                          res.status === "achieved" && "line-through text-muted-foreground"
                        )}>
                          {res.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{cat?.label}</p>
                      </div>
                    </div>
                    {res.status === "achieved" ? (
                      <Badge className="bg-green-500 text-white">
                        <Trophy className="w-3 h-3 mr-1" />
                        +{res.points_earned} pts
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={colors.border}>
                        {res.progress}%
                      </Badge>
                    )}
                  </div>
                  
                  {res.description && (
                    <p className="text-sm text-muted-foreground mb-3">{res.description}</p>
                  )}
                  
                  {res.status !== "achieved" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{res.progress}%</span>
                      </div>
                      <Progress value={res.progress} className="h-2" />
                      <div className="flex gap-2 mt-3">
                        {[25, 50, 75, 100].map((value) => (
                          <Button
                            key={value}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            disabled={res.progress >= value}
                            onClick={() => updateProgress.mutate({ id: res.id, progress: value })}
                          >
                            {value}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ResolutionsSection;
