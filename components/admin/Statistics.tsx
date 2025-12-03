"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlatformStatistics } from "@/lib/server-actions/admin";
import PoolDetailsModal from "./PoolDetailsModal";
import CashPayoutDetailsModal from "./CashPayoutDetailsModal";

interface Statistics {
  totalWallets: number;
  activeWallets: number;
  suspendedWallets: number;
  terminatedWallets: number;
  totalUsers: number;
  totalBalance: number;
  totalBalanceCents: number;
  totalCashPayout: number;
  totalCashPayoutCents: number;
  totalAmountInPool: number;
  totalAmountInPoolCents: number;
  totalDepositedFees: number;
  totalDepositedFeesCents: number;
}

const Statistics = () => {
  const router = useRouter();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isCashPayoutModalOpen, setIsCashPayoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPlatformStatistics();
        if (result.success && result.statistics) {
          setStatistics(result.statistics);
        } else {
          setError(result.error || "Failed to load statistics");
        }
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("An error occurred while loading statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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
          <p className="mb-2">Error loading statistics</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-[#800000]">
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Wallets",
      value: statistics.totalWallets,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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
      ),
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Active Wallets",
      value: statistics.activeWallets,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
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
      ),
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Suspended Wallets",
      value: statistics.suspendedWallets,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Terminated Wallets",
      value: statistics.terminatedWallets,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      ),
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Total Users",
      value: statistics.totalUsers,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Total Wallet Balance",
      value: `SSP ${statistics.totalBalance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
    },
    {
      title: "Total Cash Paid",
      value: `SSP ${statistics.totalCashPayout.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Total Amount in Pool",
      value: `SSP ${statistics.totalAmountInPool.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Total Deposited Fees",
      value: `SSP ${(statistics.totalDepositedFees || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#800000] mb-6">Platform Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const isPoolCard = card.title === "Total Amount in Pool";
            const isCashPayoutCard = card.title === "Total Cash Paid";
            const isFeesCard = card.title === "Total Deposited Fees";
            const isClickable = isPoolCard || isCashPayoutCard || isFeesCard;
            
            const handleClick = () => {
              if (isPoolCard) {
                setIsPoolModalOpen(true);
              } else if (isCashPayoutCard) {
                setIsCashPayoutModalOpen(true);
              } else if (isFeesCard) {
                router.push("/admin/fees/statistics");
              }
            };

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if ((e.key === "Enter" || e.key === " ") && isClickable) {
                e.preventDefault();
                handleClick();
              }
            };

            return (
            <div
              key={index}
                onClick={isClickable ? handleClick : undefined}
                className={`${card.bgColor} rounded-xl p-6 border-2 border-transparent hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                  isClickable ? "cursor-pointer" : ""
                }`}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? handleKeyDown : undefined}
                aria-label={
                  isPoolCard
                    ? "Click to view pool details"
                    : isCashPayoutCard
                    ? "Click to view cash payout details"
                    : isFeesCard
                    ? "Click to view fee statistics"
                    : undefined
                }
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} rounded-lg p-3 text-white`}>
                  {card.icon}
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
              </div>
              <p className={`text-sm font-medium ${card.textColor} mt-2`}>
                {card.title}
                  {isClickable && (
                    <span className="ml-2 text-xs opacity-75">(Click to view details)</span>
                  )}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      {/* Additional Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#800000] mb-1">Wallet Status Distribution</p>
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#800000]">Active</span>
                <span className="text-sm font-semibold text-green-600">
                  {statistics.totalWallets > 0
                    ? ((statistics.activeWallets / statistics.totalWallets) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#800000]">Suspended</span>
                <span className="text-sm font-semibold text-yellow-600">
                  {statistics.totalWallets > 0
                    ? ((statistics.suspendedWallets / statistics.totalWallets) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#800000]">Terminated</span>
                <span className="text-sm font-semibold text-red-600">
                  {statistics.totalWallets > 0
                    ? ((statistics.terminatedWallets / statistics.totalWallets) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#800000] mb-1">Platform Overview</p>
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#800000]">Users with Wallets</span>
                <span className="text-sm font-semibold text-blue-600">
                  {statistics.totalWallets} / {statistics.totalUsers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#800000]">Average Balance per Wallet</span>
                <span className="text-sm font-semibold text-indigo-600">
                  {statistics.totalWallets > 0
                    ? `SSP ${(statistics.totalBalance / statistics.totalWallets).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "SSP 0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pool Details Modal */}
      <PoolDetailsModal
        isOpen={isPoolModalOpen}
        onClose={() => setIsPoolModalOpen(false)}
      />

      {/* Cash Payout Details Modal */}
      <CashPayoutDetailsModal
        isOpen={isCashPayoutModalOpen}
        onClose={() => setIsCashPayoutModalOpen(false)}
      />
    </div>
  );
};

export default Statistics;

