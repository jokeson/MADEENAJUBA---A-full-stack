"use client";

import { useState, useEffect } from "react";
import { purchaseTicket } from "@/lib/server-actions/events";
import { getBalance } from "@/lib/server-actions/wallet";
import { formatCurrency } from "@/lib/format";

interface BuyTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  eventTitle: string;
  ticketPriceCents: number;
  ticketQuantity: number;
  userId: string;
  userEmail?: string;
}

const BuyTicketModal = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  ticketPriceCents,
  ticketQuantity,
  userId,
  userEmail,
}: BuyTicketModalProps) => {
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadBalance();
    }
  }, [isOpen, userId]);

  const loadBalance = async () => {
    setLoadingBalance(true);
    try {
      const result = await getBalance(userId, userEmail);
      if (result.success) {
        setBalance(result.balance);
      } else {
        setError(result.error || "Failed to load balance");
      }
    } catch (err) {
      console.error("Error loading balance:", err);
      setError("Failed to load wallet balance");
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (qty > ticketQuantity) {
      setError(`Only ${ticketQuantity} tickets available`);
      return;
    }

    const totalCost = (ticketPriceCents / 100) * qty;
    if (balance === null || balance < totalCost) {
      setError("Insufficient balance to purchase tickets");
      return;
    }

    setLoading(true);

    try {
      const result = await purchaseTicket(eventId, userId, qty, userEmail);

      if (result.success) {
        setQuantity("1");
        setError("");
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to purchase tickets");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error purchasing tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity("1");
    setError("");
    onClose();
  };

  const quantityNum = parseInt(quantity) || 0;
  const totalCost = (ticketPriceCents / 100) * quantityNum;
  const pricePerTicket = ticketPriceCents / 100;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="buy-ticket-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-lg p-4 xs:p-6 sm:p-8 m-3 sm:m-0 max-h-[90vh] overflow-y-auto"
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

        <h2 id="buy-ticket-modal-title" className="text-2xl font-bold mb-6" style={{ color: '#800000' }}>
          Buy Tickets
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Event
            </label>
            <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: '#ebebe0', color: '#800000' }}>
              <p className="font-semibold">{eventTitle}</p>
            </div>
          </div>

          {/* Available Tickets */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Tickets Available
            </label>
            <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: '#ebebe0', color: '#800000' }}>
              <p className="font-semibold">{ticketQuantity} tickets</p>
            </div>
          </div>

          {/* Price Per Ticket */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Price Per Ticket
            </label>
            <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: '#ebebe0', color: '#800000' }}>
              <p className="font-semibold">{formatCurrency(pricePerTicket)}</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Your Wallet Balance
            </label>
            <div className="px-4 py-3 rounded-lg" style={{ backgroundColor: '#ebebe0', color: '#800000' }}>
              {loadingBalance ? (
                <p className="text-sm">Loading...</p>
              ) : balance !== null ? (
                <p className="font-semibold">{formatCurrency(balance)}</p>
              ) : (
                <p className="text-sm text-red-600">Unable to load balance</p>
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2" style={{ color: '#800000' }}>
              Number of Tickets
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={ticketQuantity}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || (parseInt(val) > 0 && parseInt(val) <= ticketQuantity)) {
                  setQuantity(val);
                  if (error) setError("");
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all text-center text-base placeholder:text-[#800000] touch-manipulation"
              style={{ color: '#800000', backgroundColor: '#ebebe0' }}
              placeholder="1"
              required
              autoComplete="off"
              inputMode="numeric"
            />
            <p className="mt-1 text-xs" style={{ color: '#800000' }}>
              Maximum {ticketQuantity} tickets available
            </p>
          </div>

          {/* Total Cost */}
          {quantityNum > 0 && (
            <div className="p-4 rounded-lg border-2" style={{ borderColor: '#800000', backgroundColor: '#ebebe0' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#800000' }}>Total Cost:</span>
                <span className="text-xl font-bold" style={{ color: '#800000' }}>
                  {formatCurrency(totalCost)}
                </span>
              </div>
              {balance !== null && (
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#800000' }}>Balance After:</span>
                  <span className={`text-sm font-semibold ${balance >= totalCost ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance - totalCost)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
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
              disabled={loading || loadingBalance || quantityNum <= 0 || quantityNum > ticketQuantity || (balance !== null && balance < totalCost)}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#800000' }}
              onMouseEnter={(e) => !loading && !loadingBalance && (e.currentTarget.style.backgroundColor = '#6b0000')}
              onMouseLeave={(e) => !loading && !loadingBalance && (e.currentTarget.style.backgroundColor = '#800000')}
            >
              {loading ? "Processing..." : "Buy Tickets"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuyTicketModal;

