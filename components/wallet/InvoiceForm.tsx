"use client";

import { useState } from "react";
import { createInvoice } from "@/lib/server-actions/invoices";
import { getRecipientInfoByWalletId } from "@/lib/server-actions/wallet";
import { useRouter } from "next/navigation";

interface InvoiceFormProps {
  userId: string;
  userEmail?: string;
}

interface RecipientInfo {
  walletId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const InvoiceForm = ({ userId, userEmail }: InvoiceFormProps) => {
  const router = useRouter();
  const [recipientWalletId, setRecipientWalletId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(false);
  const [success, setSuccess] = useState("");

  // Calculate total amount
  const calculateTotal = (): number => {
    const amountNum = parseFloat(amount) || 0;
    const quantityNum = parseFloat(quantity) || 1;
    return amountNum * quantityNum;
  };

  const total = calculateTotal();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoadingRecipient(true);

    try {
      // Validate wallet ID format (3 letters + 3 digits)
      const walletIdPattern = /^[A-Z]{3}\d{3}$/i;
      if (!walletIdPattern.test(recipientWalletId.trim())) {
        setError("Invalid Wallet ID format. Please enter a valid Wallet ID (e.g., VXE445)");
        setLoadingRecipient(false);
        return;
      }

      if (!itemDescription.trim()) {
        setError("Item description is required");
        setLoadingRecipient(false);
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount greater than 0");
        setLoadingRecipient(false);
        return;
      }

      const quantityNum = quantity ? parseFloat(quantity) : undefined;
      if (quantityNum !== undefined && (isNaN(quantityNum) || quantityNum <= 0)) {
        setError("Quantity must be greater than 0 if provided");
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
      const quantityNum = quantity ? parseFloat(quantity) : undefined;

      const result = await createInvoice(
        userId,
        recipientInfo.walletId,
        itemDescription.trim(),
        amountNum,
        quantityNum,
        note.trim() || undefined,
        userEmail
      );

      if (result.success) {
        setSuccess("Invoice created and sent successfully!");
        setRecipientWalletId("");
        setItemDescription("");
        setAmount("");
        setQuantity("");
        setNote("");
        setRecipientInfo(null);
        setStep("form");
        
        // Redirect to invoices page after 2 seconds
        setTimeout(() => {
          router.push("/wallet/invoices");
        }, 2000);
      } else {
        setError(result.error || "Failed to create invoice");
        setStep("form");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error creating invoice:", err);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setStep("form");
    setRecipientInfo(null);
    setError("");
  };

  const handleReset = () => {
    setRecipientWalletId("");
    setItemDescription("");
    setAmount("");
    setQuantity("");
    setNote("");
    setError("");
    setSuccess("");
    setStep("form");
    setRecipientInfo(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: '#800000' }}>
        Create Invoice/Receipt
      </h2>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {step === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient-wallet-id" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Recipient Wallet ID <span className="text-red-500">*</span>
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
            <label htmlFor="item-description" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Item Description <span className="text-red-500">*</span>
            </label>
            <input
              id="item-description"
              type="text"
              value={itemDescription}
              onChange={(e) => {
                setItemDescription(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="e.g., Monthly Rent, Car Purchase, Consultation Services"
              required
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                Amount (per item) <span className="text-red-500">*</span>
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
              <label htmlFor="quantity" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
                Quantity (Optional)
              </label>
              <input
                id="quantity"
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (error) setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation"
                style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                placeholder="1"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
          </div>

          {total > 0 && (
            <div className="bg-[#ebebe0] border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#800000' }}>Total Amount:</span>
                <span className="text-xl font-bold" style={{ color: '#800000' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Additional Notes (Optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-base placeholder:text-[#800000] touch-manipulation resize-none"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="Add any additional notes or details..."
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 px-6 py-3 bg-gray-200 text-[#800000] rounded-lg font-semibold hover:bg-gray-300 transition-colors touch-manipulation"
              disabled={loading || loadingRecipient}
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              disabled={loading || loadingRecipient}
            >
              {loadingRecipient ? "Validating..." : "Continue"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#ebebe0] border border-gray-300 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: '#800000' }}>Review Invoice Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm" style={{ color: '#800000' }}>Recipient Wallet ID</p>
                <p className="text-base font-mono font-semibold" style={{ color: '#800000' }}>
                  {recipientInfo?.walletId}
                </p>
              </div>

              <div>
                <p className="text-sm" style={{ color: '#800000' }}>Recipient Name</p>
                <p className="text-base font-semibold" style={{ color: '#800000' }}>
                  {recipientInfo?.firstName} {recipientInfo?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm" style={{ color: '#800000' }}>Item Description</p>
                <p className="text-base font-semibold" style={{ color: '#800000' }}>
                  {itemDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm" style={{ color: '#800000' }}>Amount (per item)</p>
                  <p className="text-base font-semibold" style={{ color: '#800000' }}>
                    ${parseFloat(amount || "0").toFixed(2)}
                  </p>
                </div>
                {quantity && (
                  <div>
                    <p className="text-sm" style={{ color: '#800000' }}>Quantity</p>
                    <p className="text-base font-semibold" style={{ color: '#800000' }}>
                      {quantity}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <p className="text-base font-semibold" style={{ color: '#800000' }}>Total Amount</p>
                  <p className="text-2xl font-bold" style={{ color: '#800000' }}>
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              {note && (
                <div>
                  <p className="text-sm" style={{ color: '#800000' }}>Notes</p>
                  <p className="text-base" style={{ color: '#800000' }}>
                    {note}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancelConfirmation}
              className="flex-1 px-6 py-3 bg-gray-200 text-[#800000] rounded-lg font-semibold hover:bg-gray-300 transition-colors touch-manipulation"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSend}
              className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Invoice"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
