"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthUser, DEMO_USERS, UserRole } from "./roles";

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(DEMO_USERS.ORGANIZER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const role = (session.user.user_metadata?.role as UserRole) || "ORGANIZER";
            setUser({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
              role,
              orgId: session.user.user_metadata?.orgId || "org_dynamite",
              assignedGate: session.user.user_metadata?.assignedGate,
            });
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const role = (session.user.user_metadata?.role as UserRole) || "ORGANIZER";
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
                role,
                orgId: session.user.user_metadata?.orgId || "org_dynamite",
                assignedGate: session.user.user_metadata?.assignedGate,
              });
            } else {
              setUser(null);
            }
          });

          setIsLoading(false);
          return () => subscription.unsubscribe();
        }
      }

      // Default demo initial state: Organizer active
      setUser(DEMO_USERS.ORGANIZER);
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const signInWithPassword = async (email: string, pass: string) => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { error: error.message };
        if (data.user) {
          const role = (data.user.user_metadata?.role as UserRole) || "ORGANIZER";
          setUser({
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.user_metadata?.name || data.user.email || "User",
            role,
            orgId: data.user.user_metadata?.orgId || "org_dynamite",
          });
        }
        return {};
      }
    }

    // Fallback simulation by email prefix
    if (email.includes("volunteer")) {
      setUser(DEMO_USERS.VOLUNTEER);
    } else if (email.includes("gate")) {
      setUser(DEMO_USERS.GATE_STAFF);
    } else if (email.includes("attendee") || email.includes("student")) {
      setUser(DEMO_USERS.PARTICIPANT);
    } else {
      setUser(DEMO_USERS.ORGANIZER);
    }
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    }
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    setUser(DEMO_USERS[newRole]);
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      "x-eventos-auth-role": user.role,
      "x-eventos-org-id": user.orgId,
      "x-eventos-user-id": user.id,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "PARTICIPANT",
        isAuthenticated: !!user,
        isLoading,
        signInWithPassword,
        signOut,
        switchRole,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
