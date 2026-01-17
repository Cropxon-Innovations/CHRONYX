import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SidebarQuickAdd } from "./SidebarQuickAdd";
import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChronyxMiniLogo } from "./ChronyxMiniLogo";
import { LiveClock } from "./LiveClock";
import {
  LayoutDashboard,
  CheckSquare,
  GraduationCap,
  Wallet,
  Hourglass,
  Trophy,
  LogOut,
  Settings,
  X,
  Moon,
  Sun,
  Receipt,
  TrendingUp,
  Images,
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Users,
  StickyNote,
  Lock,
  PieChart,
  Heart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Modularized navigation sections - Reordered: Overview → Productivity → Finance → Life → Security
const navSections = [
  {
    title: "Overview",
    items: [
      { path: "/app", label: "Dashboard", icon: LayoutDashboard },
      { path: "/app/search", label: "Search", icon: Search },
    ],
  },
  {
    title: "Productivity",
    items: [
      { path: "/app/todos", label: "Todos", icon: CheckSquare },
      { path: "/app/notes", label: "Notes", icon: StickyNote },
      { path: "/app/study", label: "Study", icon: GraduationCap },
      { path: "/app/achievements", label: "Achievements", icon: Trophy },
    ],
  },
  {
    title: "Finance",
    items: [
      { path: "/app/expenses", label: "Expenses", icon: Receipt },
      { path: "/app/income", label: "Income", icon: TrendingUp },
      { path: "/app/reports", label: "Reports & Budget", icon: PieChart },
      { path: "/app/loans", label: "Loans & EMI", icon: Wallet },
      { path: "/app/insurance", label: "Insurance", icon: Heart },
    ],
  },
  {
    title: "Life",
    items: [
      { path: "/app/memory", label: "Memory", icon: Images },
      { path: "/app/documents", label: "Documents", icon: FileText },
      { path: "/app/social", label: "Social", icon: Users },
      { path: "/app/lifespan", label: "Lifespan", icon: Hourglass },
    ],
  },
  {
    title: "Security",
    items: [
      { path: "/app/vault", label: "Vault", icon: Lock },
    ],
  },
];

interface UserProfile {
  display_name: string | null;
  phone_number: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  secondary_email: string | null;
  secondary_phone: string | null;
  primary_contact: string | null;
  avatar_url: string | null;
}

const AppSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean;
    type: "email" | "phone";
    value: string;
  }>({ open: false, type: "email", value: "" });
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [pendingOtp, setPendingOtp] = useState<{ hash: string; expiresAt: string } | null>(null);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) setIsCollapsed(savedCollapsed === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone_number, email_verified, phone_verified, secondary_email, secondary_phone, primary_contact, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as UserProfile);
    };
    fetchProfile();
  }, [user]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const handleSignOut = async () => await signOut();
  const closeMobile = () => setMobileOpen(false);

  const handleSendOtp = async () => {
    if (!user?.id) {
      toast.error("User not found. Please sign in again.");
      return;
    }
    setOtpSending(true);
    try {
      const endpoint = verifyDialog.type === "email" ? "send-email-otp" : "send-sms-otp";
      const payload = verifyDialog.type === "email" 
        ? { email: verifyDialog.value, userId: user.id, type: "email" }
        : { phone: verifyDialog.value, userId: user.id, type: "phone" };

      const response = await supabase.functions.invoke(endpoint, { body: payload });
      if (response.error) throw response.error;

      if (response.data?.success && response.data?.otpHash) {
        setPendingOtp({
          hash: response.data.otpHash,
          expiresAt: response.data.expiresAt || new Date(Date.now() + 600000).toISOString(),
        });
        toast.success(`OTP sent to your ${verifyDialog.type}!`);
      } else {
        throw new Error(response.data?.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const hashOtp = async (otpValue: string): Promise<string> => {
    if (!user?.id) return "";
    const encoder = new TextEncoder();
    const data = encoder.encode(otpValue + user.id);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    try {
      if (pendingOtp) {
        const inputHash = await hashOtp(otp);
        if (inputHash === pendingOtp.hash) {
          const updateField = verifyDialog.type === "email" ? "email_verified" : "phone_verified";
          const { error } = await supabase.from("profiles").update({ [updateField]: true }).eq("id", user?.id);
          if (!error) {
            setProfile((prev) => prev ? { ...prev, [updateField]: true } : null);
            toast.success(`${verifyDialog.type === "email" ? "Email" : "Phone"} verified!`);
            setVerifyDialog({ open: false, type: "email", value: "" });
            setOtp("");
            setPendingOtp(null);
          }
        } else {
          toast.error("Invalid OTP. Please try again.");
        }
      } else {
        toast.error("Please request an OTP first.");
      }
    } catch {
      toast.error("Verification failed.");
    }
    setIsVerifying(false);
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <TooltipProvider delayDuration={0}>
      <>
        {/* Header */}
        <div className={cn("border-b border-sidebar-border", collapsed ? "p-2" : "p-4")}>
          <div className="flex items-center justify-between mb-3">
            <Link to="/app" className="flex items-center gap-2 group" onClick={closeMobile}>
              <ChronyxMiniLogo size={collapsed ? "sm" : "md"} />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-lg font-light tracking-[0.2em] text-primary group-hover:text-primary/80 transition-colors">
                    CHRONYX
                  </span>
                  <span className="text-[8px] tracking-[0.1em] text-muted-foreground -mt-0.5">
                    BY CROPXON
                  </span>
                </div>
              )}
            </Link>
            <div className="flex items-center gap-1">
              <SyncStatusIndicator />
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md transition-colors"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* User Info */}
          {!collapsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-sidebar-border">
                  {profile?.avatar_url?.startsWith("emoji:") ? (
                    <AvatarFallback className="text-lg bg-sidebar-accent">{profile.avatar_url.replace("emoji:", "")}</AvatarFallback>
                  ) : profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground"><User className="w-5 h-5" /></AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  {profile?.display_name && <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.display_name}</p>}
                  <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-sidebar-foreground/70">
                  <Mail className="w-3 h-3" />
                  {profile?.email_verified ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <button onClick={() => setVerifyDialog({ open: true, type: "email", value: user?.email || "" })} className="hover:text-amber-400">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    </button>
                  )}
                </div>
                {profile?.phone_number && (
                  <div className="flex items-center gap-1 text-sidebar-foreground/70">
                    <Phone className="w-3 h-3" />
                    {profile?.phone_verified ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <button onClick={() => setVerifyDialog({ open: true, type: "phone", value: profile.phone_number || "" })} className="hover:text-amber-400">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Live Clock in sidebar for mobile */}
              <div className="lg:hidden">
                <LiveClock compact />
              </div>
            </div>
          )}

          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="w-8 h-8 border border-sidebar-border">
                    {profile?.avatar_url?.startsWith("emoji:") ? (
                      <AvatarFallback className="text-sm bg-sidebar-accent">{profile.avatar_url.replace("emoji:", "")}</AvatarFallback>
                    ) : profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground"><User className="w-4 h-4" /></AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{profile?.display_name || user?.email}</p></TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Quick Add */}
        <div className={cn("border-b border-sidebar-border", collapsed ? "p-2" : "px-4 py-2")}>
          <SidebarQuickAdd collapsed={collapsed} onClose={closeMobile} />
        </div>

        {/* Navigation Sections */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={cn(sectionIndex > 0 && "mt-4")}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path || (path === "/app" && location.pathname === "/app/dashboard");
                  
                  if (collapsed) {
                    return (
                      <Tooltip key={path}>
                        <TooltipTrigger asChild>
                          <Link
                            to={path}
                            onClick={closeMobile}
                            className={cn(
                              "flex items-center justify-center p-2.5 rounded-md transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{label}</p></TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={closeMobile}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - Removed: Profile, Settings, Theme, Sign Out - now in TopHeader */}
      </>
    </TooltipProvider>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-background/80 backdrop-blur border border-border shadow-sm"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeMobile} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex-col z-30 transition-all duration-300",
          isCollapsed ? "w-14" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </aside>

      {/* OTP Verification Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open) => setVerifyDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify {verifyDialog.type === "email" ? "Email" : "Phone"}</DialogTitle>
            <DialogDescription>
              We'll send a verification code to {verifyDialog.value}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!pendingOtp ? (
              <Button onClick={handleSendOtp} disabled={otpSending} className="w-full">
                {otpSending ? "Sending..." : "Send Verification Code"}
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <Button onClick={handleVerifyOTP} disabled={isVerifying || otp.length < 4} className="w-full">
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog({ open: false, type: "email", value: "" })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppSidebar;
