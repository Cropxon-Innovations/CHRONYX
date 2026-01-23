import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { LeftSketchAnimation, RightSketchAnimation, FloatingParticles, GlowingOrbs } from "@/components/auth/LoginAnimations";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Apple, Loader2, Shield, Smartphone, ArrowLeft, Fingerprint } from "lucide-react";
import { DomainAutoRedirect } from "@/components/auth/DomainCanonicalizer";
import { OAuthErrorBanner } from "@/components/auth/OAuthErrorBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { TwoFactorLoginVerification } from "@/components/auth/TwoFactorLoginVerification";
import { WebAuthnRegistration } from "@/components/auth/WebAuthnRegistration";
import { SecurityMethodsModal } from "@/components/auth/SecurityMethodsModal";
import originxOneLogo from "@/assets/originx-one-logo.png";

// CHRONYX Logo - Clean minimal
const ChronxyxLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" className="opacity-60" />
    <circle cx="50" cy="50" r="38" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 3" fill="none" className="opacity-30" />
    <circle cx="50" cy="50" r="4" fill="hsl(var(--primary))" className="opacity-80" />
    {[0, 90, 180, 270].map((angle, i) => (
      <circle 
        key={i}
        cx={50 + 42 * Math.cos((angle - 90) * Math.PI / 180)}
        cy={50 + 42 * Math.sin((angle - 90) * Math.PI / 180)}
        r="2"
        fill="hsl(var(--primary))"
        className="opacity-40"
      />
    ))}
  </svg>
);

