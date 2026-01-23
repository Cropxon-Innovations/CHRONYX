import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TwoFactorStatus {
  totpEnabled: boolean;
  webauthnEnabled: boolean;
  totpVerifiedAt: string | null;
  lastUsedAt: string | null;
  backupCodesRemaining: number;
  webauthnCredentials: Array<{
    id: string;
    device_name: string;
    device_type: string;
    last_used_at: string | null;
    created_at: string;
  }>;
}

export const use2FAStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("totp-setup", {
        body: { action: "status" },
      });

      if (invokeError) throw invokeError;

      setStatus({
        totpEnabled: data.totpEnabled || false,
        webauthnEnabled: data.webauthnEnabled || false,
        totpVerifiedAt: data.totpVerifiedAt,
        lastUsedAt: data.lastUsedAt,
        backupCodesRemaining: data.backupCodesRemaining || 0,
        webauthnCredentials: data.webauthnCredentials || [],
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching 2FA status:", err);
      setError("Failed to fetch 2FA status");
      setStatus({
        totpEnabled: false,
        webauthnEnabled: false,
        totpVerifiedAt: null,
        lastUsedAt: null,
        backupCodesRemaining: 0,
        webauthnCredentials: [],
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const has2FAEnabled = status?.totpEnabled || status?.webauthnEnabled || false;

  const refetch = () => {
    setLoading(true);
    fetchStatus();
  };

  return {
    status,
    loading,
    error,
    has2FAEnabled,
    refetch,
  };
};

// Check if a user (by email) has 2FA enabled before login
export const check2FAStatusByEmail = async (email: string): Promise<{
  requires2FA: boolean;
  methods: { totp: boolean; webauthn: boolean };
} | null> => {
  try {
    // This would need a public edge function to check 2FA status by email
    // For now, we'll return null and check after login
    return null;
  } catch (err) {
    console.error("Error checking 2FA status:", err);
    return null;
  }
};
