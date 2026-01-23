import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Lock,
  Fingerprint,
  Smartphone,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Monitor,
  Clock,
  MapPin,
  Laptop,
  Tablet,
  LogOut,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { Link } from "react-router-dom";

interface LoginHistoryItem {
  id: string;
  timestamp: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  success: boolean;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityStatus {
  totpEnabled: boolean;
  webauthnEnabled: boolean;
  emailVerified: boolean;
  passwordStrength: 'weak' | 'medium' | 'strong';
  lastPasswordChange: string | null;
}

const SecurityDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    totpEnabled: false,
    webauthnEnabled: false,
    emailVerified: false,
    passwordStrength: 'medium',
    lastPasswordChange: null,
  });
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    if (user) {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      // Fetch 2FA status
      const { data: twoFAData } = await supabase.functions.invoke("totp-setup", {
        body: { action: "status" },
      });

      // Fetch profile for email verification status
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("id", user?.id)
        .single();

      const status: SecurityStatus = {
        totpEnabled: twoFAData?.totpEnabled || false,
        webauthnEnabled: twoFAData?.webauthnEnabled || false,
        emailVerified: profile?.email_verified || user?.email_confirmed_at !== null,
        passwordStrength: 'strong', // Assume strong for now
        lastPasswordChange: null,
      };

      setSecurityStatus(status);

      // Calculate security score
      let score = 20; // Base score for having an account
      if (status.emailVerified) score += 20;
      if (status.totpEnabled) score += 30;
      if (status.webauthnEnabled) score += 20;
      if (status.passwordStrength === 'strong') score += 10;
      setSecurityScore(Math.min(score, 100));

      // Mock login history (would come from database in production)
      const mockHistory: LoginHistoryItem[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          device: 'MacBook Pro',
          browser: 'Chrome',
          location: 'Mumbai, India',
          ip: '192.168.1.***',
          success: true,
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          device: 'iPhone 15',
          browser: 'Safari',
          location: 'Mumbai, India',
          ip: '192.168.1.***',
          success: true,
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          device: 'Windows PC',
          browser: 'Edge',
          location: 'Delhi, India',
          ip: '103.45.***',
          success: false,
        },
      ];
      setLoginHistory(mockHistory);

      // Current session
      const mockSessions: ActiveSession[] = [
        {
          id: '1',
          device: navigator.platform || 'Unknown Device',
          browser: getBrowserName(),
          location: 'Current Location',
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
      ];
      setActiveSessions(mockSessions);

    } catch (error) {
      console.error("Error fetching security data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <Smartphone className="w-4 h-4" />;
    }
    if (device.toLowerCase().includes('ipad') || device.toLowerCase().includes('tablet')) {
      return <Tablet className="w-4 h-4" />;
    }
    return <Laptop className="w-4 h-4" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const staggerDelay = 0.1;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-light flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor and manage your account security
          </p>
        </div>
        <Link to="/app/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Security Settings
          </Button>
        </Link>
      </motion.div>

      {/* Security Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: staggerDelay, duration: 0.5 }}
      >
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              {/* Score Circle */}
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    className={getScoreColor(securityScore)}
                    strokeDasharray={`${securityScore * 3.52} 352`}
                    initial={{ strokeDasharray: "0 352" }}
                    animate={{ strokeDasharray: `${securityScore * 3.52} 352` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <motion.span 
                    className={cn("text-3xl font-bold", getScoreColor(securityScore))}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    {securityScore}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">out of 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1">
                <h3 className="text-xl font-medium mb-1">
                  Security Score: <span className={getScoreColor(securityScore)}>{getScoreLabel(securityScore)}</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {securityScore < 80 
                    ? "Enable more security features to improve your score"
                    : "Your account is well protected"}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Email Verified", enabled: securityStatus.emailVerified, icon: CheckCircle2 },
                    { label: "Authenticator App", enabled: securityStatus.totpEnabled, icon: Smartphone },
                    { label: "Passkey/Biometric", enabled: securityStatus.webauthnEnabled, icon: Fingerprint },
                    { label: "Strong Password", enabled: securityStatus.passwordStrength === 'strong', icon: Key },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        item.enabled ? "bg-emerald-500/10" : "bg-muted/30"
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1, duration: 0.3 }}
                    >
                      <item.icon className={cn(
                        "w-4 h-4",
                        item.enabled ? "text-emerald-500" : "text-muted-foreground"
                      )} />
                      <span className={item.enabled ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                      {item.enabled ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
                      ) : (
                        <XCircle className="w-3 h-3 text-muted-foreground ml-auto" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Two-Factor Setup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: staggerDelay * 2, duration: 0.5 }}
        >
          <TwoFactorSetup onStatusChange={() => fetchSecurityData()} />
        </motion.div>

        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: staggerDelay * 3, duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Active Sessions
              </CardTitle>
              <CardDescription>Devices currently logged into your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    session.isCurrent ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      session.isCurrent ? "bg-primary/10" : "bg-muted"
                    )}>
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                            This device
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.browser} • {session.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
                    </p>
                    {!session.isCurrent && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 px-2">
                        <LogOut className="w-3 h-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Login History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: staggerDelay * 4, duration: 0.5 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Login Activity
                </CardTitle>
                <CardDescription>Your recent sign-in attempts</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchSecurityData}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {loginHistory.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      item.success ? "bg-muted/30" : "bg-destructive/5 border border-destructive/20"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.success ? "bg-emerald-500/10" : "bg-destructive/10"
                      )}>
                        {item.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.success ? "Successful login" : "Failed login attempt"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {getDeviceIcon(item.device)}
                          <span>{item.device}</span>
                          <span>•</span>
                          <span>{item.browser}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Recommendations */}
      {securityScore < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: staggerDelay * 5, duration: 0.5 }}
        >
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!securityStatus.totpEnabled && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">Enable Authenticator App</p>
                        <p className="text-xs text-muted-foreground">Adds +30 points to your security score</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-3 h-3" />
                      Setup
                    </Button>
                  </div>
                )}
                {!securityStatus.webauthnEnabled && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">Add Passkey/Biometric</p>
                        <p className="text-xs text-muted-foreground">Adds +20 points to your security score</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-3 h-3" />
                      Setup
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityDashboard;