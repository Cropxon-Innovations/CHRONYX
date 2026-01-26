import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailHeader, getEmailFooter, EMAIL_CONFIG } from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userId }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = name || email.split("@")[0];
    const appUrl = EMAIL_CONFIG.APP_URL;

    // Create a welcome notification in the database
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from("system_notifications").insert({
        title: "🎉 Welcome to CHRONYX!",
        message: `Hello ${displayName}! Welcome to the CHRONYX family. We're thrilled to have you here. Explore all the amazing features designed to help you organize your life with calm and clarity. The Originx Labs team is rooting for your success!`,
        notification_type: "success",
        target_audience: "all",
        action_url: "/app",
        action_label: "Get Started",
        is_dismissible: true,
        is_active: true,
      });
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CHRONYX</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden;">
                
                ${getEmailHeader("CHRONYX")}
                
                <!-- Welcome Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 600; color: #0f172a;">Welcome, ${displayName}! 🎉</h2>
                    <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; font-style: italic;">Your journey to an organized life begins now.</p>
                    
                    <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.8; color: #475569;">
                      We are <strong style="color: #0f172a;">absolutely delighted</strong> to welcome you to the CHRONYX family! This isn't just another app — it's your personal sanctuary for organizing everything that matters in your life.
                    </p>
                    
                    <!-- CEO Message Box -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 24px; margin: 28px 0; border: 1px solid #86efac; border-left: 4px solid #22c55e;">
                      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #166534;">
                        <em>"At Originx Labs, we believe that true productivity comes from clarity and calm, not chaos and hustle. CHRONYX is designed to be your quiet partner in life — always there when you need it, never demanding more than you can give."</em>
                      </p>
                      <p style="margin: 0; font-size: 13px; color: #15803d; font-weight: 600;">
                        — Abhishek Panda & Namrata Sahoo<br>
                        <span style="font-weight: 400; font-size: 12px; color: #22c55e;">Co-Founders, Originx Labs</span>
                      </p>
                    </div>
                    
                    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.8; color: #475569;">
                      With CHRONYX, you can <strong style="color: #0f172a;">achieve what you've always wanted</strong> — a well-organized, peaceful, and productive life. Here's what's waiting for you:
                    </p>
                    
                    <!-- Features Grid -->
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 28px; margin: 0 0 28px; border: 1px solid #e2e8f0;">
                      <h3 style="margin: 0 0 20px; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em;">What you can organize in CHRONYX</h3>
                      <table style="width: 100%;">
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">📋</span> <strong>Daily Tasks & Todos</strong> — Never miss a deadline
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">✍️</span> <strong>Noteflow</strong> — Apple-level note-taking experience
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">💰</span> <strong>FinanceFlow</strong> — Track expenses, income & savings
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">🏦</span> <strong>Loans & EMI</strong> — Smart EMI tracking with reminders
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">📚</span> <strong>Study & Library</strong> — Track your learning journey
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">🖼️</span> <strong>Private Memories</strong> — Your photo archive, your privacy
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-size: 18px; margin-right: 12px;">🛡️</span> <strong>Insurance Tracker</strong> — Never miss policy renewals
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #334155; font-size: 15px;">
                            <span style="font-size: 18px; margin-right: 12px;">⏳</span> <strong>Lifespan Visualizer</strong> — Motivational perspective on time
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <!-- Motivational Quote -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 24px; margin: 0 0 28px; border: 1px solid #fcd34d; text-align: center;">
                      <p style="margin: 0; font-size: 17px; line-height: 1.6; color: #92400e; font-style: italic;">
                        "The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and then starting on the first one."
                      </p>
                      <p style="margin: 12px 0 0; font-size: 13px; color: #b45309; font-weight: 600;">
                        — Mark Twain
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="${appUrl}/app" 
                             style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; letter-spacing: 0.08em; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);">
                            START YOUR JOURNEY →
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 32px 0 0; font-size: 14px; color: #64748b; text-align: center;">
                      We're here for you every step of the way. Reply to this email anytime — we read every message.
                    </p>
                    
                    <!-- Team Signature -->
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 4px; font-size: 14px; color: #475569;">
                        With warm regards,
                      </p>
                      <p style="margin: 0; font-size: 15px; font-weight: 600; color: #0f172a;">
                        The CHRONYX Team
                      </p>
                      <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">
                        Originx Labs Pvt. Ltd.
                      </p>
                    </div>
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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_CONFIG.NOTIFICATIONS,
        to: [email],
        subject: "🎉 Welcome to CHRONYX — Your Journey to an Organized Life Begins!",
        html: emailHtml,
        reply_to: EMAIL_CONFIG.SUPPORT_EMAIL,
      }),
    });

    const result = await emailResponse.json();
    console.log("Welcome email sent successfully:", result);

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
