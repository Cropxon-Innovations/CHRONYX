import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { LeftSketchAnimation, RightSketchAnimation, FloatingParticles } from "@/components/auth/LoginAnimations";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Apple, Lock, Loader2, Shield, Smartphone, ArrowLeft, Key, X } from "lucide-react";
import { DomainAutoRedirect } from "@/components/auth/DomainCanonicalizer";
import { OAuthErrorBanner } from "@/components/auth/OAuthErrorBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import originxOneLogo from "@/assets/originx-one-logo.png";

// CHRONYX Logo Component (same as Landing page)
const ChronxyxLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="login-page-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#login-page-logo-gradient)" 
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
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Get the intended destination from state, or default to /app
  const from = (location.state as { from?: string })?.from || "/app";

  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("chronyx_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the Terms & Conditions to create an account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // Save username preference for profile
          if (username) {
            localStorage.setItem("chronyx_pending_username", username);
          }
          toast({
            title: "Welcome to CHRONYX",
            description: "Your account has been created. A welcome email has been sent!",
          });
          navigate(from, { replace: true });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        } else {
          // Handle remember me
          if (rememberMe) {
            localStorage.setItem("chronyx_remember_email", email);
          } else {
            localStorage.removeItem("chronyx_remember_email");
          }
          navigate(from, { replace: true });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // TOTP Setup Handler
  const handleTotpSetup = async () => {
    setShowTotpDialog(true);
    setTotpStep("qr");
    setIsTotpSetup(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { action: "generate" },
      });
      
      if (error) throw error;
      
      setTotpSecret(data.secret);
      setTotpQrUrl(data.qrCodeUrl);
    } catch (error) {
      console.error("TOTP setup error:", error);
      toast({
        title: "Setup Failed",
        description: "Could not generate authenticator setup. Please try again.",
        variant: "destructive",
      });
      setShowTotpDialog(false);
    } finally {
      setIsTotpSetup(false);
    }
  };

  // TOTP Verification Handler
  const handleTotpVerify = async () => {
    if (totpCode.length !== 6) return;
    
    setIsTotpVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("totp-setup", {
        body: { 
          action: "verify",
          token: totpCode,
          secret: totpSecret,
        },
      });
      
      if (error || !data.valid) {
        toast({
          title: "Invalid Code",
          description: "The code you entered is incorrect. Please try again.",
          variant: "destructive",
        });
        setTotpCode("");
        return;
      }
      
      toast({
        title: "Authenticator Connected",
        description: "Two-factor authentication has been enabled for your account.",
      });
      setShowTotpDialog(false);
      setTotpCode("");
    } catch (error) {
      console.error("TOTP verify error:", error);
      toast({
        title: "Verification Failed",
        description: "Could not verify the code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTotpVerifying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <ChronxyxLogo className="w-16 h-16 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading CHRONYX...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <>
      <DomainAutoRedirect />
      <motion.main 
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 sm:px-6 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/3 to-transparent rounded-full blur-3xl" />
        </div>

        <FloatingParticles />
        
        <div className="w-full max-w-5xl flex items-center justify-center gap-8 relative z-10">
          <LeftSketchAnimation />
          
          <div className="w-full max-w-sm">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 sm:mb-12 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>

            {/* OAuth Error Banner */}
            <OAuthErrorBanner />

            <motion.div 
              className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-primary/5 relative"
              animate={{
                boxShadow: [
                  "0 0 30px 0px hsl(var(--primary) / 0.05)",
                  "0 0 60px 10px hsl(var(--primary) / 0.08)",
                  "0 0 30px 0px hsl(var(--primary) / 0.05)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Header with Landing Page Logo */}
              <div className="text-center mb-6 sm:mb-8">
                <motion.div
                  className="mx-auto mb-3"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ChronxyxLogo className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" />
                </motion.div>
                <h1 className="text-xl sm:text-2xl font-light tracking-[0.2em] text-foreground mb-2 sm:mb-3">
                  CHRONYX
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isSignUp ? "Create your private space." : "This space is private."}
                </p>
              </div>

              {/* OAuth Providers - Premium Styled */}
              <div className="space-y-2.5 mb-5">
                {/* Google Sign In - Active */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 sm:h-14 gap-3 border-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 relative overflow-hidden group rounded-xl"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
                      <span className="font-medium animate-pulse">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="font-medium">Continue with Google</span>
                    </>
                  )}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </Button>

                {/* OriginX One - Premium SSO */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 gap-3 border-2 border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 relative overflow-hidden group rounded-xl"
                  disabled
                >
                  <img 
                    src={originxOneLogo} 
                    alt="OriginX One" 
                    className="w-6 h-6 object-contain" 
                  />
                  <span className="font-medium">Continue with OriginX One</span>
                  <span className="absolute right-3 text-[10px] text-muted-foreground bg-gradient-to-r from-primary/10 to-primary/5 px-2 py-0.5 rounded-full border border-primary/20">
                    Coming Soon
                  </span>
                </Button>

                {/* GitHub - Disabled (Coming Soon) */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-3 border border-border/40 opacity-60 cursor-not-allowed relative rounded-xl"
                  disabled
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Continue with GitHub</span>
                  <span className="absolute right-3 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </Button>

                {/* Apple - Disabled (Coming Soon) */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-3 border border-border/40 opacity-60 cursor-not-allowed relative rounded-xl"
                  disabled
                >
                  <Apple className="w-5 h-5" />
                  <span className="font-medium">Continue with Apple</span>
                  <span className="absolute right-3 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </Button>

                {/* TOTP / Authenticator */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-3 border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 relative rounded-xl group"
                  onClick={handleTotpSetup}
                >
                  <div className="relative">
                    <Smartphone className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <Shield className="w-3 h-3 absolute -bottom-1 -right-1 text-primary" />
                  </div>
                  <span className="font-medium text-primary">Setup Authenticator App</span>
                  <Key className="w-4 h-4 ml-auto text-primary/60" />
                </Button>
              </div>

              <p className="text-center text-[10px] text-muted-foreground mb-4">
                Secure sign-in powered by <span className="font-semibold">CHRONYX</span> <span className="opacity-60">by ORIGINX LABS</span>
              </p>

              <div className="relative mb-4 sm:mb-6">
                <Separator className="bg-border/50" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username field - only show on signup */}
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="h-10 sm:h-11 bg-background/50 rounded-xl border-border/50 focus:border-primary/50"
                      pattern="^[a-zA-Z0-9_]+$"
                      title="Username can only contain letters, numbers, and underscores"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="h-10 sm:h-11 bg-background/50 rounded-xl border-border/50 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    {!isSignUp && (
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
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
                    className="h-10 sm:h-11 bg-background/50 rounded-xl border-border/50 focus:border-primary/50"
                  />
                </div>

                {/* Remember Me - only for login */}
                {!isSignUp && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                )}

                {/* Terms & Conditions - only for signup */}
                {isSignUp && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="acceptTerms"
                      className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 sm:h-12 mt-4 sm:mt-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300"
                  disabled={isLoading || (isSignUp && !acceptTerms)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : isSignUp ? "Create Account" : "Enter"}
                </Button>
              </form>

              {/* Toggle & Forgot Username */}
              <div className="mt-4 sm:mt-6 space-y-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
                </button>
                
                {!isSignUp && (
                  <div className="pt-2 border-t border-border/30">
                    <Link 
                      to="/contact"
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      Forgot your email? Contact support
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
          <RightSketchAnimation />
        </div>

        {/* TOTP Setup Dialog */}
        <Dialog open={showTotpDialog} onOpenChange={setShowTotpDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {totpStep === "qr" ? "Setup Authenticator App" : "Verify Your Code"}
              </DialogTitle>
              <DialogDescription>
                {totpStep === "qr" 
                  ? "Scan this QR code with Google Authenticator, Authy, or any TOTP app"
                  : "Enter the 6-digit code from your authenticator app"
                }
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {totpStep === "qr" ? (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {isTotpSetup ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : totpQrUrl ? (
                    <>
                      <div className="flex justify-center">
                        <div className="p-4 bg-white rounded-xl shadow-lg">
                          <img 
                            src={totpQrUrl} 
                            alt="TOTP QR Code" 
                            className="w-48 h-48"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground text-center">
                          Can't scan? Enter this code manually:
                        </p>
                        <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm text-center break-all select-all">
                          {totpSecret}
                        </div>
                      </div>

                      <Button 
                        onClick={() => setTotpStep("verify")} 
                        className="w-full"
                      >
                        I've Scanned the Code
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Failed to generate QR code. Please try again.
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={6} 
                      value={totpCode} 
                      onChange={setTotpCode}
                      disabled={isTotpVerifying}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot key={index} index={index} className="w-12 h-14 text-lg" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setTotpStep("qr")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleTotpVerify} 
                      disabled={totpCode.length !== 6 || isTotpVerifying}
                      className="flex-1"
                    >
                      {isTotpVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Enable"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </motion.main>
    </>
  );
};

export default Login;
