"use client";

import { useState } from "react";
import { getInvoiceByRef, payInvoiceByRef } from "@/lib/server-actions/invoices";

interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  userEmail?: string;
}

const PayModal = ({ isOpen, onClose, onSuccess, userId, userEmail }: PayModalProps) => {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invoice, setInvoice] = useState<any | null>(null);
  const [step, setStep] = useState<"lookup" | "review" | "success">("lookup");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLookupLoading(true);

    try {
      if (!referenceNumber.trim()) {
        setError("Please enter a reference number");
        setLookupLoading(false);
        return;
      }

      const result = await getInvoiceByRef(referenceNumber.trim());

      if (result.success && result.invoice) {
        // Check if invoice is already paid
        if (result.invoice.status === "paid") {
          setError("This invoice has already been paid");
          setLookupLoading(false);
          return;
        }

        // Check if invoice is for this user's wallet
        // Note: We'll verify this in the payment step, but we can show a warning
        setInvoice(result.invoice);
        setStep("review");
      } else {
        setError(result.error || "Invoice not found with this reference number");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error looking up invoice:", err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePay = async () => {
    if (!invoice) return;

    setError("");
    setLoading(true);

    try {
      const result = await payInvoiceByRef(referenceNumber.trim(), userId, userEmail);

      if (result.success) {
        setSuccess(`Invoice paid successfully! Amount: $${result.amount?.toFixed(2)}`);
        setStep("success");
        
        // Close modal after a brief delay
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to process payment");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error processing payment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReferenceNumber("");
    setError("");
    setSuccess("");
    setInvoice(null);
    setStep("lookup");
    onClose();
  };

  const handleBack = () => {
    setInvoice(null);
    setStep("lookup");
    setError("");
  };

  if (!isOpen) return null;

  // Calculate fee if invoice exists
  const feeAmount = invoice ? invoice.amount * 0.05 : 0;
  const totalDeducted = invoice ? invoice.amount + feeAmount : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto m-3 sm:m-0"
        style={{ backgroundColor: '#d6d6c2' }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 rounded-t-2xl" style={{ backgroundColor: '#d6d6c2' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h2 id="pay-modal-title" className="text-2xl font-bold" style={{ color: '#800000' }}>
                  {step === "lookup" ? "Pay Invoice" : step === "review" ? "Review Invoice" : "Payment Successful"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-[#800000]/50 hover:text-[#800000] transition-colors"
                tabIndex={0}
                aria-label="Close modal"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClose();
                  }
                }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
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
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
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
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* Step 1: Lookup Invoice */}
            {step === "lookup" && (
              <form onSubmit={handleLookup} className="space-y-5">
                <div>
                  <label
                    htmlFor="reference-number"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#800000' }}
                  >
                    Invoice Reference Number
                  </label>
                  <input
                    id="reference-number"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => {
                      setReferenceNumber(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all font-mono text-center text-base sm:text-lg placeholder:text-[#800000] touch-manipulation"
                    style={{ color: '#800000', backgroundColor: '#ebebe0' }}
                    placeholder="Enter reference number"
                    required
                    disabled={lookupLoading}
                    autoComplete="off"
                    inputMode="text"
                  />
                  <p className="mt-2 text-xs text-center" style={{ color: '#800000' }}>
                    Enter the invoice reference number you received
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={lookupLoading}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#ebebeb', color: '#800000' }}
                    onMouseEnter={(e) => !lookupLoading && (e.currentTarget.style.backgroundColor = '#d4d4d4')}
                    onMouseLeave={(e) => !lookupLoading && (e.currentTarget.style.backgroundColor = '#ebebeb')}
                    tabIndex={0}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={lookupLoading || !referenceNumber.trim()}
                    className="flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#800000' }}
                    onMouseEnter={(e) => !lookupLoading && referenceNumber.trim() && (e.currentTarget.style.backgroundColor = '#6b0000')}
                    onMouseLeave={(e) => !lookupLoading && referenceNumber.trim() && (e.currentTarget.style.backgroundColor = '#800000')}
                  >
                    {lookupLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Looking up...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Lookup Invoice
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Review Invoice */}
            {step === "review" && invoice && (
              <div className="space-y-5">
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <p className="text-sm mb-1" style={{ color: '#800000' }}>Invoice Amount</p>
                    <p className="text-3xl font-bold" style={{ color: '#800000' }}>
                      ${invoice.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Reference Number:</span>
                    <span className="text-sm font-mono" style={{ color: '#800000' }}>{invoice.ref}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>From:</span>
                    <span className="text-sm" style={{ color: '#800000' }}>{invoice.issuerEmail}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-semibold" style={{ color: '#800000' }}>Purpose:</span>
                    <span className="text-sm" style={{ color: '#800000' }}>{invoice.purpose}</span>
                  </div>
                  {invoice.note && (
                    <div className="py-2 border-b border-gray-200">
                      <span className="text-sm font-semibold block mb-1" style={{ color: '#800000' }}>Note:</span>
                      <span className="text-sm" style={{ color: '#800000' }}>{invoice.note}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-semibold text-[#800000]">Status:</span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                      invoice.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="border-2 border-gray-200 rounded-lg p-4 space-y-2" style={{ backgroundColor: '#ebebe0' }}>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: '#800000' }}>Invoice Amount:</span>
                    <span className="font-semibold" style={{ color: '#800000' }}>
                      ${invoice.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: '#800000' }}>System Fee (5%):</span>
                    <span className="font-semibold" style={{ color: '#800000' }}>
                      ${feeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold" style={{ color: '#800000' }}>Total Deducted:</span>
                      <span className="font-bold text-lg" style={{ color: '#800000' }}>
                        ${totalDeducted.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#ebebeb', color: '#800000' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#d4d4d4')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#ebebeb')}
                    tabIndex={0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={loading}
                    className="flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#800000' }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6b0000')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#800000')}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Pay Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === "success" && (
              <div className="text-center space-y-4 py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#800000' }}>Payment Successful!</h3>
                <p style={{ color: '#800000' }}>Your invoice has been paid successfully.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayModal;

