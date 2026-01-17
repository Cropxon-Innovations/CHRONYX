import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { Trophy, Medal, Award, Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import MilestoneCard from "./MilestoneCard";
import { BADGE_ICONS, BADGE_CATEGORIES, BADGE_DEFINITIONS, BadgeDefinition } from "./badgeDefinitions";

interface DailyBadge {
  id: string;
  badge_date: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  description: string;
  points: number;
}

interface Todo {
  id: string;
  text: string;
  status: "pending" | "done" | "skipped";
  date: string;
  priority: "high" | "medium" | "low";
}

interface DailyBadgesProps {
  todos: Todo[];
  onBadgeEarned?: () => void;
}

// Badge checking logic based on badge type
const checkBadgeEarned = (
  def: BadgeDefinition,
  stats: {
    todayCompleted: number;
    todayTotal: number;
    todaySkipped: number;
    todayTodos: Todo[];
    totalCompleted: number;
    weeklyCompleted: number;
    monthlyCompleted: number;
    streak: number;
  }
): boolean => {
  const { todayCompleted, todayTotal, todaySkipped, todayTodos, totalCompleted, weeklyCompleted, monthlyCompleted, streak } = stats;
  
  switch (def.type) {
    // Daily badges
    case "perfect_day":
      return todayTotal > 0 && todayCompleted === todayTotal && todaySkipped === 0;
    case "high_achiever":
      const highPriorityTodos = todayTodos.filter(t => t.priority === "high");
      return highPriorityTodos.length > 0 && highPriorityTodos.every(t => t.status === "done");
    case "productivity_pro":
      return todayCompleted >= 10;
    case "consistent":
      return todayTotal > 0 && (todayCompleted / todayTotal) >= 0.8;
    case "focus_master":
      return todayCompleted >= 5 && todaySkipped === 0;
    case "overachiever":
      return todayCompleted >= 15;
    case "balanced_day":
      const hasPriorities = { high: false, medium: false, low: false };
      todayTodos.filter(t => t.status === "done").forEach(t => {
        hasPriorities[t.priority] = true;
      });
      return hasPriorities.high && hasPriorities.medium && hasPriorities.low;
    case "early_bird":
    case "night_owl":
    case "quick_start":
      return todayCompleted >= 1;
    
    // Weekly badges  
    case "streak_3":
      return streak >= 3;
    case "streak_7":
      return streak >= 7;
    case "weekly_champion":
      return weeklyCompleted >= 50;
    case "weekend_warrior":
    case "monday_motivation":
    case "friday_finisher":
      return todayTotal > 0 && todayCompleted === todayTotal;
    case "consistent_week":
      return streak >= 7;
    
    // Monthly badges
    case "streak_30":
      return streak >= 30;
    case "centurion":
      return monthlyCompleted >= 100;
    case "task_master":
      return totalCompleted >= 50;
    case "dedication":
      return streak >= 20;
    case "priority_pro":
      return monthlyCompleted >= 30;
    
    // Quarterly badges
    case "streak_90":
      return streak >= 90;
    case "five_hundred":
      return totalCompleted >= 500;
    case "consistent_quarter":
      return streak >= 75;
    case "habit_builder":
      return totalCompleted >= 50;
    
    // Yearly badges
    case "streak_365":
      return streak >= 365;
    case "thousand":
      return totalCompleted >= 1000;
    case "year_champion":
      return streak >= 365;
    case "productivity_legend":
      return totalCompleted >= 500;
    
    default:
      return false;
  }
};

export const DailyBadges = ({ todos, onBadgeEarned }: DailyBadgesProps) => {
  const allTodos = todos;
  const { user } = useAuth();
  const [badges, setBadges] = useState<DailyBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMilestoneCard, setShowMilestoneCard] = useState(false);
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  const stats = useMemo(() => {
    const todayTodos = allTodos.filter(t => t.date === today);
    const todayCompleted = todayTodos.filter(t => t.status === "done").length;
    const todaySkipped = todayTodos.filter(t => t.status === "skipped").length;
    const todayTotal = todayTodos.length;
    
    const totalCompleted = allTodos.filter(t => t.status === "done").length;
    
    // Weekly stats
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const weeklyCompleted = allTodos.filter(t => t.date >= weekAgo && t.status === "done").length;
    
    // Monthly stats
    const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const monthlyCompleted = allTodos.filter(t => t.date >= monthAgo && t.status === "done").length;
    
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dateTodos = allTodos.filter(t => t.date === checkDate);
      const dateCompleted = dateTodos.filter(t => t.status === "done").length;
      const datePercentage = dateTodos.length > 0 ? (dateCompleted / dateTodos.length) * 100 : 0;
      
      if (dateTodos.length > 0 && datePercentage >= 80) {
        streak++;
      } else if (dateTodos.length > 0) {
        break;
      }
    }
    
    return { todayTodos, todayCompleted, todaySkipped, todayTotal, totalCompleted, weeklyCompleted, monthlyCompleted, streak };
  }, [allTodos, today]);
  
  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);
  
  useEffect(() => {
    if (user && !loading) {
      checkAndAwardBadges();
    }
  }, [stats, user, loading]);
  
  // Revoke badges when tasks are uncompleted
  useEffect(() => {
    if (user && !loading) {
      revokeBadgesIfNeeded();
    }
  }, [stats.todayCompleted, stats.todayTotal]);
  
  const fetchBadges = async () => {
    const { data, error } = await supabase
      .from("daily_badges")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setBadges(data as DailyBadge[]);
    }
    setLoading(false);
  };
  
  const revokeBadgesIfNeeded = async () => {
    if (!user) return;
    
    const todayBadges = badges.filter(b => b.badge_date === today);
    const badgesToRevoke: string[] = [];
    
    for (const badge of todayBadges) {
      const def = BADGE_DEFINITIONS.find(d => d.type === badge.badge_type);
      if (!def) continue;
      
      const stillEarned = checkBadgeEarned(def, stats);
      
      if (!stillEarned) {
        badgesToRevoke.push(badge.id);
      }
    }
    
    if (badgesToRevoke.length > 0) {
      const { error } = await supabase
        .from("daily_badges")
        .delete()
        .in("id", badgesToRevoke);
      
      if (!error) {
        setBadges(prev => prev.filter(b => !badgesToRevoke.includes(b.id)));
        toast.info("Badge revoked - complete more tasks to earn it back!");
      }
    }
  };
  
  const checkAndAwardBadges = async () => {
    if (!user) return;
    
    const todayBadges = badges.filter(b => b.badge_date === today);
    const newBadges: Array<{
      user_id: string;
      badge_date: string;
      badge_type: string;
      badge_name: string;
      badge_icon: string;
      description: string;
      points: number;
    }> = [];
    
    for (const def of BADGE_DEFINITIONS) {
      if (todayBadges.some(b => b.badge_type === def.type)) continue;
      
      const earned = checkBadgeEarned(def, stats);
      
      if (earned) {
        newBadges.push({
          user_id: user.id,
          badge_date: today,
          badge_type: def.type,
          badge_name: def.name,
          badge_icon: def.icon,
          description: def.description,
          points: def.points,
        });
      }
    }
    
    if (newBadges.length > 0) {
      const { data, error } = await supabase
        .from("daily_badges")
        .insert(newBadges)
        .select();
      
      if (!error && data) {
        setBadges(prev => [...data as DailyBadge[], ...prev]);
        data.forEach((badge: DailyBadge) => {
          toast.success(`🏆 ${badge.badge_name}!`, {
            description: `${badge.description} (+${badge.points} pts)`,
          });
        });
        onBadgeEarned?.();
      }
    }
  };
  
  const todayBadgesData = badges.filter(b => b.badge_date === today);
  const recentBadges = badges.slice(0, 12);
  const totalPoints = badges.reduce((sum, b) => sum + (b.points || 10), 0);

  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Badges</h3>
              <p className="text-xs text-muted-foreground">Your achievements</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {badges.length}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-amber-500 border-amber-500/30">
              {totalPoints} pts
            </Badge>
          </div>
        </div>
        
        {/* Today's Badges with hover tooltips */}
        {todayBadgesData.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Today's Achievements</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {todayBadgesData.map((badge) => {
                const IconComponent = BADGE_ICONS[badge.badge_icon] || Award;
                const def = BADGE_DEFINITIONS.find(d => d.type === badge.badge_type);
                const categoryInfo = def ? BADGE_CATEGORIES[def.category] : null;
                
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 bg-background/60 rounded-md px-2 py-1 cursor-pointer hover:bg-background/80 transition-colors">
                        <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-foreground">{badge.badge_name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">{badge.badge_name}</span>
                          {categoryInfo && (
                            <Badge className={cn("text-[10px]", categoryInfo.color)}>
                              {categoryInfo.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <p className="text-xs text-amber-500 font-medium">+{badge.points} points</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Badge Collection with hover tooltips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => setShowMilestoneCard(true)}
            >
              <Gift className="w-3 h-3 mr-1" />
              Year Review
            </Button>
          </div>
          
          {loading ? (
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-4">
              <Medal className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Complete tasks to earn badges!</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {recentBadges.map((badge) => {
                const IconComponent = BADGE_ICONS[badge.badge_icon] || Award;
                const def = BADGE_DEFINITIONS.find(d => d.type === badge.badge_type);
                const categoryInfo = def ? BADGE_CATEGORIES[def.category] : null;
                
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center cursor-pointer transition-all hover:scale-110 group">
                        <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-amber-500" />
                          <span className="font-semibold">{badge.badge_name}</span>
                          {categoryInfo && (
                            <Badge className={cn("text-[10px]", categoryInfo.color)}>
                              {categoryInfo.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Earned: {format(new Date(badge.badge_date), "MMM d, yyyy")}</span>
                          <span className="text-amber-500 font-medium">+{badge.points} pts</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              {badges.length > 12 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                  <span className="text-[10px] text-muted-foreground font-medium">+{badges.length - 12}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Milestone Card Dialog */}
        <Dialog open={showMilestoneCard} onOpenChange={setShowMilestoneCard}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <MilestoneCard 
              badges={badges} 
              totalTasks={allTodos.filter(t => t.status === "done").length}
              streak={stats.streak}
              onClose={() => setShowMilestoneCard(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default DailyBadges;
