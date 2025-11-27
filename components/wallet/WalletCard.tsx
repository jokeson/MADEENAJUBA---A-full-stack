"use client";

import { useRouter } from "next/navigation";

/**
 * Props for WalletCard component
 */
interface WalletCardProps {
  /** Current wallet balance */
  balance: number;
  /** Wallet ID to display on card */
  walletId: string;
  /** Whether balance is currently loading */
  balanceLoading: boolean;
  /** Error message from balance fetch */
  balanceError: string;
  /** Current wallet status */
  walletStatus: "active" | "suspended" | "terminated" | null;
  /** User's first name from KYC */
  firstName: string | null;
  /** User's last name from KYC */
  lastName: string | null;
  /** Whether KYC info is loading */
  loadingKyc: boolean;
  /** Current KYC status */
  kycStatus: "pending" | "approved" | "rejected" | null;
  /** KYC rejection reason if rejected */
  kycRejectionReason: string | null;
  /** User email (fallback for cardholder name) */
  userEmail?: string;
}

/**
 * WalletCard Component
 * 
 * Displays a Mastercard-style wallet card with:
 * - Golden metallic design with multiple overlay effects
 * - Wallet ID (card number)
 * - Current balance
 * - Cardholder name (from KYC or email)
 * - Expiry date and Mastercard logo
 * - Handles different states: loading, suspended, terminated, errors
 * 
 * @param props - Component props
 */
