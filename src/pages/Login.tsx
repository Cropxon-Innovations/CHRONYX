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
import { motion } from "framer-motion";
import { Github, Apple, Lock } from "lucide-react";

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

  if (loading) {
    return (
      <main className="min-h-screen vyom-gradient-bg flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <motion.main 
      className="min-h-screen vyom-gradient-bg flex items-center justify-center px-4 sm:px-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <FloatingParticles />
      
      <div className="w-full max-w-5xl flex items-center justify-center gap-8 relative z-10">
        <LeftSketchAnimation />
        
        <div className="w-full max-w-sm">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 sm:mb-12"
          >
            ← Back
          </Link>

          <motion.div 
            className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm relative"
            animate={{
              boxShadow: [
                "0 0 20px 0px hsl(var(--primary) / 0.05)",
                "0 0 40px 5px hsl(var(--primary) / 0.1)",
                "0 0 20px 0px hsl(var(--primary) / 0.05)",
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

            {/* OAuth Providers */}
            <div className="space-y-2 mb-4">
              {/* Google Sign In - Active */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 sm:h-14 gap-3 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">
                  {isGoogleLoading ? "Connecting to CHRONYX..." : "Continue with Google"}
                </span>
              </Button>

              {/* GitHub - Disabled (Coming Soon) */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 gap-3 border opacity-50 cursor-not-allowed relative"
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
                className="w-full h-12 gap-3 border opacity-50 cursor-not-allowed relative"
                disabled
              >
                <Apple className="w-5 h-5" />
                <span className="font-medium">Continue with Apple</span>
                <span className="absolute right-3 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground mb-4">
              Secure sign-in powered by <span className="font-semibold">CHRONYX</span> <span className="opacity-60">by CROPXON</span>
            </p>

            <div className="relative mb-4 sm:mb-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
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
                    className="h-10 sm:h-11 bg-background"
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
                  className="h-10 sm:h-11 bg-background"
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
                  className="h-10 sm:h-11 bg-background"
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
                variant="vyom-primary"
                className="w-full h-10 sm:h-11 mt-4 sm:mt-6"
                disabled={isLoading || (isSignUp && !acceptTerms)}
              >
                {isLoading ? "Please wait..." : isSignUp ? "Create Account" : "Enter"}
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
                <div className="pt-2 border-t border-border/50">
                  <Link 
                    to="/forgot-password"
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
    </motion.main>
  );
};

export default Login;
