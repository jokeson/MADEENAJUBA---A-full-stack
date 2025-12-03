"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getKycUserInfo } from "@/lib/server-actions/kyc";
import { getDashboardStats, DashboardStats } from "@/lib/server-actions/dashboard";
import { formatCurrency } from "@/lib/format";
import Sidebar from "@/components/Sidebar";

const DashboardPage = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

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

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) {
        setLoadingStats(false);
        return;
      }

      try {
        setLoadingStats(true);
        setStatsError("");
        const result = await getDashboardStats(user.id, user.email);
        if (result.success && result.stats) {
          setStats(result.stats);
        } else {
          setStatsError(result.error || "Failed to load statistics");
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStatsError("Failed to load statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, user?.email]);

  const getWelcomeMessage = () => {
    if (loadingKyc) {
      return "Welcome back!";
    }
    if (firstName && lastName) {
      return `Welcome back, ${firstName} ${lastName}!`;
    }
    return `Welcome back, ${user?.email || "User"}!`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60  ">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12 md:mt-30">
          <div className="mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <p className="text-[#800000] text-sm xs:text-base sm:text-lg md:text-xl font-semibold break-words">
              {getWelcomeMessage()}
            </p>
          </div>

          {statsError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {statsError}
            </div>
          )}

          {loadingStats ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 xs:p-5 sm:p-6 animate-pulse">
                  <div className="h-5 xs:h-6 bg-gray-200 rounded w-3/4 mb-3 xs:mb-4"></div>
                  <div className="h-7 xs:h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6">
              {/* Events Card */}
              <div className="bg-white rounded-lg p-4 xs:p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Events
                </h3>
                <p className="text-2xl xs:text-3xl font-bold text-[#800000] mb-1">
                  {stats.events.total}
                </p>
                <div className="mt-3 space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span className="font-medium text-green-600">{stats.events.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">{stats.events.pending}</span>
                  </div>
                  {stats.events.live > 0 && (
                    <div className="flex justify-between">
                      <span>Live:</span>
                      <span className="font-medium text-red-600">{stats.events.live}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoices Card */}
              <div className="bg-white rounded-lg p-4 xs:p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Invoices
                </h3>
                <p className="text-2xl xs:text-3xl font-bold text-[#800000] mb-1">
                  {stats.invoices.totalIssued + stats.invoices.totalReceived}
                </p>
                <div className="mt-3 space-y-1 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Issued:</span>
                    <span className="font-medium">{stats.invoices.totalIssued}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Received:</span>
                    <span className="font-medium">{stats.invoices.totalReceived}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid:</span>
                    <span className="font-medium text-yellow-600">
                      {stats.invoices.unpaidReceived + stats.invoices.unpaidIssued}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wallet Card */}
              <div className="bg-white rounded-lg p-4 xs:p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Wallet
                </h3>
                {stats.wallet.walletId ? (
                  <>
                    <p className="text-xl xs:text-2xl font-bold text-[#800000] mb-1">
                      {formatCurrency(stats.wallet.balance)}
                    </p>
                    <div className="mt-3 space-y-1 text-xs sm:text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Wallet ID:</span>
                        <span className="font-mono font-medium">{stats.wallet.walletId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium capitalize ${
                          stats.wallet.status === "active" ? "text-green-600" :
                          stats.wallet.status === "suspended" ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {stats.wallet.status || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transactions:</span>
                        <span className="font-medium">{stats.wallet.transactionCount}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No wallet found</p>
                )}
              </div>

              {/* Posts Card */}
              <div className="bg-white rounded-lg p-4 xs:p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg
                      className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Posts
                </h3>
                <p className="text-2xl xs:text-3xl font-bold text-[#800000] mb-1">
                  {stats.posts.total}
                </p>
                <p className="mt-3 text-xs sm:text-sm text-gray-600">
                  Total news posts published
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
