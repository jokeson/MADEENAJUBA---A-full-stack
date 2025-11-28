"use server";

import { getUserByEmail, createUser } from "@/lib/db/utils";
import { COLLECTIONS } from "@/lib/db/models";
import type { UserModel } from "@/lib/db/models";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// Simple password hashing using Node.js crypto (for now)
// In production, consider using bcryptjs for better security
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
};

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    // Validate password
    if (password.length < 8 || password.length > 25) {
      return { success: false, message: "Password must be 8 to 25 characters" };
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create new user
    const newUser = await createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
    });

    if (!newUser._id) {
      return { success: false, message: "Failed to create user" };
    }

    return {
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, message: "Email and password are required" };
    }

    // Find user by email
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return { success: false, message: "Invalid email or password" };
    }

    if (!user._id) {
      return { success: false, message: "User ID not found" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign in",
    };
  }
}

/**
 * Get user by ID (for session management)
 */
export async function getUserById(userId: string): Promise<AuthResult> {
  try {
    if (!ObjectId.isValid(userId)) {
      return { success: false, message: "Invalid user ID format" };
    }

    const collection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user || !user._id) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Get user error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to get user",
    };
  }
}

/**
 * Sign up a user with a specific role (for admin setup)
 */
export async function signUpWithRole(
  email: string,
  password: string,
  role: "user" | "admin" | "journalist" | "employee" | "finance" = "user"
): Promise<AuthResult> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    // Validate password
    if (password.length < 8 || password.length > 25) {
      return { success: false, message: "Password must be 8 to 25 characters" };
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create new user with specified role
    const newUser = await createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
    });

    if (!newUser._id) {
      return { success: false, message: "Failed to create user" };
    }

    return {
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Sign up with role error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to sign up",
    };
  }
}

