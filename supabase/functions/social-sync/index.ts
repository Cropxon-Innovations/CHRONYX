// Social Sync Edge Function
// Fetches posts from connected social platforms
// Currently returns mock data for demo mode

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FetchedPost {
  platform_post_id: string;
  platform_permalink: string;
  post_type: string;
  content_text: string;
  content_preview: string;
  media_urls: string[];
  thumbnails: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  posted_at: string;
  hashtags: string[];
  mentions: string[];
}

// Platform-specific fetchers (placeholders for real API integration)
const fetchers: Record<string, (credentials: Record<string, string>) => Promise<FetchedPost[]>> = {
  linkedin: async (credentials) => {
    // TODO: Integrate with LinkedIn API
    // Endpoint: https://api.linkedin.com/v2/ugcPosts
    console.log("[LinkedIn] Fetching posts...");
    
    // Demo data
    return [
      {
        platform_post_id: `urn:li:share:demo_${Date.now()}`,
        platform_permalink: "https://linkedin.com/posts/demo",
        post_type: "article",
        content_text: "Just published a new article on building scalable systems! #Engineering #Tech",
        content_preview: "Just published a new article on building scalable systems!",
        media_urls: [],
        thumbnails: [],
        likes_count: Math.floor(Math.random() * 500),
        comments_count: Math.floor(Math.random() * 50),
        shares_count: Math.floor(Math.random() * 30),
        views_count: Math.floor(Math.random() * 5000),
        posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        hashtags: ["Engineering", "Tech"],
        mentions: [],
      },
    ];
  },
  
  twitter: async (credentials) => {
    // TODO: Integrate with Twitter API v2
    console.log("[Twitter] Fetching posts...");
    
    // Demo data
    return [
      {
        platform_post_id: `tweet_demo_${Date.now()}`,
        platform_permalink: "https://twitter.com/demo/status/123",
        post_type: "text",
        content_text: "Excited to announce we just hit 10K users! 🎉 Thank you for your support!",
        content_preview: "Excited to announce we just hit 10K users!",
        media_urls: [],
        thumbnails: [],
        likes_count: Math.floor(Math.random() * 200),
        comments_count: Math.floor(Math.random() * 30),
        shares_count: Math.floor(Math.random() * 50),
        views_count: Math.floor(Math.random() * 10000),
        posted_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        hashtags: [],
        mentions: [],
      },
    ];
  },
  
  instagram: async (credentials) => {
    // TODO: Integrate with Instagram Graph API
    console.log("[Instagram] Fetching posts...");
    
    return [
      {
        platform_post_id: `ig_demo_${Date.now()}`,
        platform_permalink: "https://instagram.com/p/demo",
        post_type: "image",
        content_text: "Behind the scenes 📸 #photography #bts",
        content_preview: "Behind the scenes",
        media_urls: ["https://picsum.photos/800/800"],
        thumbnails: ["https://picsum.photos/200/200"],
        likes_count: Math.floor(Math.random() * 1000),
        comments_count: Math.floor(Math.random() * 100),
        shares_count: 0,
        views_count: 0,
        posted_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        hashtags: ["photography", "bts"],
        mentions: [],
      },
    ];
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { integration_id, demo_mode = true } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ error: "integration_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch integration
    const { data: integration, error: intError } = await supabase
      .from("social_integrations")
      .select("*")
      .eq("id", integration_id)
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: "Integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fetcher = fetchers[integration.platform];
    if (!fetcher) {
      return new Response(
        JSON.stringify({ error: `Unsupported platform: ${integration.platform}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulate delay
    if (demo_mode) {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }

    const credentials: Record<string, string> = demo_mode ? {} : {
      access_token: integration.access_token_encrypted || "",
      api_key: integration.api_key_encrypted || "",
    };

    const posts = await fetcher(credentials);

    // Upsert posts to database
    for (const post of posts) {
      await supabase
        .from("social_posts")
        .upsert({
          user_id: integration.user_id,
          integration_id: integration.id,
          platform: integration.platform,
          ...post,
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "integration_id,platform_post_id",
        });
    }

    // Update last sync time
    await supabase
      .from("social_integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", integration_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        posts_synced: posts.length,
        platform: integration.platform
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Social Sync] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
