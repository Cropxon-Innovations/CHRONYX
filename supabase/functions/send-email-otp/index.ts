import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getSender, getEmailFooter } from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  userId: string;
  type: "email" | "phone";
  purpose?: "verification" | "account_deletion";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const okJson = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return okJson({
        success: false,
        errorCode: "missing_resend_key",
        message: "Email service is not configured. Please contact support.",
      });
    }

    const { email, userId, type, purpose = "verification" }: SendOtpRequest = await req.json();

    if (!email || !userId) {
      return okJson({
        success: false,
        errorCode: "invalid_request",
        message: "Email and userId are required.",
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Hash OTP (tie it to this userId so it can't be reused across accounts)
    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(otp + userId)
    );
    const hashArray = Array.from(new Uint8Array(otpHash));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Determine subject and message based on purpose
    const isAccountDeletion = purpose === "account_deletion";
    const subject = isAccountDeletion
      ? `⚠️ Account Deletion Code: ${otp}`
      : `✉️ CHRONYX Verification Code: ${otp}`;

    const headerTitle = isAccountDeletion ? "ACCOUNT DELETION" : "EMAIL VERIFICATION";
    const headerSubtitle = isAccountDeletion
      ? "SECURITY VERIFICATION REQUIRED"
      : "VERIFY YOUR IDENTITY";

    const purposeMessage = isAccountDeletion
      ? "Enter this code to confirm your account deletion request."
      : `Enter this code to verify your ${type === "email" ? "email address" : "phone number"}.`;

    const warningMessage = isAccountDeletion
      ? "⚠️ This action is permanent and cannot be undone. Make sure you have exported your data before proceeding."
      : "If you didn't request this code, please ignore this email.";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 0.2em; font-weight: 300;">CHRONYX</h1>
              <p style="color: #64748b; font-size: 9px; letter-spacing: 0.15em; margin-top: 6px;">BY CROPXON</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #94a3b8; font-size: 11px; letter-spacing: 0.2em; margin: 0;">${headerTitle}</p>
                <p style="color: #64748b; font-size: 9px; letter-spacing: 0.1em; margin-top: 4px;">${headerSubtitle}</p>
              </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 48px 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">${isAccountDeletion ? "🔐" : "✉️"}</span>
              </div>
              
              <p style="color: #475569; font-size: 16px; margin: 0 0 28px; line-height: 1.5;">
                Your one-time verification code is:
              </p>
              
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; margin: 0 0 28px;">
                <span style="font-size: 44px; font-weight: 700; letter-spacing: 12px; color: #0f172a; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;">${otp}</span>
              </div>
              
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                ${purposeMessage}
              </p>
              
              <div style="background: ${isAccountDeletion ? "#fef2f2" : "#fef3c7"}; border-radius: 12px; padding: 16px 20px; margin: 0 0 24px; border: 1px solid ${isAccountDeletion ? "#fecaca" : "#fcd34d"};">
                <p style="color: ${isAccountDeletion ? "#dc2626" : "#92400e"}; font-size: 13px; margin: 0; font-weight: 500;">
                  ⏱ This code expires in <strong>10 minutes</strong>
                </p>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                ${warningMessage}
              </p>
            </div>
            
            <!-- Security Badge -->
            <div style="padding: 20px 40px; background: #f0fdf4; border-top: 1px solid #dcfce7; text-align: center;">
              <p style="color: #16a34a; font-size: 12px; margin: 0; font-weight: 500;">
                🔒 Secured by CHRONYX Authentication
              </p>
            </div>
            
            ${getEmailFooter()}
          </div>
        </body>
      </html>
    `;

    // IMPORTANT: use production sender (getchronyx.com) for real deliveries
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getSender("auth", false),
        to: [email],
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const raw = await emailResponse.text();

      // Provide a helpful, user-facing message without breaking the frontend with non-2xx
      const isDomainVerificationError =
        emailResponse.status === 403 &&
        (raw.toLowerCase().includes("verify a domain") ||
          raw.toLowerCase().includes("testing emails"));

      const message = isDomainVerificationError
        ? "Email sending is still in test mode. Please verify your getchronyx.com domain in Resend and use a from-address on that domain (e.g., no-reply@getchronyx.com)."
        : "Failed to send OTP email. Please try again in a moment.";

      console.error("Resend API error:", raw);

      return okJson({
        success: false,
        errorCode: "email_send_failed",
        message,
        resendStatus: emailResponse.status,
      });
    }

    return okJson({
      success: true,
      message: "OTP sent successfully",
      otpHash: hashHex,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in send-email-otp function:", error);
    return okJson({
      success: false,
      errorCode: "internal_error",
      message: error?.message || "Unexpected error",
    });
  }
};

serve(handler);
