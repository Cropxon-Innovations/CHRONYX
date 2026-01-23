import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  general: "General Inquiry",
  support: "Technical Support",
  billing: "Billing Question",
  feedback: "Feedback & Suggestions",
  partnership: "Partnership Opportunity",
  other: "Other",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Processing contact form submission");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);
    const { name, email, subject, message }: ContactRequest = await req.json();

    console.log(`Contact form from: ${name} (${email}), Subject: ${subject}`);

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const subjectLabel = subjectLabels[subject] || "General Inquiry";
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Send notification to contact@getchronyx.com
    const notificationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 0.25em; color: #ffffff;">CHRONYX</h1>
            <p style="margin: 8px 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 0.15em;">NEW CONTACT FORM SUBMISSION</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <h2 style="margin: 0 0 24px; font-size: 20px; color: #1e293b;">New Message Received</h2>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #1e293b;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">From:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                    <a href="mailto:${email}" style="color: #1e293b; text-decoration: underline;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subject:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${subjectLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${timestamp}</td>
                </tr>
              </table>
            </div>

            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Message:</h3>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="margin-top: 32px; text-align: center;">
              <a href="mailto:${email}?subject=Re: ${subjectLabel} - CHRONYX" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                Reply to ${name}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px 40px; background-color: #faf9f7; border-top: 1px solid #e8e6e3; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
              This is an automated notification from <a href="https://getchronyx.com" style="color: #64748b; text-decoration: underline;">CHRONYX</a>
            </p>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8e6e3;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; font-weight: 500;">
                CHRONYX by ORIGINX LABS PVT. LTD.
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                <a href="https://www.originxlabs.com" style="color: #94a3b8; text-decoration: underline;">www.originxlabs.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send auto-reply to the user
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 40px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.25em; color: #ffffff;">CHRONYX</h1>
            <p style="margin: 8px 0 0; font-size: 10px; color: #94a3b8; letter-spacing: 0.15em;">A QUIET SPACE FOR YOUR LIFE</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <h2 style="margin: 0 0 16px; font-size: 24px; color: #1e293b;">Thank You for Reaching Out!</h2>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
              Hi ${name},
            </p>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
              We've received your message and want to thank you for getting in touch with CHRONYX. 
              Your inquiry is important to us, and we'll get back to you within 24 hours.
            </p>

            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #64748b;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">Your Message Summary:</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #475569;"><strong>Subject:</strong> ${subjectLabel}</p>
              <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Submitted:</strong> ${timestamp}</p>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
              In the meantime, feel free to explore CHRONYX or check out our documentation for quick answers.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="https://chronyx.lovable.app" 
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;">
                Explore CHRONYX
              </a>
            </div>

            <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 24px 0 0;">
              Best regards,<br>
              <strong>The CHRONYX Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 24px 40px; background-color: #faf9f7; border-top: 1px solid #e8e6e3; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
              This email was sent by <a href="https://getchronyx.com" style="color: #64748b; text-decoration: underline;">Chronyx</a> (getchronyx.com)
            </p>
            <p style="margin: 0 0 12px; font-size: 11px; color: #94a3b8;">
              For support, contact <a href="mailto:support@getchronyx.com" style="color: #64748b; text-decoration: underline;">support@getchronyx.com</a>
            </p>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8e6e3;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #94a3b8; font-weight: 500;">
                CHRONYX by CROPXON INNOVATIONS PVT. LTD.
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                <a href="https://www.cropxon.com" style="color: #94a3b8; text-decoration: underline;">www.cropxon.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use development sender for now
    const sender = "CHRONYX <onboarding@resend.dev>";

    // Send notification email to team - Office@getchronyx.com
    const notificationResult = await resend.emails.send({
      from: sender,
      to: ["Office@getchronyx.com"],
      subject: `[CHRONYX Contact] ${subjectLabel} from ${name}`,
      html: notificationHtml,
      reply_to: email,
    });

    console.log("Notification email sent:", notificationResult);

    // Send auto-reply to user
    const autoReplyResult = await resend.emails.send({
      from: sender,
      to: [email],
      subject: "Thank you for contacting CHRONYX",
      html: autoReplyHtml,
    });

    console.log("Auto-reply email sent:", autoReplyResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contact form submitted successfully" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send message";
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
