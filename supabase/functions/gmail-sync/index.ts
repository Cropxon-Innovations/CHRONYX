import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CHRONYX FinanceFlow - Production Parser
// Multi-level extraction + deduplication
// ========================================

// ==========================================
// PART 1: COMPREHENSIVE SENDER & QUERY LIST
// ==========================================

// UPI App senders
const UPI_APP_SENDERS = [
  'noreply@google.com',
  'payments-noreply@google.com',
  'no-reply@phonepe.com',
  'no-reply@paytm.com',
  'care@paytm.com',
  'noreply@upi.bhim.com',
  'no-reply@amazonpay.in',
];

// Bank alert senders (comprehensive list)
const BANK_SENDERS = [
  'alerts@sbialerts.com',
  'donotreply@sbi.co.in',
  'alerts@hdfcbank.net',
  'alerts@icicibank.com',
  'alerts@axisbank.com',
  'alerts@kotak.com',
  'alerts@yesbank.in',
  'alerts@idfcfirstbank.com',
  'alerts@federalbank.co.in',
  'alerts@pnb.co.in',
  'alerts@bobmail.rfrm.bank',
  'alerts@canarabank.in',
  'alerts@unionbank.co.in',
  'alerts@indusind.com',
  'alerts@rbl.co.in',
];

// Merchant senders
const MERCHANT_SENDERS = [
  'razorpay',
  'stripe',
  'amazon',
  'flipkart',
  'swiggy',
  'zomato',
  'uber',
  'ola',
  'netflix',
  'spotify',
  'airtel',
  'jio',
  'bigbasket',
  'blinkit',
  'myntra',
  'ajio',
];

// Build comprehensive Gmail query with folder support
function buildGmailQuery(afterDate: Date, folders?: Record<string, boolean>): string {
  const formatGmailDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Subject patterns for transactions - more comprehensive
  const subjectPatterns = [
    'UPI', 'Payment', 'Transaction', 'debit', 'credit', 'debited', 'credited',
    '"Transaction Alert"', 'INR', 'Rs', '₹', 'receipt', 'invoice', 'order',
    'purchase', 'subscription', 'renewal', 'bill', 'statement', 'reward',
    'cashback', 'refund', 'transfer', 'sent', 'received', 'paid'
  ];
  const subjectQuery = `subject:(${subjectPatterns.join(' OR ')})`;
  
  // From patterns - combine all senders
  const fromPatterns = [
    ...UPI_APP_SENDERS.map(s => `from:${s}`),
    ...BANK_SENDERS.map(s => `from:${s}`),
    ...MERCHANT_SENDERS.map(s => `from:${s}`),
  ].join(' OR ');
  
  // Folder/category filters - Gmail uses category: for tabs
  const folderQueries: string[] = [];
  if (folders) {
    if (folders.inbox) folderQueries.push('in:inbox');
    if (folders.promotions) folderQueries.push('category:promotions');
    if (folders.updates) folderQueries.push('category:updates');
    if (folders.social) folderQueries.push('category:social');
    // Also search "Purchases" label which Gmail auto-creates
    folderQueries.push('category:purchases');
    folderQueries.push('label:purchases');
  } else {
    // Default: search all relevant categories
    folderQueries.push('in:inbox');
    folderQueries.push('category:promotions');
    folderQueries.push('category:updates');
    folderQueries.push('category:purchases');
    folderQueries.push('label:purchases');
  }
  
  const folderFilter = folderQueries.length > 0 ? `(${folderQueries.join(' OR ')})` : '';
  
  return `(${subjectQuery}) (${fromPatterns}) ${folderFilter} after:${formatGmailDate(afterDate)}`;
}

// ==========================================
// PART 2: ROBUST REGEX PATTERNS
// ==========================================

