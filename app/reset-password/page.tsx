"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPasswordResetToken, resetPassword } from "@/lib/server-actions/auth";
import toast from "react-hot-toast";

/**
 * Reset Password Page
 * Allows users to reset their password using a token from the email link.
 */
const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        setVerifying(false);
        return;
      }

      const result = await verifyPasswordResetToken(token);
      if (result.success) {
        setTokenValid(true);
      } else {
        setError(result.message || "Invalid or expired reset token. Please request a new password reset.");
      }
      setVerifying(false);
    };

    verifyToken();
  }, [token]);

  /**
   * Handles input field changes.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
    setError("");
  };

  /**
   * Toggles password visibility.
   */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Toggles confirm password visibility.
   */
  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  /**
   * Handles form submission for password reset.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 8 || password.length > 25) {
      setError("Password must be 8 to 25 characters");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, password);

    if (!result.success) {
      setError(result.message || "Failed to reset password");
      setLoading(false);
    } else {
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  /**
   * Handles key down events for accessibility.
   */
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d6d6c2] px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
            <p className="mt-4 text-[#800000]">Verifying reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d6d6c2] px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-[#800000] mb-4">Invalid Reset Link</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          <p className="text-[#800000] mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, () => router.push("/"))}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d6d6c2] px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-[#800000] mb-2">Reset Password</h1>
        <p className="text-sm text-[#800000] mb-6">
          Enter your new password below.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-[#800000] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="reset-password"
                name="password"
                value={password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-10 text-base text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
                placeholder="Enter new password"
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
                maxLength={25}
                aria-label="New password"
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000] hover:text-[#900000]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-[#800000]/70 mt-1">Password must be 8 to 25 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-[#800000] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="reset-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-10 text-base text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
                placeholder="Confirm new password"
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
                maxLength={25}
                aria-label="Confirm new password"
              />
              <button
                type="button"
                onClick={handleToggleConfirmPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#800000] hover:text-[#900000]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        {/* Back to Home Link */}
        <p className="text-sm text-[#800000] mt-6 text-center">
          <button
            className="text-[#800000] hover:text-[#900000] font-medium"
            onClick={() => router.push("/")}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, () => router.push("/"))}
          >
            Back to Home
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
