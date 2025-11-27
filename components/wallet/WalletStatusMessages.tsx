"use client";

import { useRouter } from "next/navigation";

/**
 * Props for WalletStatusMessages component
 */
interface WalletStatusMessagesProps {
  /** Whether balance is currently loading */
  balanceLoading: boolean;
  /** Whether KYC status is currently loading */
  loadingKycStatus: boolean;
  /** Current KYC status (pending, approved, rejected, or null) */
  kycStatus: "pending" | "approved" | "rejected" | null;
  /** Error message from balance fetch */
  balanceError: string;
  /** Current wallet status (active, suspended, terminated, or null) */
  walletStatus: "active" | "suspended" | "terminated" | null;
  /** KYC rejection reason if application was rejected */
  kycRejectionReason: string | null;
}

/**
 * WalletStatusMessages Component
 * 
 * Displays different status messages based on wallet and KYC application status:
 * - KYC Application Pending: Shows pending message with info
 * - KYC Application Rejected: Shows rejection reason with resubmit button
 * - No Wallet: Shows "Get Started" message with apply button
 * 
 * @param props - Component props
 */
const WalletStatusMessages = ({
  balanceLoading,
  loadingKycStatus,
  kycStatus,
  balanceError,
  walletStatus,
  kycRejectionReason,
}: WalletStatusMessagesProps) => {
  const router = useRouter();

  // Show KYC Application Pending message
  if (!balanceLoading && !loadingKycStatus && kycStatus === "pending" && balanceError && balanceError !== "suspended" && balanceError !== "terminated" && walletStatus === null) {
    return (
      <div className="rounded-xl sm:rounded-2xl shadow-md p-6 sm:p-8 md:p-10 lg:p-12 mb-6 sm:mb-6 md:mb-8 max-w-2xl mx-auto" style={{ backgroundColor: '#d6d6c2' }}>
        <div className="mb-6 sm:mb-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full" style={{ backgroundColor: '#f5f5f0' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 sm:h-10 sm:w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: '#800000' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          {/* Title and Description */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: '#800000' }}>
            KYC Application
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[#800000] mb-6 sm:mb-8">
            Complete your Know Your Customer (KYC) application to activate your wallet
          </p>
        </div>
        
        {/* Pending Status Message */}
        <div className="rounded-lg p-6 sm:p-8" style={{ backgroundColor: '#f5f5f0', border: '1px solid rgba(128, 0, 0, 0.2)' }}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: '#800000' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: '#800000' }}>
                Important Information
              </h3>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#800000' }}>
                Your application will be reviewed by an admin within 24 hours. You will receive a notification once your application is approved or rejected.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show KYC Application Rejected message
  if (!balanceLoading && !loadingKycStatus && kycStatus === "rejected" && balanceError && balanceError !== "suspended" && balanceError !== "terminated" && walletStatus === null) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-6 sm:p-8 md:p-10 lg:p-12 mb-6 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
        <div className="mb-6 sm:mb-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-red-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 sm:h-10 sm:w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          {/* Title and Description */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: '#800000' }}>
            KYC Application Rejected
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[#800000] mb-6 sm:mb-8">
            Your KYC application has been rejected. Please review the reason below and resubmit your application.
          </p>
        </div>
        
        {/* Rejection Reason Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-red-900 mb-2">
                Rejection Reason
              </h3>
              <p className="text-red-800 text-sm sm:text-base leading-relaxed mb-4">
                {kycRejectionReason || "Your KYC application was rejected. Please review your information and resubmit."}
              </p>
              <p className="text-red-700 text-sm sm:text-base">
                Please review the reason above and resubmit your application with the necessary corrections.
              </p>
            </div>
          </div>
        </div>

        {/* Resubmit Button */}
        <button
          onClick={() => router.push("/kyc")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-[#800000] hover:bg-[#900000] text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 md:px-10 rounded-lg transition-colors shadow-md hover:shadow-lg text-base sm:text-lg md:text-xl"
          tabIndex={0}
          aria-label="Resubmit KYC application"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/kyc");
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Resubmit Application
        </button>
      </div>
    );
  }

  // Show "Get Started" message if user has no wallet and no KYC application
  if (!balanceLoading && !loadingKycStatus && !kycStatus && balanceError && balanceError !== "suspended" && balanceError !== "terminated" && walletStatus === null) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto text-center px-4 sm:px-6">
        <div className="mb-4 sm:mb-6 md:mb-8">
          {/* Wallet Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mb-3 sm:mb-4 md:mb-6 rounded-full bg-[#800000]/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: '#800000' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          
          {/* Heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight px-2 sm:px-0" style={{ color: '#800000' }}>
            Get Started with Your Digital Wallet
          </h2>
          
          {/* Description Paragraphs */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#800000] mb-2 sm:mb-3 leading-relaxed px-2 sm:px-4 md:px-0">
            You don't have a wallet yet. Apply now to start using Kilimanjaro E-Wallet services!
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-[#800000] mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2 sm:px-4 md:px-0">
            Complete your KYC application to get approved and receive your digital wallet. It only takes a few minutes!
          </p>
        </div>
        
        {/* Apply Button */}
        <button
          onClick={() => router.push("/kyc")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-[#800000] hover:bg-[#900000] text-white font-semibold py-2.5 sm:py-3 md:py-4 px-5 sm:px-6 md:px-8 lg:px-10 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm sm:text-base md:text-lg lg:text-xl"
          tabIndex={0}
          aria-label="Apply for wallet"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/kyc");
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="md:block text-white">Apply for Wallet</span>
        </button>
      </div>
    );
  }

  // Return null if none of the conditions are met
  return null;
};

export default WalletStatusMessages;

