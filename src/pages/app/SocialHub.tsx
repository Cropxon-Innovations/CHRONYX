import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plug,
  FileText,
  Send,
  BarChart3,
  Clock,
  Inbox,
  Settings2,
} from "lucide-react";

// Components
import { SocialHubHeader } from "@/components/social/SocialHubHeader";
import { IntegrationsPanel } from "@/components/social/IntegrationsPanel";
import { PostComposer, type ComposerData } from "@/components/social/PostComposer";
import { PostPreviewDialog } from "@/components/social/PostPreviewDialog";
import { FetchedPostsFeed } from "@/components/social/FetchedPostsFeed";
import { ApprovalQueue } from "@/components/social/ApprovalQueue";
import { PublishQueueDisplay } from "@/components/social/PublishQueueDisplay";

// Types and Mock Data
import type { SocialIntegration, PlatformConfig, SocialPost, SocialDraft, PublishQueueItem, MediaAttachment } from "@/components/social/SocialHubTypes";
import { 
  MOCK_PLATFORM_CONFIGS, 
  MOCK_INTEGRATIONS, 
  MOCK_POSTS, 
  MOCK_DRAFTS, 
  MOCK_QUEUE 
} from "@/components/social/mockData";

const SocialHub = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("compose");
  
  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ComposerData | null>(null);
  
  // Demo mode - using mock data
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Local state for demo data (in production, this comes from Supabase)
  const [integrations, setIntegrations] = useState<SocialIntegration[]>(MOCK_INTEGRATIONS);
  const [posts, setPosts] = useState<SocialPost[]>(MOCK_POSTS);
  const [drafts, setDrafts] = useState<SocialDraft[]>(MOCK_DRAFTS);
  const [queueItems, setQueueItems] = useState<PublishQueueItem[]>(MOCK_QUEUE);
  const platformConfigs = MOCK_PLATFORM_CONFIGS;

  // Fetch platform configs from DB (when not in demo mode)
  const { data: dbPlatformConfigs } = useQuery({
    queryKey: ["social-platform-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_platform_config")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as PlatformConfig[];
    },
    enabled: !isDemoMode && !!user?.id,
  });

  // Fetch integrations from DB
  const { data: dbIntegrations } = useQuery({
    queryKey: ["social-integrations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_integrations")
        .select("*")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data as SocialIntegration[];
    },
    enabled: !isDemoMode && !!user?.id,
  });

  // Handlers for Integration Panel
  const handleConnect = useCallback((platform: PlatformConfig, method: "oauth" | "api_key", credentials?: { apiKey: string; apiSecret?: string }) => {
    if (isDemoMode) {
      // Demo: Add mock integration
      const newIntegration: SocialIntegration = {
        id: `int-${Date.now()}`,
        user_id: user?.id || "demo-user",
        platform: platform.platform,
        connection_type: method,
        platform_user_id: `user-${platform.platform}`,
        platform_username: `demo_${platform.platform}`,
        platform_display_name: `Demo ${platform.display_name}`,
        platform_avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform.platform}`,
        platform_metadata: {},
        status: "connected",
        last_sync_at: new Date().toISOString(),
        error_message: null,
        scopes: platform.oauth_scopes || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setIntegrations(prev => [...prev, newIntegration]);
      toast({ title: `${platform.display_name} connected!`, description: "Demo connection successful" });
    } else {
      // TODO: Real OAuth/API key connection
      toast({ title: "Coming Soon", description: "Real API integration will be available soon" });
    }
  }, [isDemoMode, user?.id, toast]);

  const handleSync = useCallback((integration: SocialIntegration) => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id 
          ? { ...i, last_sync_at: new Date().toISOString(), status: "connected" as const }
          : i
      ));
      setIsSyncing(false);
      toast({ title: "Synced!", description: `${integration.platform} data refreshed` });
    }, 1500);
  }, [toast]);

  const handleDisconnect = useCallback((integration: SocialIntegration) => {
    setIntegrations(prev => prev.filter(i => i.id !== integration.id));
    toast({ title: "Disconnected", description: `${integration.platform} removed` });
  }, [toast]);

  const handleSyncAll = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => ({
        ...i,
        last_sync_at: new Date().toISOString(),
        status: i.status === "expired" ? "expired" : "connected",
      })));
      setIsSyncing(false);
      toast({ title: "All Synced!", description: "All connected platforms refreshed" });
    }, 2000);
  }, [toast]);

  // Handlers for Post Composer
  const handleSubmitPost = useCallback((data: ComposerData) => {
    const newDraft: SocialDraft = {
      id: `draft-${Date.now()}`,
      user_id: user?.id || "demo-user",
      title: null,
      content_text: data.content,
      media_attachments: data.mediaAttachments,
      post_type: data.mediaAttachments.length > 0 ? (data.mediaAttachments[0].type as any) : "text",
      platform_content: data.platformOverrides,
      target_platforms: data.targetPlatforms,
      scheduled_at: data.scheduledAt?.toISOString() || null,
      timezone: "Asia/Kolkata",
      status: data.requiresApproval ? "pending_approval" : (data.scheduledAt ? "scheduled" : "approved"),
      requires_approval: data.requiresApproval,
      approved_at: data.requiresApproval ? null : new Date().toISOString(),
      approved_by: data.requiresApproval ? null : user?.id || "demo-user",
      rejection_reason: null,
      preview_generated_at: null,
      preview_data: {},
      tags: data.tags,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDrafts(prev => [newDraft, ...prev]);

    // If approved and scheduled, add to queue
    if (!data.requiresApproval || data.scheduledAt) {
      const newQueueItems = data.targetPlatforms.map(platform => {
        const integration = integrations.find(i => i.platform === platform);
        return {
          id: `queue-${Date.now()}-${platform}`,
          user_id: user?.id || "demo-user",
          draft_id: newDraft.id,
          integration_id: integration?.id || "",
          platform,
          status: "pending" as const,
          priority: 5,
          scheduled_at: data.scheduledAt?.toISOString() || new Date().toISOString(),
          started_at: null,
          completed_at: null,
          retry_count: 0,
          max_retries: 3,
          last_error: null,
          next_retry_at: null,
          published_id: null,
          created_at: new Date().toISOString(),
        };
      });
      setQueueItems(prev => [...newQueueItems, ...prev]);
    }

    setPreviewOpen(false);
    toast({
      title: data.requiresApproval ? "Submitted for Approval" : (data.scheduledAt ? "Post Scheduled!" : "Post Queued!"),
      description: `Targeting ${data.targetPlatforms.length} platform(s)`,
    });
    setActiveTab("queue");
  }, [user?.id, integrations, toast]);

  const handlePreviewPost = useCallback((data: ComposerData) => {
    setPreviewData(data);
    setPreviewOpen(true);
  }, []);

  // Handlers for Approval Queue
  const handleApprove = useCallback((draftId: string) => {
    setDrafts(prev => prev.map(d => 
      d.id === draftId 
        ? { ...d, status: "approved" as const, approved_at: new Date().toISOString(), approved_by: user?.id || "demo-user" }
        : d
    ));
    
    // Add to queue
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      const newQueueItems = draft.target_platforms.map(platform => {
        const integration = integrations.find(i => i.platform === platform);
        return {
          id: `queue-${Date.now()}-${platform}`,
          user_id: user?.id || "demo-user",
          draft_id: draftId,
          integration_id: integration?.id || "",
          platform,
          status: "pending" as const,
          priority: 5,
          scheduled_at: draft.scheduled_at || new Date().toISOString(),
          started_at: null,
          completed_at: null,
          retry_count: 0,
          max_retries: 3,
          last_error: null,
          next_retry_at: null,
          published_id: null,
          created_at: new Date().toISOString(),
        };
      });
      setQueueItems(prev => [...newQueueItems, ...prev]);
    }
    
    toast({ title: "Approved!", description: "Post added to publishing queue" });
  }, [drafts, integrations, user?.id, toast]);

  const handleReject = useCallback((draftId: string, reason: string) => {
    setDrafts(prev => prev.map(d => 
      d.id === draftId 
        ? { ...d, status: "cancelled" as const, rejection_reason: reason }
        : d
    ));
    toast({ title: "Rejected", description: "Post has been rejected" });
  }, [toast]);

  const handleDeleteDraft = useCallback((draftId: string) => {
    setDrafts(prev => prev.filter(d => d.id !== draftId));
    setQueueItems(prev => prev.filter(q => q.draft_id !== draftId));
    toast({ title: "Deleted", description: "Draft removed" });
  }, [toast]);

  const handleEditDraft = useCallback((draft: SocialDraft) => {
    // TODO: Open composer with draft data
    toast({ title: "Edit Mode", description: "Edit functionality coming soon" });
  }, [toast]);

  const handlePreviewDraft = useCallback((draft: SocialDraft) => {
    const data: ComposerData = {
      content: draft.content_text,
      title: draft.title || undefined,
      mediaAttachments: draft.media_attachments,
      targetPlatforms: draft.target_platforms,
      scheduledAt: draft.scheduled_at ? new Date(draft.scheduled_at) : undefined,
      requiresApproval: draft.requires_approval,
      tags: draft.tags || [],
      platformOverrides: draft.platform_content,
    };
    setPreviewData(data);
    setPreviewOpen(true);
  }, []);

  // Handlers for Publish Queue
  const handleRetryQueue = useCallback((itemId: string) => {
    setQueueItems(prev => prev.map(q => 
      q.id === itemId 
        ? { ...q, status: "pending" as const, retry_count: q.retry_count + 1, last_error: null }
        : q
    ));
    toast({ title: "Retrying...", description: "Post will be retried shortly" });
  }, [toast]);

  const handleCancelQueue = useCallback((itemId: string) => {
    setQueueItems(prev => prev.map(q => 
      q.id === itemId 
        ? { ...q, status: "cancelled" as const }
        : q
    ));
    toast({ title: "Cancelled", description: "Publish job cancelled" });
  }, [toast]);

  // Connected integrations for composer
  const connectedIntegrations = integrations.filter(i => i.status === "connected");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header with Stats */}
        <SocialHubHeader 
          integrations={integrations}
          drafts={drafts}
          queueItems={queueItems}
        />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="compose" className="gap-2 data-[state=active]:bg-background">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Compose</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-background">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="approval" className="gap-2 data-[state=active]:bg-background relative">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Approval</span>
              {drafts.filter(d => d.status === "pending_approval").length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[10px] text-white flex items-center justify-center">
                  {drafts.filter(d => d.status === "pending_approval").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-background">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Queue</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-2 data-[state=active]:bg-background">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="mt-0">
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <PostComposer
                  integrations={connectedIntegrations}
                  platformConfigs={platformConfigs}
                  onSubmit={handleSubmitPost}
                  onPreview={handlePreviewPost}
                  isSubmitting={isPublishing}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="sticky top-6 space-y-4">
                  {/* Quick Tips */}
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h3 className="font-medium mb-2 text-sm">💡 Tips</h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li>• Use hashtags for better reach</li>
                      <li>• Schedule posts for peak engagement times</li>
                      <li>• Preview before publishing to check formatting</li>
                      <li>• Enable approval for team review workflow</li>
                    </ul>
                  </div>
                  
                  {/* Recent Drafts */}
                  {drafts.length > 0 && (
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <h3 className="font-medium mb-2 text-sm">📝 Recent Drafts</h3>
                      <div className="space-y-2">
                        {drafts.slice(0, 3).map(draft => (
                          <div 
                            key={draft.id} 
                            className="text-xs p-2 rounded bg-background cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handlePreviewDraft(draft)}
                          >
                            <p className="truncate">{draft.content_text.substring(0, 50)}...</p>
                            <p className="text-muted-foreground mt-1">
                              {draft.target_platforms.join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-0">
            <IntegrationsPanel
              integrations={integrations}
              platformConfigs={platformConfigs}
              onConnect={handleConnect}
              onSync={handleSync}
              onDisconnect={handleDisconnect}
              onSyncAll={handleSyncAll}
              isSyncing={isSyncing}
              isDemoMode={isDemoMode}
            />
          </TabsContent>

          {/* Approval Tab */}
          <TabsContent value="approval" className="mt-0">
            <ApprovalQueue
              drafts={drafts}
              platformConfigs={platformConfigs}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDeleteDraft}
              onEdit={handleEditDraft}
              onPreview={handlePreviewDraft}
              isProcessing={isPublishing}
            />
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="mt-0">
            <PublishQueueDisplay
              queueItems={queueItems}
              drafts={drafts}
              platformConfigs={platformConfigs}
              onRetry={handleRetryQueue}
              onCancel={handleCancelQueue}
              isProcessing={isPublishing}
            />
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="mt-0">
            <FetchedPostsFeed
              posts={posts}
              integrations={integrations}
              platformConfigs={platformConfigs}
              isLoading={isSyncing}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-8 rounded-lg border bg-muted/30 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Analytics Coming Soon</h3>
                <p className="text-sm text-muted-foreground">
                  Track engagement, reach, and performance across all your platforms.
                </p>
              </div>
              <div className="p-8 rounded-lg border bg-muted/30 text-center">
                <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Advanced Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure posting schedules, auto-publishing rules, and more.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <PostPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          data={previewData}
          integrations={connectedIntegrations}
          platformConfigs={platformConfigs}
          onApprove={() => previewData && handleSubmitPost(previewData)}
          onSchedule={() => previewData && handleSubmitPost(previewData)}
          onPublishNow={() => previewData && handleSubmitPost(previewData)}
          isProcessing={isPublishing}
        />
      </div>
    </div>
  );
};

export default SocialHub;
