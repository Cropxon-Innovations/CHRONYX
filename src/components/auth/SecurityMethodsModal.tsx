import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Fingerprint, 
  Smartphone, 
  AlertTriangle, 
  Check, 
  ChevronRight,
  Loader2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityMethodsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPasskey: () => void;
  onSelectAuthenticator: () => void;
}

interface DeviceCapabilities {
  webauthnSupported: boolean;
  platformAuthenticator: boolean;
  biometricAvailable: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osName: string;
  browserName: string;
}

const detectDeviceCapabilities = (): DeviceCapabilities => {
  const ua = navigator.userAgent;
  
  // Detect OS
  let osName = 'Unknown';
  if (/Windows/i.test(ua)) osName = 'Windows';
  else if (/Mac/i.test(ua)) osName = 'macOS';
  else if (/iPhone|iPad/i.test(ua)) osName = 'iOS';
  else if (/Android/i.test(ua)) osName = 'Android';
  else if (/Linux/i.test(ua)) osName = 'Linux';
  
  // Detect browser
  let browserName = 'Unknown';
  if (/Chrome/i.test(ua) && !/Edge|Edg/i.test(ua)) browserName = 'Chrome';
  else if (/Firefox/i.test(ua)) browserName = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Safari';
  else if (/Edge|Edg/i.test(ua)) browserName = 'Edge';
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/iPhone|Android.*Mobile/i.test(ua)) deviceType = 'mobile';
  else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) deviceType = 'tablet';
  
  // Check WebAuthn support
  const webauthnSupported = !!(window.PublicKeyCredential);
  
  // Platform authenticator (biometric) availability
  const platformAuthenticator = webauthnSupported && 
    (osName === 'iOS' || osName === 'macOS' || osName === 'Windows' || osName === 'Android');
  
  // Biometric naming based on platform
  const biometricAvailable = platformAuthenticator && 
    (osName === 'iOS' || osName === 'macOS' || osName === 'Android' || osName === 'Windows');

  return {
    webauthnSupported,
    platformAuthenticator,
    biometricAvailable,
    deviceType,
    osName,
    browserName,
  };
};

const getBiometricName = (osName: string): string => {
  switch (osName) {
    case 'iOS':
    case 'macOS':
      return 'Face ID / Touch ID';
    case 'Android':
      return 'Fingerprint / Face Unlock';
    case 'Windows':
      return 'Windows Hello';
    default:
      return 'Biometric';
  }
};

export const SecurityMethodsModal = ({
  open,
  onOpenChange,
  onSelectPasskey,
  onSelectAuthenticator,
}: SecurityMethodsModalProps) => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isCheckingPasskey, setIsCheckingPasskey] = useState(false);

  useEffect(() => {
    if (open) {
      setCapabilities(detectDeviceCapabilities());
    }
  }, [open]);

  const handlePasskeySelect = async () => {
    if (!capabilities?.webauthnSupported) {
      return;
    }
    
    setIsCheckingPasskey(true);
    
    // Small delay to show loading state
    await new Promise(r => setTimeout(r, 300));
    
    setIsCheckingPasskey(false);
    onOpenChange(false);
    onSelectPasskey();
  };

  const handleAuthenticatorSelect = () => {
    onOpenChange(false);
    onSelectAuthenticator();
  };

  if (!capabilities) return null;

  const biometricName = getBiometricName(capabilities.osName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Choose Security Method
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to protect your account
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {/* Passkey Option */}
          <motion.button
            type="button"
            onClick={handlePasskeySelect}
            disabled={!capabilities.webauthnSupported || isCheckingPasskey}
            className={cn(
              "w-full p-4 rounded-2xl border text-left transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              capabilities.webauthnSupported 
                ? "border-border/50 bg-card" 
                : "border-destructive/20 bg-destructive/5 opacity-60 cursor-not-allowed"
            )}
            whileHover={capabilities.webauthnSupported ? { scale: 1.01 } : {}}
            whileTap={capabilities.webauthnSupported ? { scale: 0.99 } : {}}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                capabilities.webauthnSupported 
                  ? "bg-gradient-to-br from-primary/20 to-primary/5" 
                  : "bg-muted"
              )}>
                {isCheckingPasskey ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Fingerprint className={cn(
                    "w-6 h-6",
                    capabilities.webauthnSupported ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Passkey</h3>
                  {capabilities.biometricAvailable && (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {capabilities.biometricAvailable 
                    ? `Use ${biometricName} for instant, secure login`
                    : "Use a hardware security key or device biometrics"
                  }
                </p>
                
                {!capabilities.webauthnSupported && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Not supported on {capabilities.browserName}</span>
                  </div>
                )}
                
                {capabilities.webauthnSupported && (
                  <div className="flex items-center gap-2 mt-2">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Phishing-resistant • No passwords</span>
                  </div>
                )}
              </div>
              
              {capabilities.webauthnSupported && (
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
          </motion.button>

          {/* Authenticator App Option */}
          <motion.button
            type="button"
            onClick={handleAuthenticatorSelect}
            className={cn(
              "w-full p-4 rounded-2xl border text-left transition-all duration-200",
              "border-border/50 bg-card",
              "hover:border-primary/50 hover:bg-primary/5",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
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
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Works on any device • Time-based codes</span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </motion.button>
        </div>

        {/* Info Footer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            You can only have one authenticator method active at a time. 
            Setting up a new one will replace the existing one.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
