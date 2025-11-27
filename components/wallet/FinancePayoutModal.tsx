"use client";

import { useState } from "react";
import { processCashPayout, getPendingWithdrawalByRef } from "@/lib/server-actions/wallet";
import { canHandleFinance } from "@/lib/rbac";
import { formatDateWithTime } from "@/lib/format";

interface FinancePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  financeUserId: string;
  userRole: string;
}

const FinancePayoutModal = ({
  isOpen,
  onClose,
  onSuccess,
  financeUserId,
  userRole,
}: FinancePayoutModalProps) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [withdrawalData, setWithdrawalData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setWithdrawalData(null);
    setShowDetails(false);

    try {
      const result = await getPendingWithdrawalByRef(referenceNumber.trim());

      if (result.success && result.withdrawal) {
        if (result.withdrawal.status !== "pending") {
          setError(`This withdrawal has already been ${result.withdrawal.status}.`);
          setLoading(false);
          return;
        }

        if (result.withdrawal.isExpired) {
          setError("This withdrawal request has expired. The full amount has been automatically returned to the user's wallet without any fee deduction.");
          setLoading(false);
          return;
        }

        setWithdrawalData(result);
        setShowDetails(true);
      } else {
        setError(result.error || "Withdrawal request not found");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error looking up withdrawal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayout = async () => {
    if (!withdrawalData || !referenceNumber) {
      setError("Please lookup a withdrawal request first");
      return;
    }

    setError("");
    setProcessing(true);

    try {
      const result = await processCashPayout(financeUserId, referenceNumber.trim());

      if (result.success) {
        setReferenceNumber("");
        setWithdrawalData(null);
        setShowDetails(false);
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to process payout");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error processing payout:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setReferenceNumber("");
    setError("");
    setWithdrawalData(null);
    setShowDetails(false);
    setLoading(false);
    setProcessing(false);
    onClose();
  };


  if (!isOpen) return null;

  // Check if user has finance permissions
  if (!canHandleFinance(userRole as any)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-3 sm:m-4" style={{ backgroundColor: '#d6d6c2' }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2
              id="finance-payout-modal-title"
              className="text-2xl font-bold"
              style={{ color: '#800000' }}
            >
              Check Reference Number
            </h2>
            <button
              onClick={handleClose}
              className="text-[#800000]/50 hover:text-[#800000] transition-colors"
              aria-label="Close modal"
              tabIndex={0}
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Reference Number Input */}
          {!showDetails && (
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label
                  htmlFor="ref-number"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: '#800000' }}
                >
                  Reference Number
                </label>
                <input
                  id="ref-number"
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation"
                  style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                  placeholder="Enter withdrawal reference number (e.g., 456778)"
                  required
                  disabled={loading}
                  autoComplete="off"
                  inputMode="text"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#ebebeb', color: '#800000' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ebebeb'}
                  tabIndex={0}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !referenceNumber.trim()}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#800000' }}
                  onMouseEnter={(e) => !loading && referenceNumber.trim() && (e.currentTarget.style.backgroundColor = '#6b0000')}
                  onMouseLeave={(e) => !loading && referenceNumber.trim() && (e.currentTarget.style.backgroundColor = '#800000')}
                >
                  {loading ? "Looking up..." : "Lookup Withdrawal"}
                </button>
              </div>
            </form>
          )}

          {/* Withdrawal Details */}
          {showDetails && withdrawalData && (
            <div className="space-y-6">
              {/* User Data */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#800000' }}>
                  User Information
                </h3>
                <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: '#ebebe0' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>First Name: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {withdrawalData.kyc?.firstName || withdrawalData.user.firstName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Last Name: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {withdrawalData.kyc?.lastName || withdrawalData.user.lastName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Wallet ID: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {withdrawalData.withdrawal.walletId}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Email: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {withdrawalData.user.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Images */}
              {withdrawalData.kyc && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#800000' }}>
                    Valid ID Images
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {withdrawalData.kyc.idFrontUrl && (
                      <div>
                        <p className="text-sm font-semibold mb-2" style={{ color: '#800000' }}>ID Front</p>
                        {withdrawalData.kyc.idFrontUrl.startsWith("blob:") ? (
                          <div className="w-full h-48 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <svg
                                className="mx-auto h-12 w-12 text-[#800000]/50"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="mt-2 text-sm text-[#800000]">Image not available</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={withdrawalData.kyc.idFrontUrl}
                            alt="ID Front"
                            className="w-full h-auto border border-gray-300 rounded-lg"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (!img.src.includes("data:image")) {
                                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3EImage not available%3C/text%3E%3C/svg%3E";
                                img.onerror = null;
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                    {withdrawalData.kyc.idBackUrl && (
                      <div>
                        <p className="text-sm font-semibold mb-2" style={{ color: '#800000' }}>ID Back</p>
                        {withdrawalData.kyc.idBackUrl.startsWith("blob:") ? (
                          <div className="w-full h-48 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center">
                            <div className="text-center">
                              <svg
                                className="mx-auto h-12 w-12 text-[#800000]/50"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="mt-2 text-sm text-[#800000]">Image not available</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={withdrawalData.kyc.idBackUrl}
                            alt="ID Back"
                            className="w-full h-auto border border-gray-300 rounded-lg"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              if (!img.src.includes("data:image")) {
                                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3EImage not available%3C/text%3E%3C/svg%3E";
                                img.onerror = null;
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                    {!withdrawalData.kyc.idFrontUrl && !withdrawalData.kyc.idBackUrl && (
                      <p className="text-sm font-medium text-[#800000]">No ID images available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Withdrawal Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#800000' }}>
                  Withdrawal Details
                </h3>
                <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: '#ebebe0' }}>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Reference Number: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {withdrawalData.withdrawal.ref}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Time of Withdrawal: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {formatDateWithTime(withdrawalData.withdrawal.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Expires At: </span>
                    <span className="text-sm font-medium" style={{ color: '#800000' }}>
                      {formatDateWithTime(withdrawalData.withdrawal.expiresAt)}
                    </span>
                  </div>
                  {withdrawalData.transaction && (
                    <div>
                      <span className="text-sm font-semibold" style={{ color: '#800000' }}>Transaction Status: </span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded ${
                          withdrawalData.transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {withdrawalData.transaction.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Amount Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="text-base font-semibold mb-3" style={{ color: '#800000' }}>
                      Amount Breakdown
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold" style={{ color: '#800000' }}>Withdrawal Amount (in pool):</span>
                        <span className="text-sm font-bold" style={{ color: '#800000' }}>
                          ${withdrawalData.withdrawal.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold" style={{ color: '#800000' }}>5% System Fee:</span>
                        <span className="text-sm font-bold text-red-600">
                          -${(withdrawalData.withdrawal.amount * 0.05).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-sm font-semibold" style={{ color: '#800000' }}>Amount User Will Receive:</span>
                        <span className="text-base font-bold text-green-600">
                          ${(withdrawalData.withdrawal.amount * 0.95).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> The user will receive ${(withdrawalData.withdrawal.amount * 0.95).toFixed(2)} after the 5% system fee deduction. 
                        The 5% fee (${(withdrawalData.withdrawal.amount * 0.05).toFixed(2)}) will be recorded in the Fee Ledger as "cash out fee" and must be manually deposited to the admin wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    setWithdrawalData(null);
                    setError("");
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#ebebeb', color: '#800000' }}
                  onMouseEnter={(e) => !processing && (e.currentTarget.style.backgroundColor = '#d4d4d4')}
                  onMouseLeave={(e) => !processing && (e.currentTarget.style.backgroundColor = '#ebebeb')}
                  tabIndex={0}
                  disabled={processing}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={processing}
                  className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#800000' }}
                  onMouseEnter={(e) => !processing && (e.currentTarget.style.backgroundColor = '#6b0000')}
                  onMouseLeave={(e) => !processing && (e.currentTarget.style.backgroundColor = '#800000')}
                >
                  {processing ? "Processing..." : "Pay cash"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancePayoutModal;

