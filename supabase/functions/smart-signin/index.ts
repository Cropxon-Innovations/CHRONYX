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

// TOTP helpers
function base32Decode(encoded: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, "");
  const result: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}

async function generateTOTP(secret: string, time: number = Date.now()): Promise<string> {
  const timeStep = 30;
  const counter = Math.floor(time / 1000 / timeStep);
  
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);

  const secretBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, counterBuffer);
  const signatureBytes = new Uint8Array(signature);

  const offset = signatureBytes[signatureBytes.length - 1] & 0xf;
  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  const now = Date.now();
  const timeStep = 30 * 1000;

  for (let i = -window; i <= window; i++) {
    const time = now + i * timeStep;
    const expectedToken = await generateTOTP(secret, time);
    if (expectedToken === token) {
      return true;
    }
  }
  return false;
}

async function decryptSecret(encryptedData: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(encryptionKey.padEnd(32, "0").slice(0, 32));
  
  const combined = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace("-", "").toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOTP_ENCRYPTION_KEY") || supabaseServiceKey.slice(0, 32);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, ...payload } = await req.json();
    
    // Get RP ID from request origin
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "https://chronyx.app";
    const rpId = new URL(origin).hostname;

    // Action: Check if email has 2FA enabled (no auth required)
    if (action === "check-email") {
      const { email } = payload;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lookup user by email using admin API
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing users:", userError);
        return new Response(
          JSON.stringify({ error: "Failed to lookup user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return new Response(
          JSON.stringify({ 
            exists: false,
            has2FA: false,
            methods: { totp: false, webauthn: false }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check 2FA status
      const { data: twoFA } = await supabase
        .from("user_2fa")
        .select("totp_enabled, webauthn_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          exists: true,
          has2FA: !!(twoFA?.totp_enabled || twoFA?.webauthn_enabled),
          methods: {
            totp: twoFA?.totp_enabled || false,
            webauthn: twoFA?.webauthn_enabled || false,
          },
          userId: user.id, // Include for passkey auth
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Get WebAuthn authentication options by email (no auth required)
    if (action === "webauthn-options") {
      const { email } = payload;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lookup user by email
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's credentials
      const { data: credentials } = await supabase
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("user_id", user.id);

      if (!credentials || credentials.length === 0) {
        return new Response(
          JSON.stringify({ error: "No passkeys registered for this account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate and store challenge
      const challenge = generateChallenge();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from("auth_challenges").insert({
        user_id: user.id,
        challenge,
        challenge_type: "smart_signin",
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
        JSON.stringify({ success: true, options, userId: user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Verify WebAuthn and create session (no auth required)
    if (action === "webauthn-verify") {
      const { email, credential } = payload;
      
      if (!email || !credential) {
        return new Response(
          JSON.stringify({ error: "Email and credential are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lookup user
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from("auth_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_type", "smart_signin")
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

      // Update credential counter
      await supabase
        .from("webauthn_credentials")
        .update({
          counter: storedCred.counter + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", storedCred.id);

      // Update 2FA timestamp
      await supabase
        .from("user_2fa")
        .update({ last_2fa_at: new Date().toISOString() })
        .eq("user_id", user.id);

      // Generate magic link for passwordless login
      const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
        options: {
          redirectTo: origin + "/app",
        },
      });

      if (magicLinkError || !magicLink) {
        console.error("Error generating magic link:", magicLinkError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          // Return the hashed token from the magic link for client-side verification
          accessToken: magicLink.properties.hashed_token,
          redirectUrl: magicLink.properties.action_link,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: Verify TOTP and create session (no auth required)
    if (action === "totp-verify") {
      const { email, token } = payload;
      
      if (!email || !token) {
        return new Response(
          JSON.stringify({ error: "Email and token are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Lookup user
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get 2FA data
      const { data: twoFA, error: fetchError } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !twoFA?.totp_enabled || !twoFA.totp_secret_encrypted) {
        return new Response(
          JSON.stringify({ error: "TOTP not enabled for this account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secret = await decryptSecret(twoFA.totp_secret_encrypted, encryptionKey);
      let isValid = await verifyTOTP(secret, token);
      let usedBackupCode = false;

      // If not valid, check backup codes
      if (!isValid) {
        for (let i = 0; i < (twoFA.backup_codes_hash?.length || 0); i++) {
          const hashedInput = await hashCode(token);
          if (twoFA.backup_codes_hash![i] === hashedInput) {
            isValid = true;
            usedBackupCode = true;
            
            // Remove used backup code
            const updatedCodes = [...twoFA.backup_codes_hash!];
            updatedCodes.splice(i, 1);
            
            await supabase
              .from("user_2fa")
              .update({ 
                backup_codes_hash: updatedCodes,
                backup_codes_used: (twoFA.backup_codes_used || 0) + 1,
              })
              .eq("user_id", user.id);
            break;
          }
        }
      }

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update 2FA timestamp
      await supabase
        .from("user_2fa")
        .update({ last_2fa_at: new Date().toISOString() })
        .eq("user_id", user.id);

      // Generate magic link for passwordless login
      const { data: magicLink, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
        options: {
          redirectTo: origin + "/app",
        },
      });

      if (magicLinkError || !magicLink) {
        console.error("Error generating magic link:", magicLinkError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          usedBackupCode,
          accessToken: magicLink.properties.hashed_token,
          redirectUrl: magicLink.properties.action_link,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Smart sign-in error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
