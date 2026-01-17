import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { LiveClock } from "./LiveClock";
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
} from "lucide-react";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export const TopHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { getCurrentPlan, loading: planLoading } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const plan = getCurrentPlan();
  
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
  }, [user]);
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const getPlanBadge = () => {
    switch (plan) {
      case "premium":
        return { label: "Premium", color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white" };
      case "pro":
        return { label: "Pro", color: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" };
      default:
        return { label: "Free", color: "bg-muted text-muted-foreground" };
    }
  };
  
  const planBadge = getPlanBadge();

  return (
    <div className="hidden lg:flex fixed top-0 right-0 left-64 h-14 bg-background/80 backdrop-blur-sm border-b border-border z-30 items-center justify-between px-6 transition-all duration-300">
      {/* Left - Clock */}
      <LiveClock />
      
      {/* Right - Plan, Settings, User Menu */}
      <div className="flex items-center gap-3">
        {/* Plan Badge */}
        {!planLoading && (
          <Link to="/app/profile">
            <Badge className={cn("cursor-pointer hover:opacity-90 transition-opacity", planBadge.color)}>
              {plan !== "free" && <Crown className="w-3 h-3 mr-1" />}
              {planBadge.label}
            </Badge>
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
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/app/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/app/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 focus:text-rose-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopHeader;
