import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuthHashHandler - Detects OAuth tokens in URL hash fragment and processes them.
 * 
 * When Supabase OAuth uses implicit flow, tokens appear in the URL hash (#access_token=...).
 * This component detects these tokens and ensures they are properly processed,
 * then redirects users to the dashboard with a clean URL.
 */
export const useOAuthHashHandler = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processHashTokens = async () => {
      const hash = window.location.hash;
      
      // Check if hash contains OAuth tokens
      if (!hash || !hash.includes('access_token')) {
        return;
      }

      setIsProcessing(true);
      console.log('[OAuth] Detected tokens in URL hash, processing...');

      try {
        // Parse hash parameters
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          console.error('[OAuth] Error from provider:', error, errorDescription);
          setError(errorDescription || error);
          
          // Clean URL and redirect to login with error
          window.history.replaceState({}, '', window.location.pathname);
          navigate('/login?error=oauth_failed&message=' + encodeURIComponent(errorDescription || error), { replace: true });
          return;
        }

        if (!accessToken) {
          console.error('[OAuth] No access token found in hash');
          setError('No access token received');
          return;
        }

        // Supabase should automatically pick up the session from the URL
        // But we'll verify the session was created
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[OAuth] Session error:', sessionError);
          setError(sessionError.message);
          navigate('/login?error=session_failed', { replace: true });
          return;
        }

        if (sessionData?.session) {
          console.log('[OAuth] Session established successfully for:', sessionData.session.user.email);
          
          // Clean the URL by removing the hash fragment
          window.history.replaceState({}, '', window.location.pathname);
          
          // Navigate to dashboard
          navigate('/app', { replace: true });
        } else {
          // If no session yet, try to set it manually using the tokens
          // This is a fallback in case auto-detection didn't work
          console.log('[OAuth] No session found, attempting manual token set...');
          
          if (accessToken && refreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('[OAuth] Failed to set session:', setSessionError);
              setError(setSessionError.message);
              navigate('/login?error=token_invalid', { replace: true });
              return;
            }

            if (data.session) {
              console.log('[OAuth] Session set manually for:', data.session.user.email);
              window.history.replaceState({}, '', window.location.pathname);
              navigate('/app', { replace: true });
            }
          }
        }
      } catch (err) {
        console.error('[OAuth] Unexpected error processing tokens:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        navigate('/login?error=unexpected', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    processHashTokens();
  }, [navigate, location]);

  return { isProcessing, error };
};

/**
 * Component version for use in route components
 */
export const OAuthHashHandler = ({ children }: { children?: React.ReactNode }) => {
  const { isProcessing } = useOAuthHashHandler();

  // While processing, don't render children to prevent flash
  if (isProcessing) {
    return null;
  }

  return <>{children}</>;
};

export default OAuthHashHandler;
