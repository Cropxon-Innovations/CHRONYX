import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin, ADMIN_ROUTE } from "@/hooks/useAdminCheck";
import { trackLogin } from "@/hooks/useLoginTracking";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const loginTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check admin status when session changes
        if (session?.user) {
          setTimeout(() => {
            checkIsAdmin(session.user.id).then(setIsAdmin);
          }, 0);
          
          // Track login on SIGNED_IN event (avoid duplicate tracking)
          if (event === 'SIGNED_IN' && loginTrackedRef.current !== session.user.id) {
            loginTrackedRef.current = session.user.id;
            // Determine login method
            const provider = session.user.app_metadata?.provider || 'password';
            trackLogin(session.user, provider, 'success');
          }
        } else {
          setIsAdmin(false);
          loginTrackedRef.current = null;
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check admin status for existing session
      if (session?.user) {
        checkIsAdmin(session.user.id).then(setIsAdmin);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // The redirectTo URL is where Supabase redirects AFTER processing the OAuth callback.
  // Google Cloud Console should have the Supabase callback URL:
  // https://ewevnteuyfpinnlhvoty.supabase.co/auth/v1/callback
  // 
  // Flow: App → Google → Supabase callback → App's redirectTo URL
  const getRedirectUrl = () => `${window.location.origin}/auth/callback`;

  const signUp = async (email: string, password: string) => {
    const redirectUrl = getRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    // Send welcome email if signup was successful
    if (!error && data?.user) {
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email, name: email.split('@')[0] }
        });
      } catch (e) {
        console.error('Failed to send welcome email:', e);
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = getRedirectUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
