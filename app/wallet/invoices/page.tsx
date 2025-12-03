"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { getUserInvoices } from "@/lib/server-actions/invoices";
import { payInvoiceByRef } from "@/lib/server-actions/invoices";
import { getBalance } from "@/lib/server-actions/wallet";
import toast from "react-hot-toast";

interface Invoice {
  _id: string;
  ref: string;
  type: "issued" | "received";
  issuerEmail: string;
  recipientWalletId: string;
  recipientEmail: string;
  amountCents: number;
  amount: number;
  purpose: string;
  note?: string;
  status: "unpaid" | "paid";
  createdAt: string;
  paidAt?: string;
}

const InvoicesPage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<{
    issued: Invoice[];
    received: Invoice[];
  }>({ issued: [], received: [] });
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"received" | "issued">("received");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [checkingWallet, setCheckingWallet] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  // Check if user has a wallet
  useEffect(() => {
    const checkWallet = async () => {
      if (!user?.id) {
        setHasWallet(false);
        setCheckingWallet(false);
        return;
      }

      try {
        setCheckingWallet(true);
        const balanceResult = await getBalance(user.id, user.email);
        // If getBalance succeeds, user has a wallet
        setHasWallet(balanceResult.success && balanceResult.walletId !== undefined);
      } catch (err) {
        setHasWallet(false);
      } finally {
        setCheckingWallet(false);
      }
    };

    if (user?.id) {
      checkWallet();
    } else {
      setHasWallet(false);
      setCheckingWallet(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id || !hasWallet) {
        setLoadingInvoices(false);
        return;
      }

      try {
        setLoadingInvoices(true);
        setError("");
        const result = await getUserInvoices(user.id, user.email);
        if (result.success) {
          const filterValidInvoices = (invoices: any[]): Invoice[] => {
            return invoices
              .filter((inv) => inv._id && inv.ref)
              .map((inv) => ({
                ...inv,
                _id: inv._id as string,
                ref: inv.ref as string,
              }));
          };
          setInvoices({
            issued: filterValidInvoices(result.issued || []),
            received: filterValidInvoices(result.received || []),
          });
        } else {
          setError(result.error || "Failed to load invoices");
        }
      } catch (err) {
        setError("An error occurred while loading invoices");
        console.error("Error fetching invoices:", err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    if (user?.id && hasWallet) {
      fetchInvoices();
    }
  }, [user?.id, user?.email, hasWallet]);

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!user?.id) return;

    setPayError("");
    setPayingInvoiceId(invoice._id);

    try {
      const result = await payInvoiceByRef(invoice.ref, user.id, user.email);
      if (result.success) {
        toast.success(`Invoice paid successfully! Amount: $${result.amount?.toFixed(2)}`);
        // Refresh invoices
        const refreshResult = await getUserInvoices(user.id, user.email);
        if (refreshResult.success) {
          const filterValidInvoices = (invoices: any[]): Invoice[] => {
            return invoices
              .filter((inv) => inv._id && inv.ref)
              .map((inv) => ({
                ...inv,
                _id: inv._id as string,
                ref: inv.ref as string,
              }));
          };
          setInvoices({
            issued: filterValidInvoices(refreshResult.issued || []),
            received: filterValidInvoices(refreshResult.received || []),
          });
        }
      } else {
        const errorMsg = result.error || "Failed to pay invoice";
        setPayError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setPayError("An error occurred while paying invoice");
      console.error("Error paying invoice:", err);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: "unpaid" | "paid") => {
    if (status === "paid") {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Unpaid
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentInvoices = activeTab === "received" ? invoices.received : invoices.issued;

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {checkingWallet ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
                <p style={{ color: '#800000' }}>Checking wallet status...</p>
              </div>
            </div>
          ) : !hasWallet ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md w-full">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full" style={{ backgroundColor: '#f5f5f0' }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
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
                <h2 className="text-2xl font-bold mb-3" style={{ color: '#800000' }}>
                  Wallet Required
                </h2>
                <p className="text-lg mb-6" style={{ color: '#800000' }}>
                  You need a wallet to view and manage invoices. Complete your KYC application to get approved and receive your digital wallet.
                </p>
              </div>
              <button
                onClick={() => router.push("/kyc")}
                className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                style={{ backgroundColor: '#800000' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
                Apply for Wallet
              </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#800000' }}>
                  Invoices
                </h1>
                <p className="text-sm" style={{ color: '#800000' }}>
                  View and manage your received and issued invoices
                </p>
              </div>

              {/* Tabs */}
              <div className="mb-6 border-b border-gray-300">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("received")}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                      activeTab === "received"
                        ? "border-[#800000] text-[#800000]"
                        : "border-transparent text-gray-500 hover:text-[#800000]"
                    }`}
                    aria-selected={activeTab === "received"}
                    role="tab"
                  >
                    Received ({invoices.received.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("issued")}
                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                      activeTab === "issued"
                        ? "border-[#800000] text-[#800000]"
                        : "border-transparent text-gray-500 hover:text-[#800000]"
                    }`}
                    aria-selected={activeTab === "issued"}
                    role="tab"
                  >
                    Send Invoice ({invoices.issued.length})
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {payError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {payError}
                  <button
                    onClick={() => setPayError("")}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}

              {loadingInvoices ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000] mx-auto mb-4"></div>
                  <p style={{ color: '#800000' }}>Loading invoices...</p>
                </div>
              ) : currentInvoices.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-lg" style={{ color: '#800000' }}>
                    {activeTab === "received" 
                      ? "No received invoices found."
                      : "No sent invoices found."}
                  </p>
                  {activeTab === "issued" && (
                    <button
                      onClick={() => router.push("/wallet/invoices/create")}
                      className="mt-4 px-6 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#800000' }}
                    >
                      Create Invoice
                    </button>
                  )}
                </div>
              ) : (
            <div className="space-y-4">
              {currentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-1" style={{ color: '#800000' }}>
                            {invoice.purpose}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Reference: <span className="font-mono">{invoice.ref}</span>
                          </p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-lg font-bold" style={{ color: '#800000' }}>
                            ${invoice.amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {activeTab === "received" ? "From" : "To"}
                          </p>
                          <p className="text-sm font-semibold" style={{ color: '#800000' }}>
                            {invoice.status === "paid" ? (
                              // For paid invoices, swap the display based on tab
                              activeTab === "received"
                                ? `${invoice.recipientWalletId} (${invoice.recipientEmail})` // Issuer sees who paid them
                                : invoice.issuerEmail // Payer sees who they paid
                            ) : (
                              // For unpaid invoices, show original roles
                              activeTab === "received"
                                ? invoice.issuerEmail // Recipient sees who sent it
                                : `${invoice.recipientWalletId} (${invoice.recipientEmail})` // Issuer sees who they sent it to
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm" style={{ color: '#800000' }}>
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        {invoice.status === "paid" && invoice.paidAt && (
                          <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="text-sm" style={{ color: '#800000' }}>
                              {formatDate(invoice.paidAt)}
                            </p>
                          </div>
                        )}
                      </div>

                      {invoice.note && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="text-sm" style={{ color: '#800000' }}>
                            {invoice.note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-shrink-0">
                      {activeTab === "received" && invoice.status === "unpaid" && (
                        <button
                          onClick={() => handlePayInvoice(invoice)}
                          disabled={payingInvoiceId === invoice._id}
                          className="px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          style={{ backgroundColor: '#800000' }}
                        >
                          {payingInvoiceId === invoice._id ? "Processing..." : "Pay Invoice"}
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/wallet/invoices/${invoice._id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors touch-manipulation"
                        style={{ color: '#800000' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
