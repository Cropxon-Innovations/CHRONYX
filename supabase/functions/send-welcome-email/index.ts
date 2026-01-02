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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const displayName = name || email.split("@")[0];

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "VYOM <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to VYOM - Your Personal Life Operating System",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to VYOM</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 0.25em; color: #1a1a1a;">VYOM</h1>
                      <p style="margin: 8px 0 0; font-size: 12px; color: #666; letter-spacing: 0.1em;">YOUR PERSONAL LIFE OPERATING SYSTEM</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 500; color: #1a1a1a;">Welcome, ${displayName}!</h2>
                      
                      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333;">
                        Thank you for joining VYOM. We're excited to help you organize and manage your life with calm, clarity, and control.
                      </p>
                      
                      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333;">
                        VYOM is designed to be your personal system of record — a quiet, private space where you can track your finances, studies, memories, and more.
                      </p>
                      
                      <!-- Features List -->
                      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 24px; margin: 0 0 30px;">
                        <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em;">What you can do with VYOM:</h3>
                        <ul style="margin: 0; padding: 0 0 0 20px; color: #333; line-height: 1.8;">
                          <li>Track expenses, income, and budget</li>
                          <li>Manage loans and EMI schedules</li>
                          <li>Organize insurance policies and claims</li>
                          <li>Plan and track your study progress</li>
                          <li>Store and organize memories</li>
                          <li>Manage daily todos and tasks</li>
                          <li>Visualize your lifespan journey</li>
                        </ul>
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '') || 'https://vyom.app'}/app" 
                               style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;">
                              GET STARTED
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9f9f9; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-align: center;">
                        VYOM By CropXon Innovations Pvt Ltd
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">
                        This is an automated welcome email. Please do not reply directly to this message.
                      </p>
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
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
