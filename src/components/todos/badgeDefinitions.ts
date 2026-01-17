import { 
  Trophy, Star, Zap, Flame, Target, Crown, Medal, Award,
  Sparkles, CheckCircle2, Rocket, Brain, Coffee, Moon,
  Sun, Calendar, Clock, Heart, Shield, Gem, Gift, 
  PartyPopper, TrendingUp, Mountain, Sunrise, Sunset,
  Timer, BookOpen, Lightbulb, ThumbsUp, Stars, LucideIcon
} from "lucide-react";

// Badge Icon Map
export const BADGE_ICONS: Record<string, LucideIcon> = {
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
  sun: Sun,
  calendar: Calendar,
  clock: Clock,
  heart: Heart,
  shield: Shield,
  gem: Gem,
  gift: Gift,
  party: PartyPopper,
  trending: TrendingUp,
  mountain: Mountain,
  sunrise: Sunrise,
  sunset: Sunset,
  timer: Timer,
  book: BookOpen,
  lightbulb: Lightbulb,
  thumbsup: ThumbsUp,
  stars: Stars,
};

// Badge categories with colors
export const BADGE_CATEGORIES = {
  daily: { label: "Daily", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  weekly: { label: "Weekly", color: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
  monthly: { label: "Monthly", color: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  quarterly: { label: "Quarterly", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
  yearly: { label: "Yearly", color: "bg-rose-500/20 text-rose-500 border-rose-500/30" },
} as const;

// Badge definition type
export interface BadgeDefinition {
  type: string;
  name: string;
  icon: string;
  category: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  description: string;
  points: number;
}

// Badge definitions - 30 badges across all categories
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Daily badges (10)
  { type: "perfect_day", name: "Perfect Day", icon: "crown", category: "daily", description: "Complete 100% of tasks in a day", points: 15 },
  { type: "high_achiever", name: "High Achiever", icon: "star", category: "daily", description: "Complete all high priority tasks", points: 15 },
  { type: "productivity_pro", name: "Productivity Pro", icon: "rocket", category: "daily", description: "Complete 10+ tasks in a day", points: 20 },
  { type: "consistent", name: "Consistent", icon: "target", category: "daily", description: "Maintain 80%+ completion rate", points: 10 },
  { type: "focus_master", name: "Focus Master", icon: "brain", category: "daily", description: "Complete 5 tasks without skipping", points: 12 },
  { type: "overachiever", name: "Overachiever", icon: "trending", category: "daily", description: "Complete 15+ tasks in a day", points: 25 },
  { type: "balanced_day", name: "Balanced Day", icon: "heart", category: "daily", description: "Complete tasks from all priority levels", points: 10 },
  { type: "early_bird", name: "Early Bird", icon: "sunrise", category: "daily", description: "Start your day productively", points: 10 },
  { type: "night_owl", name: "Night Owl", icon: "moon", category: "daily", description: "Complete tasks after hours", points: 8 },
  { type: "quick_start", name: "Quick Start", icon: "zap", category: "daily", description: "Complete first task quickly", points: 8 },
  
  // Weekly badges (7)
  { type: "streak_3", name: "On Fire", icon: "flame", category: "weekly", description: "3-day completion streak", points: 20 },
  { type: "streak_7", name: "Week Warrior", icon: "trophy", category: "weekly", description: "7-day completion streak", points: 50 },
  { type: "weekly_champion", name: "Weekly Champion", icon: "medal", category: "weekly", description: "Complete 50+ tasks in a week", points: 40 },
  { type: "weekend_warrior", name: "Weekend Warrior", icon: "sun", category: "weekly", description: "Complete all weekend tasks", points: 30 },
  { type: "monday_motivation", name: "Monday Motivation", icon: "coffee", category: "weekly", description: "Start week strong", points: 15 },
  { type: "friday_finisher", name: "Friday Finisher", icon: "party", category: "weekly", description: "End week with 0 pending", points: 35 },
  { type: "consistent_week", name: "Consistent Week", icon: "calendar", category: "weekly", description: "80%+ completion for 7 days", points: 45 },
  
  // Monthly badges (5)
  { type: "streak_30", name: "Monthly Master", icon: "crown", category: "monthly", description: "30-day completion streak", points: 100 },
  { type: "centurion", name: "Centurion", icon: "shield", category: "monthly", description: "Complete 100 tasks in a month", points: 80 },
  { type: "task_master", name: "Task Master", icon: "gem", category: "monthly", description: "Complete 50 tasks total", points: 50 },
  { type: "dedication", name: "Dedication", icon: "heart", category: "monthly", description: "Use app for 20+ days", points: 60 },
  { type: "priority_pro", name: "Priority Pro", icon: "lightbulb", category: "monthly", description: "Complete 30+ high priority tasks", points: 70 },
  
  // Quarterly badges (4)
  { type: "streak_90", name: "Quarter Champion", icon: "mountain", category: "quarterly", description: "90-day completion streak", points: 250 },
  { type: "five_hundred", name: "500 Club", icon: "stars", category: "quarterly", description: "Complete 500 tasks total", points: 200 },
  { type: "consistent_quarter", name: "Consistent Quarter", icon: "trending", category: "quarterly", description: "Maintain 75%+ for 3 months", points: 180 },
  { type: "habit_builder", name: "Habit Builder", icon: "timer", category: "quarterly", description: "Complete recurring tasks 50+ times", points: 150 },
  
  // Yearly badges (4)
  { type: "streak_365", name: "Year Legend", icon: "crown", category: "yearly", description: "365-day completion streak", points: 1000 },
  { type: "thousand", name: "Thousand Strong", icon: "gem", category: "yearly", description: "Complete 1000 tasks total", points: 500 },
  { type: "year_champion", name: "Year Champion", icon: "trophy", category: "yearly", description: "Complete tasks every day for a year", points: 1000 },
  { type: "productivity_legend", name: "Productivity Legend", icon: "sparkles", category: "yearly", description: "Earn 50+ badges in a year", points: 750 },
];
