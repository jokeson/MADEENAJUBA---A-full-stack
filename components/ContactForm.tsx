"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitContactMessage, getUserContactInfo } from "@/lib/server-actions/contact";
import toast from "react-hot-toast";

const ContactForm = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // Load user contact info if authenticated
  useEffect(() => {
    const loadUserInfo = async () => {
      if (isAuthenticated && user?.id) {
        setLoadingUserInfo(true);
        try {
          const result = await getUserContactInfo(user.id);
          if (result.success) {
            setUserEmail(result.email || "");
            setUserPhone(result.phone || "");
            setFormData((prev) => ({
              ...prev,
              email: result.email || "",
              phone: result.phone || "",
            }));
          }
        } catch (error) {
          console.error("Error loading user info:", error);
          // Silently fail - user can still fill form manually
        } finally {
          setLoadingUserInfo(false);
        }
      }
    };

    loadUserInfo();
  }, [isAuthenticated, user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await submitContactMessage({
        userId: isAuthenticated ? user?.id : undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        toast.success(result.message || "Your message has been sent successfully!");
        // Reset form
        setFormData({
          email: isAuthenticated ? userEmail : "",
          phone: isAuthenticated ? userPhone : "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(result.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      // Handle server action not found error (deployment mismatch)
      if (error instanceof Error && error.message.includes("Failed to find Server Action")) {
        toast.error("The form is being updated. Please refresh the page and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Enter message subject"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 outline-none transition-all text-sm xs:text-base"
            disabled={loading || loadingUserInfo}
          />
        </div>

        {/* Email - Show if not authenticated, auto-fill if authenticated */}
        {!isAuthenticated && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 outline-none transition-all text-sm xs:text-base"
              disabled={loading || loadingUserInfo}
            />
          </div>
        )}

        {/* Email - Read-only if authenticated */}
        {isAuthenticated && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || userEmail}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm xs:text-base"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Your email is automatically included from your account
            </p>
          </div>
        )}

        {/* Phone - Show if not authenticated, auto-fill if authenticated */}
        {!isAuthenticated && (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+211 912 345 678"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 outline-none transition-all text-sm xs:text-base"
              disabled={loading || loadingUserInfo}
            />
          </div>
        )}

        {/* Phone - Read-only if authenticated */}
        {isAuthenticated && (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || userPhone || "Not provided"}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm xs:text-base"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              {userPhone
                ? "Your phone number is automatically included from your KYC"
                : "Phone number not available in your profile"}
            </p>
          </div>
        )}

        {/* Message */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm xs:text-base font-semibold text-[#800000] mb-2"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Enter your message here..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/20 outline-none transition-all resize-none text-sm xs:text-base"
            disabled={loading || loadingUserInfo}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || loadingUserInfo}
          className="w-full bg-[#800000] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#900000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm xs:text-base sm:text-lg"
        >
          {loading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Send Message</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;

