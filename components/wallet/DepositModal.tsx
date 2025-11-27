"use client";

import { useState } from "react";
import { redeemCode } from "@/lib/server-actions/wallet";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail?: string;
}

const DepositModal = ({ isOpen, onClose, onSuccess, userId, userEmail }: DepositModalProps) => {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await redeemCode(userId, code, pin, userEmail);

      if (result.success) {
        setCode("");
        setPin("");
        setSuccess(result.message || "Deposit successful!");
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to deposit");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error depositing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setPin("");
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl m-3 sm:m-0"
        style={{ backgroundColor: '#d6d6c2' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-[#800000]/50 hover:text-[#800000] transition-colors"
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

        <h2 id="deposit-modal-title" className="text-2xl font-bold mb-6" style={{ color: '#800000' }}>
          Deposit Money
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="deposit-code" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Redeem Code
            </label>
            <input
              id="deposit-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-center text-base sm:text-lg font-mono tracking-widest placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="Enter redeem code (e.g., 7646-6789-7865-5000)"
              required
              autoComplete="off"
              inputMode="text"
            />
          </div>
          <div>
            <label htmlFor="deposit-pin" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              4-Digit PIN
            </label>
            <input
              id="deposit-pin"
              type="text"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                if (error) setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-center text-base sm:text-lg font-mono tracking-widest placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              required
              autoComplete="off"
              inputMode="numeric"
            />
            <p className="mt-2 text-sm" style={{ color: '#800000' }}>
              Enter both the redeem code and 4-digit PIN to add funds to your wallet.
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
              disabled={loading || !!success}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = '#800000')}
            >
              {loading ? "Processing..." : success ? "Success!" : "Redeem Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;

