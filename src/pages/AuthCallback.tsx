import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkIsAdmin, ADMIN_ROUTE } from "@/hooks/useAdminCheck";

// CHRONYX Logo Component
const ChronxyxLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="callback-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#callback-logo-gradient)" 
      strokeWidth="2" 
      fill="none"
      className="opacity-80"
    />
    <circle 
      cx="50" cy="50" r="35" 
      stroke="hsl(var(--primary))" 
      strokeWidth="1" 
      strokeDasharray="6 4"
      fill="none"
      className="opacity-40"
    />
    <circle 
      cx="50" cy="50" r="5" 
      fill="hsl(var(--primary))"
      className="opacity-90"
    />
    {[0, 90, 180, 270].map((angle, i) => (
      <circle 
        key={i}
        cx={50 + 40 * Math.cos((angle - 90) * Math.PI / 180)}
        cy={50 + 40 * Math.sin((angle - 90) * Math.PI / 180)}
        r="2"
        fill="hsl(var(--primary))"
        className="opacity-50"
      />
    ))}
  </svg>
);

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const processAuth = async () => {
    try {
      setError(null);
      const hash = window.location.hash;
      
      console.log('[AuthCallback] Processing authentication...');
      console.log('[AuthCallback] Hash present:', !!hash);
      console.log('[AuthCallback] Search params:', location.search);

      // Check for OAuth errors in hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const oauthError = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (oauthError) {
          console.error('[AuthCallback] OAuth error:', oauthError, errorDescription);
          setError(errorDescription || oauthError);
          return;
        }

        // Check for access token in hash (implicit flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log('[AuthCallback] Found access token in hash, processing...');
          
          // Try to get existing session first
          const { data: existingSession } = await supabase.auth.getSession();
          
          if (existingSession?.session) {
            console.log('[AuthCallback] Session already exists, redirecting...');
            window.history.replaceState({}, '', '/auth/callback');
            navigate("/app", { replace: true });
            return;
          }

          // Set session from hash tokens
          if (refreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              console.error('[AuthCallback] Failed to set session:', setSessionError);
              setError(setSessionError.message);
              return;
            }

            if (data.session) {
              console.log('[AuthCallback] Session established for:', data.session.user.email);
              window.history.replaceState({}, '', '/auth/callback');
              setTimeout(() => {
                navigate("/app", { replace: true });
              }, 1000);
              return;
            }
          }
        }
      }

      // Check for PKCE flow (code in query params)
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      
      if (code) {
        console.log('[AuthCallback] Found code in query params (PKCE flow)');
        // Supabase client handles code exchange automatically
      }

      // Standard session check (for both flows)
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthCallback] Session error:', sessionError);
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        console.log('[AuthCallback] Session found, checking admin status...');
        // Clean URL and redirect
        window.history.replaceState({}, '', '/auth/callback');
        
        // Check if user is admin and redirect accordingly
        const isAdmin = await checkIsAdmin(data.session.user.id);
        setTimeout(() => {
          if (isAdmin) {
            navigate(ADMIN_ROUTE, { replace: true });
          } else {
            navigate("/app", { replace: true });
          }
        }, 1500);
      } else {
        console.log('[AuthCallback] No session found, waiting for auth state change...');
        // Wait a bit for auth state to propagate
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            const isAdmin = await checkIsAdmin(retryData.session.user.id);
            if (isAdmin) {
              navigate(ADMIN_ROUTE, { replace: true });
            } else {
              navigate("/app", { replace: true });
            }
          } else {
            setError('Unable to complete authentication. Please try again.');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('[AuthCallback] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await processAuth();
    setIsRetrying(false);
  };

  useEffect(() => {
    processAuth();
  }, [navigate, location]);

  // Error state
  if (error) {
    return (
      <motion.main 
        className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
          >
            <AlertCircle className="w-8 h-8 text-destructive" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-xl font-medium text-foreground">
              Authentication Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login', { replace: true })}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact{' '}
            <a href="mailto:support@getchronyx.com" className="text-primary hover:underline">
              support@getchronyx.com
            </a>
          </p>
        </div>
      </motion.main>
    );
  }

  // Loading state
  return (
    <motion.main 
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <ChronxyxLogo className="w-20 h-20" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <motion.h1 
            className="text-xl font-medium text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Signing you into CHRONYX…
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Just a moment while we set things up
          </motion.p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            />
          ))}
        </div>
      </div>
    </motion.main>
  );
};

export default AuthCallback;
