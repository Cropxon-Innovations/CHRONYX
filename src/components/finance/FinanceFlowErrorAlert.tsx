import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  WifiOff,
  KeyRound,
  ShieldX,
  XCircle,
  Zap,
} from "lucide-react";

export type FinanceFlowErrorCode =
  | "TOKEN_EXPIRED"
  | "RATE_LIMIT_EXCEEDED"
  | "CONNECTION_FAILED"
  | "INVALID_TOKEN"
  | "QUOTA_EXCEEDED"
  | "CONFIG_ERROR"
  | "PERMISSION_DENIED"
  | "UNKNOWN";

interface ErrorConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: {
    label: string;
    variant: "default" | "outline" | "destructive";
  };
  bgClass: string;
  borderClass: string;
}

const errorConfigs: Record<FinanceFlowErrorCode, ErrorConfig> = {
  TOKEN_EXPIRED: {
    icon: <KeyRound className="w-5 h-5 text-amber-500" />,
    title: "Session Expired",
    description: "Your Gmail session has expired. Please reconnect your account to continue syncing.",
    action: { label: "Reconnect Gmail", variant: "default" },
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/20",
  },
  RATE_LIMIT_EXCEEDED: {
    icon: <Clock className="w-5 h-5 text-orange-500" />,
    title: "Rate Limit Reached",
    description: "Gmail API limit reached. Please wait a few minutes before trying again.",
    action: { label: "Retry in 5 min", variant: "outline" },
    bgClass: "bg-orange-500/5",
    borderClass: "border-orange-500/20",
  },
  CONNECTION_FAILED: {
    icon: <WifiOff className="w-5 h-5 text-red-500" />,
    title: "Connection Failed",
    description: "Unable to connect to Gmail. Please check your internet connection and try again.",
    action: { label: "Retry", variant: "outline" },
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/20",
  },
  INVALID_TOKEN: {
    icon: <ShieldX className="w-5 h-5 text-destructive" />,
    title: "Invalid Authorization",
    description: "Gmail authorization is invalid or has been revoked. Please reconnect your account.",
    action: { label: "Reconnect", variant: "default" },
    bgClass: "bg-destructive/5",
    borderClass: "border-destructive/20",
  },
  QUOTA_EXCEEDED: {
    icon: <Zap className="w-5 h-5 text-purple-500" />,
    title: "Daily Limit Reached",
    description: "Daily Gmail sync limit exceeded. Try again tomorrow or upgrade for more syncs.",
    action: { label: "Try Tomorrow", variant: "outline" },
    bgClass: "bg-purple-500/5",
    borderClass: "border-purple-500/20",
  },
  CONFIG_ERROR: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    title: "Configuration Error",
    description: "Google OAuth is not properly configured. Please contact support for assistance.",
    action: { label: "Contact Support", variant: "outline" },
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/20",
  },
  PERMISSION_DENIED: {
    icon: <ShieldX className="w-5 h-5 text-red-500" />,
    title: "Permission Denied",
    description: "Gmail access was denied. Please grant the required permissions to use FinanceFlow.",
    action: { label: "Grant Access", variant: "default" },
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/20",
  },
  UNKNOWN: {
    icon: <XCircle className="w-5 h-5 text-muted-foreground" />,
    title: "Something Went Wrong",
    description: "An unexpected error occurred. Please try again or contact support if the issue persists.",
    action: { label: "Retry", variant: "outline" },
    bgClass: "bg-muted/30",
    borderClass: "border-muted",
  },
};

interface FinanceFlowErrorAlertProps {
  errorCode: FinanceFlowErrorCode;
  onAction: () => void;
  onDismiss?: () => void;
  className?: string;
}

const FinanceFlowErrorAlert = ({
  errorCode,
  onAction,
  onDismiss,
  className = "",
}: FinanceFlowErrorAlertProps) => {
  const config = errorConfigs[errorCode] || errorConfigs.UNKNOWN;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Alert className={`${config.bgClass} ${config.borderClass}`}>
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {config.icon}
        </motion.div>
        <div className="flex-1">
          <AlertTitle className="text-sm font-medium">{config.title}</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            {config.description}
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 text-xs"
            >
              Dismiss
            </Button>
          )}
          <Button
            variant={config.action.variant}
            size="sm"
            onClick={onAction}
            className="h-7 text-xs gap-1"
          >
            {errorCode === "CONNECTION_FAILED" && (
              <RefreshCw className="w-3 h-3" />
            )}
            {config.action.label}
          </Button>
        </div>
      </Alert>
    </motion.div>
  );
};

export default FinanceFlowErrorAlert;

// Helper function to map API errors to error codes
export function parseFinanceFlowError(error: any): FinanceFlowErrorCode {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code?.toLowerCase() || "";
  
  if (message.includes("token expired") || code.includes("token_expired")) {
    return "TOKEN_EXPIRED";
  }
  if (message.includes("rate limit") || code.includes("rate_limit")) {
    return "RATE_LIMIT_EXCEEDED";
  }
  if (message.includes("connection") || message.includes("network") || message.includes("fetch")) {
    return "CONNECTION_FAILED";
  }
  if (message.includes("invalid token") || message.includes("invalid_token")) {
    return "INVALID_TOKEN";
  }
  if (message.includes("quota") || message.includes("limit exceeded")) {
    return "QUOTA_EXCEEDED";
  }
  if (message.includes("configuration") || message.includes("not configured")) {
    return "CONFIG_ERROR";
  }
  if (message.includes("permission") || message.includes("denied") || message.includes("access_denied")) {
    return "PERMISSION_DENIED";
  }
  
  return "UNKNOWN";
}
