// ============================================
// CHRONYX Guardrails - Security & Rate Limiting Helpers
// ============================================

import { supabase } from '@/integrations/supabase/client';

// Gmail ingestion limits
export const GMAIL_LIMITS = {
  MAX_EMAILS_PER_RUN: 20,
  MAX_IMPORTS_PER_DAY: 50,
  MAX_EMAIL_AGE_DAYS: 90,
};

// Rate limiting for edge functions
export const RATE_LIMITS = {
  gmail_sync: { requests: 5, windowMs: 60000 }, // 5 requests per minute
  ai_parse: { requests: 10, windowMs: 60000 }, // 10 requests per minute
  payment: { requests: 3, windowMs: 60000 }, // 3 payments per minute
};

// Data source priority
export const DATA_SOURCE_PRIORITY = {
  manual: 100,
  user_edited: 90,
  ocr: 50,
  gmail: 30,
  ai: 20,
};

/**
 * Check if manual data should override auto-imported data
 */
export function shouldOverride(existingSource: string, newSource: string): boolean {
  const existingPriority = DATA_SOURCE_PRIORITY[existingSource as keyof typeof DATA_SOURCE_PRIORITY] || 0;
  const newPriority = DATA_SOURCE_PRIORITY[newSource as keyof typeof DATA_SOURCE_PRIORITY] || 0;
  return newPriority > existingPriority;
}

/**
 * Log user action for audit trail
 */
export async function logUserAction(params: {
  userId: string;
  action: string;
  module: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  source?: string;
}) {
  try {
    await supabase.from('user_action_logs').insert([{
      user_id: params.userId,
      action: params.action,
      module: params.module,
      target_id: params.targetId,
      target_type: params.targetType,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      success: params.success ?? true,
      source: params.source ?? 'manual',
    }]);
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
}

/**
 * Log AI parsing for cost tracking
 */
export async function logAIParsing(params: {
  userId: string;
  parseType: string;
  inputSnippet?: string;
  outputSummary?: string;
  modelUsed?: string;
  confidenceScore?: number;
  tokensUsed?: number;
  costEstimate?: number;
  success?: boolean;
  errorMessage?: string;
}) {
  try {
    await supabase.from('ai_parsing_logs').insert([{
      user_id: params.userId,
      parse_type: params.parseType,
      input_snippet: params.inputSnippet?.substring(0, 200),
      output_summary: params.outputSummary?.substring(0, 500),
      model_used: params.modelUsed,
      confidence_score: params.confidenceScore,
      tokens_used: params.tokensUsed,
      cost_estimate: params.costEstimate,
      success: params.success ?? true,
      error_message: params.errorMessage,
      source: 'ai',
    }]);
  } catch (error) {
    console.error('Failed to log AI parsing:', error);
  }
}

/**
 * Log Gmail import activity
 */
export async function logGmailImport(params: {
  userId: string;
  gmailMessageId?: string;
  action: 'import' | 'skip' | 'duplicate' | 'error';
  success?: boolean;
  errorMessage?: string;
  emailSubject?: string;
  transactionAmount?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from('gmail_import_logs').insert([{
      user_id: params.userId,
      gmail_message_id: params.gmailMessageId,
      action: params.action,
      success: params.success ?? true,
      error_message: params.errorMessage,
      email_subject: params.emailSubject?.substring(0, 200),
      transaction_amount: params.transactionAmount,
      metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
      source: 'gmail',
    }]);
  } catch (error) {
    console.error('Failed to log Gmail import:', error);
  }
}

/**
 * Log error for debugging
 */
export async function logError(params: {
  userId?: string;
  errorType: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  endpoint?: string;
  requestPayload?: Record<string, unknown>;
  severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}) {
  try {
    await supabase.from('error_logs').insert([{
      user_id: params.userId,
      error_type: params.errorType,
      error_code: params.errorCode,
      error_message: params.errorMessage,
      stack_trace: params.stackTrace,
      endpoint: params.endpoint,
      request_payload: params.requestPayload ? JSON.parse(JSON.stringify(params.requestPayload)) : null,
      severity: params.severity ?? 'error',
    }]);
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

/**
 * Check daily Gmail import limit
 */
export async function checkDailyGmailLimit(userId: string): Promise<{ canImport: boolean; remaining: number }> {
  try {
    const { data, error } = await supabase
      .from('gmail_sync_settings')
      .select('daily_import_count, daily_import_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { canImport: true, remaining: GMAIL_LIMITS.MAX_IMPORTS_PER_DAY };
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Reset count if it's a new day
    if (data.daily_import_date !== today) {
      return { canImport: true, remaining: GMAIL_LIMITS.MAX_IMPORTS_PER_DAY };
    }

    const count = data.daily_import_count || 0;
    const remaining = Math.max(GMAIL_LIMITS.MAX_IMPORTS_PER_DAY - count, 0);
    
    return { 
      canImport: count < GMAIL_LIMITS.MAX_IMPORTS_PER_DAY, 
      remaining 
    };
  } catch (error) {
    console.error('Error checking daily limit:', error);
    return { canImport: true, remaining: GMAIL_LIMITS.MAX_IMPORTS_PER_DAY };
  }
}

/**
 * Increment daily Gmail import count
 */
export async function incrementDailyGmailCount(userId: string, count: number = 1): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('gmail_sync_settings')
      .select('daily_import_count, daily_import_date')
      .eq('user_id', userId)
      .single();

    let newCount = count;
    if (existing && existing.daily_import_date === today) {
      newCount = (existing.daily_import_count || 0) + count;
    }

    await supabase
      .from('gmail_sync_settings')
      .update({
        daily_import_count: newCount,
        daily_import_date: today,
      })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error incrementing daily count:', error);
  }
}

/**
 * Validate email age for Gmail import
 */
export function isEmailTooOld(emailDate: Date): boolean {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - GMAIL_LIMITS.MAX_EMAIL_AGE_DAYS);
  return emailDate < cutoffDate;
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CRX${year}${month}${random}`;
}
