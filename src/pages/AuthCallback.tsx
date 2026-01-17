import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

// CHRONYX Logo Component
const ChronxyxLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="callback-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
      </linearGradient>
    </defs>
    <circle 
      cx="50" cy="50" r="45" 
      stroke="url(#callback-logo-gradient)" 
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

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the auth code for a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/login?error=auth_failed");
          return;
        }

        if (data.session) {
          // Successfully authenticated - redirect to dashboard
          setTimeout(() => {
            navigate("/app", { replace: true });
          }, 1500); // Brief delay for smooth UX
        } else {
          // No session found, redirect to login
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth callback exception:", err);
        navigate("/login?error=callback_failed");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <motion.main 
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo */}
        <motion.div
          animate={{ 
            rotate: 360,
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <ChronxyxLogo className="w-20 h-20" />
        </motion.div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <motion.h1 
            className="text-xl font-medium text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Signing you into CHRONYX…
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Just a moment while we set things up
          </motion.p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            />
          ))}
        </div>
      </div>
    </motion.main>
  );
};

export default AuthCallback;
