"use client";

import React from "react";

/**
 * Transaction type definition
 */
interface Transaction {
  _id: string;
  type: string;
  amount: number;
  createdAt: string;
  fromWalletId?: string;
  toWalletId?: string;
  isSent?: boolean;
  isReceived?: boolean;
  status: string;
  note?: string;
}

/**
 * Props for WalletTransactions component
 */
interface WalletTransactionsProps {
  /** Array of all transactions */
  transactions: Transaction[];
  /** Current wallet ID */
  walletId: string;
  /** Current filter type */
  transactionFilter: "all" | "sent" | "received" | "paid";
  /** Callback when filter changes */
  onFilterChange: (filter: "all" | "sent" | "received" | "paid") => void;
  /** Current page number */
  currentPage: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Number of transactions per page */
  transactionsPerPage: number;
  /** Callback when a transaction is clicked */
  onTransactionClick: (transaction: Transaction) => void;
  /** Whether user can handle finance (admin/finance role) */
  canHandleFinance: boolean;
}

/**
 * WalletTransactions Component
 * 
 * Displays wallet transactions with:
 * - Filter tabs (All, Sent, Received, Paid)
 * - Transaction list with icons and amounts
 * - Pagination controls
 * - Click to view transaction details
 * 
 * @param props - Component props
 */
