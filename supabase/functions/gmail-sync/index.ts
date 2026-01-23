import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CHRONYX Auto Finance - Hybrid Parser
// Rule-based first, Gemini 1.5 Flash fallback
// ========================================

// Gmail query for transaction emails - includes receipts AND bank alerts
const GMAIL_QUERY_PARTS = [
  // Receipt/invoice subjects
  'subject:(receipt OR invoice OR payment OR "order confirmation" OR "payment successful" OR "UPI" OR "debited" OR "credited" OR "transaction" OR "txn")',
  // Merchant and bank alert senders
  'from:(razorpay OR stripe OR amazon OR flipkart OR swiggy OR zomato OR uber OR ola OR netflix OR spotify OR airtel OR jio OR google OR apple OR phonepe OR paytm OR gpay OR bigbasket OR blinkit OR myntra OR ajio OR hdfcbank OR icicibank OR sbi OR axisbank OR kotakbank OR yesbank OR idfcbank OR rbl OR federalbank OR indusind OR pnb OR bob OR canarabank OR unionbank)',
];

// Transaction keywords for filtering
const TRANSACTION_KEYWORDS = [
  'invoice', 'receipt', 'order confirmation', 'payment successful',
  'payment received', 'transaction', 'purchase', 'bill', 'razorpay',
  'stripe', 'amazon', 'flipkart', 'swiggy', 'zomato', 'uber', 'ola',
  'gpay', 'phonepe', 'paytm', 'google pay', 'upi', 'debit', 'credit',
  'bank statement', 'payment confirmation', 'order placed', 'debited',
  'credited', 'txn', 'VPA', 'IMPS', 'NEFT', 'RTGS', 'has been debited',
  'has been credited', 'account ending'
];

// Merchant patterns for rule-based extraction
const MERCHANT_PATTERNS = [
  { regex: /amazon/i, name: 'Amazon', category: 'Shopping' },
  { regex: /flipkart/i, name: 'Flipkart', category: 'Shopping' },
  { regex: /swiggy/i, name: 'Swiggy', category: 'Food' },
  { regex: /zomato/i, name: 'Zomato', category: 'Food' },
  { regex: /uber/i, name: 'Uber', category: 'Transport' },
  { regex: /ola/i, name: 'Ola', category: 'Transport' },
  { regex: /rapido/i, name: 'Rapido', category: 'Transport' },
  { regex: /netflix/i, name: 'Netflix', category: 'Entertainment' },
  { regex: /spotify/i, name: 'Spotify', category: 'Entertainment' },
  { regex: /hotstar/i, name: 'Disney+ Hotstar', category: 'Entertainment' },
  { regex: /prime\s*video/i, name: 'Prime Video', category: 'Entertainment' },
  { regex: /youtube\s*premium/i, name: 'YouTube Premium', category: 'Entertainment' },
  { regex: /airtel/i, name: 'Airtel', category: 'Utilities' },
  { regex: /jio/i, name: 'Jio', category: 'Utilities' },
  { regex: /vodafone|vi\s/i, name: 'Vi', category: 'Utilities' },
  { regex: /bsnl/i, name: 'BSNL', category: 'Utilities' },
  { regex: /electricity|bescom|power|tata\s*power/i, name: 'Electricity', category: 'Utilities' },
  { regex: /gas\s*bill|indane|bharat\s*gas/i, name: 'Gas', category: 'Utilities' },
  { regex: /razorpay/i, name: 'Razorpay Payment', category: 'Other' },
  { regex: /stripe/i, name: 'Stripe Payment', category: 'Other' },
  { regex: /google\s*(play|one|cloud)/i, name: 'Google', category: 'Entertainment' },
  { regex: /apple/i, name: 'Apple', category: 'Shopping' },
  { regex: /myntra/i, name: 'Myntra', category: 'Shopping' },
  { regex: /ajio/i, name: 'AJIO', category: 'Shopping' },
  { regex: /meesho/i, name: 'Meesho', category: 'Shopping' },
  { regex: /nykaa/i, name: 'Nykaa', category: 'Shopping' },
  { regex: /bigbasket/i, name: 'BigBasket', category: 'Food' },
  { regex: /grofers|blinkit/i, name: 'Blinkit', category: 'Food' },
  { regex: /zepto/i, name: 'Zepto', category: 'Food' },
  { regex: /dunzo/i, name: 'Dunzo', category: 'Food' },
  { regex: /irctc/i, name: 'IRCTC', category: 'Transport' },
  { regex: /makemytrip/i, name: 'MakeMyTrip', category: 'Transport' },
  { regex: /goibibo/i, name: 'Goibibo', category: 'Transport' },
  { regex: /lic|life\s*insurance/i, name: 'LIC', category: 'Insurance' },
  { regex: /acko/i, name: 'Acko', category: 'Insurance' },
  { regex: /hdfc\s*ergo/i, name: 'HDFC Ergo', category: 'Insurance' },
  { regex: /icici\s*lombard/i, name: 'ICICI Lombard', category: 'Insurance' },
];

