"use server";

import { getUserByEmail, createUser } from "@/lib/db/utils";
import { COLLECTIONS } from "@/lib/db/models";
import type { UserModel, PasswordResetTokenModel } from "@/lib/db/models";
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

/**
 * Request password reset - generates a token and sends email
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { success: false, message: "Invalid email format" };
    }

    // Find user by email
    const user = await getUserByEmail(email.toLowerCase());
    if (!user || !user._id) {
      // Don't reveal if user exists or not for security
      return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Invalidate any existing tokens for this user
    const tokensCollection = await getCollection<PasswordResetTokenModel>(
      COLLECTIONS.PASSWORD_RESET_TOKENS
    );
    await tokensCollection.updateMany(
      { userId: user._id, used: false },
      { $set: { used: true } }
    );

    // Create new reset token
    const resetToken: Omit<PasswordResetTokenModel, "_id"> = {
      userId: user._id,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    await tokensCollection.insertOne(resetToken);

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    
    // Import email utility dynamically to avoid issues if email is not configured
    try {
      const { sendPasswordResetEmail } = await import("@/lib/utils/email");
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // For development, log the reset URL
      if (process.env.NODE_ENV === "development") {
        console.log("Password reset URL (dev only):", resetUrl);
      }
    }

    return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
  } catch (error) {
    console.error("Request password reset error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to process password reset request",
    };
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ success: boolean; message?: string; userId?: string }> {
  try {
    if (!token || token.trim().length === 0) {
      return { success: false, message: "Invalid reset token" };
    }

    const tokensCollection = await getCollection<PasswordResetTokenModel>(
      COLLECTIONS.PASSWORD_RESET_TOKENS
    );

    const resetToken = await tokensCollection.findOne({
      token: token.trim(),
      used: false,
    });

    if (!resetToken) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return { success: false, message: "Reset token has expired" };
    }

    return {
      success: true,
      userId: resetToken.userId.toString(),
    };
  } catch (error) {
    console.error("Verify password reset token error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to verify reset token",
    };
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate password
    if (!newPassword || newPassword.length < 8 || newPassword.length > 25) {
      return { success: false, message: "Password must be 8 to 25 characters" };
    }

    // Verify token
    const tokenVerification = await verifyPasswordResetToken(token);
    if (!tokenVerification.success || !tokenVerification.userId) {
      return { success: false, message: tokenVerification.message || "Invalid or expired reset token" };
    }

    const userId = tokenVerification.userId;

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update user password
    const usersCollection = await getCollection<UserModel>(COLLECTIONS.USERS);
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "User not found" };
    }

    // Mark token as used
    const tokensCollection = await getCollection<PasswordResetTokenModel>(
      COLLECTIONS.PASSWORD_RESET_TOKENS
    );
    await tokensCollection.updateOne(
      { token: token.trim() },
      {
        $set: {
          used: true,
          usedAt: new Date(),
        },
      }
    );

    return { success: true, message: "Password has been reset successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}