// Amount extraction - handles ₹, Rs, INR with commas and decimals
// CRITICAL: Use [0-9]+ FIRST to capture full numbers without commas (like 4599.73)
// before trying comma-formatted patterns
const AMOUNT_PATTERNS = [
  // ₹4599.73 or Rs.4599.73 or Rs. 12,345.67 - prioritize full number capture
  /(?:₹|rs\.?|inr)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi,
  // Comma-formatted: ₹1,250.50 or Rs. 12,34,567.89 (Indian format with lakhs)
  /(?:₹|rs\.?|inr)\s*([0-9]{1,2}(?:,[0-9]{2})*,[0-9]{3}(?:\.[0-9]{1,2})?)/gi,
  // Amount with label: "Amount: ₹500" or "debited: 1000.50"
  /(?:amount|total|paid|charged|debited|credited)\s*:?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi,
  // Reverse format: 1000.50 INR or 4599.73 rs
  /([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr)/gi,
];

// Reference ID / Transaction ID patterns
const REFERENCE_ID_PATTERNS = [
  // Explicit labels: Ref No, UTR, Txn ID
  /(?:ref(?:erence)?\s*(?:no|number)?|txn(?:\s*id)?|transaction\s*id|utr|upi\s*ref)\s*[:\-]?\s*([A-Za-z0-9\-_\/]{8,30})/gi,
  // Long alphanumeric token (fallback)
  /\b([A-Z0-9]{12,25})\b/g,
];

// Date patterns (Indian formats)
const DATE_PATTERNS = [
  // DD MMM YYYY (12 Aug 2026)
  /\b(\d{1,2}\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\b/gi,
  // DD/MM/YYYY or DD-MM-YYYY
  /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
  // ISO: YYYY-MM-DD
  /\b(\d{4}-\d{2}-\d{2})\b/g,
  // DD-MM-YY format
  /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2})\b/g,
];

// Account mask patterns
const ACCOUNT_MASK_PATTERNS = [
  // A/c XXXXX1234, **1234, XXXX5678
  /(?:a\/?c(?:count)?|acct)\s*[:\-]?\s*([Xx\*]{2,}[0-9]{2,4})/gi,
  /\b([Xx\*]{2,}[0-9]{2,4})\b/g,
  // "ending with 1234" or "ending 5678"
  /ending\s*(?:with)?\s*(\d{4})/gi,
];

// Debit/Credit detection
const DEBIT_PATTERNS = /\b(debit|debited|spent|paid|sent|dr|withdrawn|purchased)\b/i;
const CREDIT_PATTERNS = /\b(credit|credited|received|cr|deposited|refund)\b/i;

// Failed/Reversal detection (edge cases)
const FAILED_PATTERNS = /\b(failed|reversed|refund|reversal|cancelled|rejected|unsuccessful)\b/i;
const STATEMENT_PATTERNS = /\b(statement|summary|monthly\s*bill|account\s*statement)\b/i;

// ==========================================
// PART 3: MERCHANT PATTERNS
// ==========================================

