import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAdmin";

// Real infrastructure counts
const EDGE_FUNCTIONS_COUNT = 47;
const STORAGE_BUCKETS_COUNT = 11;
const DATABASE_TABLES_COUNT = 179;

export const useInfrastructureStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["infrastructure-stats"],
    queryFn: async () => {
      // Get real user count from profiles
      const { count: userCount, error: userError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (userError) {
        console.error("Error fetching user count:", userError);
      }

      // Get today's new users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      return {
        edgeFunctions: EDGE_FUNCTIONS_COUNT,
        storageBuckets: STORAGE_BUCKETS_COUNT,
        databaseTables: DATABASE_TABLES_COUNT,
        totalUsers: userCount || 0,
        todayNewUsers: todayUsers || 0,
      };
    },
    enabled: isAdmin === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useUserDetails = (userId: string | null) => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["user-details", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // Get subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Get payment records
      const { data: payments } = await supabase
        .from("payment_records")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      // Get activity logs for this user
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      // Get login history
      const { data: loginHistory } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", userId)
        .order("login_at", { ascending: false })
        .limit(10);

      return {
        profile,
        subscription,
        payments: payments || [],
        roles: roles?.map((r) => r.role) || [],
        activities: activities || [],
        loginHistory: loginHistory || [],
      };
    },
    enabled: isAdmin === true && !!userId,
  });
};

export const useNewUserNotifications = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["new-user-notifications"],
    queryFn: async () => {
      // Get users registered in the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .gte("created_at", yesterday.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching new users:", error);
        return [];
      }

      return data || [];
    },
    enabled: isAdmin === true,
    refetchInterval: 60000, // Check every minute
  });
};

export const useAllStorageBuckets = () => {
  // These are the actual bucket names from the project
  return [
    { name: "syllabus", isPublic: false },
    { name: "insurance-documents", isPublic: false },
    { name: "loan-documents", isPublic: true },
    { name: "memories", isPublic: false },
    { name: "documents", isPublic: false },
    { name: "vyom", isPublic: true },
    { name: "chronyx", isPublic: true },
    { name: "book-assets", isPublic: true },
    { name: "library", isPublic: true },
    { name: "family-documents", isPublic: false },
    { name: "avatars", isPublic: true },
  ];
};

export const useAllEdgeFunctions = () => {
  // Real edge function names from the project
  return [
    "ai-categorize",
    "analyze-note",
    "apply-foreclosure",
    "apply-part-payment",
    "auto-link-insurance-expense",
    "check-social-profiles",
    "chronyx-bot",
    "create-razorpay-order",
    "dictionary",
    "explain-paragraph",
    "generate-emi-schedule",
    "get-google-client-id",
    "gmail-disconnect",
    "gmail-oauth-callback",
    "gmail-sync",
    "mark-emi-paid",
    "parse-syllabus",
    "razorpay-webhook",
    "recalc-loan-summary",
    "send-contact-email",
    "send-email-otp",
    "send-emi-reminders",
    "send-financial-report",
    "send-insurance-reminders",
    "send-invoice-email",
    "send-password-reset",
    "send-payment-receipt",
    "send-sms-otp",
    "send-weekly-task-summary",
    "send-welcome-email",
    "smart-signin",
    "social-publish",
    "social-sync",
    "stock-prices",
    "summarize-chapter",
    "tax-audit",
    "tax-calculate",
    "tax-compare",
    "tax-discover-deductions",
    "tax-discover-income",
    "tax-full-calculation",
    "tax-generate-pdf",
    "tax-recommend",
    "taxyn-chat",
    "totp-setup",
    "verify-razorpay-payment",
    "webauthn-setup",
  ];
};
