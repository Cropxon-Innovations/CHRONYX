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

    console.log("Fetching upcoming EMIs for reminders...");

    const today = new Date();
    const reminderDays = [7, 3, 1];
    const emailsSent: string[] = [];

    for (const days of reminderDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      console.log(`Checking EMIs due on ${targetDateStr} (${days} days away)...`);

      const { data: emis, error: emiError } = await supabase
        .from("emi_schedule")
        .select(`
          id,
          emi_date,
          emi_amount,
          loan_id,
          loans!inner (
            id,
            bank_name,
            loan_type,
            user_id
          )
        `)
        .eq("payment_status", "Pending")
        .eq("emi_date", targetDateStr);

      if (emiError) {
        console.error("Error fetching EMIs:", emiError);
        continue;
      }

      if (!emis || emis.length === 0) {
        console.log(`No EMIs due on ${targetDateStr}`);
        continue;
      }

      console.log(`Found ${emis.length} EMIs due on ${targetDateStr}`);

      for (const emi of emis) {
        const loan = emi.loans as any;
        const reminderType = `upcoming_${days}`;

        const { data: existingReminder } = await supabase
          .from("emi_reminders")
          .select("id")
          .eq("emi_id", emi.id)
          .eq("reminder_type", reminderType)
          .single();

        if (existingReminder) {
          console.log(`Reminder already sent for EMI ${emi.id}`);
          continue;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("id", loan.user_id)
          .single();

        if (!profile?.email) {
          console.log(`No email found for user ${loan.user_id}`);
          continue;
        }

        const formattedAmount = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(emi.emi_amount);

        const formattedDate = new Date(emi.emi_date).toLocaleDateString("en-IN", {
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
            subject: `EMI Reminder: ${loan.bank_name} payment due in ${days} day${days > 1 ? "s" : ""}`,
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
                    <p style="color: #94a3b8; font-size: 10px; letter-spacing: 2px; margin-top: 6px;">EMI REMINDER</p>
                  </div>
                  
                  <!-- Alert Banner -->
                  <div style="background: ${days === 1 ? '#fef2f2' : days === 3 ? '#fffbeb' : '#f0f9ff'}; padding: 16px 24px; border-bottom: 1px solid ${days === 1 ? '#fecaca' : days === 3 ? '#fed7aa' : '#bae6fd'};">
                    <p style="margin: 0; color: ${days === 1 ? '#b91c1c' : days === 3 ? '#c2410c' : '#0369a1'}; font-size: 14px; font-weight: 500; text-align: center;">
                      ${days === 1 ? '⚠️ Payment due tomorrow!' : days === 3 ? '📅 Payment due in 3 days' : '🔔 Upcoming payment reminder'}
                    </p>
                  </div>
                  
                  <!-- Content -->
                  <div style="padding: 32px;">
                    <p style="color: #475569; font-size: 16px; margin: 0 0 24px;">
                      Hi ${userName}, your EMI payment is due in <strong>${days} day${days > 1 ? "s" : ""}</strong>.
                    </p>
                    
                    <!-- EMI Details -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Bank</td>
                          <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${loan.bank_name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Loan Type</td>
                          <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${loan.loan_type}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #64748b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">Due Date</td>
                          <td style="padding: 10px 0; font-weight: 500; text-align: right; color: #0f172a; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${formattedDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; color: #0f172a; font-size: 15px; font-weight: 600;">EMI Amount</td>
                          <td style="padding: 12px 0; font-weight: 700; text-align: right; color: #dc2626; font-size: 18px;">${formattedAmount}</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 24px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                      💡 <strong>Tip:</strong> Ensure sufficient balance in your account to avoid late payment charges.
                    </p>
                    
                    <!-- CTA -->
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="https://chronyx.lovable.app/app/loans" 
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

          await supabase.from("emi_reminders").insert({
            emi_id: emi.id,
            reminder_type: reminderType,
            email_sent_to: profile.email,
          });

          emailsSent.push(`${loan.bank_name} - ${formattedAmount} (${days} days)`);
          console.log(`Reminder sent for EMI ${emi.id} to ${profile.email}`);
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
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
    console.error("Error in send-emi-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});