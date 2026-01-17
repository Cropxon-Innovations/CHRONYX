import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { PublishQueueItem, SocialDraft, PlatformConfig } from "./SocialHubTypes";

interface PublishQueueDisplayProps {
  queueItems: PublishQueueItem[];
  drafts: SocialDraft[];
  platformConfigs: PlatformConfig[];
  onRetry: (itemId: string) => void;
  onCancel: (itemId: string) => void;
  isProcessing?: boolean;
}

export const PublishQueueDisplay = ({
  queueItems,
  drafts,
  platformConfigs,
  onRetry,
  onCancel,
  isProcessing = false,
}: PublishQueueDisplayProps) => {
  const getDraft = (draftId: string) => drafts.find((d) => d.id === draftId);
  const getConfig = (platform: string) => platformConfigs.find((c) => c.platform === platform);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      completed: "bg-green-500/10 text-green-500 border-green-500/30",
      failed: "bg-destructive/10 text-destructive border-destructive/30",
      cancelled: "bg-muted text-muted-foreground border-muted",
    };

    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const pendingCount = queueItems.filter((q) => q.status === "pending").length;
  const processingCount = queueItems.filter((q) => q.status === "processing").length;
  const completedCount = queueItems.filter((q) => q.status === "completed").length;
  const failedCount = queueItems.filter((q) => q.status === "failed").length;

  const activeItems = queueItems.filter((q) => ["pending", "processing"].includes(q.status));
  const historyItems = queueItems.filter((q) =>
    ["completed", "failed", "cancelled"].includes(q.status)
  );

  return (
    <div className="space-y-6">
      {/* Queue Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 text-center">
            <Loader2 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{processingCount}</p>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-3 text-center">
            <XCircle className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Queue */}
      {activeItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4" />
              Active Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {activeItems.map((item) => {
                  const draft = getDraft(item.draft_id);
                  const Icon = getPlatformIcon(item.platform);
                  const color = getPlatformColor(item.platform);
                  const config = getConfig(item.platform);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {config?.display_name || item.platform}
                          </p>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {draft?.content_text?.substring(0, 50)}...
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.scheduled_at), "MMM d, h:mm a")}
                          {item.retry_count > 0 && (
                            <span className="text-amber-500">
                              (Retry {item.retry_count}/{item.max_retries})
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCancel(item.id)}
                        disabled={isProcessing || item.status === "processing"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No publish history yet
            </p>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {historyItems.map((item) => {
                  const Icon = getPlatformIcon(item.platform);
                  const color = getPlatformColor(item.platform);
                  const config = getConfig(item.platform);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 border rounded text-sm"
                    >
                      {getStatusIcon(item.status)}
                      <Icon className="h-4 w-4" style={{ color }} />
                      <span className="flex-1 truncate">
                        {config?.display_name || item.platform}
                      </span>
                      {item.completed_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })}
                        </span>
                      )}
                      {item.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(item.id)}
                          disabled={isProcessing}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {queueItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">📤</div>
            <p className="font-medium">Queue Empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Posts will appear here when scheduled for publishing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
