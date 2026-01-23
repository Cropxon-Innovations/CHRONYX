import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUserNotFound(false);

    try {
      // First check if the user exists in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      // If no profile found, check if user exists in auth by trying to send reset
      // Supabase won't error if user doesn't exist (security), so we check profiles first
      if (!profile && !profileError) {
        // Try to find by checking if any user has this email (through auth)
        // Since we can't query auth.users directly, we'll just proceed
        // but inform the user to sign up if they're new
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes("User not found") || error.message.includes("user_not_found")) {
          setUserNotFound(true);
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setEmailSent(true);
        toast({
          title: "Reset link sent",
          description: "If an account exists with this email, you'll receive a password reset link.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.main
      className="min-h-screen vyom-gradient-bg flex items-center justify-center px-4 sm:px-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full max-w-sm">
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <motion.div
          className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm"
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
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {emailSent ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Mail className="w-6 h-6 text-primary" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-light tracking-[0.1em] text-foreground mb-2">
              {emailSent ? "Check Your Email" : "Forgot Password"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {emailSent
                ? "We've sent you a password reset link."
                : "Enter your email to receive a password reset link."}
            </p>
          </div>

          {userNotFound ? (
            <div className="space-y-4">
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <strong>No account found with this email.</strong>
                  <br />
                  If you signed up with Google, try signing in with Google instead.
                  Otherwise, create a new account.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-2">
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Sign in with Google
                  </Button>
                </Link>
                <Link to="/login?signup=true">
                  <Button variant="vyom-primary" className="w-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create New Account
                  </Button>
                </Link>
              </div>
              
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  setUserNotFound(false);
                  setEmail("");
                }}
              >
                Try a different email
              </Button>
            </div>
          ) : !emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 bg-background"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                If you signed up with Google and want to add a password, we'll send you a link to set one.
              </p>

              <Button
                type="submit"
                variant="vyom-primary"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Send Reset / Set Password Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try Again
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-[10px] text-muted-foreground">
            Secure password reset by{" "}
            <span className="font-semibold">CHRONYX</span>{" "}
            <span className="opacity-60">by ORIGINX LABS</span>
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
};

export default ForgotPassword;