// Bank UPI/Transaction patterns - extract merchant from VPA or beneficiary
const BANK_UPI_PATTERNS = [
  // "debited...to VPA xxx@bank BENEFICIARY_NAME" pattern (HDFC style)
  { regex: /(?:debited|paid|sent).*?(?:to\s+VPA\s+[\w.@-]+\s+)?([A-Z][A-Z\s]{2,40}?)(?:\s+on\s|\.\s*Your)/i, extract: 1 },
  // "credited from VPA xxx@bank SENDER_NAME" pattern  
  { regex: /credited.*?(?:from\s+VPA\s+[\w.@-]+\s+)?([A-Z][A-Z\s]{2,40}?)(?:\s+on\s|\.\s*Your)/i, extract: 1 },
  // "to BENEFICIARY" or "from SENDER"
  { regex: /(?:to|from)\s+([A-Z][A-Z\s]{3,30})(?:\s+on\s|\s+ref|\s*\.)/i, extract: 1 },
  // VPA with name after @ 
  { regex: /VPA\s+[\w.]+@([a-z]+)/i, extract: 1 },
];

// Helper to extract merchant from bank alerts
function extractMerchantFromBankAlert(text: string): { name: string; category: string; confidence: number } | null {
  // First check if it's a bank alert
  const isBankAlert = /hdfcbank|icicibank|sbi|axisbank|kotakbank|yesbank|idfcbank|rbl|federalbank|indusind|pnb|bob|canarabank|unionbank/i.test(text);
  
  if (!isBankAlert) return null;
  
  // Try to extract beneficiary/merchant name from UPI patterns
  for (const pattern of BANK_UPI_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match && match[pattern.extract]) {
      let name = match[pattern.extract].trim();
      // Clean up the name
      name = name.replace(/\s+/g, ' ').trim();
      // Skip if too short or looks like a reference number
      if (name.length > 2 && !/^\d+$/.test(name)) {
        return { name, category: 'Other', confidence: 0.75 };
      }
    }
  }
  
  // Fallback: Use bank name as merchant with "UPI Transfer" suffix
  const bankMatch = text.match(/(hdfc|icici|sbi|axis|kotak|yes|idfc|rbl|federal|indusind|pnb|bob|canara|union)\s*bank/i);
  if (bankMatch) {
    return { name: `UPI via ${bankMatch[1].toUpperCase()} Bank`, category: 'Other', confidence: 0.6 };
  }
  
  return null;
}

// Amount extraction patterns (INR focused)
const AMOUNT_PATTERNS = [
  /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/gi,
  /(?:amount|total|paid|charged|debited)\s*:?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/gi,
  /([\d,]+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/gi,
];

// Date extraction patterns
const DATE_PATTERNS = [
  /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
  /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi,
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/gi,
];

// CONFIDENCE THRESHOLD - below this triggers Gemini fallback
const CONFIDENCE_THRESHOLD = 0.7;

// ========================================
// Rule-based extraction functions
// ========================================

function extractAmountRuleBased(text: string): { amount: number | null; confidence: number } {
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 10000000) {
        return { amount, confidence: 0.85 };
      }
    }
  }
  return { amount: null, confidence: 0 };
}

