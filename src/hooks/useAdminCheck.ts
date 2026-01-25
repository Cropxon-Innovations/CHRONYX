import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a user has admin role - can be called independently of React hooks
 * Used for login redirect logic
 */
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return !!data;
  } catch (e) {
    console.error("Failed to check admin status:", e);
    return false;
  }
};

// Secure admin route path - not exposed publicly
export const ADMIN_ROUTE = "/chronyx-control-8x9k2m";
