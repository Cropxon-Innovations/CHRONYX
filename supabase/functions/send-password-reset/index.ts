import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getSender,
  getEmailFooter,
  getEmailButton,
} from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl, name }: PasswordResetRequest = await req.json();

    if (!email || !resetUrl) {
      return new Response(
        JSON.stringify({ error: "Email and reset URL are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const displayName = name || email.split("@")[0];
    const sender = getSender("auth");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - CHRONYX</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #334155;">
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 300; letter-spacing: 0.15em; color: #f1f5f9;">
                      CHRONYX
                    </h1>
                    <p style="margin: 0; font-size: 12px; color: #64748b; letter-spacing: 0.1em;">
                      PASSWORD RESET REQUEST
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 24px; font-size: 16px; color: #cbd5e1;">
                      Hello ${displayName},
                    </p>
                    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                      We received a request to reset your password for your CHRONYX account. Click the button below to create a new password.
                    </p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      ${getEmailButton("Reset Password", resetUrl, "primary")}
                    </div>
                    
                    <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 3px solid #f59e0b;">
                      <p style="margin: 0; font-size: 13px; color: #fbbf24;">
                        ⚠️ This link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                    
                    <p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
                      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                    
                    <p style="margin: 24px 0 0; font-size: 13px; color: #64748b;">
                      Can't click the button? Copy and paste this link:<br>
                      <span style="color: #60a5fa; word-break: break-all;">${resetUrl}</span>
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: sender,
        to: [email],
        subject: "Reset Your CHRONYX Password",
        html,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Password reset email sent:", data);
      return new Response(
        JSON.stringify({ success: true, message: "Password reset email sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const error = await res.text();
      console.error("Failed to send password reset email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
