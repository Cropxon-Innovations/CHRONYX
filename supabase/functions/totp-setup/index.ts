import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// TOTP implementation using Web Crypto API
function generateSecret(length = 20): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

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

// Simple encryption for storing TOTP secret
async function encryptSecret(secret: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const keyData = encoder.encode(encryptionKey.padEnd(32, "0").slice(0, 32));
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
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

// Generate backup codes
function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
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

    const { action, token } = await req.json();

    if (action === "setup") {
      // Enforce only one authenticator setup per account.
      // If already enabled, do not overwrite the existing secret.
      const { data: existing2fa } = await supabase
        .from("user_2fa")
        .select("totp_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing2fa?.totp_enabled) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Authenticator already enabled for this account. Disable it in Settings to register a new one.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate new TOTP secret
      const secretBytes = generateSecret(20);
      const secret = base32Encode(secretBytes);
      
      // Generate QR code URL for authenticator apps
      const issuer = "CHRONYX";
      const accountName = user.email || user.id;
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      
      // Encrypt and store the secret temporarily
      const encryptedSecret = await encryptSecret(secret, encryptionKey);
      
      // Store pending setup
      const { error: upsertError } = await supabase
        .from("user_2fa")
        .upsert({
          user_id: user.id,
          totp_secret_encrypted: encryptedSecret,
          totp_enabled: false,
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Error storing TOTP setup:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to setup TOTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          secret,
          otpauthUrl,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      // Get stored secret
      const { data: twoFA, error: fetchError } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !twoFA?.totp_secret_encrypted) {
        return new Response(
          JSON.stringify({ error: "No pending TOTP setup found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secret = await decryptSecret(twoFA.totp_secret_encrypted, encryptionKey);
      const isValid = await verifyTOTP(secret, token);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedCodes = await Promise.all(backupCodes.map(hashCode));

      // Enable TOTP
      const { error: updateError } = await supabase
        .from("user_2fa")
        .update({
          totp_enabled: true,
          totp_verified_at: new Date().toISOString(),
          backup_codes_hash: hashedCodes,
          backup_codes_used: 0,
        })
        .eq("user_id", user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to enable TOTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          backupCodes,
          message: "TOTP enabled successfully",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "authenticate") {
      // Verify TOTP token during login
      const { data: twoFA, error: fetchError } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !twoFA?.totp_enabled || !twoFA.totp_secret_encrypted) {
        return new Response(
          JSON.stringify({ error: "TOTP not enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secret = await decryptSecret(twoFA.totp_secret_encrypted, encryptionKey);
      const isValid = await verifyTOTP(secret, token);

      if (isValid) {
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

      // Check if it's a backup code
      for (let i = 0; i < (twoFA.backup_codes_hash?.length || 0); i++) {
        const hashedInput = await hashCode(token);
        if (twoFA.backup_codes_hash![i] === hashedInput) {
          // Remove used backup code
          const updatedCodes = [...twoFA.backup_codes_hash!];
          updatedCodes.splice(i, 1);
          
          await supabase
            .from("user_2fa")
            .update({ 
              backup_codes_hash: updatedCodes,
              backup_codes_used: (twoFA.backup_codes_used || 0) + 1,
              last_2fa_at: new Date().toISOString()
            })
            .eq("user_id", user.id);

          return new Response(
            JSON.stringify({ success: true, verified: true, usedBackupCode: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: false, verified: false, error: "Invalid code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      // Verify current token before disabling
      const { data: twoFA, error: fetchError } = await supabase
        .from("user_2fa")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !twoFA?.totp_enabled || !twoFA.totp_secret_encrypted) {
        return new Response(
          JSON.stringify({ error: "TOTP not enabled" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secret = await decryptSecret(twoFA.totp_secret_encrypted, encryptionKey);
      const isValid = await verifyTOTP(secret, token);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Disable TOTP
      const { error: updateError } = await supabase
        .from("user_2fa")
        .update({
          totp_enabled: false,
          totp_secret_encrypted: null,
          totp_verified_at: null,
          backup_codes_hash: null,
        })
        .eq("user_id", user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to disable TOTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "TOTP disabled successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      const { data: twoFA } = await supabase
        .from("user_2fa")
        .select("totp_enabled, webauthn_enabled, totp_verified_at, last_2fa_at, backup_codes_used")
        .eq("user_id", user.id)
        .single();

      const { data: webauthnCreds } = await supabase
        .from("webauthn_credentials")
        .select("id, device_name, device_type, last_used_at, created_at")
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          totpEnabled: twoFA?.totp_enabled || false,
          webauthnEnabled: twoFA?.webauthn_enabled || false,
          totpVerifiedAt: twoFA?.totp_verified_at,
          lastUsedAt: twoFA?.last_2fa_at,
          backupCodesRemaining: twoFA?.backup_codes_used ? 8 - twoFA.backup_codes_used : 8,
          webauthnCredentials: webauthnCreds || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("TOTP setup error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
