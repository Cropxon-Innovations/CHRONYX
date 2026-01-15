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

    // Get the date range for last week
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    // Get all users with their profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .not("email", "is", null);

    if (profilesError) {
      throw profilesError;
    }

    const emailsSent: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Get completed tasks for the week
      const { data: completedTasks } = await supabase
        .from("todos")
        .select("id, text, date, priority")
        .eq("user_id", profile.id)
        .eq("status", "done")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      // Get pending tasks
      const { data: pendingTasks } = await supabase
        .from("todos")
        .select("id, text, date, priority")
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .lte("date", endDate)
        .order("priority", { ascending: true })
        .limit(10);

      // Get study hours for the week
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

      // Generate task lists HTML
      const completedTasksHtml = completedTasks?.slice(0, 5).map(task => 
        `<li style="margin-bottom: 8px; color: #10b981;">✓ ${task.text}</li>`
      ).join("") || "<li style='color: #6b7280;'>No tasks completed this week</li>";

      const pendingTasksHtml = pendingTasks?.slice(0, 5).map(task => {
        const priorityColor = task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#6b7280";
        return `<li style="margin-bottom: 8px;"><span style="color: ${priorityColor};">●</span> ${task.text}</li>`;
      }).join("") || "<li style='color: #6b7280;'>No pending tasks!</li>";

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #e5e7eb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d44;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #496A96 0%, #354C6C 50%, #294164 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; color: white;">CHRONYX</h1>
              <p style="margin: 8px 0 0; font-size: 12px; letter-spacing: 0.1em; opacity: 0.8; color: white;">Weekly Summary</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="font-size: 18px; margin-bottom: 24px;">Hi ${userName}! 👋</p>
              <p style="color: #9ca3af; margin-bottom: 32px;">Here's your weekly productivity summary from CHRONYX:</p>
              
              <!-- Stats Grid -->
              <div style="display: flex; gap: 16px; margin-bottom: 32px;">
                <div style="flex: 1; background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #1e3a5f;">
                  <div style="font-size: 36px; font-weight: bold; color: #10b981;">${completedCount}</div>
                  <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Completed</div>
                </div>
                <div style="flex: 1; background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #1e3a5f;">
                  <div style="font-size: 36px; font-weight: bold; color: #f59e0b;">${pendingCount}</div>
                  <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Pending</div>
                </div>
                <div style="flex: 1; background-color: #0f172a; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #1e3a5f;">
                  <div style="font-size: 36px; font-weight: bold; color: #3b82f6;">${totalStudyHours}h</div>
                  <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em;">Study Time</div>
                </div>
              </div>
              
              <!-- Completed Tasks -->
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #10b981; margin-bottom: 12px;">✅ Completed This Week</h3>
                <ul style="list-style: none; padding: 0; margin: 0; background-color: #0f172a; border-radius: 8px; padding: 16px;">
                  ${completedTasksHtml}
                </ul>
              </div>
              
              <!-- Pending Tasks -->
              <div style="margin-bottom: 32px;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #f59e0b; margin-bottom: 12px;">⏳ Still Pending</h3>
                <ul style="list-style: none; padding: 0; margin: 0; background-color: #0f172a; border-radius: 8px; padding: 16px;">
                  ${pendingTasksHtml}
                </ul>
              </div>
              
              <!-- CTA -->
              <div style="text-align: center;">
                <a href="https://chronyx.lovable.app/app" style="display: inline-block; background: linear-gradient(135deg, #496A96, #354C6C); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 500; letter-spacing: 0.05em;">
                  Open CHRONYX →
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 24px; text-align: center; border-top: 1px solid #2d2d44;">
              <p style="font-size: 11px; color: #6b7280; margin: 0;">CHRONYX by CROPXON</p>
              <p style="font-size: 10px; color: #4b5563; margin: 8px 0 0;">A Quiet Space for Your Life</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "CHRONYX <notifications@resend.dev>",
          to: [profile.email],
          subject: `📊 Your Weekly Summary - ${completedCount} tasks completed!`,
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
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-task-summary:", error);
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