function extractMerchantRuleBased(text: string): { name: string; category: string; confidence: number } | null {
  // First try standard merchant patterns
  for (const pattern of MERCHANT_PATTERNS) {
    if (pattern.regex.test(text)) {
      return { name: pattern.name, category: pattern.category, confidence: 0.9 };
    }
  }
  
  // Then try bank UPI patterns for bank alert emails
  const bankMerchant = extractMerchantFromBankAlert(text);
  if (bankMerchant) {
    return bankMerchant;
  }
  
  return null;
}

function extractDateRuleBased(text: string, fallbackDate: Date): { date: Date; confidence: number } {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return { date: parsed, confidence: 0.85 };
      }
    }
  }
  return { date: fallbackDate, confidence: 0.5 };
}

function extractPaymentModeRuleBased(text: string): { mode: string; confidence: number } {
  if (/upi|gpay|phonepe|paytm|google\s*pay|bhim/i.test(text)) return { mode: 'UPI', confidence: 0.9 };
  if (/credit\s*card|visa|mastercard|amex/i.test(text)) return { mode: 'Card', confidence: 0.85 };
  if (/debit\s*card/i.test(text)) return { mode: 'Card', confidence: 0.85 };
  if (/netbanking|net\s*banking|bank\s*transfer|neft|imps|rtgs/i.test(text)) return { mode: 'Bank Transfer', confidence: 0.85 };
  if (/cash\s*on\s*delivery|cod/i.test(text)) return { mode: 'Cash', confidence: 0.8 };
  if (/wallet/i.test(text)) return { mode: 'Wallet', confidence: 0.75 };
  return { mode: 'Other', confidence: 0.3 };
}

// Normalize payment mode to valid database values
function normalizePaymentMode(mode: string | null): string {
  if (!mode) return 'Other';
  const lowerMode = mode.toLowerCase();
  
  if (lowerMode === 'upi' || lowerMode.includes('upi')) return 'UPI';
  if (lowerMode === 'card' || lowerMode.includes('card')) return 'Card';
  if (lowerMode === 'bank' || lowerMode.includes('bank') || lowerMode.includes('transfer') || lowerMode.includes('netbanking')) return 'Bank Transfer';
  if (lowerMode === 'cash') return 'Cash';
  if (lowerMode === 'wallet') return 'Wallet';
  
  // Check for exact match with valid values
  const validModes = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Wallet', 'Other', 'NetBanking'];
  const found = validModes.find(v => v.toLowerCase() === lowerMode);
  if (found) return found;
  
  return 'Other';
}

// ========================================
// Gemini 1.5 Flash fallback parser
// ========================================

interface GeminiExtraction {
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  payment_method: string | null;
  invoice_id: string | null;
  confidence: number;
  category: string | null;
}

async function parseWithGemini(emailContent: string): Promise<GeminiExtraction | null> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    console.log('[Gmail Sync] GEMINI_API_KEY not configured, skipping LLM fallback');
    return null;
  }

  const prompt = `You are a financial transaction extractor for CHRONYX Auto Finance.

Input:
Raw Gmail email content (text)

Task:
Extract ONLY factual information from this email.

Output JSON schema:
{
  "merchant": string | null,
  "amount": number | null,
  "currency": string | null,
  "date": "YYYY-MM-DD" | null,
  "payment_method": "card" | "upi" | "bank" | "wallet" | "cash" | null,
  "invoice_id": string | null,
  "confidence": number (0 to 1),
  "category": "Shopping" | "Food" | "Transport" | "Entertainment" | "Utilities" | "Insurance" | "Healthcare" | "Education" | "Other" | null
}

Rules:
- Do NOT guess missing values
- Do NOT infer if unclear
- Return null if not explicitly present
- Confidence < 0.7 means user review required
- Amount must be a number, not a string
- Date must be ISO format YYYY-MM-DD

Email content:
${emailContent.substring(0, 3000)}

Respond with ONLY valid JSON, no markdown or explanation.`;

  try {
    console.log('[Gmail Sync] Calling Gemini 1.5 Flash for parsing...');
    
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gmail Sync] Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Gmail Sync] No text in Gemini response');
      return null;
    }

    // Clean the response - remove markdown code blocks if present
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed: GeminiExtraction = JSON.parse(cleanJson);
    console.log('[Gmail Sync] Gemini extraction:', parsed);
    
    return parsed;
  } catch (error) {
    console.error('[Gmail Sync] Gemini parsing error:', error);
    return null;
  }
}

