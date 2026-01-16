import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

// Inline SVG Logo Component - No Background
const ChronyxLogoSVG = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer ring */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
    {/* Inner ring with gradient */}
    <defs>
      <linearGradient id="errorRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#64748b' }}/>
        <stop offset="50%" style={{ stopColor: '#94a3b8' }}/>
        <stop offset="100%" style={{ stopColor: '#64748b' }}/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="38" fill="none" stroke="url(#errorRingGradient)" strokeWidth="3"/>
    {/* Center C letter */}
    <text x="50" y="58" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="32" fontWeight="300" fill="currentColor">C</text>
    {/* Decorative dots */}
    <circle cx="50" cy="12" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="88" cy="50" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="50" cy="88" r="3" fill="currentColor" opacity="0.6"/>
    <circle cx="12" cy="50" r="3" fill="currentColor" opacity="0.6"/>
  </svg>
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-slate-500/30 blur-3xl" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-slate-600/30 blur-3xl" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 w-16 h-16 text-foreground"
        >
          <ChronyxLogoSVG className="w-full h-full" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-2xl font-light tracking-[0.3em] text-foreground sm:text-3xl"
        >
          CHRONYX
        </motion.h1>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          className="relative"
        >
          <span className="text-8xl font-light tracking-tight text-foreground/10 sm:text-9xl">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-light tracking-wider text-foreground sm:text-5xl">
              404
            </span>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-2"
        >
          <h2 className="text-xl font-medium text-foreground sm:text-2xl">
            Page Not Found
          </h2>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>

        {/* Path info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-lg bg-muted/50 px-4 py-2 font-mono text-xs text-muted-foreground"
        >
          {location.pathname}
        </motion.p>
      </motion.div>

      {/* Footer branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-6 flex flex-col items-center gap-1 text-center"
      >
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground sm:text-xs">
          CHRONYX BY CROPXON<br />
          INNOVATIONS PVT. LTD.
        </p>
        <a 
          href="https://www.cropxon.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[9px] tracking-[0.1em] text-muted-foreground/60 hover:text-muted-foreground transition-colors sm:text-[10px]"
        >
          www.cropxon.com
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;