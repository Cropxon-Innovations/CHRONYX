import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Fingerprint, 
  Smartphone, 
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FirstTime2FAPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPasskey: () => void;
  onSelectAuthenticator: () => void;
  onSkip: () => void;
}

export const FirstTime2FAPrompt = ({
  open,
  onOpenChange,
  onSelectPasskey,
  onSelectAuthenticator,
  onSkip,
}: FirstTime2FAPromptProps) => {
  const { user } = useAuth();
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    setIsWebAuthnSupported(!!window.PublicKeyCredential);
  }, []);

  const handleSkip = async () => {
    // Mark that user has seen the prompt
    if (user) {
      localStorage.setItem(`chronyx_2fa_prompt_shown_${user.id}`, 'true');
    }
    onSkip();
  };

  const handleSelectMethod = (method: 'passkey' | 'authenticator') => {
    if (user) {
      localStorage.setItem(`chronyx_2fa_prompt_shown_${user.id}`, 'true');
    }
    onOpenChange(false);
    if (method === 'passkey') {
      onSelectPasskey();
    } else {
      onSelectAuthenticator();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Premium Header */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={handleSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
          
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                <Shield className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Secure Your Account
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of protection
              </p>
            </div>
          </motion.div>
        </div>

        <div className="p-6 pt-2 space-y-4">
          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Two-factor authentication helps protect your account even if your password is compromised. Choose a method to get started:
          </motion.p>

          {/* Passkey Option */}
          {isWebAuthnSupported && (
            <motion.button
              type="button"
              onClick={() => handleSelectMethod('passkey')}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all duration-200",
                "border-primary/20 bg-gradient-to-r from-primary/5 to-transparent",
                "hover:border-primary/40 hover:from-primary/10",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">Passkey / Biometric</h3>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Use Face ID, Touch ID, or Windows Hello for instant login
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Phishing-resistant • No passwords needed</span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          )}

          {/* Authenticator App Option */}
          <motion.button
            type="button"
            onClick={() => handleSelectMethod('authenticator')}
            className={cn(
              "w-full p-4 rounded-2xl border text-left transition-all duration-200",
              "border-border/50 bg-card",
              "hover:border-primary/40 hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-amber-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Authenticator App</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Use Google Authenticator, Authy, or similar apps
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Works on any device • Time-based codes</span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </motion.button>

          {/* Skip Button */}
          <motion.div
            className="pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              Maybe later
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to check if user should see the 2FA prompt
export const shouldShow2FAPrompt = async (userId: string): Promise<boolean> => {
  // Check if already shown
  const alreadyShown = localStorage.getItem(`chronyx_2fa_prompt_shown_${userId}`);
  if (alreadyShown) return false;

  // Check if 2FA is already enabled
  try {
    const { data } = await supabase.functions.invoke("totp-setup", {
      body: { action: "status" },
    });
    
    if (data?.totpEnabled || data?.webauthnEnabled) {
      // Already has 2FA, don't show prompt
      localStorage.setItem(`chronyx_2fa_prompt_shown_${userId}`, 'true');
      return false;
    }
  } catch (error) {
    console.error("Error checking 2FA status:", error);
    return false;
  }

  return true;
};