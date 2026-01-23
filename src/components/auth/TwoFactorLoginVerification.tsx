import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, Key, Loader2, Fingerprint, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TwoFactorLoginVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  email: string;
  has2FAMethods: {
    totp: boolean;
    webauthn: boolean;
  };
}

type VerificationMethod = "totp" | "webauthn" | "backup";

export const TwoFactorLoginVerification = ({
  open,
  onOpenChange,
  onSuccess,
  userId,
  email,
  has2FAMethods,
}: TwoFactorLoginVerificationProps) => {
  const { toast } = useToast();
  const [method, setMethod] = useState<VerificationMethod>(
    has2FAMethods.webauthn ? "webauthn" : "totp"
  );
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTotpVerify = async () => {
    if (code.length !== 6 && method !== "backup") return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("totp-setup", {
        body: { 
          action: "authenticate",
          token: code,
        },
      });
      
      if (invokeError || !data?.verified) {
        setError("Invalid code. Please try again.");
        setCode("");
        return;
      }
      
      if (data.usedBackupCode) {
        toast({
          title: "Backup code used",
          description: "Consider generating new backup codes in Settings.",
        });
      }
      
      onSuccess();
    } catch (err) {
      console.error("2FA verification error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWebAuthnVerify = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      // Step 1: Get authentication options
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke("webauthn-setup", {
        body: { action: "authenticate-options" },
      });
      
      if (optionsError || !optionsData?.success) {
        throw new Error(optionsData?.error || "Failed to get authentication options");
      }
      
      const { options, challenge } = optionsData;
      
      // Step 2: Request credential from authenticator
      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
          })),
        },
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error("No credential received");
      }
      
      const response = credential.response as AuthenticatorAssertionResponse;
      
      // Step 3: Verify with backend
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("webauthn-setup", {
        body: {
          action: "authenticate-verify",
          credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
        },
      });
      
      if (verifyError || !verifyData?.success) {
        throw new Error(verifyData?.error || "Verification failed");
      }
      
      onSuccess();
    } catch (err: any) {
      console.error("WebAuthn verification error:", err);
      if (err.name === "NotAllowedError") {
        setError("Authentication was cancelled or timed out.");
      } else if (err.name === "SecurityError") {
        setError("Security key authentication is not available.");
      } else {
        setError(err.message || "Passkey verification failed.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (method === "webauthn") {
      handleWebAuthnVerify();
    } else {
      handleTotpVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Verify your identity to continue signing in as {email}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={method}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 py-4"
          >
            {/* Method Selection */}
            {(has2FAMethods.totp && has2FAMethods.webauthn) && (
              <div className="flex gap-2">
                <Button
                  variant={method === "webauthn" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setMethod("webauthn")}
                >
                  <Fingerprint className="w-4 h-4" />
                  Passkey
                </Button>
                <Button
                  variant={method === "totp" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setMethod("totp")}
                >
                  <Smartphone className="w-4 h-4" />
                  Authenticator
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* WebAuthn Method */}
            {method === "webauthn" && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Use your passkey</p>
                  <p className="text-sm text-muted-foreground">
                    Touch your security key or use Face ID / Touch ID
                  </p>
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for passkey...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Verify with Passkey
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* TOTP Method */}
            {method === "totp" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium mb-1">Enter authenticator code</p>
                  <p className="text-sm text-muted-foreground">
                    Open your authenticator app and enter the 6-digit code
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      setError(null);
                    }}
                    disabled={isVerifying}
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

                <Button
                  onClick={handleVerify}
                  disabled={code.length !== 6 || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>

                {/* Backup code option */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMethod("backup")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Use a backup code instead
                  </button>
                </div>
              </div>
            )}

            {/* Backup Code Method */}
            {method === "backup" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-medium mb-1">Enter backup code</p>
                  <p className="text-sm text-muted-foreground">
                    Enter one of your saved backup codes (e.g., XXXX-XXXX)
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="XXXX-XXXX"
                    className="w-full max-w-[200px] text-center font-mono text-lg tracking-wider px-4 py-3 border rounded-lg bg-background"
                    disabled={isVerifying}
                  />
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={code.length < 8 || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMethod("totp")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to authenticator code
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
