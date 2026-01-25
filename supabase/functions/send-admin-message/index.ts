import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailHeader, getEmailFooter, EMAIL_CONFIG } from "../_shared/email-templates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminMessageRequest {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  message: string;
  adminId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, subject, message, adminId }: AdminMessageRequest = await req.json();

    if (!recipientEmail || !subject || !message) {
      throw new Error("Missing required fields: recipientEmail, subject, message");
    }

    // Verify the request is from an admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminRole, error: adminError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "admin")
      .maybeSingle();

    if (adminError || !adminRole) {
      throw new Error("Unauthorized: Sender is not an admin");
    }

    const displayName = recipientName || recipientEmail.split("@")[0];

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            ${getEmailHeader("CHRONYX")}
            
            <div style="padding: 40px;">
              <h2 style="margin: 0 0 24px; font-size: 20px; color: #1e293b; font-weight: 600;">
                Hello ${displayName},
              </h2>
              
              <div style="font-size: 15px; line-height: 1.6; color: #475569; white-space: pre-wrap;">
                ${message}
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  Best regards,
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">
                  The CHRONYX Team
                </p>
              </div>
            </div>
            
            ${getEmailFooter()}
          </div>
        </body>
      </html>
    `;

    // Use production domain if available, otherwise fallback to resend dev
    const fromEmail = Deno.env.get("ADMIN_EMAIL_DOMAIN") 
      ? `CHRONYX Admin <admin@${Deno.env.get("ADMIN_EMAIL_DOMAIN")}>`
      : "CHRONYX Admin <admin@getchronyx.com>";

    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
      reply_to: EMAIL_CONFIG.SUPPORT_EMAIL,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Admin message sent successfully:", emailResponse);

    // Log the activity
    await supabase.from("admin_activity_logs").insert({
      admin_user_id: adminId,
      action: `Sent message to ${recipientEmail}: ${subject}`,
      target_type: "user",
      metadata: { subject, recipient: recipientEmail },
    });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
