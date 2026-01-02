import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Globe,
  Linkedin,
  Github,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Send,
  Calendar,
  Clock
} from "lucide-react";
import { format } from "date-fns";

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "github", name: "GitHub", icon: Github, color: "#181717" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E4405F" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "#FF0000" },
  { id: "twitter", name: "Twitter / X", icon: Twitter, color: "#1DA1F2" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { id: "telegram", name: "Telegram", icon: Send, color: "#0088CC" },
  { id: "other", name: "Other", icon: Globe, color: "#6B7280" },
];

interface SocialProfile {
  id: string;
  platform: string;
  custom_name: string | null;
  username: string | null;
  profile_url: string | null;
  logo_url: string | null;
  connection_type: string;
  last_post_date: string | null;
  last_sync_at: string | null;
  notes_encrypted: string | null;
  status: string | null;
  created_at: string;
}

const Social = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SocialProfile | null>(null);
  const [formData, setFormData] = useState({
    platform: "",
    custom_name: "",
    username: "",
    profile_url: "",
    last_post_date: "",
    notes: ""
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["social-profiles", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as SocialProfile[];
    },
    enabled: !!user?.id
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("social_profiles").insert({
        user_id: user?.id,
        platform: data.platform,
        custom_name: data.platform === "other" ? data.custom_name : null,
        username: data.username,
        profile_url: data.profile_url,
        last_post_date: data.last_post_date || null,
        notes_encrypted: data.notes,
        connection_type: "manual"
      });
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Social",
        action: `Added ${data.platform} profile`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-profiles"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Profile added successfully" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from("social_profiles")
        .update({
          platform: data.platform,
          custom_name: data.platform === "other" ? data.custom_name : null,
          username: data.username,
          profile_url: data.profile_url,
          last_post_date: data.last_post_date || null,
          notes_encrypted: data.notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", data.id);
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Social",
        action: `Updated ${data.platform} profile`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-profiles"] });
      setEditingProfile(null);
      resetForm();
      toast({ title: "Profile updated successfully" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const profile = profiles.find(p => p.id === id);
      const { error } = await supabase.from("social_profiles").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user?.id,
        module: "Social",
        action: `Removed ${profile?.platform} profile`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-profiles"] });
      toast({ title: "Profile removed" });
    }
  });

  const resetForm = () => {
    setFormData({
      platform: "",
      custom_name: "",
      username: "",
      profile_url: "",
      last_post_date: "",
      notes: ""
    });
  };

  const openEdit = (profile: SocialProfile) => {
    setEditingProfile(profile);
    setFormData({
      platform: profile.platform,
      custom_name: profile.custom_name || "",
      username: profile.username || "",
      profile_url: profile.profile_url || "",
      last_post_date: profile.last_post_date || "",
      notes: profile.notes_encrypted || ""
    });
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || PLATFORMS[PLATFORMS.length - 1];
  };

  const connectedCount = profiles.filter(p => p.connection_type === "connected").length;
  const manualCount = profiles.filter(p => p.connection_type === "manual").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-2">
            Social Identity Register
          </h1>
          <p className="text-muted-foreground text-sm">
            A private map of where you exist online
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{profiles.length}</p>
              <p className="text-xs text-muted-foreground">Platforms</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{manualCount}</p>
              <p className="text-xs text-muted-foreground">Manual</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-light">{connectedCount}</p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Button */}
        <div className="flex justify-end mb-6">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Social Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Social Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <p.icon className="h-4 w-4" style={{ color: p.color }} />
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.platform === "other" && (
                  <div>
                    <Label>Platform Name</Label>
                    <Input
                      value={formData.custom_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_name: e.target.value }))}
                      placeholder="e.g., Personal Blog"
                    />
                  </div>
                )}

                <div>
                  <Label>Username / Handle</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="@username"
                  />
                </div>

                <div>
                  <Label>Profile URL</Label>
                  <Input
                    value={formData.profile_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label>Last Post Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.last_post_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_post_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Private notes..."
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={() => addMutation.mutate(formData)} 
                  disabled={!formData.platform || addMutation.isPending}
                  className="w-full"
                >
                  {addMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profiles List */}
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-3">
            {profiles.map((profile) => {
              const platformInfo = getPlatformInfo(profile.platform);
              const Icon = platformInfo.icon;
              
              return (
                <Card key={profile.id} className="bg-card/50 border-border/50 hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${platformInfo.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: platformInfo.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            {profile.custom_name || platformInfo.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {profile.connection_type}
                          </Badge>
                        </div>
                        {profile.username && (
                          <p className="text-sm text-muted-foreground truncate">
                            {profile.username}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {profile.last_post_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Last post: {format(new Date(profile.last_post_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {profile.profile_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(profile.profile_url!, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(profile)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remove this profile?")) {
                              deleteMutation.mutate(profile.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {profiles.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No social profiles added yet</p>
                <p className="text-sm">Add your first profile to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Edit Dialog */}
        <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Platform</Label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <p.icon className="h-4 w-4" style={{ color: p.color }} />
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.platform === "other" && (
                <div>
                  <Label>Platform Name</Label>
                  <Input
                    value={formData.custom_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_name: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label>Username / Handle</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div>
                <Label>Profile URL</Label>
                <Input
                  value={formData.profile_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile_url: e.target.value }))}
                />
              </div>

              <div>
                <Label>Last Post Date</Label>
                <Input
                  type="date"
                  value={formData.last_post_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_post_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <Button 
                onClick={() => editingProfile && updateMutation.mutate({ ...formData, id: editingProfile.id })} 
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Social;
