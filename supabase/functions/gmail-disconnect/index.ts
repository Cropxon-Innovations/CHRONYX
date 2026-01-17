import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = user.id;
    console.log('[Gmail Disconnect] Disconnecting for user:', userId);
    
    // Get user's Gmail settings to revoke token
    const { data: settings } = await supabase
      .from('gmail_sync_settings')
      .select('access_token_encrypted')
      .eq('user_id', userId)
      .single();
    
    if (settings?.access_token_encrypted) {
      // Revoke Google token
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${settings.access_token_encrypted}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('[Gmail Disconnect] Token revoked');
      } catch (revokeError) {
        console.warn('[Gmail Disconnect] Token revoke failed (may already be invalid):', revokeError);
      }
    }
    
    // Delete Gmail settings
    const { error: deleteError } = await supabase
      .from('gmail_sync_settings')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error('[Gmail Disconnect] Delete error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to disconnect' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[Gmail Disconnect] Successfully disconnected');
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Gmail Disconnect] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});