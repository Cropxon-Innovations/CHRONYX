import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    const weekLabel = `${weekAgo.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .not("email", "is", null);

    if (profilesError) throw profilesError;

    const emailsSent: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      const { data: completedTasks } = await supabase
        .from("todos")
        .select("id, text, date, priority")
        .eq("user_id", profile.id)
        .eq("status", "done")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      const { data: pendingTasks } = await supabase
        .from("todos")
        .select("id, text, date, priority")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .lte("date", endDate)
        .order("priority", { ascending: true })
        .limit(10);

      const { data: studyLogs } = await supabase
        .from("study_logs")
        .select("duration")
        .eq("user_id", profile.id)
        .gte("date", startDate)
        .lte("date", endDate);

      const totalStudyMinutes = studyLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;
      const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

      const completedCount = completedTasks?.length || 0;
      const pendingCount = pendingTasks?.length || 0;
      const userName = profile.display_name || "there";

      // Calculate productivity score
      const productivityScore = completedCount > 0 ? Math.min(100, Math.round((completedCount / (completedCount + pendingCount)) * 100)) : 0;

      const completedTasksHtml = completedTasks?.slice(0, 5).map(task => 
        `<tr><td style="padding: 8px 0; color: #10b981; font-size: 14px;">✓ ${task.text}</td></tr>`
      ).join("") || "<tr><td style='color: #6b7280; font-size: 14px; padding: 8px 0;'>No tasks completed this week</td></tr>";

      const pendingTasksHtml = pendingTasks?.slice(0, 5).map(task => {
        const priorityColor = task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#6b7280";
        return `<tr><td style="padding: 8px 0; font-size: 14px;"><span style="color: ${priorityColor}; font-size: 10px;">●</span> ${task.text}</td></tr>`;
      }).join("") || "<tr><td style='color: #6b7280; font-size: 14px; padding: 8px 0;'>All caught up! 🎉</td></tr>";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #475569 0%, #334155 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; color: white;">CHRONYX</h1>
              <p style="margin: 8px 0 0; font-size: 12px; letter-spacing: 0.1em; color: #94a3b8;">Weekly Summary</p>
              <p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">${weekLabel}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="font-size: 18px; margin-bottom: 8px; color: #f1f5f9;">Hi ${userName}! 👋</p>
              <p style="color: #94a3b8; margin-bottom: 32px; font-size: 14px;">Here's your weekly productivity summary from CHRONYX:</p>
              
              <!-- Stats Cards -->
              <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #334155; width: 33%;">
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${completedCount}</div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Completed</div>
                  </td>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #334155; width: 33%;">
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${pendingCount}</div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Pending</div>
                  </td>
                  <td style="background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #334155; width: 33%;">
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${totalStudyHours}h</div>
                    <div style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px;">Study</div>
                  </td>
                </tr>
              </table>
              
              <!-- Productivity Score -->
              <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155; text-align: center;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Productivity Score</p>
                <p style="margin: 0; font-size: 36px; font-weight: bold; color: ${productivityScore >= 70 ? '#10b981' : productivityScore >= 40 ? '#f59e0b' : '#ef4444'};">${productivityScore}%</p>
              </div>
              
              <!-- Completed Tasks -->
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #10b981; margin-bottom: 12px;">✅ Completed This Week</h3>
                <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #334155;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${completedTasksHtml}
                  </table>
                  ${completedCount > 5 ? `<p style="margin: 12px 0 0; font-size: 12px; color: #64748b;">+ ${completedCount - 5} more tasks</p>` : ''}
                </div>
              </div>
              
              <!-- Pending Tasks -->
              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #f59e0b; margin-bottom: 12px;">⏳ Still Pending</h3>
                <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #334155;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${pendingTasksHtml}
                  </table>
                </div>
              </div>
              
              <!-- CTA -->
              <table style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="https://chronyx.lovable.app/app/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #475569, #334155); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; letter-spacing: 0.05em; font-size: 14px;">
                      Open CHRONYX →
                    </a>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px; text-align: center; border-top: 1px solid #334155; background-color: #0f172a;">
              <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">
                This email was sent by <a href="https://getchronyx.com" style="color: #94a3b8; text-decoration: underline;">Chronyx</a> (getchronyx.com)
              </p>
              <p style="margin: 0 0 12px; font-size: 10px; color: #475569;">
                For support, contact <a href="mailto:support@getchronyx.com" style="color: #64748b; text-decoration: underline;">support@getchronyx.com</a>
              </p>
              <div style="padding-top: 12px; border-top: 1px solid #334155;">
                <p style="margin: 0 0 2px; font-size: 10px; color: #475569; font-weight: 500;">
                  CHRONYX by CROPXON INNOVATIONS PVT. LTD.
                </p>
                <p style="margin: 0; font-size: 9px; color: #374151;">
                  <a href="https://www.cropxon.com" style="color: #475569; text-decoration: underline;">www.cropxon.com</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "CHRONYX <onboarding@resend.dev>", // Use no-reply@getchronyx.com in production
          to: [profile.email],
          subject: `📊 Weekly Summary: ${completedCount} tasks completed | CHRONYX`,
          html: emailHtml,
        });
        emailsSent.push(profile.email);
      } catch (emailError) {
        console.error(`Failed to send email to ${profile.email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Weekly summaries sent to ${emailsSent.length} users`,
        recipients: emailsSent
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-task-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);