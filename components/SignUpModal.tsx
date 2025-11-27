"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

/**
 * SignUpModal Component
 * A modal dialog component that displays a sign up form for new user registration.
 * Allows users to create an account with email, password, and password confirmation.
 * Includes validation for password matching and length requirements.
 */
const SignUpModal = ({ isOpen, onClose, onSwitchToLogin }: SignUpModalProps) => {
  // State to control password visibility (show/hide password text)
  const [showPassword, setShowPassword] = useState(false);
  // State to store and display error messages
  const [error, setError] = useState<string>("");
  // State to track loading state during account creation
  const [loading, setLoading] = useState(false);
  // State to store form input values (email, password, and confirm password)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  // Get signUp function from authentication context
  const { signUp } = useAuth();

  /**
   * Handles input field changes for email, password, and confirm password fields.
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
   * Applies to both password and confirm password fields.
   */
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  /**
   * Handles form submission for user registration.
   * Validates password match and length, then attempts to create a new user account.
   * Prevents default form submission, handles validation errors, and manages loading state.
   * @param e - React form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate that password and confirm password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password length (must be between 8 and 25 characters)
    if (formData.password.length < 8 || formData.password.length > 25) {
      setError("Password must be 8 to 25 characters");
      setLoading(false);
      return;
    }

    // Attempt to create new user account
    const result = await signUp(formData.email, formData.password);

    if (!result.success) {
      setError(result.message || "Sign up failed. Please try again.");
      setLoading(false);
    } else {
      onClose();
    }
  };

  /**
   * Handles switching from sign up modal to login modal.
   * Closes the current sign up modal and opens the login modal if the callback is provided.
   */
  const handleSwitchToLogin = () => {
    onClose();
    if (onSwitchToLogin) {
      onSwitchToLogin();
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
      aria-labelledby="modal-title"
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
        <h2 id="modal-title" className="text-2xl font-semibold text-[#800000] mb-2">
          Create an account
        </h2>

        {/* Login Link */}
        <p className="text-sm text-[#800000] mb-6">
          Have an account?{" "}
          <button
            className="text-[#800000] hover:text-[#900000] font-medium"
            onClick={handleSwitchToLogin}
            tabIndex={0}
          >
            Login
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
            <label htmlFor="email" className="block text-sm font-medium text-[#800000] mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
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
            <label htmlFor="password" className="block text-sm font-medium text-[#800000] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border-2 border-[#800000] rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] pr-10 text-base text-[#800000] placeholder:text-[#800000]/60 touch-manipulation bg-white"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="new-password"
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
            <p className="mt-1 text-xs text-[#800000]">
              Password must be 8 to 25 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#800000] mb-1"
            >
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white"
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUpModal;

