import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Globe,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { PlatformConfig, SocialIntegration, MediaAttachment } from "./SocialHubTypes";
import type { ComposerData } from "./PostComposer";

interface PostPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ComposerData | null;
  integrations: SocialIntegration[];
  platformConfigs: PlatformConfig[];
  onApprove: () => void;
  onSchedule: () => void;
  onPublishNow: () => void;
  isProcessing?: boolean;
}

export const PostPreviewDialog = ({
  open,
  onOpenChange,
  data,
  integrations,
  platformConfigs,
  onApprove,
  onSchedule,
  onPublishNow,
  isProcessing = false,
}: PostPreviewDialogProps) => {
  if (!data) return null;

  const selectedIntegrations = integrations.filter(
    (i) => data.targetPlatforms.includes(i.platform) && i.status === "connected"
  );

  const getPlatformPreview = (platform: string, integration: SocialIntegration) => {
    const config = platformConfigs.find((c) => c.platform === platform);
    const Icon = getPlatformIcon(platform);
    const color = getPlatformColor(platform);
    const charLimit = config?.max_post_length;
    const isOverLimit = charLimit && data.content.length > charLimit;

    return (
      <Card key={platform} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Platform Header */}
          <div className="px-4 py-3 border-b flex items-center gap-3" style={{ backgroundColor: `${color}10` }}>
            <Avatar className="h-10 w-10">
              {integration.platform_avatar_url ? (
                <AvatarImage src={integration.platform_avatar_url} />
              ) : null}
              <AvatarFallback style={{ backgroundColor: color, color: "white" }}>
                <Icon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {integration.platform_display_name || integration.platform_username}
              </p>
              <p className="text-xs text-muted-foreground">
                @{integration.platform_username} • {config?.display_name}
              </p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Post Content */}
          <div className="p-4">
            {/* Text content */}
            <div className="mb-3">
              <p className={`text-sm whitespace-pre-wrap ${isOverLimit ? "text-destructive" : ""}`}>
                {data.content}
              </p>
              {data.tags.length > 0 && (
                <p className="text-sm text-primary mt-2">
                  {data.tags.map((t) => `#${t}`).join(" ")}
                </p>
              )}
            </div>

            {/* Media preview */}
            {data.mediaAttachments.length > 0 && (
              <div className="rounded-lg overflow-hidden border mb-3">
                {data.mediaAttachments.length === 1 ? (
                  data.mediaAttachments[0].type === "image" ? (
                    <img
                      src={data.mediaAttachments[0].url}
                      alt=""
                      className="w-full max-h-64 object-cover"
                    />
                  ) : (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {data.mediaAttachments.slice(0, 4).map((media, idx) => (
                      <div key={media.id} className="relative aspect-square">
                        {media.type === "image" ? (
                          <img
                            src={media.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {idx === 3 && data.mediaAttachments.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              +{data.mediaAttachments.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Character count warning */}
            {isOverLimit && (
              <div className="flex items-center gap-2 text-xs text-destructive mb-3">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  {data.content.length}/{charLimit} characters (exceeds limit)
                </span>
              </div>
            )}

            {/* Fake engagement */}
            <div className="flex items-center gap-6 text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="ml-auto hover:text-primary transition-colors">
                <Bookmark className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Timestamp */}
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              {data.scheduledAt
                ? `Scheduled for ${format(data.scheduledAt, "MMM d, yyyy 'at' h:mm a")}`
                : "Publishing now"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Post Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your post will appear on each platform
          </DialogDescription>
        </DialogHeader>

        {selectedIntegrations.length > 1 ? (
          <Tabs defaultValue={selectedIntegrations[0]?.platform} className="w-full">
            <TabsList className="w-full justify-start mb-4 flex-wrap h-auto gap-2">
              {selectedIntegrations.map((integration) => {
                const Icon = getPlatformIcon(integration.platform);
                const color = getPlatformColor(integration.platform);
                return (
                  <TabsTrigger
                    key={integration.platform}
                    value={integration.platform}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                    {integration.platform}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollArea className="h-[400px]">
              {selectedIntegrations.map((integration) => (
                <TabsContent key={integration.platform} value={integration.platform}>
                  {getPlatformPreview(integration.platform, integration)}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        ) : selectedIntegrations.length === 1 ? (
          <ScrollArea className="h-[400px]">
            {getPlatformPreview(selectedIntegrations[0].platform, selectedIntegrations[0])}
          </ScrollArea>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No platforms selected
          </p>
        )}

        <Separator />

        {/* Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            {data.targetPlatforms.length} platforms
          </span>
          {data.mediaAttachments.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              {data.mediaAttachments.length} media
            </span>
          )}
          {data.scheduledAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Scheduled
            </span>
          )}
          {data.requiresApproval && (
            <Badge variant="outline">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Requires Approval
            </Badge>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Edit
          </Button>
          {data.requiresApproval ? (
            <Button onClick={onApprove} disabled={isProcessing}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isProcessing ? "Submitting..." : "Submit for Approval"}
            </Button>
          ) : data.scheduledAt ? (
            <Button onClick={onSchedule} disabled={isProcessing}>
              <Clock className="h-4 w-4 mr-2" />
              {isProcessing ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          ) : (
            <Button onClick={onPublishNow} disabled={isProcessing}>
              <Send className="h-4 w-4 mr-2" />
              {isProcessing ? "Publishing..." : "Publish Now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
