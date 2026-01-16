import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReceiptRequest {
  email: string;
  display_name?: string;
  plan_type: string;
  amount: number;
  currency: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  payment_history_id: string;
}

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Payment receipt function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, display_name, plan_type, amount, currency, razorpay_payment_id, razorpay_order_id, payment_history_id }: PaymentReceiptRequest = await req.json();

    const planNames: Record<string, string> = { 
      pro: "Pro Plan (Monthly)", 
      premium: "Premium Lifetime Plan" 
    };
    
    const planDescriptions: Record<string, string> = {
      pro: "10GB storage, Tax savings insights, Advanced reports",
      premium: "Unlimited storage, All future updates, Early access features"
    };

    const currentDate = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 6px; font-weight: 300;">CHRONYX</h1>
            <p style="color: #94a3b8; font-size: 10px; letter-spacing: 2px; margin-top: 8px;">PAYMENT RECEIPT</p>
          </div>
          
          <!-- Success Badge -->
          <div style="padding: 24px 32px 0; text-align: center;">
            <div style="display: inline-block; background: #dcfce7; border-radius: 50px; padding: 12px 24px; border: 1px solid #86efac;">
              <span style="color: #166534; font-size: 14px; font-weight: 500;">✓ Payment Successful</span>
            </div>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px; font-weight: 500;">
              Thank you${display_name ? `, ${display_name}` : ''}!
            </h2>
            <p style="color: #64748b; font-size: 15px; margin: 0 0 32px; line-height: 1.6;">
              Your payment has been successfully processed. Welcome to CHRONYX ${planNames[plan_type] || plan_type}!
            </p>
            
            <!-- Receipt Details -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Receipt Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Plan</td>
                  <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${planNames[plan_type] || plan_type}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Date</td>
                  <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${currentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Payment ID</td>
                  <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 12px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${razorpay_payment_id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Order ID</td>
                  <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 12px; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${razorpay_order_id}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; color: #0f172a; font-size: 16px; font-weight: 600;">Total Amount</td>
                  <td style="padding: 14px 0; font-weight: 700; text-align: right; color: #0f172a; font-size: 20px;">${formatAmount(amount, currency)}</td>
                </tr>
              </table>
            </div>
            
            <!-- Features Included -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; border: 1px solid #bae6fd; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px; font-size: 13px; color: #0369a1; font-weight: 600;">What's Included:</h4>
              <p style="margin: 0; color: #0c4a6e; font-size: 14px; line-height: 1.6;">
                ${planDescriptions[plan_type] || "All premium features"}
              </p>
            </div>
            
            <!-- CTA Button -->
            <table role="presentation" style="width: 100%;">
              <tr>
                <td align="center">
                  <a href="https://chronyx.lovable.app/app/dashboard" 
                     style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;">
                    Go to CHRONYX →
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">
              This email was sent by <a href="https://getchronyx.com" style="color: #64748b; text-decoration: underline;">Chronyx</a> (getchronyx.com)
            </p>
            <p style="margin: 0 0 12px; font-size: 10px; color: #94a3b8;">
              For billing inquiries, contact <a href="mailto:office@getchronyx.com" style="color: #64748b; text-decoration: underline;">office@getchronyx.com</a>
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
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "CHRONYX <onboarding@resend.dev>", // Use office@getchronyx.com in production
        to: [email],
        subject: `Payment Receipt - ${planNames[plan_type] || plan_type} | CHRONYX`,
        html: emailHtml,
      }),
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from('payment_history').update({ 
      receipt_sent: true, 
      receipt_sent_at: new Date().toISOString() 
    }).eq('id', payment_history_id);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    });
  }
};

serve(handler);