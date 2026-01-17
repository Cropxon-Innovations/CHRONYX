import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, history, language } = await req.json();
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", response: "I need you to be logged in to access your personal data." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to verify the token and fetch data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user with the provided token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("[chronyx-bot] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", response: "I couldn't verify your identity. Please try logging in again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[chronyx-bot] User authenticated:", user.id);

    // Fetch user's actual data for context
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Parallel data fetching for efficiency - filter by user.id for all tables
    const [
      profileResult,
      todosToday,
      todosWeek,
      expensesMonth,
      incomeMonth,
      loansActive,
      insurancesActive,
      studyLogsWeek,
      memoriesCount,
      notesCount
    ] = await Promise.all([
      supabase.from("profiles").select("display_name, birth_date, target_age").eq("id", user.id).single(),
      supabase.from("todos").select("id, text, status, priority").eq("user_id", user.id).eq("date", today),
      supabase.from("todos").select("id, status").eq("user_id", user.id).gte("date", startOfWeek),
      supabase.from("expenses").select("amount, category, expense_date").eq("user_id", user.id).gte("expense_date", startOfMonth),
      supabase.from("income_entries").select("amount, income_date").eq("user_id", user.id).gte("income_date", startOfMonth),
      supabase.from("loans").select("id, bank_name, principal_amount, emi_amount, status").eq("user_id", user.id).eq("status", "active"),
      supabase.from("insurances").select("id, policy_name, premium_amount, renewal_date, status").eq("user_id", user.id).eq("status", "active"),
      supabase.from("study_logs").select("id, subject, duration, date").eq("user_id", user.id).gte("date", startOfWeek),
      supabase.from("memories").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    ]);

    // Calculate user statistics
    const profile = profileResult.data;
    const displayName = profile?.display_name || "there";
    
    // Tasks analysis
    const todaysTasks = todosToday.data || [];
    const weekTasks = todosWeek.data || [];
    const completedToday = todaysTasks.filter(t => t.status === "completed").length;
    const pendingToday = todaysTasks.filter(t => t.status === "pending").length;
    const completedWeek = weekTasks.filter(t => t.status === "completed").length;
    const totalWeek = weekTasks.length;
    const completionRate = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0;

    // Finance analysis
    const expenses = expensesMonth.data || [];
    const income = incomeMonth.data || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
    const savings = totalIncome - totalExpenses;
    
    // Expense by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`);

    // Loans & Insurance
    const loans = loansActive.data || [];
    const insurances = insurancesActive.data || [];
    const totalLoanOutstanding = loans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
    const monthlyEMI = loans.reduce((sum, l) => sum + (l.emi_amount || 0), 0);
    const totalCoverage = insurances.reduce((sum, i) => sum + 0, 0); // Sum assured not in select

    // Study analysis
    const studyLogs = studyLogsWeek.data || [];
    const totalStudyMinutes = studyLogs.reduce((sum, s) => sum + (s.duration || 0), 0);
    const studyHours = Math.round(totalStudyMinutes / 60 * 10) / 10;
    const subjectsStudied = [...new Set(studyLogs.map(s => s.subject))];

    // Lifespan (if birth date available)
    let lifeProgress = "";
    if (profile?.birth_date && profile?.target_age) {
      const birthDate = new Date(profile.birth_date);
      const ageInYears = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const progress = Math.round((ageInYears / profile.target_age) * 100);
      lifeProgress = `Life progress: ${progress}% (${Math.floor(ageInYears)} years of ${profile.target_age} target)`;
    }

    // Build comprehensive context
    const userContext = `
USER PROFILE:
- Name: ${displayName}
- User ID: ${user.id}
${lifeProgress ? `- ${lifeProgress}` : ""}

TODAY'S TASKS (${today}):
- Completed: ${completedToday}
- Pending: ${pendingToday}
- Total: ${todaysTasks.length}
${pendingToday > 0 ? `- Pending tasks: ${todaysTasks.filter(t => t.status === "pending").map(t => t.text).slice(0, 3).join(", ")}${pendingToday > 3 ? "..." : ""}` : ""}

THIS WEEK'S PRODUCTIVITY:
- Tasks completed: ${completedWeek}/${totalWeek}
- Completion rate: ${completionRate}%

FINANCES THIS MONTH:
- Total Income: ₹${totalIncome.toLocaleString('en-IN')}
- Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
- Savings: ₹${savings.toLocaleString('en-IN')} (${totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0}% savings rate)
${topCategories.length > 0 ? `- Top spending: ${topCategories.join(", ")}` : ""}

LOANS & LIABILITIES:
- Active loans: ${loans.length}
- Total outstanding: ₹${totalLoanOutstanding.toLocaleString('en-IN')}
- Monthly EMI commitment: ₹${monthlyEMI.toLocaleString('en-IN')}
${loans.length > 0 ? `- Banks: ${loans.map(l => l.bank_name).join(", ")}` : ""}

INSURANCE:
- Active policies: ${insurances.length}
${insurances.length > 0 ? `- Policies: ${insurances.map(i => i.policy_name).slice(0, 3).join(", ")}` : ""}

STUDY THIS WEEK:
- Total hours: ${studyHours} hours
- Subjects: ${subjectsStudied.length > 0 ? subjectsStudied.join(", ") : "None logged"}
- Sessions: ${studyLogs.length}

VAULT:
- Memories saved: ${memoriesCount.count || 0}
- Notes created: ${notesCount.count || 0}

IMPORTANT RULES:
1. ONLY use the data above. NEVER make up numbers or information.
2. If data shows 0 or empty, say "I don't see any [X] recorded yet" - don't invent.
3. Be specific with actual numbers from the data above.
4. If asked about something not in the data, politely say you don't have that information.
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // NOVA - Female PA persona with professional yet friendly tone
    const systemPrompt = `You are NOVA (Neural Orchestrated Voice Agent), a professional female personal assistant for CHRONYX - a personal system of record app.

PERSONALITY & VOICE:
- You are a calm, composed, and professional female assistant
- Speak in a warm, measured tone - never rushed or anxious
- Be genuinely helpful like a trusted personal secretary
- Show empathy and understanding while remaining professional
- Use "I" statements: "I see that...", "I notice...", "Let me help you with..."
- Be encouraging but honest - never falsely positive

COMMUNICATION STYLE:
- Keep responses concise (2-4 sentences typically)
- Use proper formatting with line breaks for readability
- Reference SPECIFIC numbers from the user's data
- Format currency as ₹X,XX,XXX (Indian format)
- Use dates in a friendly format (e.g., "this week", "today")

STRICT DATA RULES:
1. ONLY reference data from the USER CONTEXT provided below
2. NEVER invent, guess, or approximate numbers
3. If data is 0 or empty, say "I don't see any records for that yet"
4. If asked about something not in context, say "I don't have access to that information"
5. Never mention "context" or "data provided" - speak naturally as if you know the user

RESPONSE PATTERNS:
- For productivity: Reference actual completion rates and pending tasks
- For finances: Use exact numbers, mention savings rate, top spending
- For study: Reference actual hours and subjects
- For life advice: Be supportive but grounded in their actual situation

${userContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 600,
        temperature: 0.6, // Slightly lower for more consistent, professional responses
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", response: "I'm a bit overwhelmed right now. Could you try again in a moment?" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits depleted", response: "I'm temporarily unavailable. Please check back later." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || "I apologize, I'm having trouble formulating a response right now.";

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("chronyx-bot error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        response: "I apologize, I'm experiencing some difficulties. Please try again in a moment."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
