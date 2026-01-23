import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate random challenge
function generateChallenge(): string {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...challenge));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...payload } = await req.json();
    // IMPORTANT: WebAuthn RP ID must match the current site domain.
    // Use request Origin when available so passkeys work on preview/custom domains.
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://chronyx.app";
    const rpId = new URL(origin).hostname;
    const rpName = "CHRONYX";

    if (action === "register-options") {
      // Get existing credentials (for excludeCredentials)
      const { data: existingCreds } = await supabase
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", user.id);

      const excludeCredentials = (existingCreds || []).map(cred => ({
        id: cred.credential_id,
        type: "public-key",
      }));

      // Generate and store challenge
      const challenge = generateChallenge();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("auth_challenges").insert({
        user_id: user.id,
        challenge,
        challenge_type: "registration",
        expires_at: expiresAt,
      });

      const options = {
        challenge,
        rp: {
          id: rpId,
          name: rpName,
        },
        user: {
          id: btoa(user.id),
          name: user.email || user.id,
          displayName: user.email?.split("@")[0] || "User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },  // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: payload.authenticatorType || "platform",
          userVerification: "preferred",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
        excludeCredentials,
      };

      return new Response(
        JSON.stringify({ success: true, options }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "register-verify") {
      const { credential, deviceName } = payload;

      // Verify challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("auth_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_type", "registration")
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired challenge" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark challenge as used
      await supabase
        .from("auth_challenges")
        .update({ used: true })
        .eq("id", challengeData.id);

      // ENFORCE SINGLE PASSKEY PER ACCOUNT:
      // Delete all existing passkeys for this user before storing the new one
      const { data: oldCreds } = await supabase
        .from("webauthn_credentials")
        .select("id")
        .eq("user_id", user.id);

      if (oldCreds && oldCreds.length > 0) {
        await supabase
          .from("webauthn_credentials")
          .delete()
          .eq("user_id", user.id);
        console.log(`Revoked ${oldCreds.length} old passkey(s) for user ${user.id}`);
      }

      // Store new credential
      const { error: insertError } = await supabase
        .from("webauthn_credentials")
        .insert({
          user_id: user.id,
          credential_id: credential.id,
          public_key: credential.publicKey,
          counter: 0,
          device_name: deviceName || "Security Key",
          device_type: credential.authenticatorAttachment || "platform",
          transports: credential.transports || [],
        });

      if (insertError) {
        console.error("Error storing WebAuthn credential:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to store credential" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update user_2fa
      await supabase
        .from("user_2fa")
        .upsert({
          user_id: user.id,
          webauthn_enabled: true,
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({ success: true, message: "Passkey registered (old passkeys revoked)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "authenticate-options") {
      // Get user's credentials
      const { data: credentials } = await supabase
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("user_id", user.id);

      if (!credentials || credentials.length === 0) {
        return new Response(
          JSON.stringify({ error: "No WebAuthn credentials found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate and store challenge
      const challenge = generateChallenge();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("auth_challenges").insert({
        user_id: user.id,
        challenge,
        challenge_type: "authentication",
        expires_at: expiresAt,
      });

      const options = {
        challenge,
        rpId,
        allowCredentials: credentials.map(cred => ({
          id: cred.credential_id,
          type: "public-key",
          transports: cred.transports || [],
        })),
        userVerification: "preferred",
        timeout: 60000,
      };

      return new Response(
        JSON.stringify({ success: true, options }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "authenticate-verify") {
      const { credential } = payload;

      // Verify challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("auth_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_type", "authentication")
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !challengeData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired challenge" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark challenge as used
      await supabase
        .from("auth_challenges")
        .update({ used: true })
        .eq("id", challengeData.id);

      // Verify credential exists
      const { data: storedCred, error: credError } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("user_id", user.id)
        .eq("credential_id", credential.id)
        .single();

      if (credError || !storedCred) {
        return new Response(
          JSON.stringify({ error: "Invalid credential" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update counter and last used
      await supabase
        .from("webauthn_credentials")
        .update({
          counter: credential.counter || storedCred.counter + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", storedCred.id);

      // Update last 2FA timestamp
      await supabase
        .from("user_2fa")
        .update({ last_2fa_at: new Date().toISOString() })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete-credential") {
      const { credentialId } = payload;

      const { error: deleteError } = await supabase
        .from("webauthn_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("id", credentialId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: "Failed to delete credential" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if any credentials remain
      const { data: remaining } = await supabase
        .from("webauthn_credentials")
        .select("id")
        .eq("user_id", user.id);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from("user_2fa")
          .update({ webauthn_enabled: false })
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Credential deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WebAuthn setup error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
