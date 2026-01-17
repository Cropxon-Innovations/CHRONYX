import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Repeat2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { SocialPost, SocialIntegration, PlatformConfig } from "./SocialHubTypes";

interface FetchedPostsFeedProps {
  posts: SocialPost[];
  integrations: SocialIntegration[];
  platformConfigs: PlatformConfig[];
  isLoading?: boolean;
}

export const FetchedPostsFeed = ({
  posts,
  integrations,
  platformConfigs,
  isLoading = false,
}: FetchedPostsFeedProps) => {
  const getIntegration = (integrationId: string) =>
    integrations.find((i) => i.id === integrationId);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "video":
      case "reel":
        return "🎬";
      case "image":
        return "📷";
      case "article":
        return "📰";
      case "poll":
        return "📊";
      case "story":
        return "⏱️";
      default:
        return "📝";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connect a platform and sync to see your posts here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {posts.map((post) => {
          const integration = getIntegration(post.integration_id);
          const Icon = getPlatformIcon(post.platform);
          const color = getPlatformColor(post.platform);
          const config = platformConfigs.find((c) => c.platform === post.platform);

          return (
            <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {integration?.platform_avatar_url && (
                      <AvatarImage src={integration.platform_avatar_url} />
                    )}
                    <AvatarFallback style={{ backgroundColor: `${color}20` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {integration?.platform_display_name || integration?.platform_username}
                      </p>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config?.display_name || post.platform}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.posted_at), { addSuffix: true })}
                      <span className="mx-1">•</span>
                      {getPostTypeIcon(post.post_type)} {post.post_type}
                    </p>
                  </div>
                  {post.platform_permalink && (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={post.platform_permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {post.content_preview || post.content_text ? (
                    <p className="text-sm whitespace-pre-wrap line-clamp-4 mb-3">
                      {post.content_preview || post.content_text}
                    </p>
                  ) : null}

                  {/* Media thumbnails */}
                  {post.thumbnails && (post.thumbnails as string[]).length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {(post.thumbnails as string[]).slice(0, 3).map((url, idx) => (
                        <div key={idx} className="aspect-square rounded overflow-hidden bg-muted">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {post.hashtags.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.hashtags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Engagement metrics */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4" />
                      {formatNumber(post.likes_count)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      {formatNumber(post.comments_count)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Repeat2 className="h-4 w-4" />
                      {formatNumber(post.shares_count)}
                    </span>
                    {post.views_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-4 w-4" />
                        {formatNumber(post.views_count)}
                      </span>
                    )}
                    {post.engagement_rate && (
                      <span className="flex items-center gap-1.5 ml-auto text-green-500">
                        <TrendingUp className="h-4 w-4" />
                        {post.engagement_rate}% engagement
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
