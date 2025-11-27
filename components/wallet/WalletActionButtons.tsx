"use client";

/**
 * Props for WalletActionButtons component
 */
interface WalletActionButtonsProps {
  /** Callback when Send button is clicked */
  onSendClick: () => void;
  /** Callback when Withdraw button is clicked */
  onWithdrawClick: () => void;
  /** Callback when Deposit button is clicked */
  onDepositClick: () => void;
  /** Callback when Pay button is clicked (only for finance/admin) */
  onPayClick: () => void;
  /** Whether user can handle finance (admin/finance role) */
  canHandleFinance: boolean;
}

/**
 * WalletActionButtons Component
 * 
 * Displays action buttons for wallet operations:
 * - Send: Transfer money to another wallet
 * - Withdraw: Request cash withdrawal
 * - Deposit: Add funds via redeem code
 * - Pay: Process cash payouts (admin/finance only)
 * 
 * @param props - Component props
 */
const WalletActionButtons = ({
  onSendClick,
  onWithdrawClick,
  onDepositClick,
  onPayClick,
  canHandleFinance,
}: WalletActionButtonsProps) => {
  return (
    <div className={`grid grid-cols-2 ${canHandleFinance ? "sm:grid-cols-2 md:grid-cols-4" : "sm:grid-cols-3"} gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-6 md:mb-8`}>
      {/* Send Button */}
      <button
        onClick={onSendClick}
        className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group"
        tabIndex={0}
        aria-label="Send money"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSendClick();
          }
        }}
      >
        <div className="rounded-lg p-2 sm:p-3 md:p-4 transition-colors" style={{ backgroundColor: '#ebebeb' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: '#800000' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </div>
        <span className="font-semibold text-xs sm:text-sm md:text-base text-[#800000]">Send</span>
      </button>

      {/* Withdraw Button */}
      <button
        onClick={onWithdrawClick}
        className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group"
        tabIndex={0}
        aria-label="Withdraw money"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onWithdrawClick();
          }
        }}
      >
        <div className="rounded-lg p-2 sm:p-3 md:p-4 transition-colors" style={{ backgroundColor: '#ebebeb' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: '#800000' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <span className="font-semibold text-xs sm:text-sm md:text-base text-[#800000]">Withdraw</span>
      </button>

      {/* Deposit Button */}
      <button
        onClick={onDepositClick}
        className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group"
        tabIndex={0}
        aria-label="Deposit money"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onDepositClick();
          }
        }}
      >
        <div className="rounded-lg p-2 sm:p-3 md:p-4 transition-colors" style={{ backgroundColor: '#ebebeb' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: '#800000' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <span className="font-semibold text-xs sm:text-sm md:text-base text-[#800000]">Deposit</span>
      </button>

      {/* Pay Button - Only show for Admin and Finance roles - Used for cash withdrawal payouts */}
      {canHandleFinance && (
        <button
          onClick={onPayClick}
          className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-2 sm:gap-3 group"
          tabIndex={0}
          aria-label="Pay"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPayClick();
            }
          }}
        >
          <div className="rounded-lg p-2 sm:p-3 md:p-4 transition-colors" style={{ backgroundColor: '#ebebeb' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
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
          <span className="font-semibold text-xs sm:text-sm md:text-base text-[#800000]">Pay</span>
        </button>
      )}
    </div>
  );
};

export default WalletActionButtons;

