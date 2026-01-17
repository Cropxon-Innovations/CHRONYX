import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords to filter transactional emails
const TRANSACTION_KEYWORDS = [
  'invoice', 'receipt', 'order confirmation', 'payment successful',
  'payment received', 'transaction', 'purchase', 'bill', 'razorpay',
  'stripe', 'amazon', 'flipkart', 'swiggy', 'zomato', 'uber', 'ola',
  'gpay', 'phonepe', 'paytm', 'google pay', 'upi', 'debit', 'credit',
  'bank statement', 'payment confirmation', 'order placed'
];

// Merchant patterns for extraction
const MERCHANT_PATTERNS = [
  { regex: /amazon/i, name: 'Amazon', category: 'Shopping' },
  { regex: /flipkart/i, name: 'Flipkart', category: 'Shopping' },
  { regex: /swiggy/i, name: 'Swiggy', category: 'Food' },
  { regex: /zomato/i, name: 'Zomato', category: 'Food' },
  { regex: /uber/i, name: 'Uber', category: 'Transport' },
  { regex: /ola/i, name: 'Ola', category: 'Transport' },
  { regex: /netflix/i, name: 'Netflix', category: 'Entertainment' },
  { regex: /spotify/i, name: 'Spotify', category: 'Entertainment' },
  { regex: /airtel/i, name: 'Airtel', category: 'Utilities' },
  { regex: /jio/i, name: 'Jio', category: 'Utilities' },
  { regex: /vodafone|vi\s/i, name: 'Vi', category: 'Utilities' },
  { regex: /electricity|bescom|power/i, name: 'Electricity', category: 'Utilities' },
  { regex: /razorpay/i, name: 'Razorpay Payment', category: 'Other' },
  { regex: /stripe/i, name: 'Stripe Payment', category: 'Other' },
  { regex: /google\s?(play|one|cloud)/i, name: 'Google', category: 'Entertainment' },
  { regex: /apple/i, name: 'Apple', category: 'Shopping' },
  { regex: /myntra/i, name: 'Myntra', category: 'Shopping' },
  { regex: /ajio/i, name: 'AJIO', category: 'Shopping' },
  { regex: /bigbasket/i, name: 'BigBasket', category: 'Food' },
  { regex: /grofers|blinkit/i, name: 'Blinkit', category: 'Food' },
];

// Amount extraction patterns
const AMOUNT_PATTERNS = [
  /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/gi,
  /(?:amount|total|paid|charged)\s*:?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{2})?)/gi,
  /([\d,]+(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/gi,
];

// Date extraction patterns
const DATE_PATTERNS = [
  /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
  /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/gi,
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/gi,
];

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 10000000) { // Sanity check
        return amount;
      }
    }
  }
  return null;
}

function extractMerchant(text: string): { name: string; category: string } | null {
  for (const pattern of MERCHANT_PATTERNS) {
    if (pattern.regex.test(text)) {
      return { name: pattern.name, category: pattern.category };
    }
  }
  return null;
}

function extractDate(text: string, fallbackDate: Date): Date {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return fallbackDate;
}

function extractPaymentMode(text: string): string {
  if (/upi|gpay|phonepe|paytm|google\s*pay|bhim/i.test(text)) return 'UPI';
  if (/credit\s*card|visa|mastercard|amex/i.test(text)) return 'Card';
  if (/debit\s*card/i.test(text)) return 'Card';
  if (/netbanking|net\s*banking|bank\s*transfer|neft|imps|rtgs/i.test(text)) return 'Bank Transfer';
  if (/cash\s*on\s*delivery|cod/i.test(text)) return 'Cash';
  return 'Other';
}

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
    console.log('[Gmail Sync] Starting sync for user:', userId);
    
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
    
    // Build Gmail search query
    const keywordsQuery = TRANSACTION_KEYWORDS.slice(0, 10).join(' OR ');
    let query = `(${keywordsQuery})`;
    
    // Only fetch emails from last 30 days if first sync, otherwise from last sync
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const afterDate = settings.last_sync_at 
      ? new Date(settings.last_sync_at) 
      : thirtyDaysAgo;
    
    query += ` after:${Math.floor(afterDate.getTime() / 1000)}`;
    
    console.log('[Gmail Sync] Search query:', query);
    
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
      
      // Parse Gmail API errors
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
    
    for (const msg of messages.slice(0, 30)) { // Limit to 30 per sync
      try {
        // Get full message
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        const msgData = await msgResponse.json();
        
        // Check if already processed
        const { data: existing } = await supabase
          .from('auto_imported_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('gmail_message_id', msg.id)
          .single();
        
        if (existing) {
          console.log('[Gmail Sync] Skipping already processed message:', msg.id);
          continue;
        }
        
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
        
        const fullText = `${subject} ${body} ${from}`;
        
        // Extract transaction data
        const amount = extractAmount(fullText);
        if (!amount || amount < 1) {
          console.log('[Gmail Sync] No valid amount found in message:', msg.id);
          continue;
        }
        
        const merchant = extractMerchant(fullText);
        const msgDate = dateHeader ? new Date(dateHeader) : new Date();
        const transactionDate = extractDate(fullText, msgDate);
        const paymentMode = extractPaymentMode(fullText);
        
        console.log('[Gmail Sync] Extracted:', { amount, merchant, transactionDate: transactionDate.toISOString(), paymentMode });
        
        // Check for duplicates in expenses
        const dateTolerance = new Date(transactionDate);
        dateTolerance.setDate(dateTolerance.getDate() - 1);
        const dateAfter = new Date(transactionDate);
        dateAfter.setDate(dateAfter.getDate() + 1);
        
        const amountTolerance = 0.02; // 2% tolerance
        const minAmount = amount * (1 - amountTolerance);
        const maxAmount = amount * (1 + amountTolerance);
        
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
            merchant_name: merchant?.name || 'Unknown Merchant',
            amount,
            transaction_date: transactionDate.toISOString().split('T')[0],
            payment_mode: paymentMode,
            source_platform: merchant?.name || from.match(/@([a-z]+)\./i)?.[1] || 'Email',
            email_subject: subject.substring(0, 500),
            email_snippet: msgData.snippet?.substring(0, 500),
            confidence_score: merchant ? 0.85 : 0.6,
            is_duplicate: isDuplicate,
            duplicate_of_id: duplicateOfId,
            raw_extracted_data: { 
              from, 
              category: merchant?.category || 'Other',
              full_amount: amount,
            },
          });
        
        if (insertError) {
          console.error('[Gmail Sync] Insert error:', insertError);
          continue;
        }
        
        processedCount++;
        
        // If not duplicate, create expense entry
        if (!isDuplicate) {
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
              expense_date: transactionDate.toISOString().split('T')[0],
              amount,
              category: merchant?.category || 'Other',
              payment_mode: paymentMode,
              merchant_name: merchant?.name || 'Unknown',
              notes: `Auto-imported from Gmail: ${subject.substring(0, 100)}`,
              is_auto_generated: true,
              source_type: 'gmail',
              gmail_import_id: importedTx?.id,
              confidence_score: merchant ? 0.85 : 0.6,
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
    
    console.log('[Gmail Sync] Sync complete:', { processedCount, duplicatesFound, importedCount });
    
    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      duplicates: duplicatesFound,
      imported: importedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Gmail Sync] Unexpected error:', error);
    
    // Determine error type
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