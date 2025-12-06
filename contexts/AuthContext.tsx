"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, getSession, signIn, signUp, signOut as authSignOut } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const loadSession = async () => {
      try {
        const session = await getSession();
        setUser(session);
      } catch (error) {
        console.error("Error loading session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const result = await signIn(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    }
    return { success: result.success, message: result.message };
  };

  const handleSignUp = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const result = await signUp(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      router.push("/dashboard");
    }
    return { success: result.success, message: result.message };
  };

  const handleSignOut = () => {
    authSignOut();
    setUser(null);
    toast.success("Signed out successfully!");
    // Navigate to home page after sign out
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        isAuthenticated: !!user,
      }}
    >
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

