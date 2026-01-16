import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OAuthError {
  code: string;
  title: string;
  description: string;
  steps: string[];
}

const OAUTH_ERRORS: Record<string, OAuthError> = {
  invalid_client: {
    code: "invalid_client",
    title: "Authentication Configuration Error",
    description: "The OAuth credentials are not configured correctly.",
    steps: [
      "Check that Google Client ID and Secret are correctly entered in backend settings",
      "Ensure you're using a 'Web application' OAuth client (not Android/iOS)",
      "Verify there are no extra spaces in the credentials",
      "Try regenerating the client secret in Google Cloud Console"
    ]
  },
  redirect_uri_mismatch: {
    code: "redirect_uri_mismatch", 
    title: "Redirect URI Mismatch",
    description: "The redirect URL doesn't match Google Cloud Console configuration.",
    steps: [
      "Add this exact URI to Google Cloud Console: https://ewevnteuyfpinnlhvoty.supabase.co/auth/v1/callback",
      "Ensure the Site URL in backend settings matches your domain",
      "Clear browser cache and try again"
    ]
  },
  access_denied: {
    code: "access_denied",
    title: "Access Denied",
    description: "You cancelled the authentication or access was denied.",
    steps: [
      "Try signing in again and accept the permissions",
      "Check if your Google account has any restrictions",
      "Try using a different Google account"
    ]
  },
  server_error: {
    code: "server_error",
    title: "Server Error",
    description: "An error occurred during authentication.",
    steps: [
      "Wait a few moments and try again",
      "Clear browser cache and cookies",
      "Try using incognito/private browsing mode"
    ]
  }
};

export const OAuthErrorBanner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<OAuthError | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    // Check for OAuth error in URL params
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (errorParam) {
      // Map error to our known errors
      let matchedError = OAUTH_ERRORS[errorParam];
      
      // Check error description for more specific errors
      if (errorDescription) {
        if (errorDescription.includes("invalid_client")) {
          matchedError = OAUTH_ERRORS.invalid_client;
        } else if (errorDescription.includes("redirect")) {
          matchedError = OAUTH_ERRORS.redirect_uri_mismatch;
        }
      }
      
      setError(matchedError || {
        code: errorParam,
        title: "Authentication Error",
        description: errorDescription || "An error occurred during sign-in.",
        steps: ["Try signing in again", "Clear browser cache", "Contact support if the issue persists"]
      });
    }

    // Also check localStorage for OAuth errors (set by auth callback)
    const storedError = localStorage.getItem("chronyx_oauth_error");
    if (storedError) {
      try {
        const parsedError = JSON.parse(storedError);
        if (parsedError.code && OAUTH_ERRORS[parsedError.code]) {
          setError(OAUTH_ERRORS[parsedError.code]);
        }
        localStorage.removeItem("chronyx_oauth_error");
      } catch (e) {
        console.error("Failed to parse OAuth error", e);
      }
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setError(null);
    // Clean up URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("error");
    newParams.delete("error_description");
    newParams.delete("error_code");
    setSearchParams(newParams, { replace: true });
  };

  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4"
      >
        <Alert variant="destructive" className="relative">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between pr-8">
            {error.title}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">{error.description}</p>
            <p className="text-xs text-muted-foreground font-mono">Error: {error.code}</p>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs p-0 hover:bg-transparent hover:underline"
              onClick={() => setShowSteps(!showSteps)}
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              {showSteps ? "Hide steps" : "How to fix this"}
            </Button>
            
            <AnimatePresence>
              {showSteps && (
                <motion.ol
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="list-decimal list-inside text-xs space-y-1 mt-2 pl-2 border-l-2 border-destructive/30"
                >
                  {error.steps.map((step, i) => (
                    <li key={i} className="text-muted-foreground">{step}</li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

export default OAuthErrorBanner;
