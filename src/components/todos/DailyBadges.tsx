import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { 
  Trophy, Star, Zap, Flame, Target, Crown, Medal, Award,
  Sparkles, CheckCircle2, Rocket, Brain, Coffee, Moon
} from "lucide-react";
import { toast } from "sonner";

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

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  flame: Flame,
  target: Target,
  crown: Crown,
  medal: Medal,
  award: Award,
  sparkles: Sparkles,
  check: CheckCircle2,
  rocket: Rocket,
  brain: Brain,
  coffee: Coffee,
  moon: Moon,
};

const BADGE_DEFINITIONS = [
  { type: "perfect_day", name: "Perfect Day", icon: "crown", description: "Complete 100% of tasks", check: (completed: number, total: number) => total > 0 && completed === total },
  { type: "early_bird", name: "Early Bird", icon: "coffee", description: "Complete 3+ tasks before noon", check: () => false },
  { type: "streak_3", name: "On Fire", icon: "flame", description: "3-day completion streak", checkStreak: (streak: number) => streak >= 3 },
  { type: "streak_7", name: "Week Warrior", icon: "trophy", description: "7-day completion streak", checkStreak: (streak: number) => streak >= 7 },
  { type: "streak_30", name: "Monthly Master", icon: "crown", description: "30-day completion streak", checkStreak: (streak: number) => streak >= 30 },
  { type: "high_achiever", name: "High Achiever", icon: "star", description: "Complete all high priority tasks", checkPriority: (todos: Todo[]) => {
    const highPriority = todos.filter(t => t.priority === "high");
    return highPriority.length > 0 && highPriority.every(t => t.status === "done");
  }},
  { type: "productivity_pro", name: "Productivity Pro", icon: "rocket", description: "Complete 10+ tasks in a day", check: (completed: number) => completed >= 10 },
  { type: "consistent", name: "Consistent", icon: "target", description: "Maintain 80%+ completion rate", check: (completed: number, total: number) => total > 0 && (completed / total) >= 0.8 },
  { type: "task_master", name: "Task Master", icon: "brain", description: "Complete 50 tasks total", checkTotal: (total: number) => total >= 50 },
  { type: "centurion", name: "Centurion", icon: "medal", description: "Complete 100 tasks total", checkTotal: (total: number) => total >= 100 },
];

export const DailyBadges = ({ todos, onBadgeEarned }: DailyBadgesProps) => {
  const allTodos = todos;
  const { user } = useAuth();
  const [badges, setBadges] = useState<DailyBadge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = format(new Date(), "yyyy-MM-dd");
  
  const stats = useMemo(() => {
    const todayTodos = allTodos.filter(t => t.date === today);
    const todayCompleted = todayTodos.filter(t => t.status === "done").length;
    const todayTotal = todayTodos.length;
    
    const totalCompleted = allTodos.filter(t => t.status === "done").length;
    
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
    
    return { todayTodos, todayCompleted, todayTotal, totalCompleted, streak };
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
      
      let earned = false;
      
      if (def.check) {
        earned = def.check(stats.todayCompleted, stats.todayTotal);
      } else if (def.checkStreak) {
        earned = def.checkStreak(stats.streak);
      } else if (def.checkPriority) {
        earned = def.checkPriority(stats.todayTodos);
      } else if (def.checkTotal) {
        earned = def.checkTotal(stats.totalCompleted);
      }
      
      if (earned) {
        newBadges.push({
          user_id: user.id,
          badge_date: today,
          badge_type: def.type,
          badge_name: def.name,
          badge_icon: def.icon,
          description: def.description,
          points: def.type.includes("streak_30") ? 100 : def.type.includes("streak_7") ? 50 : 10,
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
        data.forEach((badge: any) => {
          toast.success(`🏆 Badge Earned: ${badge.badge_name}!`, {
            description: badge.description,
          });
        });
        onBadgeEarned?.();
      }
    }
  };
  
  const todayBadgesData = badges.filter(b => b.badge_date === today);
  const recentBadges = badges.slice(0, 8);
  const totalPoints = badges.reduce((sum, b) => sum + (b.points || 10), 0);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
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
      
      {/* Today's Badges */}
      {todayBadgesData.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Today's Achievements</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {todayBadgesData.map((badge) => {
              const IconComponent = BADGE_ICONS[badge.badge_icon] || Award;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 bg-background/60 rounded-md px-2 py-1"
                  title={badge.description}
                >
                  <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-foreground">{badge.badge_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Badge Collection */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection</span>
        
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
              return (
                <div
                  key={badge.id}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center cursor-pointer transition-colors group"
                  title={`${badge.badge_name} - ${badge.description}`}
                >
                  <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              );
            })}
            {badges.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">+{badges.length - 8}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyBadges;
