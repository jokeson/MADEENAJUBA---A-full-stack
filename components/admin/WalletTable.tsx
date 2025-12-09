"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllWallets, getWalletTransactions } from "@/lib/server-actions/wallet";
import { suspendWallet, reactivateWallet, deleteWallet } from "@/lib/server-actions/admin";
import { formatDate, formatDateWithTime } from "@/lib/format";

interface Wallet {
  _id: string;
  walletId: string;
  userId: string;
  userEmail: string;
  userName: string;
  balance: number;
  status: "active" | "suspended" | "terminated";
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  feeCents?: number;
  fromWalletId?: string;
  toWalletId?: string;
  ref?: string;
  status: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const WalletTable = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "suspend" | "reactivate" | "delete" | null;
    walletId: string | null;
    walletInfo: string | null;
  }>({
    isOpen: false,
    type: null,
    walletId: null,
    walletInfo: null,
  });

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true);
        const result = await getAllWallets();
        if (result.success) {
          setWallets(result.wallets);
        } else {
          setError(result.error || "Failed to load wallets");
        }
      } catch (err) {
        setError("An error occurred while loading wallets");
        console.error("Error fetching wallets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);


  const handleViewDetails = async (walletId: string) => {
    if (selectedWallet === walletId) {
      setSelectedWallet(null);
      setTransactions([]);
      return;
    }

    setSelectedWallet(walletId);
    setLoadingTransactions(true);
    setTransactions([]);

    try {
      const result = await getWalletTransactions(walletId);
      if (result.success) {
        setTransactions(result.transactions);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSuspendClick = (wallet: Wallet) => {
    setConfirmModal({
      isOpen: true,
      type: wallet.status === "suspended" ? "reactivate" : "suspend",
      walletId: wallet.walletId,
      walletInfo: `${wallet.walletId} (${wallet.userName})`,
    });
  };

  const handleDeleteClick = (wallet: Wallet) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      walletId: wallet.walletId,
      walletInfo: `${wallet.walletId} (${wallet.userName}) - Balance: $${wallet.balance.toFixed(2)}`,
    });
  };

  // Don't show delete button for already terminated wallets
  const canDeleteWallet = (wallet: Wallet) => {
    return wallet.status !== "terminated";
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.walletId || !confirmModal.type || !user?.id) {
      return;
    }

    setProcessingAction(confirmModal.walletId);
    setError(null);

    try {
      let result;
      if (confirmModal.type === "suspend") {
        result = await suspendWallet(confirmModal.walletId, user.id);
      } else if (confirmModal.type === "reactivate") {
        result = await reactivateWallet(confirmModal.walletId, user.id);
      } else if (confirmModal.type === "delete") {
        result = await deleteWallet(confirmModal.walletId, user.id);
      }

      if (result?.success) {
        // Reload wallets
        const walletsResult = await getAllWallets();
        if (walletsResult.success) {
          setWallets(walletsResult.wallets);
          setCurrentPage(1); // Reset to first page after reload
        }
        setConfirmModal({ isOpen: false, type: null, walletId: null, walletInfo: null });
      } else {
        setError(result?.error || "Failed to perform action");
      }
    } catch (err) {
      console.error("Error performing action:", err);
      setError("An error occurred while performing the action");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCloseModal = () => {
    setConfirmModal({ isOpen: false, type: null, walletId: null, walletInfo: null });
    setError(null);
  };

  // Filter wallets based on search query (wallet ID or user email)
  const filteredWallets = wallets.filter((wallet) => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase().trim();
    const walletIdMatch = wallet.walletId.toLowerCase().includes(query);
    const emailMatch = wallet.userEmail.toLowerCase().includes(query);
    return walletIdMatch || emailMatch;
  });

  // Pagination calculations based on filtered wallets
  const totalPages = Math.ceil(filteredWallets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentWallets = filteredWallets.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-red-500">
          <p className="mb-2">Error loading wallets</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-[#800000]">Wallet Registry</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by wallet ID or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000] placeholder:text-[#800000]"
              aria-label="Search wallets by wallet ID or user email"
              tabIndex={0}
            />
          </div>
          <span className="text-sm text-[#800000] whitespace-nowrap">
            {searchQuery.trim() ? (
              <>
                Showing {filteredWallets.length} of {wallets.length} wallets
              </>
            ) : (
              <>Total Wallets: {wallets.length}</>
            )}
          </span>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="text-center py-8 text-[#800000]">
          <p className="mb-2">No wallets found.</p>
          <p className="text-sm">
            Wallets will appear here once users complete KYC approval.
          </p>
        </div>
      ) : filteredWallets.length === 0 ? (
        <div className="text-center py-8 text-[#800000]">
          <p className="mb-2">No wallets found matching your search.</p>
          <p className="text-sm">
            Try searching with a different wallet ID or email.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Wallet ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentWallets.map((wallet) => (
                <React.Fragment key={wallet._id || wallet.walletId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#800000]">
                      {wallet.walletId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      <div>
                        <div className="font-medium">{wallet.userName}</div>
                        <div className="text-xs text-[#800000]/50">{wallet.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      ${wallet.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          wallet.status === "active"
                            ? "bg-green-100 text-green-800"
                            : wallet.status === "suspended"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {wallet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      {formatDate(wallet.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDetails(wallet.walletId)}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label={`View details for wallet ${wallet.walletId}`}
                          tabIndex={0}
                        >
                          {selectedWallet === wallet.walletId ? "Hide Details" : "View Details"}
                        </button>
                        {user?.role === "admin" && (
                          <>
                            {wallet.status === "suspended" ? (
                              <button
                                onClick={() => handleSuspendClick(wallet)}
                                disabled={processingAction === wallet.walletId}
                                className="text-green-600 hover:text-green-900 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                                aria-label={`Reactivate wallet ${wallet.walletId}`}
                                tabIndex={0}
                              >
                                Reactivate
                              </button>
                            ) : wallet.status === "active" ? (
                              <button
                                onClick={() => handleSuspendClick(wallet)}
                                disabled={processingAction === wallet.walletId}
                                className="text-yellow-600 hover:text-yellow-900 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                                aria-label={`Suspend wallet ${wallet.walletId}`}
                                tabIndex={0}
                              >
                                Suspend
                              </button>
                            ) : null}
                            {canDeleteWallet(wallet) && (
                              <button
                                onClick={() => handleDeleteClick(wallet)}
                                disabled={processingAction === wallet.walletId}
                                className="text-red-600 hover:text-red-900 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                                aria-label={`Terminate wallet ${wallet.walletId}`}
                                tabIndex={0}
                              >
                                Terminate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {selectedWallet === wallet.walletId && (
                    <tr key={`${wallet._id}-details`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-[#800000]">Transaction Log</h4>
                          {loadingTransactions ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          ) : transactions.length === 0 ? (
                            <p className="text-sm text-[#800000]">No transactions found</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      Type
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      From/To
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      Amount
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      Ref
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      Status
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-[#800000] uppercase">
                                      Date
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 text-sm text-[#800000] capitalize">
                                        {tx.type.replace("_", " ")}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-[#800000]">
                                        {tx.fromWalletId === wallet.walletId
                                          ? `To: ${tx.toWalletId || "N/A"}`
                                          : tx.toWalletId === wallet.walletId
                                          ? `From: ${tx.fromWalletId || "N/A"}`
                                          : "N/A"}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-[#800000]">
                                        ${tx.amount.toFixed(2)}
                                        {tx.feeCents && tx.feeCents > 0 && (
                                          <span className="text-xs text-[#800000] ml-1">
                                            (fee: ${tx.feeCents.toFixed(2)})
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-[#800000] font-mono">
                                        {tx.ref || "N/A"}
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        <span
                                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            tx.status === "success" || tx.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : tx.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {tx.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-[#800000]">
                                        {formatDateWithTime(tx.createdAt)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                  tabIndex={0}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredWallets.length)}</span> of{" "}
                    <span className="font-medium">{filteredWallets.length}</span> results
                    {searchQuery.trim() && (
                      <span className="text-[#800000]"> (filtered from {wallets.length} total)</span>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#800000]/50 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      tabIndex={0}
                      aria-label="Previous page"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {getPageNumbers(totalPages, currentPage).map((page, index) => (
                      page === "..." ? (
                        <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-[#800000] ring-1 ring-inset ring-gray-300">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? "z-10 bg-[#800000] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#800000]"
                              : "text-[#800000] ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          }`}
                          tabIndex={0}
                          aria-label={`Go to page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
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

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCloseModal}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-[#800000] mb-4">
                {confirmModal.type === "suspend" && "Suspend Wallet"}
                {confirmModal.type === "reactivate" && "Reactivate Wallet"}
                {confirmModal.type === "delete" && "Terminate Wallet"}
              </h3>
              
              {confirmModal.type === "delete" ? (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-semibold mb-2">⚠️ Warning: Wallet Termination</p>
                    <p className="text-red-700 text-sm">
                      This will terminate the wallet. The user will see a termination message on their wallet page. The wallet record will be preserved for audit purposes.
                    </p>
                  </div>
                  <p className="text-sm text-[#800000] mb-2">
                    Are you sure you want to terminate wallet:
                  </p>
                  <p className="text-sm font-medium text-[#800000] mb-4">
                    {confirmModal.walletInfo}
                  </p>
                  <p className="text-xs text-[#800000]">
                    Note: Terminated wallets cannot perform any transactions. Transaction history will be preserved for audit purposes.
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-[#800000] mb-2">
                    {confirmModal.type === "suspend"
                      ? "Are you sure you want to suspend this wallet?"
                      : "Are you sure you want to reactivate this wallet?"}
                  </p>
                  <p className="text-sm font-medium text-[#800000]">
                    {confirmModal.walletInfo}
                  </p>
                  {confirmModal.type === "suspend" && (
                    <p className="text-xs text-[#800000] mt-2">
                      Suspended wallets cannot send, receive, deposit, or withdraw funds.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={!!processingAction}
                  className="flex-1 px-4 py-2 bg-gray-200 text-[#800000] rounded-md font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  tabIndex={0}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={!!processingAction}
                  className="flex-1 px-4 py-2 bg-[#800000] text-white rounded-md font-medium hover:bg-[#900000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  tabIndex={0}
                >
                  {processingAction ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {confirmModal.type === "suspend" && "Suspend"}
                      {confirmModal.type === "reactivate" && "Reactivate"}
                      {confirmModal.type === "delete" && "Terminate Wallet"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTable;
