import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailHeader, getEmailFooter, EMAIL_CONFIG } from "../_shared/email-templates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedemptionNotificationRequest {
  type: "user_request" | "admin_approved" | "admin_rejected";
  redemptionId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  coinsRedeemed: number;
  amountInr: number;
  paymentMethod: string;
  paymentDetails: {
    upi_id?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    account_holder?: string;
  };
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: RedemptionNotificationRequest = await req.json();
    const { 
      type, 
      redemptionId, 
      userId, 
      userEmail, 
      userName,
      coinsRedeemed, 
      amountInr, 
      paymentMethod, 
      paymentDetails,
      rejectionReason 
    } = request;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const displayName = userName || userEmail?.split("@")[0] || "User";
    const paymentInfo = paymentMethod === "upi" 
      ? `UPI: ${paymentDetails.upi_id}`
      : `Bank: ${paymentDetails.bank_name} | A/C: ****${paymentDetails.account_number?.slice(-4)} | IFSC: ${paymentDetails.ifsc_code}`;

    if (type === "user_request") {
      // Send email to user confirming request
      const userEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              ${getEmailHeader("CHRONYX")}
              
              <div style="padding: 40px;">
                <h2 style="margin: 0 0 24px; font-size: 20px; color: #1e293b; font-weight: 600;">
                  Redemption Request Received! 🎉
                </h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                  Hello ${displayName}, your redemption request has been submitted successfully and is pending admin approval.
                </p>
                
                <div style="background: linear-gradient(135deg, #f59e0b10, #f9731610); border: 1px solid #f59e0b30; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <h3 style="margin: 0 0 16px; font-size: 16px; color: #92400e;">Request Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Coins Redeemed</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${coinsRedeemed} coins</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
                      <td style="padding: 8px 0; color: #16a34a; font-size: 14px; font-weight: 600; text-align: right;">₹${amountInr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment To</td>
                      <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${paymentInfo}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    <strong>⏰ Processing Time:</strong> Within 24-72 working hours after admin approval
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #64748b;">
                  You'll receive another email once your request is approved and the payment is processed.
                </p>
              </div>
              
              ${getEmailFooter()}
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: EMAIL_CONFIG.BILLING,
        to: [userEmail],
        subject: `Redemption Request Received - ₹${amountInr}`,
        html: userEmailHtml,
        reply_to: EMAIL_CONFIG.SUPPORT_EMAIL,
      });

      // Notify all admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        // Get admin emails
        for (const admin of admins) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", admin.user_id)
            .single();

          if (profile?.email) {
            const adminEmailHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f5f5f5;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    ${getEmailHeader("CHRONYX ADMIN")}
                    
                    <div style="padding: 40px;">
                      <h2 style="margin: 0 0 24px; font-size: 20px; color: #1e293b; font-weight: 600;">
                        🔔 New Redemption Request
                      </h2>
                      
                      <div style="background: linear-gradient(135deg, #3b82f610, #6366f110); border: 1px solid #3b82f630; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px; font-size: 16px; color: #1e40af;">User Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Name</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${displayName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${userEmail}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">User ID</td>
                            <td style="padding: 8px 0; color: #64748b; font-size: 12px; font-family: monospace; text-align: right;">${userId.slice(0, 8)}...</td>
                          </tr>
                        </table>
                      </div>
                      
                      <div style="background: linear-gradient(135deg, #f59e0b10, #f9731610); border: 1px solid #f59e0b30; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 16px; font-size: 16px; color: #92400e;">Redemption Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Coins</td>
                            <td style="padding: 8px 0; color: #f59e0b; font-size: 14px; font-weight: 600; text-align: right;">${coinsRedeemed} coins</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount</td>
                            <td style="padding: 8px 0; color: #16a34a; font-size: 18px; font-weight: 700; text-align: right;">₹${amountInr}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Method</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${paymentMethod.toUpperCase()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment To</td>
                            <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${paymentInfo}</td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
                        Please review and approve/reject this request from the Admin Panel.
                      </p>
                      
                      <a href="${EMAIL_CONFIG.APP_URL}/chronyx-control-8x9k2m" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                        Go to Admin Panel
                      </a>
                    </div>
                    
                    ${getEmailFooter()}
                  </div>
                </body>
              </html>
            `;

            await resend.emails.send({
              from: EMAIL_CONFIG.BILLING,
              to: [profile.email],
              subject: `🔔 New Redemption Request - ₹${amountInr} from ${displayName}`,
              html: adminEmailHtml,
            });
          }

          // Create notification record
          await supabase.from("admin_redemption_notifications").insert({
            redemption_id: redemptionId,
            admin_user_id: admin.user_id,
            notification_type: "new_request",
          });
        }
      }

      // Update redemption request
      await supabase
        .from("redemption_requests")
        .update({ 
          admin_notified: true, 
          user_notified: true,
          user_email: userEmail,
          user_name: displayName,
        })
        .eq("id", redemptionId);

    } else if (type === "admin_approved") {
      // Send approval email to user
      const approvalEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              ${getEmailHeader("CHRONYX")}
              
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="display: inline-block; padding: 16px; background: linear-gradient(135deg, #22c55e20, #16a34a20); border-radius: 50%;">
                    <span style="font-size: 48px;">✅</span>
                  </div>
                </div>
                
                <h2 style="margin: 0 0 24px; font-size: 24px; color: #16a34a; font-weight: 600; text-align: center;">
                  Payment Approved & Sent!
                </h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center;">
                  Great news, ${displayName}! Your redemption has been approved and the payment has been initiated.
                </p>
                
                <div style="background: linear-gradient(135deg, #22c55e10, #16a34a10); border: 1px solid #22c55e30; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                  <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">Amount Credited</p>
                  <p style="margin: 0; font-size: 36px; font-weight: 700; color: #16a34a;">₹${amountInr}</p>
                  <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">${paymentInfo}</p>
                </div>
                
                <p style="font-size: 14px; color: #64748b; text-align: center;">
                  The amount should reflect in your account within a few minutes. If you don't see it within 24 hours, please contact support.
                </p>
              </div>
              
              ${getEmailFooter()}
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: EMAIL_CONFIG.BILLING,
        to: [userEmail],
        subject: `✅ Payment Sent - ₹${amountInr} Credited!`,
        html: approvalEmailHtml,
        reply_to: EMAIL_CONFIG.SUPPORT_EMAIL,
      });

    } else if (type === "admin_rejected") {
      // Send rejection email to user
      const rejectionEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              ${getEmailHeader("CHRONYX")}
              
              <div style="padding: 40px;">
                <h2 style="margin: 0 0 24px; font-size: 20px; color: #dc2626; font-weight: 600;">
                  Redemption Request Declined
                </h2>
                
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                  Hello ${displayName}, unfortunately your redemption request for ₹${amountInr} could not be processed.
                </p>
                
                ${rejectionReason ? `
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #991b1b;">
                    <strong>Reason:</strong> ${rejectionReason}
                  </p>
                </div>
                ` : ''}
                
                <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">
                  Your ${coinsRedeemed} coins have been restored to your wallet. Please contact support if you have any questions.
                </p>
                
                <a href="mailto:${EMAIL_CONFIG.SUPPORT_EMAIL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                  Contact Support
                </a>
              </div>
              
              ${getEmailFooter()}
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: EMAIL_CONFIG.BILLING,
        to: [userEmail],
        subject: `Redemption Request Update`,
        html: rejectionEmailHtml,
        reply_to: EMAIL_CONFIG.SUPPORT_EMAIL,
      });
    }

    console.log(`Redemption notification sent: ${type} for ${redemptionId}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-redemption-notification:", error);
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