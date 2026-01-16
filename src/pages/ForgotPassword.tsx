import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Reset link sent",
          description: "Check your email for the password reset link.",
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

          {!emailSent ? (
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

              <Button
                type="submit"
                variant="vyom-primary"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
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
            <span className="opacity-60">by CROPXON</span>
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
};

export default ForgotPassword;