// OAuth Provider Button - Minimal with just logo
const OAuthButton = ({ 
  icon, 
  label, 
  onClick, 
  disabled, 
  loading,
  comingSoon 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void; 
  disabled?: boolean;
  loading?: boolean;
  comingSoon?: boolean;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled || comingSoon}
    className={`
      relative flex items-center justify-center w-full h-12 rounded-xl 
      border border-border/50 bg-card/50 backdrop-blur-sm
      transition-all duration-300 group
      ${comingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5'}
    `}
    whileHover={!comingSoon ? { scale: 1.01 } : {}}
    whileTap={!comingSoon ? { scale: 0.99 } : {}}
  >
    {loading ? (
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
    ) : (
      <>
        <span className="transition-transform group-hover:scale-110">{icon}</span>
        <span className="ml-3 text-sm font-medium text-foreground">{label}</span>
      </>
    )}
    {comingSoon && (
      <span className="absolute right-3 text-[9px] text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full">
        Soon
      </span>
    )}
  </motion.button>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // TOTP State
  const [showTotpDialog, setShowTotpDialog] = useState(false);
  const [totpStep, setTotpStep] = useState<"qr" | "verify">("qr");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrUrl, setTotpQrUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isTotpSetup, setIsTotpSetup] = useState(false);
  const [isTotpVerifying, setIsTotpVerifying] = useState(false);

  // 2FA Login Verification State
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [pending2FAUser, setPending2FAUser] = useState<{ id: string; email: string } | null>(null);
  const [pending2FAMethods, setPending2FAMethods] = useState<{ totp: boolean; webauthn: boolean }>({ totp: false, webauthn: false });

  // WebAuthn Registration State
  const [showWebAuthnRegistration, setShowWebAuthnRegistration] = useState(false);

  // Security Methods Modal State
  const [showSecurityMethodsModal, setShowSecurityMethodsModal] = useState(false);

  const from = (location.state as { from?: string })?.from || "/app";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("chronyx_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const check2FAAndProceed = async (userId: string, userEmail: string) => {
    try {
      const { data: twoFAData } = await supabase
        .from("user_2fa")
        .select("totp_enabled, webauthn_enabled")
        .eq("user_id", userId)
        .maybeSingle();

      if (twoFAData && (twoFAData.totp_enabled || twoFAData.webauthn_enabled)) {
        setPending2FAUser({ id: userId, email: userEmail });
        setPending2FAMethods({
          totp: twoFAData.totp_enabled || false,
          webauthn: twoFAData.webauthn_enabled || false,
        });
        setShow2FAVerification(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error checking 2FA status:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms & Conditions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: error.message.includes("already registered") ? "Account exists" : "Sign up failed",
            description: error.message.includes("already registered") ? "Please sign in instead." : error.message,
            variant: "destructive",
          });
        } else {
          if (username) localStorage.setItem("chronyx_pending_username", username);
          toast({ title: "Welcome to CHRONYX", description: "Account created successfully." });
          navigate(from, { replace: true });
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          toast({ title: "Sign in failed", description: "Invalid email or password.", variant: "destructive" });
        } else if (data?.user) {
          const requires2FA = await check2FAAndProceed(data.user.id, data.user.email || email);
          
          if (!requires2FA) {
            if (rememberMe) localStorage.setItem("chronyx_remember_email", email);
            else localStorage.removeItem("chronyx_remember_email");
            navigate(from, { replace: true });
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FAVerification(false);
    if (rememberMe) localStorage.setItem("chronyx_remember_email", email);
    else localStorage.removeItem("chronyx_remember_email");
    toast({ title: "Welcome back!", description: "Two-factor authentication verified." });
    navigate(from, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
        setIsGoogleLoading(false);
        return;
      }
      // After OAuth redirect, the auth callback will handle 2FA check
    } catch (err) {
      setIsGoogleLoading(false);
    }
  };

  // Handle OAuth callback with 2FA check
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if user just logged in via OAuth and needs 2FA
      if (user && !loading) {
        const requires2FA = await check2FAAndProceed(user.id, user.email || "");
        if (!requires2FA) {
          navigate(from, { replace: true });
        }
      }
    };

    // Only run on OAuth redirects (when hash contains access_token)
    if (window.location.hash.includes("access_token")) {
      handleOAuthCallback();
    }
  }, [user, loading]);

  const handleSecurityMethodSelect = (method: "passkey" | "authenticator") => {
    if (!user) {
      toast({
        title: "Sign in first",
        description: "Please sign in to set up security methods.",
        variant: "destructive",
      });
      return;
    }
    
    if (method === "passkey") {
      setShowWebAuthnRegistration(true);
    } else {
      handleTotpSetup();
    }
  };

  const handleTotpSetup = async () => {
    // Setup requires an authenticated session (uses backend functions).
    if (!user) {
      toast({
        title: "Sign in first",
        description: "Please sign in to set up an authenticator for your account.",
        variant: "destructive",
      });
      return;
    }

    setShowTotpDialog(true);
    setTotpStep("qr");
    setIsTotpSetup(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", { body: { action: "setup" } });
      if (error) throw error;
      setTotpSecret(data.secret);
      setTotpQrUrl(data.qrCodeUrl);
    } catch (error) {
      toast({ title: "Setup Failed", description: "Could not generate authenticator setup.", variant: "destructive" });
      setShowTotpDialog(false);
    } finally {
      setIsTotpSetup(false);
    }
  };

  const handleTotpVerify = async () => {
    if (totpCode.length !== 6) return;
    setIsTotpVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "verify", token: totpCode, secret: totpSecret },
      });
      
      if (error || !data?.success) {
        toast({
          title: "Invalid Code",
          description: data?.error || "Please try again.",
          variant: "destructive",
        });
        setTotpCode("");
        return;
      }
      
      toast({ title: "Authenticator Connected", description: "Two-factor authentication enabled." });
      setShowTotpDialog(false);
      setTotpCode("");
    } catch {
      toast({ title: "Verification Failed", variant: "destructive" });
    } finally {
      setIsTotpVerifying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <ChronxyxLogo className="w-14 h-14 animate-pulse" />
          <p className="text-muted-foreground text-sm tracking-wide">Loading...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <>
      <DomainAutoRedirect />
      <main className="min-h-screen bg-background flex relative overflow-hidden">
        <GlowingOrbs />
        <FloatingParticles />
        
        {/* Left Panel - Animated Preview */}
        <div className="hidden lg:flex w-[35%] relative bg-gradient-to-br from-muted/30 to-transparent">
          <LeftSketchAnimation />
        </div>

        {/* Center - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <motion.div 
            className="w-full max-w-[380px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Back Button */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs tracking-wide">Back</span>
            </Link>

            <OAuthErrorBanner />

            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                className="mx-auto mb-5"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <ChronxyxLogo className="w-14 h-14 mx-auto" />
              </motion.div>
              <h1 className="text-2xl font-extralight tracking-[0.25em] text-foreground mb-2">
                CHRONYX
              </h1>
              <p className="text-sm text-muted-foreground font-light">
                {isSignUp ? "Create your space" : "Welcome back"}
              </p>
            </div>

            {/* OAuth Buttons - Logo focused */}
            <div className="space-y-3 mb-6">
              <OAuthButton
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                }
                label="Google"
                onClick={handleGoogleSignIn}
                loading={isGoogleLoading}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <OAuthButton
                  icon={<img src={originxOneLogo} alt="" className="w-5 h-5 object-contain" />}
                  label="OriginX"
                  comingSoon
                />
                <OAuthButton
                  icon={<Github className="w-5 h-5" />}
                  label="GitHub"
                  comingSoon
                />
                <OAuthButton
                  icon={<Apple className="w-5 h-5" />}
                  label="Apple"
                  comingSoon
                />
              </div>
            </div>

            {/* Passkey / 2FA Quick Access */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setShowSecurityMethodsModal(true)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-xs text-primary font-medium"
              >
                <Shield className="w-4 h-4" />
                Security Options
              </button>
            </div>

            <div className="relative mb-6">
              <Separator className="bg-border/40" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground">
                or
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    className="h-11 bg-muted/30 border-border/50 rounded-xl focus:border-primary/50 focus:ring-0"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 bg-muted/30 border-border/50 rounded-xl focus:border-primary/50 focus:ring-0"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Password
                  </Label>
                  {!isSignUp && (
                    <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80">
                      Forgot?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 bg-muted/30 border-border/50 rounded-xl focus:border-primary/50 focus:ring-0"
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="rounded"
                  />
                  <Label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
              )}

              {isSignUp && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    className="mt-0.5 rounded"
                  />
                  <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                    {" "}and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
                  </Label>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20"
                disabled={isLoading || (isSignUp && !acceptTerms)}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-center mt-6 text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Create one"}
              </button>
            </p>

            {/* Footer */}
            <p className="text-center mt-8 text-[10px] text-muted-foreground/50 tracking-wider">
              CHRONYX by ORIGINX LABS
            </p>
          </motion.div>
        </div>

        {/* Right Panel - Animated Preview */}
        <div className="hidden lg:flex w-[35%] relative bg-gradient-to-bl from-muted/30 to-transparent">
          <RightSketchAnimation />
        </div>

        {/* TOTP Setup Dialog */}
        <Dialog open={showTotpDialog} onOpenChange={setShowTotpDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {totpStep === "qr" ? "Setup Authenticator" : "Verify Code"}
              </DialogTitle>
              <DialogDescription>
                {totpStep === "qr" ? "Scan with your authenticator app" : "Enter the 6-digit code"}
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {totpStep === "qr" ? (
                <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {isTotpSetup ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : totpQrUrl ? (
                    <>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-xl shadow-lg">
                          <img src={totpQrUrl} alt="QR Code" className="w-44 h-44" />
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 font-mono text-xs text-center break-all">{totpSecret}</div>
                      <Button onClick={() => setTotpStep("verify")} className="w-full">Continue</Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">Failed to generate QR code.</div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={totpCode} onChange={setTotpCode} disabled={isTotpVerifying}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="w-11 h-13 text-lg" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setTotpStep("qr")} className="flex-1">Back</Button>
                    <Button onClick={handleTotpVerify} disabled={totpCode.length !== 6 || isTotpVerifying} className="flex-1">
                      {isTotpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>

        {/* 2FA Verification */}
        {pending2FAUser && (
          <TwoFactorLoginVerification
            open={show2FAVerification}
            onOpenChange={(open) => { setShow2FAVerification(open); if (!open) setPending2FAUser(null); }}
            onSuccess={handle2FASuccess}
            userId={pending2FAUser.id}
            email={pending2FAUser.email}
            has2FAMethods={pending2FAMethods}
          />
        )}

        {/* WebAuthn Registration */}
        <WebAuthnRegistration
          open={showWebAuthnRegistration}
          onOpenChange={setShowWebAuthnRegistration}
          onSuccess={() => toast({ title: "Passkey registered!", description: "Use it for passwordless login." })}
        />

        {/* Security Methods Modal */}
        <SecurityMethodsModal
          open={showSecurityMethodsModal}
          onOpenChange={setShowSecurityMethodsModal}
          onSelectPasskey={() => handleSecurityMethodSelect("passkey")}
          onSelectAuthenticator={() => handleSecurityMethodSelect("authenticator")}
        />
      </main>
    </>
  );
};

export default Login;
