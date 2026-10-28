"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { UserProfileData } from "@/components/shell/types";

interface AuthContextType {
  user: UserProfileData | null;
  rawUser: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; requiresConfirmation?: boolean; error?: string }>;
  signInWithOAuth: (provider: "github") => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_DEMO_USER: UserProfileData = {
  id: "u-demo-1",
  email: "developer@example.com",
  displayName: "Dev Lead",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);

  // Map Supabase User to UserProfileData
  const userProfile: UserProfileData | null = useMemo(() => {
    if (!configured) {
      // In unconfigured / mock mode, provide default profile for local demo
      return DEFAULT_DEMO_USER;
    }
    if (!rawUser) return null;

    return {
      id: rawUser.id,
      email: rawUser.email || "developer@example.com",
      displayName:
        rawUser.user_metadata?.full_name ||
        rawUser.user_metadata?.name ||
        rawUser.email?.split("@")[0] ||
        "Developer",
      avatarUrl: rawUser.user_metadata?.avatar_url,
    };
  }, [rawUser, configured]);

  useEffect(() => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setRawUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setRawUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, supabase]);

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      if (!configured) {
        // Fallback demo sign-in
        return { success: true };
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          // Rule: Generic error message to prevent account enumeration
          return { success: false, error: "Invalid email or password." };
        }

        return { success: true };
      } catch {
        return { success: false, error: "Unable to sign in. Please check your connection and try again." };
      }
    },
    [configured, supabase]
  );

  const signUpWithEmail = useCallback(
    async (
      name: string,
      email: string,
      password: string
    ): Promise<{ success: boolean; requiresConfirmation?: boolean; error?: string }> => {
      if (password.length < 10) {
        return { success: false, error: "Password must be at least 10 characters." };
      }

      if (!configured) {
        return { success: true, requiresConfirmation: true };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/app`,
          },
        });

        if (error) {
          // Never reveal if email exists
          return { success: false, error: "Unable to complete registration. Please try again." };
        }

        // If user is returned without active session, confirmation email was sent
        const requiresConfirmation = !data.session;
        return { success: true, requiresConfirmation };
      } catch {
        return { success: false, error: "Unable to register. Please check your connection and try again." };
      }
    },
    [configured, supabase]
  );

  const signInWithOAuth = useCallback(
    async (provider: "github"): Promise<{ success: boolean; error?: string }> => {
      if (!configured) {
        return { success: true };
      }

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/app`,
          },
        });

        if (error) {
          return { success: false, error: "Failed to initiate GitHub authentication." };
        }

        return { success: true };
      } catch {
        return { success: false, error: "Failed to initiate OAuth." };
      }
    },
    [configured, supabase]
  );

  const signOut = useCallback(async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setRawUser(null);
    setSession(null);
  }, [configured, supabase]);

  const sendPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      if (!configured) {
        return { success: true };
      }

      try {
        // Prevent account enumeration: return success regardless of whether email was found
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
        });
        return { success: true };
      } catch {
        return { success: true }; // Always return true to avoid leaking account existence
      }
    },
    [configured, supabase]
  );

  const updateUserPassword = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      if (password.length < 10) {
        return { success: false, error: "Password must be at least 10 characters." };
      }

      if (!configured) {
        return { success: true };
      }

      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          return { success: false, error: error.message || "Failed to update password." };
        }

        return { success: true };
      } catch {
        return { success: false, error: "Failed to update password." };
      }
    },
    [configured, supabase]
  );

  const value = useMemo(
    () => ({
      user: userProfile,
      rawUser,
      session,
      isLoading,
      isConfigured: configured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      sendPasswordReset,
      updateUserPassword,
    }),
    [
      userProfile,
      rawUser,
      session,
      isLoading,
      configured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      sendPasswordReset,
      updateUserPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}

