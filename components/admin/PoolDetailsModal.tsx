"use client";

import { useEffect, useState } from "react";
import { getPendingWithdrawalPoolDetails } from "@/lib/server-actions/admin";
import { formatDateDetailed } from "@/lib/format";

interface PoolDetail {
  _id: string;
  walletId: string;
  amount: number;
  amountCents: number;
  ref: string;
  createdAt: string;
  expiresAt: string;
}

interface PoolDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PoolDetailsModal = ({ isOpen, onClose }: PoolDetailsModalProps) => {
  const [poolDetails, setPoolDetails] = useState<PoolDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPoolDetails();
    }
  }, [isOpen]);

  const fetchPoolDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPendingWithdrawalPoolDetails();
      if (result.success && result.poolDetails) {
        setPoolDetails(result.poolDetails);
      } else {
        setError(result.error || "Failed to load pool details");
      }
    } catch (err) {
      console.error("Error fetching pool details:", err);
      setError("An error occurred while loading pool details");
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    setPoolDetails([]);
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pool-details-modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl m-3 sm:m-4"
        style={{ backgroundColor: "#d6d6c2" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2
              id="pool-details-modal-title"
              className="text-2xl font-bold"
              style={{ color: "#800000" }}
            >
              Pending Withdrawal Pool Details
            </h2>
            <button
              onClick={handleClose}
              className="text-[#800000]/50 hover:text-[#800000] transition-colors"
              aria-label="Close modal"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClose();
                }
              }}
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

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Pool Details Table */}
          {!loading && !error && (
            <div className="space-y-4">
              {poolDetails.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#800000] text-lg">No pending withdrawals in pool</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                              Wallet ID
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                              Reference Number
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-[#800000]">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-[#800000]">
                              Date & Time Sent to Pool
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {poolDetails.map((detail, index) => (
                            <tr
                              key={detail._id}
                              className={`border-b border-gray-200 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-[#800000]">
                                {detail.walletId}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-[#800000]">
                                {detail.ref}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-right text-[#800000]">
                                ${detail.amount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-4 py-3 text-sm text-[#800000]">
                                {formatDateDetailed(detail.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-amber-50 border-t-2 border-amber-300">
                            <td
                              colSpan={2}
                              className="px-4 py-3 text-sm font-semibold text-[#800000]"
                            >
                              Total Amount in Pool:
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-right text-[#800000]">
                              $
                              {poolDetails
                                .reduce((sum, detail) => sum + detail.amount, 0)
                                .toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                            </td>
                            <td className="px-4 py-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <div className="text-sm text-[#800000] text-center">
                    Total entries: {poolDetails.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "#800000", color: "white" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6b0000")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#800000")}
              tabIndex={0}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolDetailsModal;