const MERCHANT_PATTERNS = [
  // Shopping
  { regex: /amazon/i, name: 'Amazon', category: 'Shopping' },
  { regex: /flipkart/i, name: 'Flipkart', category: 'Shopping' },
  { regex: /myntra/i, name: 'Myntra', category: 'Shopping' },
  { regex: /ajio/i, name: 'AJIO', category: 'Shopping' },
  { regex: /meesho/i, name: 'Meesho', category: 'Shopping' },
  { regex: /nykaa/i, name: 'Nykaa', category: 'Shopping' },
  { regex: /apple/i, name: 'Apple', category: 'Shopping' },
  
  // Food
  { regex: /swiggy/i, name: 'Swiggy', category: 'Food' },
  { regex: /zomato/i, name: 'Zomato', category: 'Food' },
  { regex: /bigbasket/i, name: 'BigBasket', category: 'Food' },
  { regex: /grofers|blinkit/i, name: 'Blinkit', category: 'Food' },
  { regex: /zepto/i, name: 'Zepto', category: 'Food' },
  { regex: /dunzo/i, name: 'Dunzo', category: 'Food' },
  
  // Transport
  { regex: /uber/i, name: 'Uber', category: 'Transport' },
  { regex: /ola/i, name: 'Ola', category: 'Transport' },
  { regex: /rapido/i, name: 'Rapido', category: 'Transport' },
  { regex: /irctc/i, name: 'IRCTC', category: 'Transport' },
  { regex: /makemytrip/i, name: 'MakeMyTrip', category: 'Transport' },
  { regex: /goibibo/i, name: 'Goibibo', category: 'Transport' },
  { regex: /redbus/i, name: 'RedBus', category: 'Transport' },
  
  // Entertainment
  { regex: /netflix/i, name: 'Netflix', category: 'Entertainment' },
  { regex: /spotify/i, name: 'Spotify', category: 'Entertainment' },
  { regex: /hotstar/i, name: 'Disney+ Hotstar', category: 'Entertainment' },
  { regex: /prime\s*video/i, name: 'Prime Video', category: 'Entertainment' },
  { regex: /youtube\s*premium/i, name: 'YouTube Premium', category: 'Entertainment' },
  { regex: /google\s*(play|one|cloud)/i, name: 'Google', category: 'Entertainment' },
  
  // Utilities
  { regex: /airtel/i, name: 'Airtel', category: 'Utilities' },
  { regex: /jio/i, name: 'Jio', category: 'Utilities' },
  { regex: /vodafone|vi\s/i, name: 'Vi', category: 'Utilities' },
  { regex: /bsnl/i, name: 'BSNL', category: 'Utilities' },
  { regex: /electricity|bescom|power|tata\s*power/i, name: 'Electricity', category: 'Utilities' },
  { regex: /gas\s*bill|indane|bharat\s*gas/i, name: 'Gas', category: 'Utilities' },
  
  // Insurance - Use word boundaries to avoid false matches
  { regex: /\blic\s+of\s+india\b|life\s*insurance\s*corporation|premium\s+.*\blic\b|paid\s+to\s+\blic\b/i, name: 'LIC', category: 'Insurance' },
  { regex: /\backo\b/i, name: 'Acko', category: 'Insurance' },
  { regex: /hdfc\s*ergo/i, name: 'HDFC Ergo', category: 'Insurance' },
  { regex: /icici\s*lombard/i, name: 'ICICI Lombard', category: 'Insurance' },
  { regex: /bajaj\s*allianz/i, name: 'Bajaj Allianz', category: 'Insurance' },
  { regex: /star\s*health/i, name: 'Star Health', category: 'Insurance' },
  
  // Tech/Software subscriptions
  { regex: /lovable/i, name: 'Lovable', category: 'Technology' },
  { regex: /github/i, name: 'GitHub', category: 'Technology' },
  { regex: /openai|chatgpt/i, name: 'OpenAI', category: 'Technology' },
  { regex: /vercel/i, name: 'Vercel', category: 'Technology' },
  { regex: /netlify/i, name: 'Netlify', category: 'Technology' },
  { regex: /aws|amazon\s*web\s*services/i, name: 'AWS', category: 'Technology' },
  
  // Payments
  { regex: /razorpay/i, name: 'Razorpay Payment', category: 'Other' },
  { regex: /stripe/i, name: 'Stripe Payment', category: 'Other' },
];

// Bank source detection
const BANK_PATTERNS = [
  { regex: /sbi|state\s*bank/i, name: 'SBI', fullName: 'State Bank of India' },
  { regex: /hdfc\s*bank/i, name: 'HDFC', fullName: 'HDFC Bank' },
  { regex: /icici\s*bank/i, name: 'ICICI', fullName: 'ICICI Bank' },
  { regex: /axis\s*bank/i, name: 'Axis', fullName: 'Axis Bank' },
  { regex: /kotak/i, name: 'Kotak', fullName: 'Kotak Mahindra Bank' },
  { regex: /yes\s*bank/i, name: 'Yes', fullName: 'Yes Bank' },
  { regex: /idfc|idfc\s*first/i, name: 'IDFC First', fullName: 'IDFC First Bank' },
  { regex: /federal\s*bank/i, name: 'Federal', fullName: 'Federal Bank' },
  { regex: /pnb|punjab\s*national/i, name: 'PNB', fullName: 'Punjab National Bank' },
  { regex: /bob|bank\s*of\s*baroda/i, name: 'BoB', fullName: 'Bank of Baroda' },
  { regex: /canara/i, name: 'Canara', fullName: 'Canara Bank' },
  { regex: /union\s*bank/i, name: 'Union', fullName: 'Union Bank' },
  { regex: /indusind/i, name: 'IndusInd', fullName: 'IndusInd Bank' },
  { regex: /rbl/i, name: 'RBL', fullName: 'RBL Bank' },
];

