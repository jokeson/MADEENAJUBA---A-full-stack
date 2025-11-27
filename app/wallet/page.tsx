"use client";

/**
 * Wallet Page Component
 * 
 * Main wallet dashboard page that displays:
 * - Wallet status messages (KYC pending/rejected, no wallet)
 * - Wallet card with balance and wallet ID
 * - Action buttons (Send, Withdraw, Deposit, Pay)
 * - Transaction history with filtering and pagination
 * 
 * This page has been refactored into smaller components for better maintainability:
 * - WalletStatusMessages: Handles KYC status and no wallet messages
 * - WalletCard: Displays the Mastercard-style wallet card
 * - WalletActionButtons: Action buttons for wallet operations
 * - WalletTransactions: Transaction list with filters and pagination
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { getBalance, getTransactions } from "@/lib/server-actions/wallet";
import { getKycUserInfo, getKycStatus } from "@/lib/server-actions/kyc";
import SendModal from "@/components/wallet/SendModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";
import DepositModal from "@/components/wallet/DepositModal";
import FinancePayoutModal from "@/components/wallet/FinancePayoutModal";
import TransactionDetailModal from "@/components/wallet/TransactionDetailModal";
import { canHandleFinance } from "@/lib/rbac";

// Import wallet sub-components
import WalletStatusMessages from "@/components/wallet/WalletStatusMessages";
import WalletCard from "@/components/wallet/WalletCard";
import WalletActionButtons from "@/components/wallet/WalletActionButtons";
import WalletTransactions from "@/components/wallet/WalletTransactions";

const WalletPage = () => {
  // Authentication and routing
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Wallet state management
  const [balance, setBalance] = useState<number>(0); // Current wallet balance
  const [walletId, setWalletId] = useState<string>(""); // Unique wallet identifier
  const [balanceLoading, setBalanceLoading] = useState(true); // Loading state for balance fetch
  const [balanceError, setBalanceError] = useState<string>(""); // Error message from balance fetch
  const [walletStatus, setWalletStatus] = useState<"active" | "suspended" | "terminated" | null>(null); // Wallet status

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]); // List of all transactions
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [transactionFilter, setTransactionFilter] = useState<"all" | "sent" | "received" | "paid">("all"); // Current filter
  const transactionsPerPage = 10; // Number of transactions per page

  // Modal state management
  const [isSendModalOpen, setIsSendModalOpen] = useState(false); // Send money modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false); // Withdraw modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false); // Deposit modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false); // Pay modal (admin/finance only)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false); // Transaction detail modal
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null); // Selected transaction for details

  // KYC user information state
  const [firstName, setFirstName] = useState<string | null>(null); // User's first name from KYC
  const [lastName, setLastName] = useState<string | null>(null); // User's last name from KYC
  const [loadingKyc, setLoadingKyc] = useState(true); // Loading state for KYC info
  const [kycStatus, setKycStatus] = useState<"pending" | "approved" | "rejected" | null>(null); // KYC application status
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null); // KYC rejection reason if rejected
  const [loadingKycStatus, setLoadingKycStatus] = useState(true); // Loading state for KYC status

  /**
   * Redirect to home page if user is not authenticated
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  /**
   * Fetch wallet data (balance, wallet ID, status, transactions) when user is available
   * Handles different wallet states: active, suspended, terminated, or no wallet
   */
  useEffect(() => {
    const fetchWalletData = async () => {
      if (user?.id) {
        setBalanceLoading(true);
        try {
          // Pass both userId and email to handle localStorage auth IDs
          const balanceResult = await getBalance(user.id, user.email);
          if (balanceResult.success) {
            setBalance(balanceResult.balance);
            setBalanceError(""); // Clear any previous errors
            setWalletStatus(balanceResult.status || "active");
            if (balanceResult.walletId) {
              setWalletId(balanceResult.walletId);
            }
          } else {
            // Check if wallet is suspended or terminated
            if (balanceResult.error === "suspended" || balanceResult.status === "suspended") {
              setBalanceError("suspended");
              setWalletStatus("suspended");
              setBalance(balanceResult.balance || 0);
              if (balanceResult.walletId) {
                setWalletId(balanceResult.walletId);
              }
            } else if (balanceResult.error === "terminated" || balanceResult.status === "terminated") {
              setBalanceError("terminated");
              setWalletStatus("terminated");
              setBalance(0);
              if (balanceResult.walletId) {
                setWalletId(balanceResult.walletId);
              }
            } else {
              setBalanceError(balanceResult.error || "Failed to load wallet");
              setBalance(0);
              setWalletId("");
              setWalletStatus(null);
            }
          }

          const transactionsResult = await getTransactions(user.id, user.email);
          if (transactionsResult.success) {
            setTransactions(transactionsResult.transactions);
          } else {
            console.error("Transactions error:", transactionsResult.error);
          }
        } catch (error) {
          console.error("Error fetching wallet data:", error);
        } finally {
          setBalanceLoading(false);
        }
      }
    };

    if (user?.id) {
      fetchWalletData();
    }
  }, [user]);

  /**
   * Fetch KYC user information (first name, last name) for display on wallet card
   */
  useEffect(() => {
    const fetchKycInfo = async () => {
      if (!user?.id) {
        setLoadingKyc(false);
        return;
      }
      try {
        setLoadingKyc(true);
        const result = await getKycUserInfo(user.id, user.email);
        if (result.success && result.firstName && result.lastName) {
          setFirstName(result.firstName);
          setLastName(result.lastName);
        }
      } catch (error) {
        console.error("Error fetching KYC info:", error);
      } finally {
        setLoadingKyc(false);
      }
    };
    if (user?.id) {
      fetchKycInfo();
    }
  }, [user?.id, user?.email]);

  /**
   * Fetch KYC application status (pending, approved, rejected) and rejection reason if applicable
   */
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (!user?.id) {
        setLoadingKycStatus(false);
        return;
      }
      try {
        setLoadingKycStatus(true);
        const result = await getKycStatus(user.id, user.email);
        if (result.success && result.kyc) {
          setKycStatus(result.kyc.status);
          setKycRejectionReason(result.kyc.rejectionReason || null);
        } else {
          setKycStatus(null);
          setKycRejectionReason(null);
        }
      } catch (error) {
        console.error("Error fetching KYC status:", error);
        setKycStatus(null);
        setKycRejectionReason(null);
      } finally {
        setLoadingKycStatus(false);
      }
    };
    if (user?.id) {
      fetchKycStatus();
    }
  }, [user?.id, user?.email]);

  /**
   * Refresh wallet balance and transactions
   * Called after successful wallet operations (send, withdraw, deposit, etc.)
   * Also refreshes KYC status
   */
  const handleRefreshBalance = async () => {
    if (user?.id) {
      setBalanceLoading(true);
      try {
        // Pass both userId and email to handle localStorage auth IDs
        const balanceResult = await getBalance(user.id, user.email);
        if (balanceResult.success) {
          setBalance(balanceResult.balance);
          setBalanceError(""); // Clear any previous errors
          setWalletStatus(balanceResult.status || "active");
          if (balanceResult.walletId) {
            setWalletId(balanceResult.walletId);
          }
        } else {
          // Check if wallet is suspended or terminated
          if (balanceResult.error === "suspended" || balanceResult.status === "suspended") {
            setBalanceError("suspended");
            setWalletStatus("suspended");
            setBalance(balanceResult.balance || 0);
            if (balanceResult.walletId) {
              setWalletId(balanceResult.walletId);
            }
          } else if (balanceResult.error === "terminated" || balanceResult.status === "terminated") {
            setBalanceError("terminated");
            setWalletStatus("terminated");
            setBalance(0);
            if (balanceResult.walletId) {
              setWalletId(balanceResult.walletId);
            }
          } else {
            setBalanceError(balanceResult.error || "Failed to load wallet");
            setBalance(0);
            setWalletId("");
            setWalletStatus(null);
          }
        }

        const transactionsResult = await getTransactions(user.id, user.email);
        if (transactionsResult.success) {
          setTransactions(transactionsResult.transactions);
        }

        // Also refresh KYC status
        const kycStatusResult = await getKycStatus(user.id, user.email);
        if (kycStatusResult.success && kycStatusResult.kyc) {
          setKycStatus(kycStatusResult.kyc.status);
          setKycRejectionReason(kycStatusResult.kyc.rejectionReason || null);
        } else {
          setKycStatus(null);
          setKycRejectionReason(null);
        }
      } catch (error) {
        console.error("Error refreshing balance:", error);
      } finally {
        setBalanceLoading(false);
      }
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#d6d6c2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12">
          {/* Header */}
          <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#800000] mb-1 xs:mb-2 break-words">
              Kilimgaroo
            </h1>
            <p className="text-[#800000] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl break-words">Your Digital Wallet</p>
          </div>

          {/* Wallet Status Messages - Shows KYC pending, rejected, or no wallet messages */}
          <WalletStatusMessages
            balanceLoading={balanceLoading}
            loadingKycStatus={loadingKycStatus}
            kycStatus={kycStatus}
            balanceError={balanceError}
            walletStatus={walletStatus}
            kycRejectionReason={kycRejectionReason}
          />

          {/* Wallet Card - Only show if user has a wallet (walletStatus is not null) */}
          {walletStatus !== null && (
            <WalletCard
              balance={balance}
              walletId={walletId}
              balanceLoading={balanceLoading}
              balanceError={balanceError}
              walletStatus={walletStatus}
              firstName={firstName}
              lastName={lastName}
              loadingKyc={loadingKyc}
              kycStatus={kycStatus}
              kycRejectionReason={kycRejectionReason}
              userEmail={user?.email}
            />
          )}

          {/* Action Buttons - Only show if wallet exists and is active */}
          {!balanceError && walletStatus === "active" && (
            <WalletActionButtons
              onSendClick={() => setIsSendModalOpen(true)}
              onWithdrawClick={() => setIsWithdrawModalOpen(true)}
              onDepositClick={() => setIsDepositModalOpen(true)}
              onPayClick={() => setIsPayModalOpen(true)}
              canHandleFinance={canHandleFinance(user?.role || "user")}
            />
          )}

          {/* Recent Transactions - Only show if wallet exists and is active */}
          {!balanceError && walletStatus === "active" && (
            <WalletTransactions
              transactions={transactions}
              walletId={walletId}
              transactionFilter={transactionFilter}
              onFilterChange={(filter) => {
                setTransactionFilter(filter);
                setCurrentPage(1);
              }}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              transactionsPerPage={transactionsPerPage}
              onTransactionClick={(transaction) => {
                setSelectedTransaction(transaction);
                setIsTransactionModalOpen(true);
              }}
              canHandleFinance={canHandleFinance(user?.role || "user")}
            />
          )}

        </div>
      </div>

      {/* Wallet Operation Modals */}
      {/* Send Money Modal */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={handleRefreshBalance}
        userId={user?.id || ""}
        userEmail={user?.email}
      />
      {/* Withdraw Money Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={handleRefreshBalance}
        userId={user?.id || ""}
        userEmail={user?.email}
      />
      {/* Deposit Money Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={handleRefreshBalance}
        userId={user?.id || ""}
        userEmail={user?.email}
      />
      {/* Pay Modal - Only for Admin and Finance roles */}
      {user?.id && (
        <FinancePayoutModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={handleRefreshBalance}
          financeUserId={user.id}
          userRole={user.role || "user"}
        />
      )}
      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        userId={user?.id || ""}
        userEmail={user?.email}
        onDelete={() => {
          handleRefreshBalance();
          // Reset to page 1 if current page would be empty
          const newTotalPages = Math.ceil((transactions.length - 1) / transactionsPerPage);
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          } else if (newTotalPages === 0) {
            setCurrentPage(1);
          }
        }}
      />
    </div>
  );
};

export default WalletPage;
