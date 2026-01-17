// Types for Social Media Automation Hub

export interface PlatformConfig {
  id: string;
  platform: string;
  display_name: string;
  icon: string;
  color: string;
  supports_oauth: boolean;
  supports_api_key: boolean;
  supports_read: boolean;
  supports_publish: boolean;
  supports_schedule: boolean;
  supports_media_types: string[];
  oauth_scopes: string[] | null;
  developer_portal_url: string | null;
  max_post_length: number | null;
  is_active: boolean;
}

export interface SocialIntegration {
  id: string;
  user_id: string;
  platform: string;
  connection_type: 'oauth' | 'api_key';
  platform_user_id: string | null;
  platform_username: string | null;
  platform_display_name: string | null;
  platform_avatar_url: string | null;
  platform_metadata: Record<string, unknown>;
  status: 'pending' | 'connected' | 'expired' | 'error' | 'disconnected';
  last_sync_at: string | null;
  error_message: string | null;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  integration_id: string;
  platform: string;
  platform_post_id: string;
  platform_permalink: string | null;
  post_type: 'text' | 'image' | 'video' | 'audio' | 'link' | 'story' | 'reel' | 'article' | 'poll' | 'other';
  content_text: string | null;
  content_preview: string | null;
  media_urls: string[];
  thumbnails: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  engagement_rate: number | null;
  posted_at: string;
  hashtags: string[] | null;
  mentions: string[] | null;
  platform_metadata: Record<string, unknown>;
  fetched_at: string;
  updated_at: string;
}

export interface SocialDraft {
  id: string;
  user_id: string;
  title: string | null;
  content_text: string;
  media_attachments: MediaAttachment[];
  post_type: 'text' | 'image' | 'video' | 'audio' | 'link' | 'article' | 'poll';
  platform_content: Record<string, PlatformSpecificContent>;
  target_platforms: string[];
  scheduled_at: string | null;
  timezone: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  requires_approval: boolean;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  preview_generated_at: string | null;
  preview_data: Record<string, unknown>;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnail_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
}

export interface PlatformSpecificContent {
  content_text?: string;
  hashtags?: string[];
  mentions?: string[];
  link_preview?: boolean;
  first_comment?: string;
}

export interface SocialPublished {
  id: string;
  user_id: string;
  draft_id: string | null;
  integration_id: string | null;
  platform: string;
  platform_post_id: string | null;
  platform_permalink: string | null;
  published_at: string;
  content_snapshot: string | null;
  media_snapshot: MediaAttachment[];
  status: 'success' | 'failed' | 'partial';
  error_message: string | null;
  retry_count: number;
  initial_metrics: Record<string, number>;
  latest_metrics: Record<string, number>;
  metrics_updated_at: string | null;
  created_at: string;
}

export interface PublishQueueItem {
  id: string;
  user_id: string;
  draft_id: string;
  integration_id: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  next_retry_at: string | null;
  published_id: string | null;
  created_at: string;
}

// Workflow types
export type WorkflowStep = 'compose' | 'preview' | 'approve' | 'schedule' | 'publish';

export interface ComposerState {
  currentStep: WorkflowStep;
  draft: Partial<SocialDraft>;
  selectedPlatforms: string[];
  previewMode: boolean;
}
