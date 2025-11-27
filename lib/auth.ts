// Client-side authentication utilities using MongoDB
import { Role } from "./rbac";
import { signUp as serverSignUp, signIn as serverSignIn, getUserById } from "./server-actions/auth";

export interface User {
  email: string;
  id: string; // MongoDB ObjectId as string
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
}

const SESSION_KEY = "madeenajuba_session";

// Get current session from localStorage
export const getSession = async (): Promise<User | null> => {
  if (typeof window === "undefined") return null;
  
  const sessionJson = localStorage.getItem(SESSION_KEY);
  if (!sessionJson) return null;
  
  try {
    const session = JSON.parse(sessionJson);
    if (!session.userId) return null;
    
    // Fetch user from MongoDB using server action
    const result = await getUserById(session.userId);
    if (result.success && result.user) {
      return result.user as User;
    }
    
    // If user not found, clear session
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch (error) {
    console.error("Error getting session:", error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

// Get current session synchronously (for initial render)
// This returns cached data from localStorage
export const getSessionSync = (): { userId: string } | null => {
  if (typeof window === "undefined") return null;
  const sessionJson = localStorage.getItem(SESSION_KEY);
  if (!sessionJson) return null;
  
  try {
    return JSON.parse(sessionJson);
  } catch {
    return null;
  }
};

// Sign up a new user (uses MongoDB)
export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  if (typeof window === "undefined") {
    return { success: false, message: "Client-side only function" };
  }

  // Call server action
  const result = await serverSignUp(email, password);
  
  if (result.success && result.user) {
    // Store session in localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: result.user.id }));
    return { success: true, user: result.user as User };
  }
  
  return { success: false, message: result.message };
};

// Sign in an existing user (uses MongoDB)
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  if (typeof window === "undefined") {
    return { success: false, message: "Client-side only function" };
  }

  // Call server action
  const result = await serverSignIn(email, password);
  
  if (result.success && result.user) {
    // Store session in localStorage
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: result.user.id }));
    return { success: true, user: result.user as User };
  }
  
  return { success: false, message: result.message };
};

// Sign out the current user
export const signOut = (): AuthResponse => {
  if (typeof window === "undefined") {
    return { success: false, message: "Client-side only function" };
  }

  localStorage.removeItem(SESSION_KEY);
  return { success: true };
};

// Check if user is authenticated (async version)
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getSession();
  return session !== null;
};

// Check if user is authenticated (sync version - checks localStorage only)
export const isAuthenticatedSync = (): boolean => {
  return getSessionSync() !== null;
};

// Note: Deprecated functions have been removed.
// Please use server actions from lib/server-actions/admin.ts instead:
// - updateUserRole() → use updateUserRole() from @/lib/server-actions/admin
// - getAllUsers() → use getUsers() from @/lib/server-actions/admin
// - promoteToAdmin() → use updateUserRole() from @/lib/server-actions/admin
