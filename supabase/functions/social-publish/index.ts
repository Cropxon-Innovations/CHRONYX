// Social Publishing Edge Function
// This is a placeholder that will be connected to real platform APIs
// Currently returns mock responses for demo mode

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  draft_id: string;
  integration_id: string;
  platform: string;
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
}

interface PlatformPublisher {
  publish(request: PublishRequest, credentials: Record<string, string>): Promise<{
    success: boolean;
    platform_post_id?: string;
    platform_permalink?: string;
    error?: string;
  }>;
}

// Platform-specific publishers (placeholders for real API integration)
const publishers: Record<string, PlatformPublisher> = {
  linkedin: {
    async publish(request, credentials) {
      // TODO: Integrate with LinkedIn Marketing API
      // Endpoint: https://api.linkedin.com/v2/ugcPosts
      // Requires: access_token with w_member_social scope
      console.log("[LinkedIn] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `urn:li:share:${Date.now()}`,
        platform_permalink: `https://linkedin.com/feed/update/urn:li:share:${Date.now()}`,
      };
    },
  },
  
  twitter: {
    async publish(request, credentials) {
      // TODO: Integrate with Twitter API v2
      // Endpoint: https://api.twitter.com/2/tweets
      // Requires: OAuth 2.0 with tweet.write scope OR API Key + Secret
      console.log("[Twitter] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `tweet_${Date.now()}`,
        platform_permalink: `https://twitter.com/user/status/${Date.now()}`,
      };
    },
  },
  
  instagram: {
    async publish(request, credentials) {
      // TODO: Integrate with Instagram Graph API (via Facebook)
      // Requires: Facebook Business account + Page linked to Instagram
      // Two-step process: 1. Create container, 2. Publish container
      console.log("[Instagram] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `ig_${Date.now()}`,
        platform_permalink: `https://instagram.com/p/${Date.now()}`,
      };
    },
  },
  
  facebook: {
    async publish(request, credentials) {
      // TODO: Integrate with Facebook Graph API
      // Endpoint: https://graph.facebook.com/{page-id}/feed
      // Requires: pages_manage_posts permission
      console.log("[Facebook] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `fb_${Date.now()}`,
        platform_permalink: `https://facebook.com/post/${Date.now()}`,
      };
    },
  },
  
  youtube: {
    async publish(request, credentials) {
      // TODO: Integrate with YouTube Data API v3
      // Endpoint: https://www.googleapis.com/upload/youtube/v3/videos
      // Requires: YouTube channel + upload scope
      console.log("[YouTube] Publishing:", request.content.substring(0, 50));
      
      // Demo response (videos only)
      return {
        success: true,
        platform_post_id: `yt_${Date.now()}`,
        platform_permalink: `https://youtube.com/watch?v=${Date.now()}`,
      };
    },
  },
  
  telegram: {
    async publish(request, credentials) {
      // TODO: Integrate with Telegram Bot API
      // Endpoint: https://api.telegram.org/bot{token}/sendMessage
      // Requires: Bot token + Chat ID
      console.log("[Telegram] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `tg_${Date.now()}`,
        platform_permalink: `https://t.me/channel/${Date.now()}`,
      };
    },
  },
  
  discord: {
    async publish(request, credentials) {
      // TODO: Integrate with Discord Webhook or Bot API
      // Webhook: POST to webhook URL with content
      // Bot: POST to /channels/{channel.id}/messages
      console.log("[Discord] Publishing:", request.content.substring(0, 50));
      
      // Demo response
      return {
        success: true,
        platform_post_id: `discord_${Date.now()}`,
        platform_permalink: undefined, // Discord messages don't have public URLs
      };
    },
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { queue_item_id, demo_mode = true } = await req.json();

    if (!queue_item_id) {
      return new Response(
        JSON.stringify({ error: "queue_item_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch queue item
    const { data: queueItem, error: queueError } = await supabase
      .from("social_publish_queue")
      .select("*, social_drafts(*), social_integrations(*)")
      .eq("id", queue_item_id)
      .single();

    if (queueError || !queueItem) {
      return new Response(
        JSON.stringify({ error: "Queue item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from("social_publish_queue")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", queue_item_id);

    const platform = queueItem.platform;
    const publisher = publishers[platform];

    if (!publisher) {
      await supabase
        .from("social_publish_queue")
        .update({ 
          status: "failed", 
          last_error: `Unsupported platform: ${platform}`,
          completed_at: new Date().toISOString()
        })
        .eq("id", queue_item_id);

      return new Response(
        JSON.stringify({ error: `Unsupported platform: ${platform}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In demo mode, simulate successful publish
    // In production, use real credentials from integration
    const credentials: Record<string, string> = demo_mode ? {} : {
      access_token: queueItem.social_integrations?.access_token_encrypted || "",
      api_key: queueItem.social_integrations?.api_key_encrypted || "",
      api_secret: queueItem.social_integrations?.api_secret_encrypted || "",
    };

    const publishRequest: PublishRequest = {
      draft_id: queueItem.draft_id,
      integration_id: queueItem.integration_id,
      platform,
      content: queueItem.social_drafts?.content_text || "",
      media_urls: queueItem.social_drafts?.media_attachments?.map((m: any) => m.url) || [],
    };

    // Simulate delay for demo mode
    if (demo_mode) {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }

    const result = await publisher.publish(publishRequest, credentials);

    if (result.success) {
      // Create published record
      const { data: published } = await supabase
        .from("social_published")
        .insert({
          user_id: queueItem.user_id,
          draft_id: queueItem.draft_id,
          integration_id: queueItem.integration_id,
          platform,
          platform_post_id: result.platform_post_id,
          platform_permalink: result.platform_permalink,
          status: "success",
          content_snapshot: queueItem.social_drafts?.content_text,
          media_snapshot: queueItem.social_drafts?.media_attachments || [],
        })
        .select()
        .single();

      // Update queue item
      await supabase
        .from("social_publish_queue")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString(),
          published_id: published?.id
        })
        .eq("id", queue_item_id);

      // Update draft status
      await supabase
        .from("social_drafts")
        .update({ status: "published" })
        .eq("id", queueItem.draft_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          platform_post_id: result.platform_post_id,
          platform_permalink: result.platform_permalink
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Handle failure
      const newRetryCount = (queueItem.retry_count || 0) + 1;
      const maxRetries = queueItem.max_retries || 3;

      await supabase
        .from("social_publish_queue")
        .update({ 
          status: newRetryCount >= maxRetries ? "failed" : "pending",
          retry_count: newRetryCount,
          last_error: result.error,
          completed_at: new Date().toISOString(),
          next_retry_at: newRetryCount < maxRetries 
            ? new Date(Date.now() + 5 * 60 * 1000).toISOString() // Retry in 5 mins
            : null
        })
        .eq("id", queue_item_id);

      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Social Publish] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
