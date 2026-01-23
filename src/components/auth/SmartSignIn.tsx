import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Sparkles, 
  Fingerprint, 
  Smartphone, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  AlertCircle,
  Check,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SmartSignInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath?: string;
}

type Step = "email" | "method" | "passkey" | "totp";

interface UserStatus {
  exists: boolean;
  has2FA: boolean;
  methods: {
    totp: boolean;
    webauthn: boolean;
  };
  userId?: string;
}

export const SmartSignIn = ({ open, onOpenChange, redirectPath = "/app" }: SmartSignInProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [webauthnSupported, setWebauthnSupported] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    setWebauthnSupported(
      typeof window !== "undefined" &&
      window.PublicKeyCredential !== undefined
    );
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStep("email");
      setEmail("");
      setTotpCode("");
      setError(null);
      setUserStatus(null);
    }
  }, [open]);

  const base64UrlToUint8Array = (base64url: string): Uint8Array => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const str = atob(padded);
    return Uint8Array.from(str, (c) => c.charCodeAt(0));
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("smart-signin", {
        body: { action: "check-email", email },
      });

      if (invokeError) throw invokeError;

      if (!data.exists) {
        setError("No account found with this email. Please sign up first.");
        return;
      }

      if (!data.has2FA) {
        setError("Smart Sign-In requires 2FA. Please sign in with your password first, then enable 2FA in Settings.");
        return;
      }

      setUserStatus(data);
      setStep("method");
    } catch (err) {
      console.error("Email check error:", err);
      setError("Failed to check email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    if (!webauthnSupported) {
      setError("Passkeys are not supported on this device/browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get WebAuthn options
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke("smart-signin", {
        body: { action: "webauthn-options", email },
      });

      if (optionsError || !optionsData?.success) {
        throw new Error(optionsData?.error || "Failed to get passkey options");
      }

      const options = optionsData.options;
      options.challenge = base64UrlToUint8Array(options.challenge);
      if (Array.isArray(options.allowCredentials)) {
        options.allowCredentials = options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: base64UrlToUint8Array(cred.id),
        }));
      }

      // Request credential
      const credential = await navigator.credentials.get({
        publicKey: options,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("No credential received");
      }

      // Verify credential
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("smart-signin", {
        body: {
          action: "webauthn-verify",
          email,
          credential: { id: credential.id },
        },
      });

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyData?.error || "Passkey verification failed");
      }

      // Use the magic link to sign in
      if (verifyData.redirectUrl) {
        // Extract the token from the redirect URL and use it to sign in
        const url = new URL(verifyData.redirectUrl);
        const token = url.hash.substring(1); // Remove the # prefix
        const params = new URLSearchParams(token);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
        } else {
          // Fallback: redirect to the magic link
          window.location.href = verifyData.redirectUrl;
          return;
        }
      }

      toast({ title: "Welcome back!", description: "Signed in with passkey" });
      onOpenChange(false);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      console.error("Passkey auth error:", err);
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled or timed out");
      } else {
        setError(err.message || "Passkey authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpAuth = async () => {
    if (totpCode.length !== 6 && totpCode.length < 8) {
      setError("Please enter a valid code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("smart-signin", {
        body: { action: "totp-verify", email, token: totpCode },
      });

      if (invokeError || !data?.success) {
        throw new Error(data?.error || "Verification failed");
      }

      if (data.usedBackupCode) {
        toast({
          title: "Backup code used",
          description: "Consider generating new backup codes in Settings",
        });
      }

      // Use the magic link to sign in
      if (data.redirectUrl) {
        const url = new URL(data.redirectUrl);
        const token = url.hash.substring(1);
        const params = new URLSearchParams(token);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;
        } else {
          window.location.href = data.redirectUrl;
          return;
        }
      }

      toast({ title: "Welcome back!", description: "Signed in with authenticator" });
      onOpenChange(false);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      console.error("TOTP auth error:", err);
      setError(err.message || "Verification failed");
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Smart Sign-In
          </DialogTitle>
          <DialogDescription>
            Sign in securely using your passkey or authenticator app
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Email Input */}
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="you@example.com"
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                onClick={handleEmailSubmit}
                disabled={!email || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Method Selection */}
          {step === "method" && userStatus && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Choose how to verify your identity for
                </p>
                <p className="font-medium">{email}</p>
              </div>

              <div className="space-y-3">
                {userStatus.methods.webauthn && webauthnSupported && (
                  <Button
                    variant="outline"
                    className="w-full h-16 justify-start gap-4 hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => {
                      setStep("passkey");
                      handlePasskeyAuth();
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Use Passkey</p>
                      <p className="text-xs text-muted-foreground">
                        Face ID, Touch ID, or Security Key
                      </p>
                    </div>
                  </Button>
                )}

                {userStatus.methods.totp && (
                  <Button
                    variant="outline"
                    className="w-full h-16 justify-start gap-4 hover:border-primary/50 hover:bg-primary/5"
                    onClick={() => setStep("totp")}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Use Authenticator App</p>
                      <p className="text-xs text-muted-foreground">
                        Enter the 6-digit code from your app
                      </p>
                    </div>
                  </Button>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                variant="ghost"
                onClick={() => setStep("email")}
                className="w-full gap-2 text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Use a different email
              </Button>
            </motion.div>
          )}

          {/* Step 3: Passkey Verification */}
          {step === "passkey" && (
            <motion.div
              key="passkey"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <Fingerprint className={`w-10 h-10 text-primary ${isLoading ? "animate-pulse" : ""}`} />
                </motion.div>
                
                {isLoading ? (
                  <div>
                    <p className="font-medium">Waiting for passkey...</p>
                    <p className="text-sm text-muted-foreground">
                      Complete the verification on your device
                    </p>
                  </div>
                ) : error ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    <Button onClick={handlePasskeyAuth} className="w-full">
                      Try Again
                    </Button>
                  </div>
                ) : null}
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep("method")}
                className="w-full gap-2 text-muted-foreground"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Choose another method
              </Button>
            </motion.div>
          )}

          {/* Step 4: TOTP Verification */}
          {step === "totp" && (
            <motion.div
              key="totp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-4"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium">Enter authenticator code</p>
                <p className="text-sm text-muted-foreground">
                  Open your authenticator app and enter the 6-digit code
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={totpCode}
                  onChange={(value) => {
                    setTotpCode(value);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-11 h-13 text-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <Button
                onClick={handleTotpAuth}
                disabled={totpCode.length !== 6 || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Verify & Sign In
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setTotpCode("");
                    setError("Enter your backup code (XXXX-XXXX format)");
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Use a backup code instead
                </button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setStep("method")}
                className="w-full gap-2 text-muted-foreground"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Choose another method
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

// Smart Sign-In Button for the login page
export const SmartSignInButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.button
      onClick={onClick}
      className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 
                 bg-primary text-primary-foreground rounded-full shadow-lg
                 hover:shadow-xl hover:scale-105 transition-all duration-300
                 text-sm font-medium z-50"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Sparkles className="w-4 h-4" />
      Try Smart Sign-In
      <motion.span
        className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.button>
  );
};
