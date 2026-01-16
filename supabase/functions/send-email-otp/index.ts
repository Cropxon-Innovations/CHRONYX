import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
  userId: string;
  type: "email" | "phone";
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, type }: SendOtpRequest = await req.json();

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log(`Generated OTP for ${email}: ${otp}`);

    const otpHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(otp + userId)
    );
    const hashArray = Array.from(new Uint8Array(otpHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CHRONYX <onboarding@resend.dev>", // Use no-reply@getchronyx.com in production
        to: [email],
        subject: `Your CHRONYX Verification Code: ${otp}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
              <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 6px; font-weight: 300;">CHRONYX</h1>
                  <p style="color: #94a3b8; font-size: 10px; letter-spacing: 2px; margin-top: 8px;">VERIFICATION CODE</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 32px; text-align: center;">
                  <p style="color: #475569; font-size: 15px; margin: 0 0 24px;">Your verification code is:</p>
                  
                  <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 0 0 24px;">
                    <span style="font-size: 40px; font-weight: 600; letter-spacing: 10px; color: #0f172a; font-family: 'SF Mono', 'Monaco', monospace;">${otp}</span>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                    Enter this code to verify your ${type === "email" ? "email address" : "phone number"}.
                  </p>
                  
                  <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 24px 0 0; border: 1px solid #fcd34d;">
                    <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
                      ⏱ This code expires in <strong>10 minutes</strong>
                    </p>
                  </div>
                  
                  <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">
                    If you didn't request this code, please ignore this email.
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">
                    This email was sent by <a href="https://getchronyx.com" style="color: #64748b; text-decoration: underline;">Chronyx</a> (getchronyx.com)
                  </p>
                  <p style="margin: 0 0 12px; font-size: 10px; color: #94a3b8;">
                    For support, contact <a href="mailto:support@getchronyx.com" style="color: #64748b; text-decoration: underline;">support@getchronyx.com</a>
                  </p>
                  <div style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 2px; font-size: 10px; color: #94a3b8; font-weight: 500;">
                      CHRONYX by CROPXON INNOVATIONS PVT. LTD.
                    </p>
                    <p style="margin: 0; font-size: 9px; color: #94a3b8;">
                      <a href="https://www.cropxon.com" style="color: #94a3b8; text-decoration: underline;">www.cropxon.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        otpHash: hashHex,
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);