// UPI App source detection
const UPI_APP_PATTERNS = [
  { regex: /google\s*pay|gpay/i, name: 'GPay', fullName: 'Google Pay' },
  { regex: /phonepe/i, name: 'PhonePe', fullName: 'PhonePe' },
  { regex: /paytm/i, name: 'Paytm', fullName: 'Paytm' },
  { regex: /amazon\s*pay/i, name: 'Amazon Pay', fullName: 'Amazon Pay' },
  { regex: /bhim/i, name: 'BHIM', fullName: 'BHIM UPI' },
];

// ==========================================
// PART 4: EXTRACTION FUNCTIONS
// ==========================================

function extractAmount(text: string): { amount: number | null; confidence: number } {
  for (const pattern of AMOUNT_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 10000000) {
        return { amount, confidence: 0.9 };
      }
    }
  }
  return { amount: null, confidence: 0 };
}

function extractReferenceId(text: string): { referenceId: string | null; confidence: number } {
  // Try explicit labels first
  for (const pattern of REFERENCE_ID_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1] && match[1].length >= 8) {
      return { referenceId: match[1].toUpperCase(), confidence: 0.95 };
    }
  }
  return { referenceId: null, confidence: 0 };
}

function extractDate(text: string, fallbackDate: Date): { date: Date; confidence: number } {
  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      let dateStr = match[1];
      // Handle DD-MM-YY format
      if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/.test(dateStr)) {
        const parts = dateStr.split(/[\/\-]/);
        dateStr = `${parts[0]}/${parts[1]}/20${parts[2]}`;
      }
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime()) && parsed <= new Date()) {
        return { date: parsed, confidence: 0.85 };
      }
    }
  }
  return { date: fallbackDate, confidence: 0.5 };
}

function extractAccountMask(text: string): { accountMask: string | null; confidence: number } {
  for (const pattern of ACCOUNT_MASK_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match && match[1]) {
      return { accountMask: match[1].toUpperCase(), confidence: 0.85 };
    }
  }
  return { accountMask: null, confidence: 0 };
}

function extractTransactionType(text: string): { type: 'debit' | 'credit' | null; confidence: number } {
  const hasDebit = DEBIT_PATTERNS.test(text);
  const hasCredit = CREDIT_PATTERNS.test(text);
  
  // Check which appears first if both present
  if (hasDebit && hasCredit) {
    const debitMatch = text.match(DEBIT_PATTERNS);
    const creditMatch = text.match(CREDIT_PATTERNS);
    if (debitMatch && creditMatch) {
      const debitIndex = text.indexOf(debitMatch[0]);
      const creditIndex = text.indexOf(creditMatch[0]);
      return debitIndex < creditIndex 
        ? { type: 'debit', confidence: 0.7 }
        : { type: 'credit', confidence: 0.7 };
    }
  }
  
  if (hasDebit) return { type: 'debit', confidence: 0.9 };
  if (hasCredit) return { type: 'credit', confidence: 0.9 };
  return { type: null, confidence: 0 };
}

function extractSource(text: string, from: string): { source: string; channel: 'UPI' | 'BANK' | 'APP' | 'CARD' | 'OTHER' } {
  // Check UPI apps first
  for (const app of UPI_APP_PATTERNS) {
    if (app.regex.test(text) || app.regex.test(from)) {
      return { source: app.name, channel: 'APP' };
    }
  }
  
  // Check banks
  for (const bank of BANK_PATTERNS) {
    if (bank.regex.test(text) || bank.regex.test(from)) {
      return { source: bank.name, channel: 'BANK' };
    }
  }
  
  // Check for generic UPI
  if (/upi|vpa|@[a-z]+$/i.test(text)) {
    return { source: 'UPI', channel: 'UPI' };
  }
  
  // Check for card
  if (/visa|mastercard|rupay|credit\s*card|debit\s*card/i.test(text)) {
    return { source: 'Card', channel: 'CARD' };
  }
  
  return { source: 'Email', channel: 'OTHER' };
}

