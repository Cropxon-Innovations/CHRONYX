import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

// Canonical domain configuration - use www.getchronyx.com as canonical
const CANONICAL_DOMAIN = "www.getchronyx.com"; // Use www as canonical
const CANONICAL_URL = `https://${CANONICAL_DOMAIN}`;

export const useCanonicalDomain = () => {
  const [isNonCanonical, setIsNonCanonical] = useState(false);
  const [currentDomain, setCurrentDomain] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      setCurrentDomain(hostname);
      
      // Check if on apex when canonical is www
      if (hostname === "getchronyx.com") {
        // On apex domain - redirect to www
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

// Auto-redirect component - silently redirects apex to www
export const DomainAutoRedirect = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      
      // Auto-redirect apex to www
      if (hostname === "getchronyx.com") {
        const path = window.location.pathname + window.location.search + window.location.hash;
        window.location.replace(`https://www.getchronyx.com${path}`);
      }
    }
  }, []);

  return null;
};

export const DomainWarningBanner = () => {
  // Banner is now disabled - we use auto-redirect instead
  // Keep the component for backward compatibility but return null
  return null;
};

export default DomainWarningBanner;