const WalletCard = ({
  balance,
  walletId,
  balanceLoading,
  balanceError,
  walletStatus,
  firstName,
  lastName,
  loadingKyc,
  kycStatus,
  kycRejectionReason,
  userEmail,
}: WalletCardProps) => {
  const router = useRouter();

  // Only show card if wallet exists (walletStatus is not null)
  if (walletStatus === null) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-[#f5f5f0] via-[#8b6f47] to-[#4d2600] rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4 md:p-3 lg:p-4 mb-6 sm:mb-6 md:mb-8 text-white relative overflow-hidden min-h-[110px] sm:min-h-[130px] md:min-h-[80px] lg:min-h-[90px] max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto aspect-[1.586/1]">
      {/* Golden Metallic Base Overlay - Creates gold material effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/40 via-yellow-500/30 to-yellow-600/40 rounded-xl sm:rounded-2xl pointer-events-none"></div>
      
      {/* Golden Shine/Reflection Effect - Diagonal */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none" style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,223,0,0.35) 25%, rgba(255,215,0,0.15) 50%, rgba(184,134,11,0.25) 75%, rgba(255,215,0,0.15) 100%)'
      }}></div>
      
      {/* Golden Highlight Stripe - Vertical shine effect */}
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-yellow-300/40 via-yellow-400/30 to-transparent rounded-xl sm:rounded-2xl pointer-events-none transform -skew-x-12"></div>
      
      {/* Additional Golden Glow - Bottom right corner */}
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-tl from-yellow-500/30 via-yellow-400/20 to-transparent rounded-xl sm:rounded-2xl pointer-events-none"></div>
      
      {/* Subtle Golden Texture - Multiple light reflections */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none" style={{
        background: 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.2) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,223,0,0.15) 0%, transparent 50%)'
      }}></div>
      
      {/* Mastercard Signature Overlapping Circles */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 md:w-32 md:h-32 lg:w-36 lg:h-36 opacity-20">
        {/* Red Circle */}
        <div className="absolute top-0 right-8 sm:right-12 md:right-8 lg:right-10 w-24 h-24 sm:w-32 sm:h-32 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-red-600 rounded-full"></div>
        {/* Orange Circle */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-orange-500 rounded-full"></div>
      </div>
      
      {/* Kilimagaroo Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12]">
        <svg
          width="340"
          height="100"
          viewBox="0 0 340 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full max-w-[340px] max-h-[100px]"
        >
          {/* Stylized Wavy Line (Mountain peaks) - Connects to K */}
          <path
            d="M 8 75 Q 18 25, 30 55 Q 42 20, 54 50 Q 66 18, 78 48 Q 90 15, 102 50 Q 114 20, 126 48 L 130 45"
            stroke="#1a237e"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Kilimagaroo Text - Handwritten style with K connected to wavy line */}
          <text
            x="130"
            y="60"
            fontFamily="Georgia, serif"
            fontSize="38"
            fontWeight="600"
            fill="#1a237e"
            letterSpacing="2"
            style={{ fontStyle: 'italic' }}
          >
            Kilimagaroo
          </text>
        </svg>
      </div>
      
      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Top Section - Logo Only */}
        <div className="flex justify-end items-start mb-1 sm:mb-2 md:mb-1 lg:mb-1.5">
          {/* Kilimgaroo Logo - Smaller */}
          <div className="text-right">
            <p className="text-white text-sm sm:text-base md:text-sm lg:text-base font-bold tracking-wider drop-shadow-lg" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.3)' }}>Kilimgaroo</p>
          </div>
        </div>

        {/* Middle Section - Card Number and Balance */}
        {balanceLoading ? (
          // Loading state
          <div className="flex items-center gap-2 mb-1 sm:mb-2 md:mb-1 lg:mb-1.5">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
            <p className="text-lg sm:text-xl md:text-lg lg:text-xl text-white font-bold">Loading...</p>
          </div>
        ) : balanceError === "suspended" ? (
          // Suspended wallet state
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-8 sm:w-8 text-red-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-red-100 font-semibold text-base sm:text-lg">Wallet Suspended</p>
              </div>
              <p className="text-red-50 text-xs sm:text-sm mb-2">
                Your wallet has been suspended by an administrator.
              </p>
              <p className="text-red-50 text-xs sm:text-sm mb-4">
                Suspended wallets cannot send, receive, deposit, or withdraw funds. Please contact support for more information.
              </p>
              {walletId && (
                <div className="mt-4 p-2 sm:p-3 bg-red-600/30 rounded-lg">
                  <p className="text-red-100 text-xs font-medium mb-1">Wallet ID</p>
                  <p className="text-red-50 text-xs sm:text-sm font-mono break-all">{walletId}</p>
                </div>
              )}
            </div>
          </div>
        ) : balanceError === "terminated" ? (
          // Terminated wallet state
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 sm:h-8 sm:w-8 text-red-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <p className="text-red-100 font-semibold text-base sm:text-lg">Wallet Terminated</p>
              </div>
              <p className="text-red-50 text-xs sm:text-sm mb-2 font-medium">
                Your wallet has been terminated by an administrator.
              </p>
              <p className="text-red-50 text-xs sm:text-sm mb-4">
                This wallet is no longer active and all wallet functionality has been disabled. Please contact support for more information.
              </p>
              {walletId && (
                <div className="mt-4 p-2 sm:p-3 bg-red-600/30 rounded-lg">
                  <p className="text-red-100 text-xs font-medium mb-1">Wallet ID</p>
                  <p className="text-red-50 text-xs sm:text-sm font-mono break-all">{walletId}</p>
                </div>
              )}
            </div>
          </div>
        ) : balanceError && balanceError !== "suspended" && balanceError !== "terminated" ? (
          // Other error states (KYC related)
          <div className="space-y-3 sm:space-y-4">
            {kycStatus === "rejected" ? (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 sm:p-6">
                <p className="text-red-100 font-semibold mb-2 text-base sm:text-lg">KYC Application Rejected</p>
                <p className="text-red-50 text-xs sm:text-sm mb-2">
                  Your KYC application has been rejected. Please check the rejection message above and resubmit your application.
                </p>
                {kycRejectionReason && (
                  <p className="text-red-100 text-xs sm:text-sm font-medium mb-2">Reason: {kycRejectionReason}</p>
                )}
              </div>
            ) : kycStatus === "pending" ? (
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 sm:p-6">
                <p className="text-blue-100 font-semibold mb-2 text-base sm:text-lg">KYC Application Pending</p>
                <p className="text-blue-50 text-xs sm:text-sm">
                  Your KYC application is under review. Please wait for admin approval.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 sm:p-6">
                <p className="text-yellow-100 font-semibold mb-2 text-base sm:text-lg">Wallet Not Available</p>
                <p className="text-yellow-50 text-xs sm:text-sm mb-4">
                  You don't have a wallet yet. Apply for a wallet to start using Kilimanjaro E-Wallet services.
                </p>
                <button
                  onClick={() => router.push("/kyc")}
                  className="inline-block bg-[#800000] hover:bg-[#900000] text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 md:px-8 rounded-lg transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
                  tabIndex={0}
                  aria-label="Apply for wallet"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push("/kyc");
                    }
                  }}
                >
                  Apply for Wallet
                </button>
              </div>
            )}
          </div>
        ) : (
          // Normal state - Show wallet ID and balance
          <>
            {/* Card Number (Wallet ID) - Mastercard Style */}
            {walletId && (
              <div className="mb-0.5 sm:mb-1 md:mb-0.5 lg:mb-1">
                <p className="text-white text-base sm:text-lg md:text-base lg:text-lg font-mono font-semibold tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.15em] lg:tracking-[0.2em]">
                  {walletId.split('').map((char, idx) => (
                    <span key={idx} className="inline-block">{idx === 2 ? ` ${char}` : char}</span>
                  ))}
                </p>
              </div>
            )}
            
            {/* Balance Amount - Compact */}
            <div className="mb-0.5 sm:mb-1 md:mb-0.5 lg:mb-1">
              <h2 className="text-2xl sm:text-3xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                SSP {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </>
        )}

        {/* Bottom Section - Cardholder Name, Expiry, and Mastercard Logo */}
        <div className="mt-auto pt-0.5 sm:pt-1 md:pt-0.5 lg:pt-1">
          <div className="flex justify-between items-end">
            {/* Cardholder Name */}
            <div className="flex-1">
              {loadingKyc ? (
                <p className="text-white text-xs sm:text-sm md:text-xs lg:text-sm font-semibold uppercase tracking-wider">Loading...</p>
              ) : firstName && lastName ? (
                <p className="text-white text-xs sm:text-sm md:text-xs lg:text-sm font-semibold uppercase tracking-wider drop-shadow">
                  {firstName} {lastName}
                </p>
              ) : (
                <p className="text-white/90 text-xs sm:text-sm md:text-xs font-semibold uppercase tracking-wider">
                  {userEmail?.split('@')[0].toUpperCase() || "USER"}
                </p>
              )}
            </div>
            
            {/* Expiry Date and Mastercard Logo */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-2 lg:gap-3">
              {/* Expiry Date */}
              <div className="text-right">
                <p className="text-white/80 text-[10px] sm:text-xs font-medium mb-0.5">VALID THRU</p>
                <p className="text-white text-xs sm:text-sm font-semibold tracking-wider">12/99</p>
              </div>
              
              {/* Mastercard Logo - Two Overlapping Circles */}
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-10 md:h-10 lg:w-12 lg:h-12 flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Red Circle */}
                  <div className="absolute left-0 w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-7 lg:h-7 bg-red-600 rounded-full"></div>
                  {/* Orange Circle */}
                  <div className="absolute right-0 w-6 h-6 sm:w-7 sm:h-7 md:w-6 md:h-6 lg:w-7 lg:h-7 bg-orange-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Signature Section - Compact */}
          <div className="mt-0.5 sm:mt-1 md:mt-0.5 lg:mt-1 pt-0.5 sm:pt-1 md:pt-0.5 lg:pt-1 border-t border-white/20">
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-[10px] sm:text-xs font-medium">Authorized Signature</p>
              <div className="bg-white/10 rounded px-2 py-0.5 flex-1 max-w-[100px] sm:max-w-[120px] md:max-w-[100px] lg:max-w-[120px]">
                <p className="text-white text-[10px] sm:text-xs font-bold italic tracking-wider truncate">
                  Kilimgaroo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;

