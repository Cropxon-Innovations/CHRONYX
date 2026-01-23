import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Key, Smartphone, Loader2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebAuthnRegistrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const WebAuthnRegistration = ({
  open,
  onOpenChange,
  onSuccess,
}: WebAuthnRegistrationProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"intro" | "registering" | "naming" | "success">("intro");
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect device type for better naming suggestions
  const detectDeviceType = (): { type: string; suggestedName: string } => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) {
      return { type: "platform", suggestedName: "iPhone Face ID" };
    }
    if (/Mac/.test(ua) && /Safari/.test(ua)) {
      return { type: "platform", suggestedName: "Mac Touch ID" };
    }
    if (/Android/.test(ua)) {
      return { type: "platform", suggestedName: "Android Fingerprint" };
    }
    if (/Windows/.test(ua)) {
      return { type: "platform", suggestedName: "Windows Hello" };
    }
    return { type: "security_key", suggestedName: "Security Key" };
  };

  const handleStartRegistration = async () => {
    setIsRegistering(true);
    setError(null);
    
    try {
      // Step 1: Get registration options from backend
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke("webauthn-setup", {
        body: { action: "register-options" },
      });
      
      if (optionsError || !optionsData?.success) {
        throw new Error(optionsData?.error || "Failed to get registration options");
      }
      
      const { options, challenge } = optionsData;
      
      // Step 2: Create credential with WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
          user: {
            ...options.user,
            id: Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0)),
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
          })),
        },
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error("No credential received");
      }
      
      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Store credential data for verification after naming
      setPendingCredential({
        credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        publicKey: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
        attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
      });
      
      // Move to naming step
      const { suggestedName } = detectDeviceType();
      setDeviceName(suggestedName);
      setStep("naming");
      
    } catch (err: any) {
      console.error("WebAuthn registration error:", err);
      if (err.name === "NotAllowedError") {
        setError("Registration was cancelled or timed out.");
      } else if (err.name === "SecurityError") {
        setError("Passkeys are not supported on this device.");
      } else if (err.name === "InvalidStateError") {
        setError("This passkey is already registered.");
      } else {
        setError(err.message || "Failed to register passkey.");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!pendingCredential || !deviceName.trim()) return;
    
    setIsRegistering(true);
    setError(null);
    
    try {
      const { type } = detectDeviceType();
      
      const { data, error: verifyError } = await supabase.functions.invoke("webauthn-setup", {
        body: {
          action: "register-verify",
          ...pendingCredential,
          deviceName: deviceName.trim(),
          deviceType: type,
        },
      });
      
      if (verifyError || !data?.success) {
        throw new Error(data?.error || "Failed to verify registration");
      }
      
      setStep("success");
      
      toast({
        title: "Passkey registered!",
        description: `${deviceName} has been added for passwordless login.`,
      });
      
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        // Reset state
        setStep("intro");
        setPendingCredential(null);
        setDeviceName("");
      }, 1500);
      
    } catch (err: any) {
      console.error("WebAuthn verification error:", err);
      setError(err.message || "Failed to complete registration.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("intro");
      setPendingCredential(null);
      setDeviceName("");
      setError(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            Register Passkey
          </DialogTitle>
          <DialogDescription>
            Use Face ID, Touch ID, or a security key for fast, passwordless sign-in.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Intro Step */}
          {step === "intro" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <Fingerprint className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Touch ID</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Face ID</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <Key className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Security Key</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Passkeys are more secure than passwords and can't be phished.
                </p>
              </div>

              <Button
                onClick={handleStartRegistration}
                disabled={isRegistering}
                className="w-full gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for device...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Register Passkey
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Naming Step */}
          {step === "naming" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              
              <div className="text-center">
                <p className="font-medium">Passkey created!</p>
                <p className="text-sm text-muted-foreground">
                  Give it a name so you can identify it later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., iPhone Face ID"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleCompleteRegistration}
                disabled={!deviceName.trim() || isRegistering}
                className="w-full"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </motion.div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Check className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <div>
                <p className="font-medium text-lg">All set!</p>
                <p className="text-sm text-muted-foreground">
                  You can now use your passkey to sign in.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
