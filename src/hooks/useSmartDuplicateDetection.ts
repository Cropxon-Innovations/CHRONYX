import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  amount: number;
  merchant_name: string | null;
  transaction_date: string;
  expense_date?: string;
  category?: string;
}

interface DuplicateMatch {
  id: string;
  confidence: number;
  reason: string;
}

interface CorrectionData {
  merchant_pattern?: string;
  amount_tolerance?: number;
  date_tolerance?: number;
  is_duplicate?: boolean;
}

export const useSmartDuplicateDetection = () => {
  const { user } = useAuth();

  // Record a user correction to improve future matching
  const recordCorrection = useCallback(async (
    transactionId: string,
    correctionType: 'marked_duplicate' | 'marked_not_duplicate' | 'category_changed' | 'amount_corrected',
    originalValue: any,
    correctedValue: any
  ) => {
    if (!user) return;

    await supabase.from("financeflow_corrections").insert({
      user_id: user.id,
      original_transaction_id: transactionId,
      correction_type: correctionType,
      original_value: originalValue,
      corrected_value: correctedValue,
    });

    // If marking as not duplicate, update the transaction
    if (correctionType === 'marked_not_duplicate') {
      await supabase
        .from("auto_imported_transactions")
        .update({ 
          is_duplicate: false, 
          user_verified: true,
          learned_category: correctedValue?.category 
        })
        .eq("id", transactionId);
    }

    // If category changed, learn the pattern
    if (correctionType === 'category_changed') {
      await supabase
        .from("auto_imported_transactions")
        .update({ 
          learned_category: correctedValue?.category,
          user_verified: true 
        })
        .eq("id", transactionId);
    }
  }, [user]);

  // Get learned patterns from user corrections
  const getLearnedPatterns = useCallback(async () => {
    if (!user) return { merchantCategories: {}, duplicatePatterns: [] };

    // Fetch all corrections
    const { data: corrections } = await supabase
      .from("financeflow_corrections")
      .select("*")
      .eq("user_id", user.id);

    // Fetch verified transactions with learned categories
    const { data: verifiedTx } = await supabase
      .from("auto_imported_transactions")
      .select("merchant_name, learned_category")
      .eq("user_id", user.id)
      .eq("user_verified", true)
      .not("learned_category", "is", null);

    // Build merchant -> category mapping
    const merchantCategories: Record<string, { category: string; count: number }> = {};
    
    verifiedTx?.forEach(tx => {
      if (tx.merchant_name && tx.learned_category) {
        const key = tx.merchant_name.toLowerCase();
        if (!merchantCategories[key]) {
          merchantCategories[key] = { category: tx.learned_category, count: 0 };
        }
        merchantCategories[key].count++;
      }
    });

    // Analyze corrections for duplicate patterns
    const duplicatePatterns: { pattern: string; isDuplicate: boolean }[] = [];
    
    corrections?.forEach(c => {
      if (c.correction_type === 'marked_duplicate' || c.correction_type === 'marked_not_duplicate') {
        const originalVal = c.original_value as Record<string, any> | null;
        const merchant = originalVal?.merchant_name?.toLowerCase();
        if (merchant) {
          duplicatePatterns.push({
            pattern: merchant,
            isDuplicate: c.correction_type === 'marked_duplicate'
          });
        }
      }
    });

    return { merchantCategories, duplicatePatterns };
  }, [user]);

  // Smart duplicate check with learned patterns
  const checkDuplicate = useCallback(async (
    transaction: Transaction,
    existingExpenses: Transaction[]
  ): Promise<DuplicateMatch | null> => {
    if (!user) return null;

    const patterns = await getLearnedPatterns();

    // Base tolerance values
    let amountTolerance = 0.02; // 2% default
    let dateTolerance = 1; // 1 day default

    // Adjust based on merchant patterns
    const merchantKey = transaction.merchant_name?.toLowerCase() || '';
    
    // Check if user has marked similar transactions as not duplicates
    const notDuplicatePattern = patterns.duplicatePatterns.find(
      p => merchantKey.includes(p.pattern) && !p.isDuplicate
    );
    
    if (notDuplicatePattern) {
      // User has previously said these aren't duplicates, be more strict
      amountTolerance = 0.001; // 0.1%
      dateTolerance = 0;
    }

    // Look for duplicates
    for (const expense of existingExpenses) {
      const amountDiff = Math.abs(expense.amount - transaction.amount) / transaction.amount;
      
      const txDate = new Date(transaction.transaction_date);
      const expDate = new Date(expense.expense_date || expense.transaction_date);
      const daysDiff = Math.abs((txDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));

      if (amountDiff <= amountTolerance && daysDiff <= dateTolerance) {
        // Check merchant similarity
        const expMerchant = expense.merchant_name?.toLowerCase() || '';
        const txMerchant = merchantKey;
        
        const merchantMatch = 
          expMerchant === txMerchant ||
          expMerchant.includes(txMerchant) ||
          txMerchant.includes(expMerchant);

        if (merchantMatch || amountDiff < 0.01) {
          const confidence = calculateConfidence(amountDiff, daysDiff, merchantMatch);
          return {
            id: expense.id,
            confidence,
            reason: merchantMatch 
              ? `Same merchant and amount within ${Math.round(amountDiff * 100)}%`
              : `Same amount within ${Math.round(amountDiff * 100)}%, ${daysDiff} day(s) apart`
          };
        }
      }
    }

    return null;
  }, [user, getLearnedPatterns]);

  // Get suggested category based on learned patterns
  const getSuggestedCategory = useCallback(async (merchantName: string): Promise<string | null> => {
    if (!user || !merchantName) return null;

    const patterns = await getLearnedPatterns();
    const key = merchantName.toLowerCase();

    // Check learned patterns
    for (const [pattern, data] of Object.entries(patterns.merchantCategories)) {
      if (key.includes(pattern) || pattern.includes(key)) {
        return data.category;
      }
    }

    return null;
  }, [user, getLearnedPatterns]);

  return {
    recordCorrection,
    checkDuplicate,
    getSuggestedCategory,
    getLearnedPatterns,
  };
};

function calculateConfidence(amountDiff: number, daysDiff: number, merchantMatch: boolean): number {
  let confidence = 0.5;

  // Amount similarity (max 0.3)
  if (amountDiff < 0.001) confidence += 0.3;
  else if (amountDiff < 0.01) confidence += 0.25;
  else if (amountDiff < 0.02) confidence += 0.15;

  // Date proximity (max 0.2)
  if (daysDiff === 0) confidence += 0.2;
  else if (daysDiff <= 1) confidence += 0.1;

  // Merchant match (max 0.3)
  if (merchantMatch) confidence += 0.3;

  return Math.min(confidence, 1);
}
