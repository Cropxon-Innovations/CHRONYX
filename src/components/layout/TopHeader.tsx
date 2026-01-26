import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { LiveClock } from "./LiveClock";
import { HeaderQuote } from "./HeaderQuote";
import { LifespanSpinner } from "./LifespanSpinner";
import { GlobalSearch } from "./GlobalSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  LogOut,
  User,
  Crown,
  ChevronDown,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Search,
  Command,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export const TopHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { getCurrentPlan, loading: planLoading } = useSubscription();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const plan = getCurrentPlan();
  
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  
  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as UserProfile);
    };
    fetchProfile();
    
    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user?.id}` },
        (payload) => {
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const getPlanConfig = () => {
    switch (plan) {
      case "premium":
        return { 
          label: "Premium", 
          icon: Crown,
          className: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-500/25 border-0",
          glowColor: "amber"
        };
      case "pro":
        return { 
          label: "Pro", 
          icon: Zap,
          className: "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-0",
          glowColor: "indigo"
        };
      default:
        return { 
          label: "Free", 
          icon: Sparkles,
          className: "bg-muted text-muted-foreground hover:bg-muted/80",
          glowColor: null
        };
    }
  };
  
  const planConfig = getPlanConfig();
  const PlanIcon = planConfig.icon;

  return (
    <div className="hidden lg:flex fixed top-0 right-0 left-64 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-30 items-center justify-between px-6 transition-all duration-300">
      {/* Left - Lifespan Spinner & Clock */}
      <div className="flex items-center gap-3">
        <LifespanSpinner />
        <LiveClock />
      </div>
      
      {/* Center - Motivational Quote */}
      <HeaderQuote />
      
      {/* Right - Search, Theme Toggle, Plan, Settings, User Menu */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSearchOpen(true)}
          className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
          <span className="hidden xl:inline text-sm">Search</span>
          <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded ml-1">
            <Command className="w-3 h-3 inline" />K
          </kbd>
        </Button>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
        
        {/* Plan Badge with animation */}
        {!planLoading && (
          <Link to="/app/profile">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                className={cn(
                  "cursor-pointer transition-all flex items-center gap-1.5 px-3 py-1",
                  planConfig.className
                )}
              >
                <PlanIcon className="w-3.5 h-3.5" />
                <span className="font-medium">{planConfig.label}</span>
              </Badge>
            </motion.div>
          </Link>
        )}
        
        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/app/settings")}
          className="h-9 w-9"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="w-7 h-7">
                {profile?.avatar_url?.startsWith("emoji:") ? (
                  <AvatarFallback className="text-sm bg-muted">
                    {profile.avatar_url.replace("emoji:", "")}
                  </AvatarFallback>
                ) : profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-muted">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge 
                className={cn(
                  "mt-2 text-xs",
                  plan === "premium" 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                    : plan === "pro"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "bg-muted text-muted-foreground"
                )}
              >
                <PlanIcon className="w-3 h-3 mr-1" />
                {planConfig.label} Plan
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/app/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile & Subscription
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/app/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            {plan === "free" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")} className="text-primary">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 focus:text-rose-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Global Search Dialog */}
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </div>
  );
};

export default TopHeader;