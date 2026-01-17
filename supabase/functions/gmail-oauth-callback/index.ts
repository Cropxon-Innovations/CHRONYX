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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    console.log('[Gmail OAuth] Callback received', { hasCode: !!code, state, error });
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://chronyx.app';
    
    if (error) {
      console.error('[Gmail OAuth] Error from Google:', error);
      // Map Google errors to our error codes
      let errorCode = 'UNKNOWN';
      if (error === 'access_denied') {
        errorCode = 'PERMISSION_DENIED';
      } else if (error === 'invalid_grant') {
        errorCode = 'INVALID_TOKEN';
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${siteUrl}/app/expenses?gmail_error=${errorCode}`,
        },
      });
    }
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'No authorization code provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Parse state to get user_id
    let userId: string;
    try {
      const stateData = JSON.parse(atob(state || ''));
      userId = stateData.user_id;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!clientId || !clientSecret) {
      console.error('[Gmail OAuth] Missing Google OAuth credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Exchange code for tokens
    const redirectUri = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('[Gmail OAuth] Token exchange error:', tokenData);
      let errorCode = 'UNKNOWN';
      if (tokenData.error === 'invalid_grant') {
        errorCode = 'INVALID_TOKEN';
      } else if (tokenData.error === 'invalid_client') {
        errorCode = 'CONFIG_ERROR';
      }
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${siteUrl}/app/expenses?gmail_error=${errorCode}`,
        },
      });
    }
    
    console.log('[Gmail OAuth] Token exchange successful');
    
    // Get user's Gmail profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    
    const profileData = await profileResponse.json();
    const gmailEmail = profileData.email;
    
    console.log('[Gmail OAuth] Retrieved Gmail profile:', gmailEmail);
    
    // Store tokens in database
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);
    
    const { error: upsertError } = await supabase
      .from('gmail_sync_settings')
      .upsert({
        user_id: userId,
        is_enabled: true,
        gmail_email: gmailEmail,
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        sync_status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    
    if (upsertError) {
      console.error('[Gmail OAuth] Database error:', upsertError);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${siteUrl}/app/expenses?gmail_error=DATABASE_ERROR`,
        },
      });
    }
    
    console.log('[Gmail OAuth] Settings saved successfully');
    
    // Redirect back to app with success and email
    const encodedEmail = encodeURIComponent(gmailEmail || '');
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${siteUrl}/app/expenses?gmail_connected=true&gmail_email=${encodedEmail}`,
      },
    });
    
  } catch (error) {
    console.error('[Gmail OAuth] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});