// ========================================
// Hybrid parsing pipeline
// ========================================

interface TransactionData {
  merchant: string;
  amount: number;
  category: string;
  transactionDate: Date;
  paymentMode: string;
  confidenceScore: number;
  needsReview: boolean;
  reviewReason: string | null;
  invoiceId: string | null;
}

async function hybridParseEmail(
  emailContent: string, 
  subject: string, 
  from: string, 
  msgDate: Date
): Promise<TransactionData | null> {
  const fullText = `${subject} ${emailContent} ${from}`;
  
  // Step 1: Rule-based extraction
  console.log('[Gmail Sync] Starting rule-based extraction...');
  
  const amountResult = extractAmountRuleBased(fullText);
  const merchantResult = extractMerchantRuleBased(fullText);
  const dateResult = extractDateRuleBased(fullText, msgDate);
  const paymentResult = extractPaymentModeRuleBased(fullText);
  
  // Calculate overall rule-based confidence
  let ruleConfidence = 0;
  let ruleConfidenceFactors = 0;
  
  if (amountResult.amount) {
    ruleConfidence += amountResult.confidence;
    ruleConfidenceFactors++;
  }
  if (merchantResult) {
    ruleConfidence += merchantResult.confidence;
    ruleConfidenceFactors++;
  }
  ruleConfidence += dateResult.confidence;
  ruleConfidenceFactors++;
  ruleConfidence += paymentResult.confidence;
  ruleConfidenceFactors++;
  
  const avgRuleConfidence = ruleConfidenceFactors > 0 ? ruleConfidence / ruleConfidenceFactors : 0;
  
  console.log('[Gmail Sync] Rule-based result:', {
    amount: amountResult.amount,
    merchant: merchantResult?.name,
    avgConfidence: avgRuleConfidence
  });
  
  // Step 2: Check if we need Gemini fallback
  const needsGeminiFallback = 
    !amountResult.amount || 
    !merchantResult || 
    avgRuleConfidence < CONFIDENCE_THRESHOLD;
  
  let finalResult: TransactionData | null = null;
  let needsReview = false;
  let reviewReason: string | null = null;
  
  if (needsGeminiFallback) {
    console.log('[Gmail Sync] Low confidence, trying Gemini fallback...');
    
    const geminiResult = await parseWithGemini(fullText);
    
    if (geminiResult && geminiResult.amount && geminiResult.amount > 0) {
      // Use Gemini result
      const geminiDate = geminiResult.date ? new Date(geminiResult.date) : dateResult.date;
      
      needsReview = geminiResult.confidence < CONFIDENCE_THRESHOLD;
      reviewReason = needsReview ? 'AI extraction confidence below threshold' : null;
      
      finalResult = {
        merchant: geminiResult.merchant || 'Unknown Merchant',
        amount: geminiResult.amount,
        category: geminiResult.category || 'Other',
        transactionDate: isNaN(geminiDate.getTime()) ? dateResult.date : geminiDate,
        paymentMode: geminiResult.payment_method || paymentResult.mode,
        confidenceScore: geminiResult.confidence,
        needsReview,
        reviewReason,
        invoiceId: geminiResult.invoice_id,
      };
    } else if (amountResult.amount) {
      // Fallback to rule-based even with low confidence
      needsReview = true;
      reviewReason = 'Low extraction confidence - please verify';
      
      finalResult = {
        merchant: merchantResult?.name || 'Unknown Merchant',
        amount: amountResult.amount,
        category: merchantResult?.category || 'Other',
        transactionDate: dateResult.date,
        paymentMode: paymentResult.mode,
        confidenceScore: avgRuleConfidence,
        needsReview,
        reviewReason,
        invoiceId: null,
      };
    }
  } else {
    // Use rule-based result
    finalResult = {
      merchant: merchantResult!.name,
      amount: amountResult.amount!,
      category: merchantResult!.category,
      transactionDate: dateResult.date,
      paymentMode: paymentResult.mode,
      confidenceScore: avgRuleConfidence,
      needsReview: false,
      reviewReason: null,
      invoiceId: null,
    };
  }
  
  return finalResult;
}

