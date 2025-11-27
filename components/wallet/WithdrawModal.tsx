"use client";

import { useState } from "react";
import { requestCash } from "@/lib/server-actions/wallet";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail?: string;
}

const WithdrawModal = ({ isOpen, onClose, onSuccess, userId, userEmail }: WithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "confirmation">("form");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      // Move to confirmation step
      setStep("confirmation");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error validating amount:", err);
    }
  };

  const handleConfirmWithdraw = async () => {
    setError("");
    setLoading(true);

    try {
      const amountNum = parseFloat(amount);
      const result = await requestCash(userId, amountNum, userEmail);

      if (result.success) {
        setAmount("");
        setStep("form");
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to request withdrawal");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error requesting withdrawal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setStep("form");
    setError("");
  };

  const handleClose = () => {
    setAmount("");
    setError("");
    setStep("form");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl m-3 sm:m-0"
        style={{ backgroundColor: '#d6d6c2' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 transition-colors"
          style={{ color: '#800000' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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

        <h2 id="withdraw-modal-title" className="text-2xl font-bold mb-6" style={{ color: '#800000' }}>
          {step === "form" ? "Withdraw Cash" : "Confirm Withdrawal"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Amount to Withdraw
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#800000' }}>$</span>
              <input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError("");
                }}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                placeholder="0.00"
                required
                autoComplete="off"
                inputMode="decimal"
              />
            </div>
            <p className="mt-2 text-sm" style={{ color: '#800000' }}>
              Your withdrawal request will be processed and reviewed.
            </p>
          </div>

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
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#800000')}
            >
              Continue
            </button>
          </div>
        </form>
        ) : (
          <div className="space-y-6">
            {/* Confirmation Details */}
            <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: '#ebebe0' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#800000' }}>Withdrawal Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#800000' }}>Withdrawal Amount:</span>
                  <span className="text-lg font-bold" style={{ color: '#800000' }}>${parseFloat(amount || "0").toFixed(2)}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">Important Notice</p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          If your withdrawal request is not processed within 24 hours, the money will automatically be returned to your wallet account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#ebebeb', color: '#800000' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#d4d4d4')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ebebeb')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={loading}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#800000' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6b0000')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#800000')}
              >
                {loading ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;

