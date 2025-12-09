"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
  onSwitchToForgotPassword?: () => void;
}

/**
 * LoginModal Component
 * A modal dialog component that displays a login form for user authentication.
 * Allows users to sign in with their email and password, and provides an option to switch to sign up.
 */
const LoginModal = ({ isOpen, onClose, onSwitchToSignUp, onSwitchToForgotPassword }: LoginModalProps) => {
  // State to control password visibility (show/hide password text)
  const [showPassword, setShowPassword] = useState(false);
  // State to store and display error messages
  const [error, setError] = useState<string>("");
  // State to track loading state during authentication
  const [loading, setLoading] = useState(false);
  // State to store form input values (email and password)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  // Get signIn function from authentication context
  const { signIn } = useAuth();

  // Reset form state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Reset all state when modal opens
      setLoading(false);
      setError("");
      setShowPassword(false);
      setFormData({
        email: "",
        password: "",
      });
    }
  }, [isOpen]);

  /**
   * Handles input field changes for email and password fields.
   * Updates the formData state with the new input value and clears any existing errors.
   * @param e - React change event from input element
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  /**
   * Toggles the password visibility between hidden (password) and visible (text).
   * This allows users to see what they're typing for better UX.
   */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Handles form submission for user login.
   * Prevents default form submission, clears errors, sets loading state,
   * attempts to sign in the user, and handles success/error responses.
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn(formData.email, formData.password);

    if (!result.success) {
      setError(result.message || "Invalid email or password");
      setLoading(false);
    } else {
      // Clear form inputs after successful sign-in
      setFormData({
        email: "",
        password: "",
      });
      setError("");
      onClose();
    }
  };

  /**
   * Handles switching from login modal to sign up modal.
   * Closes the current login modal and opens the sign up modal if the callback is provided.
   */
  const handleSwitchToSignUp = () => {
    onClose();
    if (onSwitchToSignUp) {
      onSwitchToSignUp();
    }
  };

  /**
   * Handles switching from login modal to forgot password modal.
   * Closes the current login modal and opens the forgot password modal if the callback is provided.
   */
  const handleSwitchToForgotPassword = () => {
    onClose();
    if (onSwitchToForgotPassword) {
      onSwitchToForgotPassword();
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
      aria-labelledby="login-modal-title"
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClose();
            }
          }}
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
        <h2 id="login-modal-title" className="text-2xl font-semibold text-[#800000] mb-2">
          Login
        </h2>

        {/* Sign Up Link */}
        <p className="text-sm text-[#800000] mb-6">
          Don't have an account?{" "}
          <button
            className="text-[#800000] hover:text-[#900000] font-medium"
            onClick={handleSwitchToSignUp}
            tabIndex={0}
          >
            Sign Up
          </button>
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[#800000] mb-1">
              Email
            </label>
            <input
              type="email"
              id="login-email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-base text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
              placeholder="Enter your email"
              required
              disabled={loading}
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-[#800000] mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-10 text-base text-[#800000] md:text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
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
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-[#800000] hover:text-[#900000] font-medium hover:cursor-pointer"
              onClick={handleSwitchToForgotPassword}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSwitchToForgotPassword();
                }
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;

