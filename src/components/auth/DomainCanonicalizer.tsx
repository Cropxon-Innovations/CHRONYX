import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

// Canonical domain configuration - change this to switch between www and apex
const CANONICAL_DOMAIN = "getchronyx.com"; // Use apex (no www) as canonical
const CANONICAL_URL = `https://${CANONICAL_DOMAIN}`;

export const useCanonicalDomain = () => {
  const [isNonCanonical, setIsNonCanonical] = useState(false);
  const [currentDomain, setCurrentDomain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      setCurrentDomain(hostname);
      
      // Check if on www when canonical is apex, or vice versa
      if (hostname === `www.${CANONICAL_DOMAIN}`) {
        setIsNonCanonical(true);
      } else if (hostname !== CANONICAL_DOMAIN && 
                 hostname !== "localhost" && 
                 !hostname.includes("lovable")) {
        // On some other non-canonical domain
        setIsNonCanonical(true);
      }
    }
  }, []);

  const redirectToCanonical = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname + window.location.search + window.location.hash;
      window.location.href = `${CANONICAL_URL}${path}`;
    }
  };

  return { isNonCanonical, currentDomain, redirectToCanonical, CANONICAL_DOMAIN, CANONICAL_URL };
};

export const DomainWarningBanner = () => {
  const { isNonCanonical, currentDomain, redirectToCanonical, CANONICAL_DOMAIN } = useCanonicalDomain();
  const [dismissed, setDismissed] = useState(false);

  if (!isNonCanonical || dismissed) return null;

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm">
          You're on <strong>{currentDomain}</strong>. For the best experience and proper authentication, use{" "}
          <strong>{CANONICAL_DOMAIN}</strong>.
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="h-7 text-xs border-amber-500/50 hover:bg-amber-500/20"
            onClick={redirectToCanonical}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Go to {CANONICAL_DOMAIN}
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DomainWarningBanner;
