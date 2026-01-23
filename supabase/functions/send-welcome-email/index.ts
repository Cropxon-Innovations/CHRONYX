import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const displayName = name || email.split("@")[0];
    const appUrl = "https://chronyx.lovable.app";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CHRONYX <onboarding@resend.dev>", // Use no-reply@getchronyx.com in production
        to: [email],
        subject: "Welcome to CHRONYX — A Quiet Space for Your Life",
        html: `
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
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 0.25em; color: #ffffff;">CHRONYX</h1>
                      <p style="margin: 10px 0 0; font-size: 11px; color: #94a3b8; letter-spacing: 0.2em;">A QUIET SPACE FOR YOUR LIFE</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px;">
                      <h2 style="margin: 0 0 24px; font-size: 26px; font-weight: 500; color: #0f172a;">Welcome, ${displayName}!</h2>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #475569;">
                        Thank you for joining CHRONYX. We're delighted to have you in our community of people who value simplicity, privacy, and meaningful organization.
                      </p>
                      
                      <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #475569;">
                        CHRONYX is your <strong style="color: #0f172a;">personal system of record</strong> — a quiet, private space where you can hold the threads of your life with continuity and calm.
                      </p>
                      
                      <!-- Features Box -->
                      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; padding: 28px; margin: 0 0 32px; border: 1px solid #e2e8f0;">
                        <h3 style="margin: 0 0 18px; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">What you can organize in CHRONYX:</h3>
                        <table style="width: 100%;">
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">📋 Daily tasks and todos</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">💰 Expenses, income & savings</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">🏦 Loans and EMI schedules</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">🛡️ Insurance policies</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">📚 Study plans and progress</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">🖼️ Private photo memories</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #334155; font-size: 15px;">⏳ Lifespan visualization</td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${appUrl}/app/dashboard" 
                               style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500; letter-spacing: 0.08em;">
                              ENTER CHRONYX →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 32px 0 0; font-size: 14px; color: #64748b; text-align: center;">
                        We're here if you need us. Just reply to this email or reach out anytime.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 28px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                      <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-align: center;">
                        This email was sent by <a href="https://getchronyx.com" style="color: #64748b; text-decoration: underline;">Chronyx</a> (getchronyx.com)
                      </p>
                      <p style="margin: 0 0 16px; font-size: 11px; color: #94a3b8; text-align: center;">
                        For support, contact <a href="mailto:support@getchronyx.com" style="color: #64748b; text-decoration: underline;">support@getchronyx.com</a>
                      </p>
                      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; font-weight: 500;">
                          CHRONYX by ORIGINX LABS PVT. LTD.
                        </p>
                        <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                          <a href="https://www.originxlabs.com" style="color: #94a3b8; text-decoration: underline;">www.originxlabs.com</a>
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
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