function extractMerchant(text: string): { name: string; category: string; confidence: number } | null {
  // Priority 1: Extract from "towards [MERCHANT]" pattern (most reliable for credit card alerts)
  const towardsMatch = text.match(/towards\s+([A-Z0-9][A-Za-z0-9\s\.\-&]{2,40})(?:\s+on|\s+at|\s+dated|\.|\,)/i);
  if (towardsMatch && towardsMatch[1]) {
    const merchantName = towardsMatch[1].trim();
    // Check if this merchant matches a known pattern
    for (const pattern of MERCHANT_PATTERNS) {
      if (pattern.regex.test(merchantName)) {
        return { name: pattern.name, category: pattern.category, confidence: 0.95 };
      }
    }
    // Return the raw merchant name from email
    if (merchantName.length > 2 && !/^\d+$/.test(merchantName)) {
      return { name: merchantName, category: 'Other', confidence: 0.85 };
    }
  }
  
  // Priority 2: Try VPA merchant extraction (for UPI payments - "to VPA xxx MERCHANT_NAME")
  const vpaMatch = text.match(/to\s+vpa\s+[\w.@]+\s+([A-Z][A-Za-z\s]{2,40})(?:\s+on|\.)/i);
  if (vpaMatch && vpaMatch[1]) {
    const merchantName = vpaMatch[1].trim();
    // Check against known patterns
    for (const pattern of MERCHANT_PATTERNS) {
      if (pattern.regex.test(merchantName)) {
        return { name: pattern.name, category: pattern.category, confidence: 0.9 };
      }
    }
    return { name: merchantName, category: 'Other', confidence: 0.75 };
  }
  
  // Priority 3: Try "to [NAME]" or "paid to [NAME]" patterns
  const toMatch = text.match(/(?:paid\s+to|sent\s+to|transferred\s+to)\s+([A-Z][A-Za-z\s]{2,30})(?:\s+(?:on|via|using|ref)|[.\-])/i);
  if (toMatch && toMatch[1]) {
    const merchantName = toMatch[1].trim();
    // Check against known patterns
    for (const pattern of MERCHANT_PATTERNS) {
      if (pattern.regex.test(merchantName)) {
        return { name: pattern.name, category: pattern.category, confidence: 0.9 };
      }
    }
    if (merchantName.length > 2 && !/^\d+$/.test(merchantName)) {
      return { name: merchantName, category: 'Other', confidence: 0.7 };
    }
  }
  
  // Priority 4: Fall back to checking entire text against known merchant patterns
  // But only for high-confidence patterns with word boundaries
  for (const pattern of MERCHANT_PATTERNS) {
    // Skip generic insurance patterns when falling back to full text search
    if (pattern.name === 'LIC' && !/\blic\b|life\s*insurance\s*corporation/i.test(text)) {
      continue;
    }
    if (pattern.regex.test(text)) {
      return { name: pattern.name, category: pattern.category, confidence: 0.8 };
    }
  }
  
  return null;
}

function extractDescription(text: string): string | null {
  // Look for description patterns
  const patterns = [
    /(?:description|remarks?|note)\s*[:\-]?\s*([A-Za-z0-9\s\.\-&]{5,100})/i,
    /(?:for|towards)\s+([A-Za-z0-9\s\.\-&]{5,50})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().substring(0, 100);
    }
  }
  return null;
}

// Check for edge cases
function checkEdgeCases(text: string, subject: string): { 
  isFailed: boolean; 
  isReversal: boolean; 
  isStatement: boolean;
} {
  const fullText = `${subject} ${text}`;
  return {
    isFailed: FAILED_PATTERNS.test(fullText) && /failed|unsuccessful|rejected/i.test(fullText),
    isReversal: FAILED_PATTERNS.test(fullText) && /reversed|reversal|refund/i.test(fullText),
    isStatement: STATEMENT_PATTERNS.test(fullText),
  };
}

