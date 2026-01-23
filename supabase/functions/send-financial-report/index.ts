import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRate: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  topMerchants: Array<{ name: string; amount: number }>;
  transactionCount: number;
  averageDaily: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const generateReportHTML = (
  reportType: string,
  period: string,
  data: ReportData,
  userName: string
): string => {
  const isPositive = data.netFlow >= 0;
  const netFlowColor = isPositive ? '#16a34a' : '#dc2626';
  const netFlowSign = isPositive ? '+' : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronyx ${reportType} Financial Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.8; font-size: 14px; }
    .content { padding: 32px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .summary-card { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .summary-card.income { border-left: 4px solid #16a34a; }
    .summary-card.expense { border-left: 4px solid #dc2626; }
    .summary-card.net { border-left: 4px solid ${netFlowColor}; }
    .summary-card.savings { border-left: 4px solid #2563eb; }
    .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; }
    .income-value { color: #16a34a; }
    .expense-value { color: #dc2626; }
    .net-value { color: ${netFlowColor}; }
    .savings-value { color: #2563eb; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .category-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .category-name { font-weight: 500; }
    .category-amount { font-weight: 600; color: #1f2937; }
    .category-percent { font-size: 12px; color: #6b7280; margin-left: 8px; }
    .insights { background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 32px; }
    .insights h3 { margin: 0 0 12px 0; color: #1e40af; font-size: 14px; }
    .insights ul { margin: 0; padding-left: 20px; }
    .insights li { margin-bottom: 8px; font-size: 14px; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #2563eb; text-decoration: none; }
    .stats-row { display: flex; justify-content: space-around; background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .stat { text-align: center; }
    .stat-value { font-size: 20px; font-weight: 700; color: #1f2937; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Chronyx ${reportType} Report</h1>
      <p>${period}</p>
    </div>
    
    <div class="content">
      <p style="margin-bottom: 24px;">Hi ${userName || 'there'},</p>
      <p style="margin-bottom: 24px;">Here's your ${reportType.toLowerCase()} financial summary:</p>
      
      <div class="summary-grid">
        <div class="summary-card income">
          <div class="summary-label">Total Income</div>
          <div class="summary-value income-value">${formatCurrency(data.totalIncome)}</div>
        </div>
        <div class="summary-card expense">
          <div class="summary-label">Total Expenses</div>
          <div class="summary-value expense-value">${formatCurrency(data.totalExpenses)}</div>
        </div>
        <div class="summary-card net">
          <div class="summary-label">Net Flow</div>
          <div class="summary-value net-value">${netFlowSign}${formatCurrency(Math.abs(data.netFlow))}</div>
        </div>
        <div class="summary-card savings">
          <div class="summary-label">Savings Rate</div>
          <div class="summary-value savings-value">${data.savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">${data.transactionCount}</div>
          <div class="stat-label">Transactions</div>
        </div>
        <div class="stat">
          <div class="stat-value">${formatCurrency(data.averageDaily)}</div>
          <div class="stat-label">Avg Daily Spend</div>
        </div>
      </div>

      ${data.topCategories.length > 0 ? `
      <div class="section">
        <div class="section-title">Top Spending Categories</div>
        ${data.topCategories.slice(0, 5).map(cat => `
          <div class="category-item">
            <span class="category-name">${cat.name}</span>
            <span>
              <span class="category-amount">${formatCurrency(cat.amount)}</span>
              <span class="category-percent">(${cat.percentage.toFixed(1)}%)</span>
            </span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.topMerchants.length > 0 ? `
      <div class="section">
        <div class="section-title">Top Merchants</div>
        ${data.topMerchants.slice(0, 5).map(m => `
          <div class="category-item">
            <span class="category-name">${m.name}</span>
            <span class="category-amount">${formatCurrency(m.amount)}</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="insights">
        <h3>💡 Insights</h3>
        <ul>
          ${data.savingsRate >= 20 ? '<li>Great job! You\'re saving more than 20% of your income.</li>' : 
            data.savingsRate >= 10 ? '<li>Good progress! Try to increase savings to 20%.</li>' : 
            '<li>Consider reducing expenses to improve your savings rate.</li>'}
          ${data.topCategories[0] ? `<li>Your highest spending is on ${data.topCategories[0].name} (${data.topCategories[0].percentage.toFixed(0)}%).</li>` : ''}
          ${isPositive ? '<li>Positive cash flow - you\'re spending less than you earn! 🎉</li>' : '<li>Consider reviewing expenses - spending exceeds income.</li>'}
        </ul>
      </div>

      <p style="text-align: center; color: #6b7280; font-size: 14px;">
        View detailed analytics in your <a href="${Deno.env.get('SITE_URL') || 'https://chronyx.app'}/app/finance-flow" style="color: #2563eb;">Chronyx Dashboard</a>
      </p>
    </div>

    <div class="footer">
      <p>This is an automated report from Chronyx.</p>
      <p>To manage your report preferences, visit <a href="${Deno.env.get('SITE_URL') || 'https://chronyx.app'}/app/settings">Settings</a>.</p>
      <p style="margin-top: 12px;">© ${new Date().getFullYear()} Chronyx. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

const getDateRange = (reportType: string): { start: Date; end: Date; period: string } => {
  const now = new Date();
  let start: Date;
  let period: string;

  switch (reportType) {
    case 'daily':
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      period = start.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      break;
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      period = `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      period = start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      break;
    case 'quarterly':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      period = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
      break;
    case 'annually':
      start = new Date(now.getFullYear() - 1, 0, 1);
      period = `Year ${now.getFullYear() - 1}`;
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      period = 'Last 7 days';
  }

  return { start, end: now, period };
};

const fetchReportData = async (
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string
): Promise<ReportData> => {
  // Fetch expenses and income in parallel
  const [expensesRes, incomeRes, transactionsRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate),
    supabase
      .from("income_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("income_date", startDate)
      .lte("income_date", endDate),
    supabase
      .from("auto_imported_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_duplicate", false)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
  ]);

  const expenses = expensesRes.data || [];
  const income = incomeRes.data || [];
  const transactions = transactionsRes.data || [];

  // Calculate totals
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) +
    transactions.filter((t: any) => t.transaction_type === 'expense').reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const totalIncome = income.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0) +
    transactions.filter((t: any) => t.transaction_type === 'income').reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netFlow / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryMap = new Map<string, number>();
  expenses.forEach((e: any) => {
    const cat = e.category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount || 0));
  });

  const topCategories = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top merchants
  const merchantMap = new Map<string, number>();
  [...expenses, ...transactions].forEach((item: any) => {
    const merchant = item.merchant_name || item.description || 'Unknown';
    merchantMap.set(merchant, (merchantMap.get(merchant) || 0) + Number(item.amount || 0));
  });

  const topMerchants = Array.from(merchantMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate days in period
  const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;

  return {
    totalIncome,
    totalExpenses,
    netFlow,
    savingsRate,
    topCategories,
    topMerchants,
    transactionCount: expenses.length + transactions.length,
    averageDaily: totalExpenses / days,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, userId, reportType, email } = await req.json();

    if (action === 'send_report') {
      // Send a single report
      if (!userId || !reportType) {
        return new Response(JSON.stringify({ error: 'Missing userId or reportType' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        return new Response(JSON.stringify({ error: 'User email not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { start, end, period } = getDateRange(reportType);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const reportData = await fetchReportData(supabase, userId, startStr, endStr);
      const reportTypeCapitalized = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      const html = generateReportHTML(reportTypeCapitalized, period, reportData, profile.display_name || '');

      const emailResponse = await resend.emails.send({
        from: "Chronyx <reports@chronyx.app>",
        to: [email || profile.email],
        subject: `Your ${reportTypeCapitalized} Financial Report - ${period}`,
        html,
      });

      // Update subscription last_sent_at
      await supabase
        .from('finance_report_subscriptions')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('report_type', reportType);

      console.log('Report sent successfully:', emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'process_scheduled') {
      // Process all scheduled reports (called by cron)
      const now = new Date();

      // Find subscriptions that need to be sent
      const { data: subscriptions } = await supabase
        .from('finance_report_subscriptions')
        .select('*, profiles!inner(email, display_name)')
        .eq('is_enabled', true);

      const results = [];

      for (const sub of subscriptions || []) {
        try {
          // Check if it's time to send based on report_type
          const shouldSend = checkIfShouldSend(sub.report_type, sub.last_sent_at);
          
          if (!shouldSend) continue;

          const { start, end, period } = getDateRange(sub.report_type);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];

          const reportData = await fetchReportData(supabase, sub.user_id, startStr, endStr);
          const reportTypeCapitalized = sub.report_type.charAt(0).toUpperCase() + sub.report_type.slice(1);
          const html = generateReportHTML(reportTypeCapitalized, period, reportData, sub.profiles?.display_name || '');

          await resend.emails.send({
            from: "Chronyx <reports@chronyx.app>",
            to: [sub.profiles?.email],
            subject: `Your ${reportTypeCapitalized} Financial Report - ${period}`,
            html,
          });

          // Update last_sent_at
          await supabase
            .from('finance_report_subscriptions')
            .update({ last_sent_at: now.toISOString() })
            .eq('id', sub.id);

          results.push({ id: sub.id, status: 'sent' });
        } catch (err: any) {
          console.error(`Failed to send report for subscription ${sub.id}:`, err);
          results.push({ id: sub.id, status: 'failed', error: err.message });
        }
      }

      return new Response(JSON.stringify({ processed: results.length, results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in send-financial-report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function checkIfShouldSend(reportType: string, lastSentAt: string | null): boolean {
  if (!lastSentAt) return true;

  const now = new Date();
  const lastSent = new Date(lastSentAt);
  const hoursSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  switch (reportType) {
    case 'daily':
      return hoursSinceLast >= 24 && now.getHours() >= 7; // Send after 7 AM
    case 'weekly':
      return hoursSinceLast >= 168 && now.getDay() === 1; // Monday
    case 'monthly':
      return hoursSinceLast >= 672 && now.getDate() === 1; // 1st of month
    case 'quarterly':
      return hoursSinceLast >= 2016 && [0, 3, 6, 9].includes(now.getMonth()) && now.getDate() === 1;
    case 'annually':
      return hoursSinceLast >= 8640 && now.getMonth() === 0 && now.getDate() === 1;
    default:
      return false;
  }
}
