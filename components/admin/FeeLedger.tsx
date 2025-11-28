"use client";

import { useState, useEffect } from "react";
import { getAllFees, depositTotalFees, getDepositedTicketFees } from "@/lib/server-actions/admin";
import { useAuth } from "@/contexts/AuthContext";

interface FeeTransaction {
  _id: string;
  type: "p2p" | "ticket" | "invoice" | "withdrawal";
  amount: number;
  fee: number;
  percentage: number;
  fromWalletId?: string;
  toWalletId?: string;
  ref: string;
  createdAt: string;
  deposited?: boolean;
  depositedAt?: string;
}

interface DepositedTicketFee {
  _id: string;
  feeType: "p2p" | "ticket" | "invoice" | "withdrawal";
  fromWalletId: string;
  depositAmount: number;
  depositAmountCents: number;
  date: string;
  time: string;
  createdAt: string;
  depositedAt: string;
  ref: string;
}

type TabType = "all" | "deposit";

const ITEMS_PER_PAGE = 10;

const FeeLedger = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [fees, setFees] = useState<FeeTransaction[]>([]);
  const [depositedTicketFees, setDepositedTicketFees] = useState<DepositedTicketFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const [currentPageDeposit, setCurrentPageDeposit] = useState(1);
  const [error, setError] = useState<string>("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string>("");
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);

  useEffect(() => {
    const loadFees = async () => {
      try {
        setLoading(true);
        setError("");
        const feesData = await getAllFees();
        setFees(feesData);
      } catch (err) {
        console.error("Error loading fees:", err);
        setError("Failed to load fees");
      } finally {
        setLoading(false);
      }
    };
    loadFees();
  }, []);

  useEffect(() => {
    const loadDepositedTicketFees = async () => {
      if (activeTab === "deposit") {
        try {
          setDepositLoading(true);
          setError("");
          const depositedFees = await getDepositedTicketFees();
          // Filter out fees without depositedAt (shouldn't happen for deposited fees, but type safety)
          const validDepositedFees = depositedFees.filter((fee): fee is DepositedTicketFee => 
            fee.depositedAt !== undefined
          );
          setDepositedTicketFees(validDepositedFees);
          setCurrentPageDeposit(1); // Reset to first page when loading new data
        } catch (err) {
          console.error("Error loading deposited ticket fees:", err);
          setError("Failed to load deposited ticket fees");
        } finally {
          setDepositLoading(false);
        }
      }
    };
    loadDepositedTicketFees();
  }, [activeTab]);

  // Reset page when switching tabs
  useEffect(() => {
    if (activeTab === "all") {
      setCurrentPageAll(1);
    } else {
      setCurrentPageDeposit(1);
    }
  }, [activeTab]);

  // Pagination calculations for All Fees tab
  const totalPagesAll = Math.ceil(fees.length / ITEMS_PER_PAGE);
  const startIndexAll = (currentPageAll - 1) * ITEMS_PER_PAGE;
  const endIndexAll = startIndexAll + ITEMS_PER_PAGE;
  const currentFees = fees.slice(startIndexAll, endIndexAll);

  // Pagination calculations for Deposit to Wallet tab
  const totalPagesDeposit = Math.ceil(depositedTicketFees.length / ITEMS_PER_PAGE);
  const startIndexDeposit = (currentPageDeposit - 1) * ITEMS_PER_PAGE;
  const endIndexDeposit = startIndexDeposit + ITEMS_PER_PAGE;
  const currentDepositedFees = depositedTicketFees.slice(startIndexDeposit, endIndexDeposit);

  // Generate page numbers array
  const getPageNumbers = (totalPages: number, currentPage: number) => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Only count undeposited fees in totals
  const undepositedFees = fees.filter((f) => !f.deposited);
  const totalFees = undepositedFees.reduce((sum, fee) => sum + fee.fee, 0);
  const p2pFees = undepositedFees.filter((f) => f.type === "p2p").reduce((sum, f) => sum + f.fee, 0);
  const ticketFees = undepositedFees.filter((f) => f.type === "ticket").reduce((sum, f) => sum + f.fee, 0);
  const invoiceFees = undepositedFees.filter((f) => f.type === "invoice").reduce((sum, f) => sum + f.fee, 0);
  const withdrawalFees = undepositedFees.filter((f) => f.type === "withdrawal").reduce((sum, f) => sum + f.fee, 0);

  const handleDeposit = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setDepositing(true);
    setError("");
    setDepositSuccess("");

    try {
      const result = await depositTotalFees(user.id);
      
      if (result.success) {
        const walletInfo = result.walletId ? ` (Wallet ID: ${result.walletId})` : "";
        setDepositSuccess(
          `✅ Successfully deposited $${result.amount?.toFixed(2) || "0.00"} into admin wallet${walletInfo}`
        );
        setShowDepositConfirm(false);
        // Reload fees after successful deposit
        const feesData = await getAllFees();
        setFees(feesData);
        // Clear success message after 8 seconds (increased visibility time)
        setTimeout(() => setDepositSuccess(""), 8000);
      } else {
        setError(result.error || "Failed to deposit fees");
      }
    } catch (err) {
      console.error("Error depositing fees:", err);
      setError("Failed to deposit fees");
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-[#800000]">Fee Ledger</h3>
          <p className="text-sm text-[#800000] mt-1">
            System fees collected from P2P transfers, ticket sales, and invoices
          </p>
        </div>
        {activeTab === "all" && (
          <div className="text-right">
            <p className="text-sm text-[#800000]">Total Fees</p>
            <p className="text-2xl font-bold text-green-600">${totalFees.toFixed(2)}</p>
            {totalFees > 0 && (
              <button
                onClick={() => setShowDepositConfirm(true)}
                disabled={depositing}
                className="mt-3 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                tabIndex={0}
                aria-label="Deposit total fees into admin wallet"
              >
                {depositing ? "Depositing..." : "Deposit"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPageAll(1);
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-[#800000] hover:text-[#800000] hover:border-gray-300"
              }
            `}
            tabIndex={0}
            aria-label="View all fees"
          >
            All Fees
          </button>
          <button
            onClick={() => {
              setActiveTab("deposit");
              setCurrentPageDeposit(1);
            }}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "deposit"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-[#800000] hover:text-[#800000] hover:border-gray-300"
              }
            `}
            tabIndex={0}
            aria-label="View deposit to wallet"
          >
            Deposit to Wallet
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {depositSuccess && (
        <div className="mb-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-green-800 text-sm font-medium shadow-sm">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{depositSuccess}</span>
          </div>
        </div>
      )}

      {/* Deposit Confirmation Modal */}
      {showDepositConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#800000] mb-4">Confirm Deposit</h3>
            <p className="text-[#800000] mb-2">
              Deposit total fees of <span className="font-semibold text-green-600">${totalFees.toFixed(2)}</span> into admin wallet?
            </p>
            <p className="text-sm text-[#800000] mb-6">
              This will add the total accumulated fees to your admin wallet balance.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDepositConfirm(false)}
                disabled={depositing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed transition-colors"
                tabIndex={0}
                aria-label="Cancel deposit"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositing}
                className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#900000] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                tabIndex={0}
                aria-label="Confirm deposit"
              >
                {depositing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Depositing...
                  </span>
                ) : (
                  "Confirm Deposit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Fees Tab */}
      {activeTab === "all" && (
        <>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-[#800000]">Loading fees...</p>
            </div>
          ) : fees.length === 0 ? (
            <div className="text-center py-8 text-[#800000]">
              <p className="mb-2">No fees collected yet.</p>
              <p className="text-sm">
                Fees will appear here from P2P transfers (5%), ticket sales (10%), invoice payments (5%), and withdrawals (5%).
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-[#800000]">P2P Fees</p>
                  <p className="text-xl font-semibold text-blue-600">
                    ${p2pFees.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#800000] mt-1">5% of transfers</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-[#800000]">Ticket Fees</p>
                  <p className="text-xl font-semibold text-green-600">
                    ${ticketFees.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#800000] mt-1">10% of sales</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-[#800000]">Invoice Fees</p>
                  <p className="text-xl font-semibold text-purple-600">
                    ${invoiceFees.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#800000] mt-1">5% of payments</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-[#800000]">Cash Out Fees</p>
                  <p className="text-xl font-semibold text-orange-600">
                    ${withdrawalFees.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#800000] mt-1">5% of cash withdrawals</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentFees.map((fee) => (
                      <tr key={fee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fee.type === "p2p"
                                ? "bg-blue-100 text-blue-800"
                                : fee.type === "ticket"
                                ? "bg-green-100 text-green-800"
                                : fee.type === "invoice"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {fee.type === "withdrawal" ? "CASH OUT" : fee.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#800000]">
                          {fee.ref || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                          ${fee.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${fee.fee.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                          {fee.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                          {new Date(fee.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for All Fees */}
              {totalPagesAll > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPageAll(Math.max(1, currentPageAll - 1))}
                      disabled={currentPageAll === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                      tabIndex={0}
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPageAll(Math.min(totalPagesAll, currentPageAll + 1))}
                      disabled={currentPageAll === totalPagesAll}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                      tabIndex={0}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-[#800000]">
                        Showing <span className="font-medium">{startIndexAll + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(endIndexAll, fees.length)}</span> of{" "}
                        <span className="font-medium">{fees.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageAll(Math.max(1, currentPageAll - 1))}
                          disabled={currentPageAll === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          tabIndex={0}
                          aria-label="Previous page"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {getPageNumbers(totalPagesAll, currentPageAll).map((page, index) => (
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#800000] ring-1 ring-inset ring-gray-300">
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setCurrentPageAll(page as number)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPageAll === page
                                  ? "z-10 bg-[#800000] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000]"
                                  : "text-[#800000] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                              }`}
                              tabIndex={0}
                              aria-label={`Go to page ${page}`}
                              aria-current={currentPageAll === page ? "page" : undefined}
                            >
                              {page}
                            </button>
                          )
                        ))}
                        <button
                          onClick={() => setCurrentPageAll(Math.min(totalPagesAll, currentPageAll + 1))}
                          disabled={currentPageAll === totalPagesAll}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          tabIndex={0}
                          aria-label="Next page"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Deposit to Wallet Tab */}
      {activeTab === "deposit" && (
        <>
          {depositLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-[#800000]">Loading deposited fees...</p>
            </div>
          ) : depositedTicketFees.length === 0 ? (
            <div className="text-center py-8 text-[#800000]">
              <p className="mb-2">No fee deposits found.</p>
              <p className="text-sm">
                Fees that have been deposited to the admin wallet from the "All Fees" tab will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Fee Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Fee From Wallet ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentDepositedFees.map((fee) => (
                      <tr key={fee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fee.feeType === "p2p"
                                ? "bg-blue-100 text-blue-800"
                                : fee.feeType === "ticket"
                                ? "bg-green-100 text-green-800"
                                : fee.feeType === "invoice"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {fee.feeType === "p2p" ? "P2P" : fee.feeType === "ticket" ? "TICKET" : fee.feeType === "invoice" ? "INVOICE" : "CASH OUT"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#800000] font-mono">
                            {fee.fromWalletId || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ${fee.depositAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                          {fee.date || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                          {fee.time || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#800000]">
                          {fee.ref || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Deposit to Wallet */}
              {totalPagesDeposit > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPageDeposit(Math.max(1, currentPageDeposit - 1))}
                    disabled={currentPageDeposit === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                    tabIndex={0}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPageDeposit(Math.min(totalPagesDeposit, currentPageDeposit + 1))}
                    disabled={currentPageDeposit === totalPagesDeposit}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                    tabIndex={0}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#800000]">
                      Showing <span className="font-medium">{startIndexDeposit + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(endIndexDeposit, depositedTicketFees.length)}</span> of{" "}
                      <span className="font-medium">{depositedTicketFees.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPageDeposit(Math.max(1, currentPageDeposit - 1))}
                        disabled={currentPageDeposit === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        tabIndex={0}
                        aria-label="Previous page"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {getPageNumbers(totalPagesDeposit, currentPageDeposit).map((page, index) => (
                        page === "..." ? (
                          <span key={`ellipsis-deposit-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#800000] ring-1 ring-inset ring-gray-300">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPageDeposit(page as number)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPageDeposit === page
                                ? "z-10 bg-[#800000] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000]"
                                : "text-[#800000] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            }`}
                            tabIndex={0}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPageDeposit === page ? "page" : undefined}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      <button
                        onClick={() => setCurrentPageDeposit(Math.min(totalPagesDeposit, currentPageDeposit + 1))}
                        disabled={currentPageDeposit === totalPagesDeposit}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        tabIndex={0}
                        aria-label="Next page"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default FeeLedger;
