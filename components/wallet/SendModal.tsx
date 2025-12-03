"use client";

import { useState } from "react";
import { sendMoney, getRecipientInfoByWalletId } from "@/lib/server-actions/wallet";
import toast from "react-hot-toast";

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail?: string;
}

interface RecipientInfo {
  walletId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const SendModal = ({ isOpen, onClose, onSuccess, userId, userEmail }: SendModalProps) => {
  const [recipientWalletId, setRecipientWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingRecipient(true);

    try {
      // Validate wallet ID format (3 letters + 3 digits)
      const walletIdPattern = /^[A-Z]{3}\d{3}$/i;
      if (!walletIdPattern.test(recipientWalletId.trim())) {
        setError("Invalid Wallet ID format. Please enter a valid Wallet ID (e.g., VXE445)");
        setLoadingRecipient(false);
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount");
        setLoadingRecipient(false);
        return;
      }

      // Get recipient information
      const recipientResult = await getRecipientInfoByWalletId(recipientWalletId.trim().toUpperCase());
      
      if (recipientResult.success && recipientResult.recipient) {
        setRecipientInfo(recipientResult.recipient);
        setStep("confirmation");
      } else {
        setError(recipientResult.error || "Failed to get recipient information");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error getting recipient info:", err);
    } finally {
      setLoadingRecipient(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!recipientInfo) return;

    setError("");
    setLoading(true);

    try {
      const amountNum = parseFloat(amount);
      const result = await sendMoney(
        userId,
        recipientInfo.walletId,
        amountNum,
        note || undefined,
        userEmail
      );

      if (result.success) {
        toast.success(result.message || `Successfully sent $${amountNum.toFixed(2)}! Reference: ${result.ref || "N/A"}`);
        setRecipientWalletId("");
        setAmount("");
        setNote("");
        setRecipientInfo(null);
        setStep("form");
        onSuccess();
        onClose();
      } else {
        const errorMsg = result.error || "Failed to send money";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error sending money:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setStep("form");
    setRecipientInfo(null);
    setError("");
  };

  const handleClose = () => {
    setRecipientWalletId("");
    setAmount("");
    setNote("");
    setError("");
    setStep("form");
    setRecipientInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-modal-title"
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

        <h2 id="send-modal-title" className="text-2xl font-bold mb-6" style={{ color: '#800000' }}>
          {step === "form" ? "Send Money" : "Confirm Transaction"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === "form" ? (
          <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient-wallet-id" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Recipient Wallet ID
            </label>
            <input
              id="recipient-wallet-id"
              type="text"
              value={recipientWalletId}
              onChange={(e) => {
                setRecipientWalletId(e.target.value.toUpperCase());
                if (error) setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all font-mono text-center text-base sm:text-lg tracking-wider placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="VXE445"
              pattern="[A-Z]{3}\d{3}"
              maxLength={6}
              required
              autoComplete="off"
              inputMode="text"
            />
            <p className="mt-1 text-xs" style={{ color: '#800000' }}>
              Enter the recipient's Wallet ID (e.g., VXE445)
            </p>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#800000' }}>$</span>
              <input
                id="amount"
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
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Note (Optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all resize-none text-base placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="Add a note..."
              rows={3}
              autoComplete="off"
            />
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
              disabled={loadingRecipient}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !loadingRecipient && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !loadingRecipient && (e.currentTarget.style.backgroundColor = '#800000')}
            >
              {loadingRecipient ? "Verifying..." : "Continue"}
            </button>
          </div>
        </form>
        ) : (
          <div className="space-y-6">
            {/* Confirmation Details */}
            <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: '#ebebe0' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#800000' }}>Transaction Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#800000' }}>Amount:</span>
                  <span className="text-lg font-bold" style={{ color: '#800000' }}>${parseFloat(amount || "0").toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#800000' }}>Recipient Wallet ID:</span>
                  <span className="text-sm font-mono font-semibold" style={{ color: '#800000' }}>{recipientInfo?.walletId}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#800000' }}>Recipient Name:</span>
                  <span className="text-sm font-semibold" style={{ color: '#800000' }}>
                    {recipientInfo?.firstName} {recipientInfo?.lastName}
                  </span>
                </div>
                
                {note && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium block mb-1" style={{ color: '#800000' }}>Note:</span>
                    <span className="text-sm" style={{ color: '#800000' }}>{note}</span>
                  </div>
                )}
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
                onClick={handleConfirmSend}
                disabled={loading}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#800000' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6b0000')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#800000')}
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendModal;

