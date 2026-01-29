import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

// Premium CHRONYX branded error boundary - no Lovable branding anywhere
export class ChronyxErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CHRONYX] Application error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* CHRONYX branded error icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            {/* Error header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground text-sm">
                CHRONYX encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {/* Error details (collapsible) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRefresh} variant="default" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
            </div>

            {/* CHRONYX branding */}
            <div className="pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground tracking-wider">
                CHRONYX BY ORIGINX LABS PVT. LTD.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error fallback for functional components
export function ChronyxErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary?: () => void;
}) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-6 bg-muted/30 rounded-xl">
      <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
      <h3 className="font-medium text-foreground mb-1">Unable to load content</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
        {error?.message || "An unexpected error occurred"}
      </p>
      {resetErrorBoundary && (
        <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
          <RefreshCw className="w-3 h-3 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Simple inline error display for minor errors
export function ChronyxInlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
      <span className="text-destructive">{message}</span>
    </div>
  );
}

// Toast-style error for API errors
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Remove any "Lovable" references
    return error.message.replace(/lovable/gi, "CHRONYX");
  }
  if (typeof error === "string") {
    return error.replace(/lovable/gi, "CHRONYX");
  }
  return "An unexpected error occurred. Please try again.";
}

export default ChronyxErrorBoundary;
