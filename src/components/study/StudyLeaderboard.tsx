import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  Clock,
  Users,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  completed_topics: number;
  total_points: number;
  study_hours: number;
  current_streak: number;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null; username: string | null };
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="w-5 h-5 text-amber-500" />;
    case 2: return <Medal className="w-5 h-5 text-slate-400" />;
    case 3: return <Medal className="w-5 h-5 text-amber-700" />;
    default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1: return "bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/30";
    case 2: return "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/30";
    case 3: return "bg-gradient-to-r from-amber-700/20 to-amber-800/10 border-amber-700/30";
    default: return "bg-card border-border";
  }
};

export const StudyLeaderboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("global");

  // Fetch global leaderboard
  const { data: globalLeaderboard = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ["study-leaderboard", "global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_leaderboard")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    enabled: !!user,
  });

  // Fetch friends (using explicit type assertion since table is new)
  const { data: friends = [] } = useQuery({
    queryKey: ["study-friends", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_friends" as any)
        .select("*, profiles:friend_id(display_name, avatar_url, username)")
        .eq("user_id", user!.id)
        .eq("status", "accepted");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch friend requests
  const { data: friendRequests = [] } = useQuery({
    queryKey: ["friend-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_friends" as any)
        .select("id, user_id, friend_id, status, created_at")
        .eq("friend_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return (data || []) as unknown as FriendRequest[];
    },
    enabled: !!user,
  });

  // Search users
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq("id", user!.id)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user && searchQuery.length > 2,
  });

  // Friends leaderboard
  const friendsLeaderboard = globalLeaderboard.filter(entry =>
    entry.user_id === user?.id || friends.some((f: any) => f.friend_id === entry.user_id)
  );

  // Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase.from("study_friends" as any).insert({
        user_id: user!.id,
        friend_id: friendId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Friend request sent!");
      setSearchQuery("");
    },
    onError: () => {
      toast.error("Failed to send request");
    },
  });

  // Accept/Reject request
  const respondRequestMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const { error } = await supabase
        .from("study_friends" as any)
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["study-friends"] });
      toast.success(accept ? "Friend added!" : "Request declined");
    },
  });

  // Find current user's rank
  const userRank = globalLeaderboard.findIndex(e => e.user_id === user?.id) + 1;
  const userStats = globalLeaderboard.find(e => e.user_id === user?.id);

  if (loadingGlobal) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Stats Card */}
      {userStats && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {getRankIcon(userRank)}
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage src={userStats.avatar_url || undefined} />
                <AvatarFallback>{userStats.display_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{userStats.display_name || "You"}</p>
              <p className="text-sm text-muted-foreground">Rank #{userRank} globally</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-xl font-bold text-primary">{userStats.total_points}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-500">{userStats.current_streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-500" />
            Friend Requests ({friendRequests.length})
          </h4>
          <div className="space-y-2">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={request.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{request.profiles?.display_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium">{request.profiles?.display_name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-emerald-500"
                  onClick={() => respondRequestMutation.mutate({ id: request.id, accept: true })}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => respondRequestMutation.mutate({ id: request.id, accept: false })}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="global" className="gap-2">
              <Trophy className="w-4 h-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2">
              <Users className="w-4 h-4" />
              Friends ({friends.length})
            </TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={() => setShowAddFriend(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Friend
          </Button>
        </div>

        <TabsContent value="global" className="mt-4">
          <LeaderboardList entries={globalLeaderboard} currentUserId={user?.id} />
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          {friendsLeaderboard.length > 0 ? (
            <LeaderboardList entries={friendsLeaderboard} currentUserId={user?.id} />
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Add friends to compare progress</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Study Friend
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="pl-9"
              />
            </div>
            
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result: any) => (
                  <div key={result.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback>{result.display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{result.display_name}</p>
                      {result.username && (
                        <p className="text-xs text-muted-foreground">@{result.username}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendRequestMutation.mutate(result.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery.length > 2 && searchResults.length === 0 && !searching && (
              <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Leaderboard List Component
const LeaderboardList = ({ 
  entries, 
  currentUserId 
}: { 
  entries: LeaderboardEntry[]; 
  currentUserId?: string;
}) => {
  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const rank = index + 1;
        const isCurrentUser = entry.user_id === currentUserId;
        
        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl border transition-all",
              getRankBg(rank),
              isCurrentUser && "ring-2 ring-primary/30"
            )}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(rank)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback>{entry.display_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
                {entry.display_name || "Anonymous"}
                {isCurrentUser && <Badge variant="secondary" className="ml-2 text-[10px]">You</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.completed_topics} topics completed
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-right">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-foreground">{entry.total_points}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-muted-foreground">{entry.current_streak}d</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">{entry.study_hours}h</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
