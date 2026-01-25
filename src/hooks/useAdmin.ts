import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Super Admin email - only this user can revoke admin access
const SUPER_ADMIN_EMAIL = "originxlabs@gmail.com";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIsSuperAdmin = () => {
  const { user } = useAuth();
  return user?.email === SUPER_ADMIN_EMAIL;
};

export const useAdminUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, plan_type, status");

      return profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [],
        subscription: subscriptions?.find(s => s.user_id === profile.id) || null
      })) || [];
    },
    enabled: isAdmin === true,
  });
};

export const useAdminTemplates = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_templates")
        .select("*")
        .order("category")
        .order("title");

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const usePublicTemplates = () => {
  return useQuery({
    queryKey: ["public-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_templates")
        .select("*")
        .eq("is_active", true)
        .not("published_at", "is", null)
        .order("usage_count", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: {
      title: string;
      description?: string;
      category: string;
      template_type: string;
      template_data: Json;
      cover_image_url?: string;
      is_featured?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("admin_templates")
        .insert({
          title: template.title,
          description: template.description,
          category: template.category,
          template_type: template.template_type,
          template_data: template.template_data,
          cover_image_url: template.cover_image_url,
          is_featured: template.is_featured,
          published_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      queryClient.invalidateQueries({ queryKey: ["public-templates"] });
      toast.success("Template created successfully");
    },
    onError: (error) => {
      console.error("Failed to create template:", error);
      toast.error("Failed to create template");
    },
  });
};

export const useSystemNotifications = () => {
  return useQuery({
    queryKey: ["system-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useAdminNotifications = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notification: {
      title: string;
      message: string;
      notification_type?: string;
      target_audience?: string;
      action_url?: string;
      action_label?: string;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("system_notifications")
        .insert({
          title: notification.title,
          message: notification.message,
          notification_type: notification.notification_type || "info",
          target_audience: notification.target_audience || "all",
          action_url: notification.action_url,
          action_label: notification.action_label,
          expires_at: notification.expires_at,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification sent successfully");
    },
    onError: (error) => {
      console.error("Failed to create notification:", error);
      toast.error("Failed to send notification");
    },
  });
};

export const usePlatformAnalytics = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["platform-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_analytics")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const useServiceHealth = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["service-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_health")
        .select("*")
        .order("last_check_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const usePricingConfig = () => {
  return useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdatePricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricing: {
      id?: string;
      plan_name: string;
      display_name: string;
      description?: string;
      monthly_price: number;
      annual_price?: number;
      features?: Json;
    }) => {
      if (pricing.id) {
        const { data, error } = await supabase
          .from("pricing_config")
          .update({
            plan_name: pricing.plan_name,
            display_name: pricing.display_name,
            description: pricing.description,
            monthly_price: pricing.monthly_price,
            annual_price: pricing.annual_price,
            features: pricing.features,
          })
          .eq("id", pricing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("pricing_config")
          .insert({
            plan_name: pricing.plan_name,
            display_name: pricing.display_name,
            description: pricing.description,
            monthly_price: pricing.monthly_price,
            annual_price: pricing.annual_price,
            features: pricing.features,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-config"] });
      toast.success("Pricing updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update pricing:", error);
      toast.error("Failed to update pricing");
    },
  });
};

export const usePaymentRecords = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["admin-payment-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_records")
        .select("id, invoice_number, amount, currency, plan, status, razorpay_order_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const useFeatureUsageStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["feature-usage-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_usage_stats")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

export const useGrantAdminRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({
          user_id: targetUserId,
          role: "admin",
          granted_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin role granted");
    },
    onError: (error) => {
      console.error("Failed to grant admin role:", error);
      toast.error("Failed to grant admin role");
    },
  });
};

export const useRevokeAdminRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", "admin");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin role revoked");
    },
    onError: (error) => {
      console.error("Failed to revoke admin role:", error);
      toast.error("Failed to revoke admin role");
    },
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      // Update profile with suspended status
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: suspend } as Record<string, boolean>)
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(suspend ? "User suspended" : "User unsuspended");
    },
    onError: (error) => {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    },
  });
};

export const useLogAdminActivity = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: {
      action: string;
      target_type?: string;
      target_id?: string;
      metadata?: Json;
    }) => {
      const { error } = await supabase
        .from("admin_activity_logs")
        .insert({
          admin_user_id: user?.id,
          action: activity.action,
          target_type: activity.target_type,
          target_id: activity.target_id,
          metadata: activity.metadata,
        });

      if (error) throw error;
    },
  });
};

export const useActivityLogs = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, user_id, action, module, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });
};

// Get user payments for the payments popup
export const useUserPayments = (userId: string | null) => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["user-payments", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("payment_records")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true && !!userId,
  });
};
