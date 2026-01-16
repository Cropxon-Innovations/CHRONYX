import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Fetching upcoming insurance renewals for reminders...");

    const today = new Date();
    const emailsSent: string[] = [];

    const { data: insurances, error: insuranceError } = await supabase
      .from("insurances")
      .select("id, policy_name, provider, renewal_date, premium_amount, user_id, reminder_days")
      .eq("status", "active");

    if (insuranceError) throw insuranceError;

    if (!insurances || insurances.length === 0) {
      console.log("No active insurances found");
      return new Response(
        JSON.stringify({ success: true, reminders_sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${insurances.length} active insurances`);

    for (const insurance of insurances) {
      const renewalDate = new Date(insurance.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = insurance.reminder_days || [30, 7, 1];

      if (!reminderDays.includes(daysUntilRenewal)) continue;

      console.log(`Insurance ${insurance.id} renewal in ${daysUntilRenewal} days`);

      const { data: existingReminder } = await supabase
        .from("insurance_reminders")
        .select("id")
        .eq("insurance_id", insurance.id)
        .eq("reminder_days_before", daysUntilRenewal)
        .single();

      if (existingReminder) {
        console.log(`Reminder already sent for insurance ${insurance.id}`);
        continue;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", insurance.user_id)
        .single();

      if (!profile?.email) {
        console.log(`No email found for user ${insurance.user_id}`);
        continue;
      }

      const formattedPremium = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(insurance.premium_amount);

      const formattedDate = renewalDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const userName = profile.display_name || "there";

      try {
        const { error: emailError } = await resend.emails.send({
          from: "CHRONYX <onboarding@resend.dev>", // Use no-reply@getchronyx.com in production
          to: [profile.email],
          subject: `Insurance Renewal: ${insurance.policy_name} due in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? "s" : ""}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 4px; font-weight: 300;">CHRONYX</h1>
                  <p style="color: #94a3b8; font-size: 10px; letter-spacing: 2px; margin-top: 6px;">INSURANCE REMINDER</p>
                </div>
                
                <!-- Alert Banner -->
                <div style="background: ${daysUntilRenewal <= 3 ? '#fef2f2' : daysUntilRenewal <= 7 ? '#fffbeb' : '#f0fdf4'}; padding: 16px 24px; border-bottom: 1px solid ${daysUntilRenewal <= 3 ? '#fecaca' : daysUntilRenewal <= 7 ? '#fed7aa' : '#bbf7d0'};">
                  <p style="margin: 0; color: ${daysUntilRenewal <= 3 ? '#b91c1c' : daysUntilRenewal <= 7 ? '#c2410c' : '#166534'}; font-size: 14px; font-weight: 500; text-align: center;">
                    ${daysUntilRenewal <= 1 ? '⚠️ Renewal due tomorrow!' : daysUntilRenewal <= 3 ? '📅 Renewal due soon' : daysUntilRenewal <= 7 ? '🔔 Renewal reminder' : '🛡️ Upcoming renewal'}
                  </p>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <p style="color: #475569; font-size: 16px; margin: 0 0 24px;">
                    Hi ${userName}, your insurance policy is up for renewal in <strong>${daysUntilRenewal} day${daysUntilRenewal > 1 ? "s" : ""}</strong>.
                  </p>
                  
                  <!-- Policy Details -->
                  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Policy Name</td>
                        <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${insurance.policy_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Provider</td>
                        <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${insurance.provider}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Renewal Date</td>
                        <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 600;">Premium Amount</td>
                        <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #059669; font-size: 18px;">${formattedPremium}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="background: #fef3c7; border-radius: 8px; padding: 14px; margin: 0 0 24px; border: 1px solid #fcd34d;">
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      <strong>Important:</strong> Renew your policy before the due date to avoid coverage gaps.
                    </p>
                  </div>
                  
                  <!-- CTA -->
                  <table role="presentation" style="width: 100%;">
                    <tr>
                      <td align="center">
                        <a href="https://chronyx.lovable.app/app/insurance" 
                           style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
                          View in CHRONYX →
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
        });

        if (emailError) {
          console.error("Error sending email:", emailError);
          continue;
        }

        await supabase.from("insurance_reminders").insert({
          insurance_id: insurance.id,
          reminder_days_before: daysUntilRenewal,
          email_sent_to: profile.email,
        });

        emailsSent.push(`${insurance.policy_name} - ${daysUntilRenewal} days`);
        console.log(`Reminder sent for insurance ${insurance.id} to ${profile.email}`);
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: emailsSent.length,
        details: emailsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-insurance-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});