const WalletTransactions = ({
  transactions,
  walletId,
  transactionFilter,
  onFilterChange,
  currentPage,
  onPageChange,
  transactionsPerPage,
  onTransactionClick,
  canHandleFinance,
}: WalletTransactionsProps) => {
  /**
   * Filter transactions based on selected filter type
   */
  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionFilter === "all") {
      return true;
    } else if (transactionFilter === "sent") {
      // Sent transactions: fromWalletId matches user's walletId, or type indicates money going out
      return (
        (walletId && transaction.fromWalletId === walletId) ||
        transaction.isSent === true ||
        transaction.type === "send" ||
        transaction.type === "request"
      );
    } else if (transactionFilter === "received") {
      // Received transactions: toWalletId matches user's walletId, or type indicates money coming in
      return (
        (walletId && transaction.toWalletId === walletId) ||
        transaction.isReceived === true ||
        transaction.type === "receive" ||
        transaction.type === "redeem" ||
        transaction.type === "deposit" ||
        transaction.type === "ticket_payout" ||
        transaction.type === "cash_payout"
      );
    } else if (transactionFilter === "paid") {
      // Paid transactions: cash_payout type with status "success" and note "paid cash" (processed by finance/admin)
      // These are transactions where finance/admin paid cash to users
      return (
        transaction.type === "cash_payout" &&
        transaction.status === "success" &&
        transaction.note === "paid cash"
      );
    }
    return true;
  });

  /**
   * Get transaction type display name
   */
  const getTransactionTypeName = (transaction: Transaction): string => {
    if (transactionFilter === "paid" && transaction.type === "cash_payout" && transaction.note === "paid cash") {
      return "paid cash";
    } else if (transaction.type === "cash_payout") {
      return "withdraw";
    } else {
      return transaction.type.replace("_", " ");
    }
  };

  /**
   * Get transaction status display name
   */
  const getTransactionStatus = (transaction: Transaction): string => {
    if (transactionFilter === "paid" && transaction.type === "cash_payout" && transaction.note === "paid cash") {
      return "Paid";
    } else if (transaction.type === "cash_payout" && transaction.status === "success") {
      return "Withdrawn";
    } else {
      return transaction.status;
    }
  };

  /**
   * Get transaction icon based on type
   */
  const getTransactionIcon = (type: string) => {
    if (type === "send") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#800000' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      );
    } else if (type === "receive") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: '#800000' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v14m7-7H5"
          />
        </svg>
      );
    } else if (type === "cash_payout") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
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
      );
    } else {
      // Default wallet icon
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 sm:h-5 sm:w-5"
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
      );
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: '#800000' }}>
          Transactions
        </h3>
      </div>

      {/* Transaction Filter Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
        <button
          onClick={() => {
            onFilterChange("all");
            onPageChange(1);
          }}
          className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-base transition-colors border-b-2 whitespace-nowrap ${
            transactionFilter === "all"
              ? "border-[#800000] text-[#800000]"
              : "border-transparent text-[#800000] hover:text-[#900000]"
          }`}
          tabIndex={0}
          aria-label="Show all transactions"
        >
          All
        </button>
        <button
          onClick={() => {
            onFilterChange("sent");
            onPageChange(1);
          }}
          className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-base transition-colors border-b-2 whitespace-nowrap ${
            transactionFilter === "sent"
              ? "border-[#800000] text-[#800000]"
              : "border-transparent text-[#800000] hover:text-[#900000]"
          }`}
          tabIndex={0}
          aria-label="Show sent transactions"
        >
          Sent
        </button>
        <button
          onClick={() => {
            onFilterChange("received");
            onPageChange(1);
          }}
          className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-base transition-colors border-b-2 whitespace-nowrap ${
            transactionFilter === "received"
              ? "border-[#800000] text-[#800000]"
              : "border-transparent text-[#800000] hover:text-[#900000]"
          }`}
          tabIndex={0}
          aria-label="Show received transactions"
        >
          Received
        </button>
        {/* Paid Tab - Only visible for Finance and Admin */}
        {canHandleFinance && (
          <button
            onClick={() => {
              onFilterChange("paid");
              onPageChange(1);
            }}
            className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 font-medium text-sm sm:text-base transition-colors border-b-2 whitespace-nowrap ${
              transactionFilter === "paid"
                ? "border-[#800000] text-[#800000]"
                : "border-transparent text-[#800000] hover:text-[#900000]"
            }`}
            tabIndex={0}
            aria-label="Show paid cash transactions"
          >
            Paid
          </button>
        )}
      </div>

      {/* Transaction List or Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm sm:text-base" style={{ color: '#800000' }}>
            {transactionFilter === "sent"
              ? "No sent transactions"
              : transactionFilter === "received"
              ? "No received transactions"
              : transactionFilter === "paid"
              ? "No withdrawal transactions"
              : "No transactions yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Transaction Items */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {paginatedTransactions.map((transaction) => (
              <div
                key={transaction._id}
                onClick={() => onTransactionClick(transaction)}
                className="flex flex-row items-center justify-between gap-4 p-3 sm:p-4 md:p-5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTransactionClick(transaction);
                  }
                }}
                aria-label={`View transaction ${transaction._id} details`}
              >
                {/* Transaction Icon and Info */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className="rounded-lg p-2 sm:p-2.5 md:p-3 flex-shrink-0"
                    style={{ backgroundColor: '#ebebe0' }}
                  >
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base capitalize truncate" style={{ color: '#800000' }}>
                      {getTransactionTypeName(transaction)}
                    </p>
                    <p className="text-xs sm:text-sm" style={{ color: '#800000' }}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Transaction Amount and Status */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base sm:text-lg" style={{ color: '#800000' }}>
                    {transaction.type === "send" || transaction.type === "request" ? "-" : "+"}
                    SSP {transaction.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs capitalize font-semibold" style={{ color: '#800000' }}>
                    {getTransactionStatus(transaction)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredTransactions.length > transactionsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border-t pt-4">
              {/* Pagination Info */}
              <div className="text-xs sm:text-sm text-center sm:text-left" style={{ color: '#800000' }}>
                Showing {(currentPage - 1) * transactionsPerPage + 1} to{" "}
                {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} transactions
              </div>
              
              {/* Pagination Controls */}
              <div className="flex gap-2 flex-wrap justify-center">
                {/* Previous Button */}
                <button
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-sm sm:text-base font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                  style={{ color: currentPage === 1 ? '#9ca3af' : '#800000' }}
                  tabIndex={0}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if needed
                    const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-3 py-2" style={{ color: '#800000' }}>...</span>
                        )}
                        <button
                          onClick={() => onPageChange(page)}
                          className={`px-3 sm:px-4 py-2 border-2 rounded-lg text-sm sm:text-base font-medium ${
                            currentPage === page
                              ? "bg-[#800000] text-white border-[#800000]"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                          style={currentPage !== page ? { color: '#800000' } : {}}
                          tabIndex={0}
                          aria-label={`Go to page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                
                {/* Next Button */}
                <button
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-sm sm:text-base font-medium text-[#800000] hover:bg-gray-50 disabled:bg-gray-100 disabled:text-[#800000]/50 disabled:cursor-not-allowed"
                  style={{
                    color: currentPage === totalPages ? '#9ca3af' : '#800000'
                  }}
                  tabIndex={0}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletTransactions;

