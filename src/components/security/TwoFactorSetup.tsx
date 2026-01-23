import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Check, 
  Copy, 
  Download, 
  QrCode, 
  Fingerprint, 
  AlertTriangle,
  Loader2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TwoFactorStatus {
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

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

export const TwoFactorSetup = ({ onStatusChange }: TwoFactorSetupProps) => {
  const { user, session } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("totp");
  
  // TOTP state
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrCodeUrl: string;
    otpauthUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  // WebAuthn state
  const [isRegisteringWebAuthn, setIsRegisteringWebAuthn] = useState(false);
  const [webauthnDeviceName, setWebauthnDeviceName] = useState("");
  const [showWebAuthnDialog, setShowWebAuthnDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStatus();
    }
  }, [user]);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "status" },
      });

      if (error) throw error;
      setStatus(data);
      onStatusChange?.(data.totpEnabled || data.webauthnEnabled);
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const startTotpSetup = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "setup" },
      });

      if (error) throw error;
      
      setTotpSetup({
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
        otpauthUrl: data.otpauthUrl,
      });
    } catch (error) {
      console.error("Error starting TOTP setup:", error);
      toast.error("Failed to start authenticator setup");
    } finally {
      setIsSettingUp(false);
    }
  };

  const verifyTotp = async () => {
    if (verificationCode.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "verify", token: verificationCode },
      });

      if (error) throw error;

      if (data.success) {
        setBackupCodes(data.backupCodes);
        setShowBackupDialog(true);
        setTotpSetup(null);
        setVerificationCode("");
        await fetchStatus();
        toast.success("Authenticator app enabled successfully!");
      }
    } catch (error: any) {
      console.error("Error verifying TOTP:", error);
      toast.error(error.message || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const disableTotp = async () => {
    if (disableCode.length !== 6) return;
    
    setIsDisabling(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "disable", token: disableCode },
      });

      if (error) throw error;

      if (data.success) {
        setShowDisableDialog(false);
        setDisableCode("");
        await fetchStatus();
        toast.success("Authenticator app disabled");
      }
    } catch (error: any) {
      console.error("Error disabling TOTP:", error);
      toast.error(error.message || "Failed to disable authenticator");
    } finally {
      setIsDisabling(false);
    }
  };

  const startWebAuthnRegistration = async () => {
    setIsRegisteringWebAuthn(true);
    try {
      // Get registration options from server
      const { data, error } = await supabase.functions.invoke("webauthn-setup", {
        body: { action: "register-options", authenticatorType: "platform" },
      });

      if (error) throw error;

      const options = data.options;

      // Convert challenge from base64
      options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      options.user.id = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: options,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Send to server for verification
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("webauthn-setup", {
        body: {
          action: "register-verify",
          deviceName: webauthnDeviceName || "Device",
          credential: {
            id: credential.id,
            publicKey: btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))),
            authenticatorAttachment: (credential as any).authenticatorAttachment,
            transports: response.getTransports?.() || [],
          },
        },
      });

      if (verifyError) throw verifyError;

      setShowWebAuthnDialog(false);
      setWebauthnDeviceName("");
      await fetchStatus();
      toast.success("Security key registered successfully!");
    } catch (error: any) {
      console.error("WebAuthn registration error:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Registration was cancelled or timed out");
      } else if (error.name === "NotSupportedError") {
        toast.error("WebAuthn is not supported on this device");
      } else {
        toast.error(error.message || "Failed to register security key");
      }
    } finally {
      setIsRegisteringWebAuthn(false);
    }
  };

  const deleteWebAuthnCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase.functions.invoke("webauthn-setup", {
        body: { action: "delete-credential", credentialId },
      });

      if (error) throw error;
      
      await fetchStatus();
      toast.success("Security key removed");
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast.error("Failed to remove security key");
    }
  };

  const copySecret = () => {
    if (totpSetup?.secret) {
      navigator.clipboard.writeText(totpSetup.secret);
      toast.success("Secret copied to clipboard");
    }
  };

  const downloadBackupCodes = () => {
    const content = `CHRONYX Backup Codes
Generated: ${new Date().toLocaleString()}
Account: ${user?.email}

Keep these codes safe. Each code can only be used once.

${backupCodes.join("\n")}

If you lose access to your authenticator app, use one of these codes to sign in.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chronyx-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const is2FAEnabled = status?.totpEnabled || status?.webauthnEnabled;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              is2FAEnabled 
                ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20" 
                : "bg-muted"
            )}>
              <Shield className={cn(
                "w-5 h-5",
                is2FAEnabled ? "text-emerald-500" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </div>
          </div>
          {is2FAEnabled && (
            <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Enabled
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="totp" className="gap-2 data-[state=active]:bg-background">
              <Smartphone className="w-4 h-4" />
              Authenticator App
            </TabsTrigger>
            <TabsTrigger value="webauthn" className="gap-2 data-[state=active]:bg-background">
              <Fingerprint className="w-4 h-4" />
              Security Key
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="mt-4 space-y-4">
            {status?.totpEnabled ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Authenticator app is active</p>
                    <p className="text-xs text-muted-foreground">
                      {status.backupCodesRemaining} backup codes remaining
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    Disable
                  </Button>
                </div>
              </div>
            ) : totpSetup ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-muted/30 border border-border/50">
                  <div className="relative">
                    <img 
                      src={totpSetup.qrCodeUrl} 
                      alt="QR Code" 
                      className="w-48 h-48 rounded-lg border-4 border-background shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground max-w-xs">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Or enter this code manually:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-muted/50 font-mono text-xs break-all">
                      {totpSetup.secret}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Enter the 6-digit code from your app</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setTotpSetup(null);
                      setVerificationCode("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={verifyTotp}
                    disabled={verificationCode.length !== 6 || isVerifying}
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Verify & Enable
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Authenticator App</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use apps like Google Authenticator, Authy, or 1Password to generate secure codes.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={startTotpSetup} 
                  disabled={isSettingUp}
                  className="w-full"
                >
                  {isSettingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  Set Up Authenticator App
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="webauthn" className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Security Keys & Passkeys</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use hardware security keys (YubiKey) or device biometrics (Face ID, Touch ID, Windows Hello).
                  </p>
                </div>
              </div>
            </div>

            {status?.webauthnCredentials && status.webauthnCredentials.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Registered devices</Label>
                {status.webauthnCredentials.map((cred) => (
                  <div 
                    key={cred.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{cred.device_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(cred.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebAuthnCredential(cred.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={() => setShowWebAuthnDialog(true)}
              className="w-full"
              variant={status?.webauthnEnabled ? "outline" : "default"}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {status?.webauthnEnabled ? "Add Another Device" : "Set Up Security Key"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Save Your Backup Codes
              </DialogTitle>
              <DialogDescription>
                These codes can be used to access your account if you lose your authenticator app. Each code can only be used once.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-muted/50 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i} className="p-2 rounded bg-background text-center">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-600">
                Store these codes in a safe place. You won't be able to see them again!
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={downloadBackupCodes}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowBackupDialog(false)}>
                I've Saved These Codes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable TOTP Dialog */}
        <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Disable Authenticator App</DialogTitle>
              <DialogDescription>
                Enter a code from your authenticator app to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={6}
                value={disableCode}
                onChange={setDisableCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={disableTotp}
                disabled={disableCode.length !== 6 || isDisabling}
              >
                {isDisabling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* WebAuthn Registration Dialog */}
        <Dialog open={showWebAuthnDialog} onOpenChange={setShowWebAuthnDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Register Security Key</DialogTitle>
              <DialogDescription>
                Give your device a name to help you identify it later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Device Name</Label>
                <Input
                  placeholder="e.g., MacBook Pro, iPhone"
                  value={webauthnDeviceName}
                  onChange={(e) => setWebauthnDeviceName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWebAuthnDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={startWebAuthnRegistration}
                disabled={isRegisteringWebAuthn}
              >
                {isRegisteringWebAuthn ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Fingerprint className="w-4 h-4 mr-2" />
                )}
                Register
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