// ==========================================
// PART 5: DEDUPLICATION LOGIC
// ==========================================

async function generateStrongDedupeHash(
  userId: string,
  referenceId: string
): Promise<string> {
  const input = `${userId}|${referenceId}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'STRONG_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

async function generateWeakDedupeHash(
  userId: string,
  amount: number,
  date: Date,
  accountMask: string | null,
  txnType: string | null
): Promise<string> {
  // Round date to 5-minute window
  const dateWindow = new Date(Math.floor(date.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
  const input = `${userId}|${Math.round(amount * 100)}|${dateWindow.toISOString()}|${accountMask || ''}|${txnType || ''}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return 'WEAK_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// ==========================================
// PART 6: MAIN PARSING PIPELINE
// ==========================================

interface ParsedTransaction {
  merchant: string;
  amount: number;
  category: string;
  transactionDate: Date;
  transactionType: 'debit' | 'credit';
  paymentMode: string;
  referenceId: string | null;
  accountMask: string | null;
  source: string;
  channel: string;
  description: string | null;
  confidenceScore: number;
  needsReview: boolean;
  reviewReason: string | null;
  isFailed: boolean;
  isReversal: boolean;
}

function parseEmailContent(
  body: string,
  subject: string,
  from: string,
  msgDate: Date
): ParsedTransaction | null {
  const fullText = `${subject} ${body}`;
  
  // Check edge cases first
  const edgeCases = checkEdgeCases(body, subject);
  
  // Skip statement emails
  if (edgeCases.isStatement) {
    console.log('[Gmail Sync] Skipping statement email');
    return null;
  }
  
  // Extract all fields
  const amountResult = extractAmount(fullText);
  if (!amountResult.amount || amountResult.amount < 1) {
    console.log('[Gmail Sync] No valid amount found');
    return null;
  }
  
  const dateResult = extractDate(fullText, msgDate);
  const typeResult = extractTransactionType(fullText);
  const refResult = extractReferenceId(fullText);
  const accountResult = extractAccountMask(fullText);
  const sourceResult = extractSource(fullText, from);
  const merchantResult = extractMerchant(fullText);
  const description = extractDescription(fullText);
  
  // Determine payment mode
  let paymentMode = 'Other';
  if (/upi|gpay|phonepe|paytm|google\s*pay|bhim|vpa/i.test(fullText)) {
    paymentMode = 'UPI';
  } else if (/credit\s*card|visa|mastercard|amex/i.test(fullText)) {
    paymentMode = 'Card';
  } else if (/debit\s*card/i.test(fullText)) {
    paymentMode = 'Card';
  } else if (/netbanking|net\s*banking|neft|imps|rtgs/i.test(fullText)) {
    paymentMode = 'Bank Transfer';
  } else if (/wallet/i.test(fullText)) {
    paymentMode = 'Wallet';
  }
  
  // Calculate confidence
  let confidence = 0.5;
  let confidenceFactors = 1;
  
  if (amountResult.confidence > 0) {
    confidence += amountResult.confidence;
    confidenceFactors++;
  }
  if (dateResult.confidence > 0.5) {
    confidence += dateResult.confidence;
    confidenceFactors++;
  }
  if (typeResult.confidence > 0) {
    confidence += typeResult.confidence;
    confidenceFactors++;
  }
  if (refResult.confidence > 0) {
    confidence += refResult.confidence;
    confidenceFactors++;
  }
  if (merchantResult) {
    confidence += merchantResult.confidence;
    confidenceFactors++;
  }
  
  const avgConfidence = confidence / confidenceFactors;
  
  // Determine if review needed
  const needsReview = avgConfidence < 0.7 || !typeResult.type || !merchantResult;
  let reviewReason: string | null = null;
  if (needsReview) {
    const reasons: string[] = [];
    if (avgConfidence < 0.7) reasons.push('Low confidence');
    if (!typeResult.type) reasons.push('Unknown transaction type');
    if (!merchantResult) reasons.push('Unknown merchant');
    reviewReason = reasons.join(', ');
  }
  
  return {
    merchant: merchantResult?.name || sourceResult.source || 'Unknown',
    amount: amountResult.amount,
    category: merchantResult?.category || 'Other',
    transactionDate: dateResult.date,
    transactionType: typeResult.type || 'debit',
    paymentMode,
    referenceId: refResult.referenceId,
    accountMask: accountResult.accountMask,
    source: sourceResult.source,
    channel: sourceResult.channel,
    description,
    confidenceScore: Math.round(avgConfidence * 100),
    needsReview,
    reviewReason,
    isFailed: edgeCases.isFailed,
    isReversal: edgeCases.isReversal,
  };
}

// ==========================================
// PART 7: TOKEN REFRESH
// ==========================================

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

// ==========================================
// PART 8: MAIN HANDLER
// ==========================================

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
    
    // Get Gmail settings
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
    
    // Calculate date range (90 days max)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    let afterDate = ninetyDaysAgo;
    if (settings.last_sync_at) {
      const lastSync = new Date(settings.last_sync_at);
      const now = new Date();
      if (lastSync < now && lastSync > ninetyDaysAgo) {
        afterDate = lastSync;
      }
    }
    
    // Build comprehensive Gmail query with folder settings
    const scanFolders = (settings.scan_folders as Record<string, boolean> | null) || undefined;
    const query = buildGmailQuery(afterDate, scanFolders);
    console.log('[Gmail Sync] Query:', query.substring(0, 300) + '...');
    console.log('[Gmail Sync] Looking for emails after:', afterDate.toISOString());
    console.log('[Gmail Sync] Scanning folders:', JSON.stringify(scanFolders));
    
    // Fetch messages from Gmail
    let messagesResponse;
    try {
      messagesResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
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
        errorCode = 'PERMISSION_DENIED';
        errorMessage = 'Gmail access was denied. Please grant the required permissions.';
      } else if (gmailError.code === 429) {
        errorCode = 'RATE_LIMIT_EXCEEDED';
        errorMessage = 'Gmail API limit reached. Please wait a few minutes.';
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
    let failedCount = 0;
    
    // Process messages (max 50 per sync)
    for (const msg of messages.slice(0, 50)) {
      try {
        // Check if already processed by gmail_message_id
        const { data: existing } = await supabase
          .from('auto_imported_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('gmail_message_id', msg.id)
          .maybeSingle();
        
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
            // Try HTML as fallback
            if (part.mimeType === 'text/html' && part.body?.data && !body) {
              body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'))
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ');
            }
          }
        }
        
        const msgDate = dateHeader ? new Date(dateHeader) : new Date();
        
        // Parse the email
        const parsed = parseEmailContent(body, subject, from, msgDate);
        
        if (!parsed) {
          console.log('[Gmail Sync] No valid transaction in message:', msg.id);
          continue;
        }
        
        // Skip failed transactions but log them
        if (parsed.isFailed) {
          console.log('[Gmail Sync] Skipping failed transaction:', msg.id);
          failedCount++;
          continue;
        }
        
        // Store full ISO timestamp including time from Gmail header
        const transactionDateStr = parsed.transactionDate.toISOString();
        
        // MULTI-LEVEL DEDUPLICATION
        let isDuplicate = false;
        let dedupeHash = '';
        
        // Level 1: Strong dedup by reference ID
        if (parsed.referenceId) {
          dedupeHash = await generateStrongDedupeHash(userId, parsed.referenceId);
          
          const { data: refDupe } = await supabase
            .from('auto_imported_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('dedupe_hash', dedupeHash)
            .maybeSingle();
          
          if (refDupe) {
            console.log('[Gmail Sync] Duplicate by reference ID:', parsed.referenceId);
            duplicatesFound++;
            isDuplicate = true;
            continue;
          }
        }
        
        // Level 2: Weak dedup by composite key
        if (!isDuplicate) {
          const weakHash = await generateWeakDedupeHash(
            userId,
            parsed.amount,
            parsed.transactionDate,
            parsed.accountMask,
            parsed.transactionType
          );
          
          const { data: weakDupe } = await supabase
            .from('auto_imported_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('dedupe_hash', weakHash)
            .maybeSingle();
          
          if (weakDupe) {
            console.log('[Gmail Sync] Duplicate by composite key');
            duplicatesFound++;
            isDuplicate = true;
            continue;
          }
          
          // Use weak hash if no reference ID
          if (!parsed.referenceId) {
            dedupeHash = weakHash;
          }
        }
        
        // Level 3: Check existing expenses (fuzzy)
        const dateTolerance = new Date(parsed.transactionDate);
        dateTolerance.setMinutes(dateTolerance.getMinutes() - 10);
        const dateAfter = new Date(parsed.transactionDate);
        dateAfter.setMinutes(dateAfter.getMinutes() + 10);
        
        const { data: fuzzyDupes } = await supabase
          .from('expenses')
          .select('id, amount, expense_date, merchant_name, is_auto_generated')
          .eq('user_id', userId)
          .gte('expense_date', dateTolerance.toISOString().split('T')[0])
          .lte('expense_date', dateAfter.toISOString().split('T')[0])
          .gte('amount', parsed.amount * 0.98)
          .lte('amount', parsed.amount * 1.02);
        
        let duplicateOfId = null;
        if (fuzzyDupes && fuzzyDupes.length > 0) {
          const manualEntry = fuzzyDupes.find(e => !e.is_auto_generated);
          if (manualEntry) {
            duplicateOfId = manualEntry.id;
            isDuplicate = true;
            duplicatesFound++;
            console.log('[Gmail Sync] Found fuzzy duplicate of manual entry:', manualEntry.id);
          }
        }
        
        // Normalize payment mode
        const normalizedPaymentMode = (() => {
          const mode = parsed.paymentMode.toLowerCase();
          if (mode === 'upi' || mode.includes('upi')) return 'UPI';
          if (mode === 'card' || mode.includes('card')) return 'Card';
          if (mode.includes('bank') || mode.includes('transfer')) return 'Bank Transfer';
          if (mode === 'wallet') return 'Wallet';
          if (mode === 'cash') return 'Cash';
          return 'Other';
        })();
        
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
            payment_mode: normalizedPaymentMode,
            source_platform: parsed.source,
            email_subject: subject.substring(0, 500),
            email_snippet: msgData.snippet?.substring(0, 500),
            confidence_score: parsed.confidenceScore / 100,
            is_duplicate: isDuplicate,
            duplicate_of_id: duplicateOfId,
            dedupe_hash: dedupeHash,
            needs_review: parsed.needsReview,
            review_reason: parsed.reviewReason,
            raw_extracted_data: { 
              from, 
              category: parsed.category,
              referenceId: parsed.referenceId,
              accountMask: parsed.accountMask,
              transactionType: parsed.transactionType,
              channel: parsed.channel,
              description: parsed.description,
              isReversal: parsed.isReversal,
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
            .maybeSingle();
          
          const { error: expenseError } = await supabase
            .from('expenses')
            .insert({
              user_id: userId,
              // Store date-only for expense_date field (type: date)
              expense_date: parsed.transactionDate.toISOString().split('T')[0],
              amount: parsed.amount,
              category: parsed.category,
              payment_mode: normalizedPaymentMode,
              merchant_name: parsed.merchant,
              notes: parsed.description || `Auto-imported: ${subject.substring(0, 80)}`,
              is_auto_generated: true,
              source_type: 'gmail',
              gmail_import_id: importedTx?.id,
              confidence_score: parsed.confidenceScore / 100,
            });
          
          if (!expenseError) {
            importedCount++;
            
            // Link expense to imported transaction
            const { data: newExpense } = await supabase
              .from('expenses')
              .select('id')
              .eq('user_id', userId)
              .eq('gmail_import_id', importedTx?.id)
              .maybeSingle();
            
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
    
    console.log('[Gmail Sync] Sync complete:', { 
      processedCount, 
      duplicatesFound, 
      importedCount, 
      needsReviewCount,
      failedCount 
    });
    
    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      duplicates: duplicatesFound,
      imported: importedCount,
      needsReview: needsReviewCount,
      failed: failedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[Gmail Sync] Unexpected error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      code: 'UNKNOWN',
      message: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