// ========================================
// Deduplication hash generator
// ========================================

async function generateDedupeHash(
  amount: number, 
  date: string, 
  merchant: string, 
  invoiceId: string | null
): Promise<string> {
  const input = `${amount.toFixed(2)}|${date}|${merchant.toLowerCase().trim()}|${invoiceId || ''}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================
// Token refresh
// ========================================

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: 'refresh_token',
      }),
    });
    
    const data = await response.json();
    if (data.access_token) {
      return { access_token: data.access_token, expires_in: data.expires_in };
    }
    return null;
  } catch (error) {
    console.error('[Gmail Sync] Token refresh error:', error);
    return null;
  }
}

// ========================================
// Main handler
// ========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
        message: 'Authorization header is required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    ).auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
        message: 'Your session is invalid. Please log in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const userId = user.id;
    console.log('[Gmail Sync] Starting hybrid sync for user:', userId);
    
    // Get user's Gmail settings
    const { data: settings, error: settingsError } = await supabase
      .from('gmail_sync_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (settingsError || !settings || !settings.is_enabled) {
      return new Response(JSON.stringify({ 
        error: 'Gmail sync not enabled',
        code: 'NOT_CONNECTED',
        message: 'Please connect your Gmail account first.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if token needs refresh
    let accessToken = settings.access_token_encrypted;
    if (new Date(settings.token_expires_at) < new Date()) {
      console.log('[Gmail Sync] Token expired, refreshing...');
      const newTokens = await refreshAccessToken(settings.refresh_token_encrypted);
      if (!newTokens) {
        await supabase
          .from('gmail_sync_settings')
          .update({ sync_status: 'token_expired', is_enabled: false })
          .eq('user_id', userId);
        
        return new Response(JSON.stringify({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Your Gmail session has expired. Please reconnect your account.'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      accessToken = newTokens.access_token;
      await supabase
        .from('gmail_sync_settings')
        .update({
          access_token_encrypted: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq('user_id', userId);
    }
    
    // Update sync status
    await supabase
      .from('gmail_sync_settings')
      .update({ sync_status: 'syncing' })
      .eq('user_id', userId);
    
    // Build strict Gmail query
    // For first sync or manual resync, look back 90 days
    // For subsequent syncs, use last_sync_at but cap at 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    let afterDate = ninetyDaysAgo;
    
    // Only use last_sync_at if it's a valid past date and within 90 days
    if (settings.last_sync_at) {
      const lastSync = new Date(settings.last_sync_at);
      const now = new Date();
      // If last_sync_at is in the past and more recent than 90 days ago, use it
      if (lastSync < now && lastSync > ninetyDaysAgo) {
        afterDate = lastSync;
      }
    }
    
    // Format date as YYYY/MM/DD for Gmail query (more reliable than Unix timestamp)
    const formatGmailDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };
    
    // Use strict query for receipts only
    const query = `(${GMAIL_QUERY_PARTS[0]} OR ${GMAIL_QUERY_PARTS[1]}) after:${formatGmailDate(afterDate)}`;
    
    console.log('[Gmail Sync] Strict query:', query);
    console.log('[Gmail Sync] Looking for emails after:', afterDate.toISOString());
    
    // Fetch messages from Gmail
    let messagesResponse;
    try {
      messagesResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (fetchError) {
      console.error('[Gmail Sync] Network error:', fetchError);
      await supabase
        .from('gmail_sync_settings')
        .update({ sync_status: 'error' })
        .eq('user_id', userId);
      
      return new Response(JSON.stringify({ 
        error: 'Connection failed',
        code: 'CONNECTION_FAILED',
        message: 'Unable to connect to Gmail. Please check your internet connection.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const messagesData = await messagesResponse.json();
    
    if (messagesData.error) {
      console.error('[Gmail Sync] Gmail API error:', messagesData.error);
      await supabase
        .from('gmail_sync_settings')
        .update({ sync_status: 'error' })
        .eq('user_id', userId);
      
      const gmailError = messagesData.error;
      let errorCode = 'UNKNOWN';
      let errorMessage = 'An error occurred while syncing Gmail.';
      
      if (gmailError.code === 401) {
        errorCode = 'INVALID_TOKEN';
        errorMessage = 'Gmail authorization is invalid. Please reconnect your account.';
      } else if (gmailError.code === 403) {
        if (gmailError.message?.includes('quota')) {
          errorCode = 'QUOTA_EXCEEDED';
          errorMessage = 'Daily Gmail sync limit reached. Try again tomorrow.';
        } else {
          errorCode = 'PERMISSION_DENIED';
          errorMessage = 'Gmail access was denied. Please grant the required permissions.';
        }
      } else if (gmailError.code === 429) {
        errorCode = 'RATE_LIMIT_EXCEEDED';
        errorMessage = 'Gmail API limit reached. Please wait a few minutes before trying again.';
      }
      
      return new Response(JSON.stringify({ 
        error: gmailError.message || 'Gmail API error',
        code: errorCode,
        message: errorMessage
      }), {
        status: gmailError.code || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const messages = messagesData.messages || [];
    console.log('[Gmail Sync] Found', messages.length, 'potential transaction emails');
    
    let processedCount = 0;
    let duplicatesFound = 0;
    let importedCount = 0;
    let needsReviewCount = 0;
    
    // Process max 30 per sync to stay in free tier
    for (const msg of messages.slice(0, 30)) {
      try {
        // Check if already processed by gmail_message_id
        const { data: existing } = await supabase
          .from('auto_imported_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('gmail_message_id', msg.id)
          .single();
        
        if (existing) {
          console.log('[Gmail Sync] Skipping already processed:', msg.id);
          continue;
        }
        
        // Get full message
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        const msgData = await msgResponse.json();
        
        // Extract headers
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        
        // Get message body
        let body = '';
        if (msgData.payload?.body?.data) {
          body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (msgData.payload?.parts) {
          for (const part of msgData.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              break;
            }
          }
        }
        
        const msgDate = dateHeader ? new Date(dateHeader) : new Date();
        
        // Hybrid parsing
        const parsed = await hybridParseEmail(body, subject, from, msgDate);
        
        if (!parsed || parsed.amount < 1) {
          console.log('[Gmail Sync] No valid transaction in message:', msg.id);
          continue;
        }
        
        const transactionDateStr = parsed.transactionDate.toISOString().split('T')[0];
        
        // Generate dedupe hash
        const dedupeHash = await generateDedupeHash(
          parsed.amount, 
          transactionDateStr, 
          parsed.merchant,
          parsed.invoiceId
        );
        
        // Check for duplicate by hash
        const { data: hashDupe } = await supabase
          .from('auto_imported_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('dedupe_hash', dedupeHash)
          .single();
        
        if (hashDupe) {
          console.log('[Gmail Sync] Duplicate by hash:', dedupeHash);
          duplicatesFound++;
          continue;
        }
        
        // Check for duplicates in expenses (amount + date tolerance)
        const dateTolerance = new Date(parsed.transactionDate);
        dateTolerance.setDate(dateTolerance.getDate() - 1);
        const dateAfter = new Date(parsed.transactionDate);
        dateAfter.setDate(dateAfter.getDate() + 1);
        
        const amountTolerance = 0.02;
        const minAmount = parsed.amount * (1 - amountTolerance);
        const maxAmount = parsed.amount * (1 + amountTolerance);
        
        const { data: duplicateExpenses } = await supabase
          .from('expenses')
          .select('id, amount, expense_date, merchant_name, is_auto_generated')
          .eq('user_id', userId)
          .gte('expense_date', dateTolerance.toISOString().split('T')[0])
          .lte('expense_date', dateAfter.toISOString().split('T')[0])
          .gte('amount', minAmount)
          .lte('amount', maxAmount);
        
        let isDuplicate = false;
        let duplicateOfId = null;
        
        if (duplicateExpenses && duplicateExpenses.length > 0) {
          // Prefer manual entries
          const manualEntry = duplicateExpenses.find(e => !e.is_auto_generated);
          if (manualEntry) {
            isDuplicate = true;
            duplicateOfId = manualEntry.id;
            duplicatesFound++;
            console.log('[Gmail Sync] Found duplicate manual entry:', manualEntry.id);
          }
        }
        
        // Insert into auto_imported_transactions
        const { error: insertError } = await supabase
          .from('auto_imported_transactions')
          .insert({
            user_id: userId,
            gmail_message_id: msg.id,
            gmail_thread_id: msgData.threadId,
            merchant_name: parsed.merchant,
            amount: parsed.amount,
            transaction_date: transactionDateStr,
            payment_mode: parsed.paymentMode,
            source_platform: parsed.merchant || from.match(/@([a-z]+)\./i)?.[1] || 'Email',
            email_subject: subject.substring(0, 500),
            email_snippet: msgData.snippet?.substring(0, 500),
            confidence_score: parsed.confidenceScore,
            is_duplicate: isDuplicate,
            duplicate_of_id: duplicateOfId,
            dedupe_hash: dedupeHash,
            needs_review: parsed.needsReview,
            review_reason: parsed.reviewReason,
            raw_extracted_data: { 
              from, 
              category: parsed.category,
              full_amount: parsed.amount,
              invoice_id: parsed.invoiceId,
            },
          });
        
        if (insertError) {
          console.error('[Gmail Sync] Insert error:', insertError);
          continue;
        }
        
        processedCount++;
        if (parsed.needsReview) needsReviewCount++;
        
        // If not duplicate and not needs review, auto-create expense
        if (!isDuplicate && !parsed.needsReview) {
          const { data: importedTx } = await supabase
            .from('auto_imported_transactions')
            .select('id')
            .eq('gmail_message_id', msg.id)
            .eq('user_id', userId)
            .single();
          
          const { error: expenseError } = await supabase
            .from('expenses')
            .insert({
              user_id: userId,
              expense_date: transactionDateStr,
              amount: parsed.amount,
              category: parsed.category,
              payment_mode: normalizePaymentMode(parsed.paymentMode),
              merchant_name: parsed.merchant,
              notes: `Auto-imported from Gmail: ${subject.substring(0, 100)}`,
              is_auto_generated: true,
              source_type: 'gmail',
              gmail_import_id: importedTx?.id,
              confidence_score: parsed.confidenceScore,
            });
          
          if (!expenseError) {
            importedCount++;
            
            // Link expense to imported transaction
            const { data: newExpense } = await supabase
              .from('expenses')
              .select('id')
              .eq('user_id', userId)
              .eq('gmail_import_id', importedTx?.id)
              .single();
            
            if (newExpense) {
              await supabase
                .from('auto_imported_transactions')
                .update({ linked_expense_id: newExpense.id, is_processed: true })
                .eq('id', importedTx?.id);
            }
          }
        }
        
      } catch (msgError) {
        console.error('[Gmail Sync] Error processing message:', msg.id, msgError);
      }
    }
    
    // Update sync status
    await supabase
      .from('gmail_sync_settings')
      .update({
        sync_status: 'idle',
        last_sync_at: new Date().toISOString(),
        total_synced_count: (settings.total_synced_count || 0) + importedCount,
      })
      .eq('user_id', userId);
    
    console.log('[Gmail Sync] Hybrid sync complete:', { processedCount, duplicatesFound, importedCount, needsReviewCount });
    
    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      duplicates: duplicatesFound,
      imported: importedCount,
      needsReview: needsReviewCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Gmail Sync] Unexpected error:', error);
    
    let errorCode = 'UNKNOWN';
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorCode = 'CONNECTION_FAILED';
      errorMessage = 'Unable to connect to Gmail. Please check your internet connection.';
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      code: errorCode,
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
