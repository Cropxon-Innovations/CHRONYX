import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category patterns for common merchants
const CATEGORY_PATTERNS: Record<string, { pattern: RegExp; category: string; confidence: number }[]> = {
  'Food & Dining': [
    { pattern: /swiggy|zomato|uber\s*eats|domino|pizza|mcdonald|kfc|burger|restaurant|cafe|coffee|starbucks|chaayos|haldiram|barbeque|subway|dunkin/i, category: 'Food & Dining', confidence: 0.95 },
  ],
  'Shopping': [
    { pattern: /amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal|shopclues|tatacliq|jiomart|bigbasket|grofers|blinkit|zepto|instamart/i, category: 'Shopping', confidence: 0.9 },
  ],
  'Transportation': [
    { pattern: /uber|ola|rapido|meru|irctc|redbus|makemytrip|goibibo|yatra|cleartrip|indigo|spicejet|vistara|air\s*india|metro|railway/i, category: 'Transportation', confidence: 0.92 },
  ],
  'Entertainment': [
    { pattern: /netflix|hotstar|prime\s*video|spotify|gaana|jiosaavn|youtube|zee5|sonyliv|voot|apple\s*music|bookmyshow|pvr|inox/i, category: 'Entertainment', confidence: 0.95 },
  ],
  'Utilities': [
    { pattern: /electricity|water|gas|broadband|internet|jio|airtel|vodafone|vi\s|bsnl|tata\s*sky|dish\s*tv|d2h/i, category: 'Utilities', confidence: 0.9 },
  ],
  'Healthcare': [
    { pattern: /pharmacy|1mg|pharmeasy|netmeds|apollo|medplus|hospital|clinic|doctor|diagnostic|lab|health|medical|wellness/i, category: 'Healthcare', confidence: 0.88 },
  ],
  'Education': [
    { pattern: /udemy|coursera|unacademy|byju|upgrad|simplilearn|school|college|university|tuition|books|kindle/i, category: 'Education', confidence: 0.85 },
  ],
  'Finance': [
    { pattern: /sip|mutual\s*fund|zerodha|groww|upstox|paytm\s*money|kuvera|emi|loan/i, category: 'Finance', confidence: 0.87 },
  ],
  'Subscriptions': [
    { pattern: /subscription|membership|premium|pro\s*plan|annual|monthly\s*fee|renewal/i, category: 'Subscriptions', confidence: 0.8 },
  ],
  'Fuel': [
    { pattern: /petrol|diesel|fuel|iocl|hpcl|bpcl|indian\s*oil|bharat\s*petroleum|shell|reliance\s*petro/i, category: 'Fuel', confidence: 0.95 },
  ],
  'Insurance': [
    // Use word boundary for LIC to avoid matching "public", "click", etc.
    { pattern: /\blic\b|life\s*insurance\s*corp|hdfc\s*ergo|icici\s*lombard|bajaj\s*allianz|star\s*health|max\s*bupa|care\s*health/i, category: 'Insurance', confidence: 0.9 },
  ],
  'Technology': [
    { pattern: /lovable|github|openai|chatgpt|vercel|netlify|aws|azure|digitalocean|heroku/i, category: 'Technology', confidence: 0.9 },
  ],
  'Investments': [
    { pattern: /nse|bse|shares|stocks|equity|demat|trading|zerodha|groww|upstox|angel|motilal|kotak\s*securities/i, category: 'Investments', confidence: 0.85 },
  ],
};

// Extract category from patterns
function getCategoryFromPatterns(merchantName: string, emailContent: string): { category: string; confidence: number } | null {
  const combinedText = `${merchantName} ${emailContent}`.toLowerCase();
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const { pattern, category: cat, confidence } of patterns) {
      if (pattern.test(combinedText)) {
        return { category: cat, confidence };
      }
    }
  }
  
  return null;
}

// AI-powered categorization using Gemini
async function aiCategorize(merchantName: string, emailSubject: string, emailContent: string): Promise<{ category: string; confidence: number }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  
  if (!geminiKey) {
    console.log('No Gemini API key, falling back to pattern matching');
    return getCategoryFromPatterns(merchantName, emailContent) || { category: 'Other', confidence: 0.5 };
  }

  try {
    const prompt = `Categorize this transaction into one of these categories:
- Food & Dining
- Shopping
- Transportation
- Entertainment
- Utilities
- Healthcare
- Education
- Finance
- Subscriptions
- Fuel
- Insurance
- Investments
- Rent
- Salary
- Other

Transaction details:
Merchant: ${merchantName}
Subject: ${emailSubject}
Content snippet: ${emailContent.substring(0, 500)}

Respond with JSON only: {"category": "CategoryName", "confidence": 0.XX}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return getCategoryFromPatterns(merchantName, emailContent) || { category: 'Other', confidence: 0.5 };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || 'Other',
        confidence: parsed.confidence || 0.7,
      };
    }
  } catch (error) {
    console.error('AI categorization error:', error);
  }

  return getCategoryFromPatterns(merchantName, emailContent) || { category: 'Other', confidence: 0.5 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, transactions, merchantName, emailSubject, emailContent } = body;

    if (action === 'categorize_single') {
      // Single transaction categorization
      const result = await aiCategorize(merchantName || '', emailSubject || '', emailContent || '');
      
      // Learn the pattern if confidence is high
      if (result.confidence >= 0.8 && merchantName) {
        await supabase.from('ai_category_patterns').upsert({
          user_id: user.id,
          merchant_pattern: merchantName.toLowerCase(),
          suggested_category: result.category,
          confidence: result.confidence,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'user_id,merchant_pattern' });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'categorize_batch') {
      // Batch categorization
      const results = [];
      
      // First, get user's learned patterns
      const { data: userPatterns } = await supabase
        .from('ai_category_patterns')
        .select('*')
        .eq('user_id', user.id);

      const patternMap = new Map(
        (userPatterns || []).map(p => [p.merchant_pattern, { category: p.suggested_category, confidence: p.confidence }])
      );

      for (const tx of transactions || []) {
        const merchantLower = (tx.merchant_name || '').toLowerCase();
        
        // Check user patterns first
        let result = patternMap.get(merchantLower);
        
        if (!result) {
          // Check partial matches
          for (const [pattern, data] of patternMap) {
            if (merchantLower.includes(pattern) || pattern.includes(merchantLower)) {
              result = data;
              break;
            }
          }
        }

        if (!result) {
          // Fall back to AI/pattern matching
          result = await aiCategorize(tx.merchant_name || '', tx.email_subject || '', tx.email_body || '');
        }

        results.push({
          transaction_id: tx.id,
          ...result,
        });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'learn_category') {
      // User correction - learn the pattern
      const { transactionId, category, merchantName: merchant } = body;
      
      if (merchant && category) {
        await supabase.from('ai_category_patterns').upsert({
          user_id: user.id,
          merchant_pattern: merchant.toLowerCase(),
          suggested_category: category,
          confidence: 1.0, // User confirmed
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'user_id,merchant_pattern' });

        // Update the transaction
        if (transactionId) {
          await supabase
            .from('auto_imported_transactions')
            .update({ category, user_verified: true, learned_category: category })
            .eq('id', transactionId);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_suggestions') {
      // Get category suggestions for a merchant
      const { data: patterns } = await supabase
        .from('ai_category_patterns')
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ patterns: patterns || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
