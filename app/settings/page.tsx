"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getKycUserInfo } from "@/lib/server-actions/kyc";
import Sidebar from "@/components/Sidebar";

const SettingsPage = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("profile");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchKycInfo = async () => {
      if (!user?.id) {
        setLoadingKyc(false);
        return;
      }

      try {
        setLoadingKyc(true);
        const result = await getKycUserInfo(user.id, user.email);
        if (result.success && result.firstName && result.lastName) {
          setFirstName(result.firstName);
          setLastName(result.lastName);
        }
      } catch (error) {
        console.error("Error fetching KYC info:", error);
      } finally {
        setLoadingKyc(false);
      }
    };

    if (user?.id) {
      fetchKycInfo();
    }
  }, [user?.id, user?.email]);

  const settingsSections = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "account",
      label: "Account",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
  ];

  const renderProfileSection = () => (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-[#800000] mb-4 xs:mb-5 sm:mb-6 break-words">Personal Information</h3>
        <div className="bg-white rounded-lg shadow-md p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 space-y-4 xs:space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm xs:text-base font-medium text-[#800000] mb-2 xs:mb-3">
              First Name
            </label>
            <input
              type="text"
              value={firstName || ""}
              disabled
              className="w-full px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-[#800000] break-words">
              First name from KYC application
            </p>
          </div>
          <div>
            <label className="block text-sm xs:text-base font-medium text-[#800000] mb-2 xs:mb-3">
              Last Name
            </label>
            <input
              type="text"
              value={lastName || ""}
              disabled
              className="w-full px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-[#800000] break-words">
              Last name from KYC application
            </p>
          </div>
          <div>
            <label className="block text-sm xs:text-base font-medium text-[#800000] mb-2 xs:mb-3">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-3 xs:px-4 sm:px-5 py-2 xs:py-2.5 sm:py-3 text-sm xs:text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed focus:outline-none"
            />
            <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-[#800000] break-words">
              Email cannot be changed
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSection = () => (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-[#800000] mb-4 xs:mb-5 sm:mb-6 break-words">Account Details</h3>
        <div className="bg-white rounded-lg shadow-md p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 space-y-4 xs:space-y-5 sm:space-y-6">
          <div>
            <label className="block text-base font-medium text-[#800000] mb-3">
              User ID
            </label>
            <input
              type="text"
              value={user?.id || ""}
              disabled
              className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-[#800000] mb-3">
              Account Role
            </label>
            <input
              type="text"
              value={user?.role || ""}
              disabled
              className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed capitalize focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-[#800000] mb-3">
              Account Created
            </label>
            <input
              type="text"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              disabled
              className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-[#800000] cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-[#800000] mb-4 xs:mb-5 sm:mb-6 break-words">Password & Security</h3>
        <div className="bg-white rounded-lg shadow-md p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 space-y-4 xs:space-y-5 sm:space-y-6">
          <div>
            <label className="block text-base font-medium text-[#800000] mb-3">
              Change Password
            </label>
            <p className="text-base text-[#800000] mb-6">
              To change your password, please contact support or use the password reset feature.
            </p>
            <button
              disabled
              className="px-6 py-3 text-base bg-gray-200 text-[#800000] rounded-lg font-medium cursor-not-allowed"
              tabIndex={-1}
            >
              Change Password
            </button>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-base font-medium text-[#800000] mb-3">Two-Factor Authentication</h4>
            <p className="text-base text-[#800000] mb-6">
              Two-factor authentication is not yet available.
            </p>
            <button
              disabled
              className="px-6 py-3 text-base bg-gray-200 text-[#800000] rounded-lg font-medium cursor-not-allowed"
              tabIndex={-1}
            >
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      <div>
        <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-[#800000] mb-4 xs:mb-5 sm:mb-6 break-words">Application Preferences</h3>
        <div className="bg-white rounded-lg shadow-md p-4 xs:p-5 sm:p-6 md:p-7 lg:p-8 space-y-4 xs:space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-base font-medium text-[#800000] mb-2">
                Email Notifications
              </label>
              <p className="text-sm text-[#800000]">
                Receive email notifications for important updates
              </p>
            </div>
            <button
              disabled
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-200 cursor-not-allowed"
              tabIndex={-1}
            >
              <span className="inline-block h-5 w-5 translate-x-1 transform rounded-full bg-white transition" />
            </button>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-base font-medium text-[#800000] mb-2">
                  Transaction Alerts
                </label>
                <p className="text-sm text-[#800000]">
                  Get notified about wallet transactions
                </p>
              </div>
              <button
                disabled
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-200 cursor-not-allowed"
                tabIndex={-1}
              >
                <span className="inline-block h-5 w-5 translate-x-1 transform rounded-full bg-white transition" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "account":
        return renderAccountSection();
      case "security":
        return renderSecuritySection();
      case "preferences":
        return renderPreferencesSection();
      default:
        return renderProfileSection();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d6d6c2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#d6d6c2] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12">
          {/* Header */}
          <div className="mb-5 xs:mb-6 sm:mb-7 md:mb-8">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#800000] mb-2 xs:mb-3 break-words">
              Settings
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl text-[#800000] break-words">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Content */}
          <div className="flex flex-col lg:flex-row gap-4 xs:gap-5 sm:gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="bg-white rounded-lg shadow-md p-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 xs:py-2.5 sm:py-3 rounded-md text-sm xs:text-base font-medium transition-colors
                      ${
                        activeSection === section.id
                          ? "bg-blue-50 text-blue-600"
                          : "text-[#800000] hover:bg-gray-50"
                      }
                    `}
                    tabIndex={0}
                    aria-label={`Switch to ${section.label} settings`}
                  >
                    <span className="w-5 h-5 xs:w-6 xs:h-6 flex-shrink-0">{section.icon}</span>
                    <span className="truncate">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

