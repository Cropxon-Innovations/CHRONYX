import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ImagePlus,
  Video,
  Music,
  Link2,
  Send,
  Clock,
  Eye,
  Sparkles,
  AlertCircle,
  X,
  Calendar,
  CheckCircle2,
  FileText,
  Hash,
  AtSign,
} from "lucide-react";
import { format } from "date-fns";
import { getPlatformIcon, getPlatformColor } from "./PlatformIcons";
import type { SocialIntegration, PlatformConfig, MediaAttachment } from "./SocialHubTypes";

interface PostComposerProps {
  integrations: SocialIntegration[];
  platformConfigs: PlatformConfig[];
  onSubmit: (data: ComposerData) => void;
  onPreview: (data: ComposerData) => void;
  isSubmitting?: boolean;
}

export interface ComposerData {
  content: string;
  title?: string;
  mediaAttachments: MediaAttachment[];
  targetPlatforms: string[];
  scheduledAt?: Date;
  requiresApproval: boolean;
  tags: string[];
  platformOverrides: Record<string, { content?: string; hashtags?: string[] }>;
}

export const PostComposer = ({
  integrations,
  platformConfigs,
  onSubmit,
  onPreview,
  isSubmitting = false,
}: PostComposerProps) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectedIntegrations = integrations.filter((i) => i.status === "connected");
  const publishablePlatforms = connectedIntegrations.filter((integration) => {
    const config = platformConfigs.find((c) => c.platform === integration.platform);
    return config?.supports_publish;
  });

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(publishablePlatforms.map((i) => i.platform));
  };

  const getCharacterLimit = () => {
    const limits = selectedPlatforms
      .map((p) => platformConfigs.find((c) => c.platform === p)?.max_post_length)
      .filter((l): l is number => l !== null && l !== undefined);
    return limits.length > 0 ? Math.min(...limits) : null;
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = characterLimit && content.length > characterLimit;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const type = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : file.type.startsWith("audio")
        ? "audio"
        : "file";

      const attachment: MediaAttachment = {
        id: crypto.randomUUID(),
        type,
        url: URL.createObjectURL(file),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      };

      setMediaAttachments((prev) => [...prev, attachment]);
    });

    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setMediaAttachments((prev) => prev.filter((m) => m.id !== id));
  };

  const getComposerData = (): ComposerData => ({
    content,
    title: title || undefined,
    mediaAttachments,
    targetPlatforms: selectedPlatforms,
    scheduledAt: isScheduled && scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : undefined,
    requiresApproval,
    tags,
    platformOverrides: {},
  });

  const handleSubmit = () => {
    onSubmit(getComposerData());
  };

  const handlePreview = () => {
    onPreview(getComposerData());
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Publish to</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllPlatforms}
              disabled={publishablePlatforms.length === 0}
            >
              Select All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {publishablePlatforms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No publishing-enabled platforms connected. Connect a platform first.
              </p>
            ) : (
              publishablePlatforms.map((integration) => {
                const Icon = getPlatformIcon(integration.platform);
                const color = getPlatformColor(integration.platform);
                const isSelected = selectedPlatforms.includes(integration.platform);

                return (
                  <TooltipProvider key={integration.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePlatform(integration.platform)}
                          className="gap-2"
                          style={isSelected ? { backgroundColor: color } : {}}
                        >
                          <Icon className="h-4 w-4" />
                          {integration.platform_username || integration.platform}
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {integration.platform_display_name || integration.platform}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </div>
        </div>

        <Separator />

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">Content</Label>
            {characterLimit && (
              <span
                className={`text-xs ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}
              >
                {content.length}/{characterLimit}
              </span>
            )}
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Write your post here..."
            rows={6}
            className={isOverLimit ? "border-destructive" : ""}
          />
          {isOverLimit && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Content exceeds character limit for selected platforms
            </p>
          )}
        </div>

        {/* Media Attachments */}
        <div>
          <Label className="mb-3 block">Media</Label>
          <div className="flex gap-2 mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </div>
          {mediaAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mediaAttachments.map((media) => (
                <div
                  key={media.id}
                  className="relative group rounded-lg overflow-hidden border bg-muted"
                >
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.file_name}
                      className="h-20 w-20 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex items-center justify-center">
                      {media.type === "video" ? (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Music className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMedia(media.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <Label className="mb-3 block">Tags</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag..."
              className="flex-1"
            />
            <Button variant="outline" onClick={handleAddTag}>
              <Hash className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  #{tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Scheduling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="schedule">Schedule Post</Label>
            </div>
            <Switch
              id="schedule"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
          </div>
          {isScheduled && (
            <div className="flex gap-3 pl-6">
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Approval */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="approval">Require Approval Before Publishing</Label>
          </div>
          <Switch
            id="approval"
            checked={requiresApproval}
            onCheckedChange={setRequiresApproval}
          />
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={!content || selectedPlatforms.length === 0}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content || selectedPlatforms.length === 0 || isSubmitting || isOverLimit}
            className="flex-1"
          >
            {isSubmitting ? (
              "Processing..."
            ) : requiresApproval ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </>
            ) : isScheduled ? (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Post
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
