"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import CreateInvoiceModal from "@/components/wallet/CreateInvoiceModal";
import { getUserInvoices } from "@/lib/server-actions/invoices";
import { payInvoiceByRef } from "@/lib/server-actions/invoices";

interface Invoice {
  _id?: string;
  ref?: string;
  recipientWalletId: string;
  recipientEmail: string;
  issuerEmail?: string;
  amountCents: number;
  amount: number;
  purpose?: string;
  note?: string;
  status: "unpaid" | "paid";
  createdAt: string;
  paidAt?: string;
}

const CreateInvoicePage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sentInvoices, setSentInvoices] = useState<Invoice[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState("");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) return;

      try {
        setLoadingInvoices(true);
        setError("");
        const result = await getUserInvoices(user.id, user.email);
        if (result.success) {
          setSentInvoices(result.issued || []);
          setReceivedInvoices(result.received || []);
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

    if (user?.id) {
      fetchInvoices();
    }
  }, [user]);

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!user?.id || !invoice.ref) return;

    setPayError("");
    setPayingInvoiceId(invoice._id || null);

    try {
      const result = await payInvoiceByRef(invoice.ref, user.id, user.email);
      if (result.success) {
        // Refresh invoices
        const refreshResult = await getUserInvoices(user.id, user.email);
        if (refreshResult.success) {
          setSentInvoices(refreshResult.issued || []);
          setReceivedInvoices(refreshResult.received || []);
        }
      } else {
        setPayError(result.error || "Failed to pay invoice");
      }
    } catch (err) {
      setPayError("An error occurred while paying invoice");
      console.error("Error paying invoice:", err);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleInvoiceSuccess = () => {
    // Refresh invoices after successful creation
    if (user?.id) {
      getUserInvoices(user.id, user.email).then((result) => {
        if (result.success) {
          setSentInvoices(result.issued || []);
          setReceivedInvoices(result.received || []);
        }
      });
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

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#800000' }}>
                Create Invoice/Receipt
              </h1>
              <p className="text-sm" style={{ color: '#800000' }}>
                Create new invoices or view your sent invoices
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap"
              style={{ backgroundColor: '#800000' }}
            >
              Create Invoice
            </button>
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
                Received ({receivedInvoices.length})
              </button>
              <button
                onClick={() => setActiveTab("sent")}
                className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                  activeTab === "sent"
                    ? "border-[#800000] text-[#800000]"
                    : "border-transparent text-gray-500 hover:text-[#800000]"
                }`}
                aria-selected={activeTab === "sent"}
                role="tab"
              >
                Sent ({sentInvoices.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
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
            ) : activeTab === "received" && receivedInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-lg" style={{ color: '#800000' }}>
                  No received invoices found.
                </p>
              </div>
            ) : activeTab === "sent" && sentInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-lg" style={{ color: '#800000' }}>
                  No sent invoices found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === "received" ? receivedInvoices : sentInvoices).map((invoice) => (
                    <div
                      key={invoice._id || invoice.ref || Math.random()}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold mb-1" style={{ color: '#800000' }}>
                                {invoice.purpose || "Invoice"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Reference: <span className="font-mono">{invoice.ref || "N/A"}</span>
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
                                {activeTab === "received"
                                  ? invoice.issuerEmail || "Unknown"
                                  : `${invoice.recipientWalletId} (${invoice.recipientEmail})`}
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
                              disabled={payingInvoiceId === invoice._id || !invoice.ref}
                              className="px-4 py-2 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                              style={{ backgroundColor: '#800000' }}
                            >
                              {payingInvoiceId === invoice._id ? "Processing..." : "Pay Invoice"}
                            </button>
                          )}
                          {invoice._id && (
                            <button
                              onClick={() => router.push(`/wallet/invoices/${invoice._id}`)}
                              className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors touch-manipulation"
                              style={{ color: '#800000' }}
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {user && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleInvoiceSuccess}
          userId={user.id}
          userEmail={user.email}
        />
      )}
    </div>
  );
};

export default CreateInvoicePage;
