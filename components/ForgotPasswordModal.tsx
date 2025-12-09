"use client";

import { useState, useEffect } from "react";
import { requestPasswordReset } from "@/lib/server-actions/auth";
import toast from "react-hot-toast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

/**
 * ForgotPasswordModal Component
 * A modal dialog component that allows users to request a password reset link via email.
 */
const ForgotPasswordModal = ({ isOpen, onClose, onSwitchToLogin }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset form state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError("");
      setEmail("");
      setSuccess(false);
    }
  }, [isOpen]);

  /**
   * Handles input field changes for email field.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  /**
   * Handles form submission for password reset request.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email);

    if (!result.success) {
      setError(result.message || "Failed to send reset link");
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      toast.success("Password reset link sent! Please check your email.");
    }
  };

  /**
   * Handles switching from forgot password modal to login modal.
   */
  const handleSwitchToLogin = () => {
    onClose();
    if (onSwitchToLogin) {
      onSwitchToLogin();
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

  // Don't render the modal if it's not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
    >
      <div
        className="relative w-full max-w-md mx-2 rounded-lg bg-[#d6d6c2] p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#800000] hover:text-[#900000] transition-colors"
          aria-label="Close modal"
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, onClose)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 id="forgot-password-modal-title" className="text-2xl font-semibold text-[#800000] mb-2">
          Forgot Password
        </h2>

        {/* Description */}
        <p className="text-sm text-[#800000] mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            <p className="font-medium">Password reset link sent!</p>
            <p className="mt-1">
              If an account exists with this email, you will receive a password reset link shortly.
              Please check your email inbox.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="forgot-password-email" className="block text-sm font-medium text-[#800000] mb-1">
                Email
              </label>
              <input
                type="email"
                id="forgot-password-email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-base text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
                inputMode="email"
                aria-label="Email address"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleSwitchToLogin}
              className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Login Link */}
        {!success && (
          <p className="text-sm text-[#800000] mt-6 text-center">
            Remember your password?{" "}
            <button
              className="text-[#800000] hover:text-[#900000] font-medium"
              onClick={handleSwitchToLogin}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, handleSwitchToLogin)}
            >
              Login
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
