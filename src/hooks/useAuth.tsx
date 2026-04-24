import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; emailConfirmationSent?: boolean }>;
  resendSignUpConfirmation: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getEmailRedirectUrl = () => {
    const configuredRedirectUrl = import.meta.env.VITE_AUTH_EMAIL_REDIRECT_URL as string | undefined;

    if (configuredRedirectUrl?.trim()) {
      return configuredRedirectUrl.trim();
    }

    return `${window.location.origin}/`;
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      console.warn(
        'Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (!hasSupabaseConfig) {
        return { error: 'Supabase is not configured. Please set the environment variables and redeploy.' };
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let friendlyMessage = 'Login failed. Please try again.';
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Please check your email and confirm your account before signing in.';
        }
        return { error: friendlyMessage };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      if (!hasSupabaseConfig) {
        return { error: 'Supabase is not configured. Please set the environment variables and redeploy.' };
      }
      const redirectUrl = getEmailRedirectUrl();
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: displayName ? { display_name: displayName } : undefined,
        }
      });

      if (error) {
        console.error('Supabase sign up error:', error);
        let friendlyMessage = 'Sign up failed. Please try again.';
        if (error.message.includes('User already registered')) {
          friendlyMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Password should be at least')) {
          friendlyMessage = 'Password should be at least 6 characters long.';
        } else if (error.message.toLowerCase().includes('redirect')) {
          friendlyMessage = 'The confirmation link redirect URL is not allowed in Supabase. Check your auth URL settings.';
        }
        return { error: friendlyMessage };
      }

      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });

      return { error: null, emailConfirmationSent: true };
    } catch (error) {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const resendSignUpConfirmation = async (email: string) => {
    try {
      if (!hasSupabaseConfig) {
        return { error: 'Supabase is not configured. Please set the environment variables and redeploy.' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getEmailRedirectUrl(),
        },
      });

      if (error) {
        console.error('Supabase confirmation resend error:', error);
        return { error: 'Could not resend the confirmation email. Please wait a moment and try again.' };
      }

      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox and spam folder.",
      });

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      if (!hasSupabaseConfig) {
        return;
      }
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    resendSignUpConfirmation,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
