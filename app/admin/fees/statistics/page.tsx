"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/rbac";
import Sidebar from "@/components/Sidebar";
import { getDepositedFeesByPeriod } from "@/lib/server-actions/admin";

type PeriodType = "day" | "week" | "month" | "year" | "total";

interface FeeDetail {
  _id: string;
  feeType: "p2p" | "ticket" | "invoice" | "withdrawal";
  fromWalletId: string;
  depositAmount: number;
  depositAmountCents: number;
  date: string;
  time: string;
  depositedAt: string;
  ref: string;
}

interface PeriodData {
  period: string;
  totalAmount: number;
  totalAmountCents: number;
  count: number;
  fees: FeeDetail[];
}

const FeeStatisticsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("day");
  const [feesData, setFeesData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());

  // Check authorization
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user.role))) {
      router.push("/admin");
    }
  }, [authLoading, user, router]);

  // Fetch fees data when period changes
  useEffect(() => {
    const fetchFees = async () => {
      if (!user || !isAdmin(user.role)) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getDepositedFeesByPeriod(selectedPeriod);
        setFeesData(data);
      } catch (err) {
        console.error("Error fetching fees:", err);
        setError("Failed to load fee statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [selectedPeriod, user]);

  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    setExpandedPeriods(new Set()); // Reset expanded periods when changing view
  };

  const togglePeriodExpansion = (period: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(period)) {
      newExpanded.delete(period);
    } else {
      newExpanded.add(period);
    }
    setExpandedPeriods(newExpanded);
  };

  const getFeeTypeColor = (type: string) => {
    switch (type) {
      case "p2p":
        return "bg-blue-100 text-blue-800";
      case "ticket":
        return "bg-green-100 text-green-800";
      case "invoice":
        return "bg-purple-100 text-purple-800";
      case "withdrawal":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFeeTypeLabel = (type: string) => {
    switch (type) {
      case "p2p":
        return "P2P";
      case "ticket":
        return "Ticket";
      case "invoice":
        return "Invoice";
      case "withdrawal":
        return "Withdrawal";
      default:
        return type;
    }
  };

  const formatPeriodLabel = (period: string) => {
    if (period === "Total") return "Total";
    if (selectedPeriod === "week") return period;
    if (selectedPeriod === "month") {
      const [year, month] = period.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    }
    if (selectedPeriod === "year") return period;
    if (selectedPeriod === "day") {
      const date = new Date(period);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    }
    return period;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex">
        <Sidebar />
        <div className="flex-1 w-full md:ml-56 lg:ml-56 xl:ml-60">
          <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin(user.role)) {
    return null;
  }

  const totalAllPeriods = feesData.reduce((sum, period) => sum + period.totalAmount, 0);
  const totalCount = feesData.reduce((sum, period) => sum + period.count, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 w-full md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 pt-20 xs:pt-24 sm:pt-20 md:pt-8 lg:pt-10 xl:pt-12 pb-4 xs:pb-5 sm:pb-6 md:pb-8 lg:pb-10 xl:pb-12">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 mt-2 xs:mt-4 sm:mt-2 md:mt-0 flex items-center gap-2 text-[#800000] hover:text-[#900000] transition-colors"
              tabIndex={0}
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Admin</span>
            </button>
            <h1 className="text-3xl font-bold text-[#800000]">Fee Statistics</h1>
            <p className="text-gray-600 mt-2">View deposited fees organized by time period</p>
          </div>

          {/* Period Selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              {(["day", "week", "month", "year", "total"] as PeriodType[]).map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    selectedPeriod === period
                      ? "bg-[#800000] text-white"
                      : "bg-gray-100 text-[#800000] hover:bg-gray-200"
                  }`}
                  tabIndex={0}
                  aria-label={`View fees by ${period}`}
                >
                  {period === "total" ? "All Time" : period}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-[#800000] mb-1">Total Periods</p>
                <p className="text-2xl font-bold text-blue-600">{feesData.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-[#800000] mb-1">Total Fees</p>
                <p className="text-2xl font-bold text-green-600">{totalCount}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-[#800000] mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${totalAllPeriods.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Fees Data */}
          {feesData.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-[#800000] text-lg">No deposited fees found for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feesData.map((periodData) => (
                <div
                  key={periodData.period}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Period Header */}
                  <button
                    onClick={() => togglePeriodExpansion(periodData.period)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    tabIndex={0}
                    aria-label={`Toggle ${periodData.period} details`}
                  >
                    <div className="flex items-center gap-4">
                      <svg
                        className={`w-5 h-5 text-[#800000] transition-transform ${
                          expandedPeriods.has(periodData.period) ? "rotate-90" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-[#800000]">
                          {formatPeriodLabel(periodData.period)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {periodData.count} fee{periodData.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#800000]">
                        ${periodData.totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </button>

                  {/* Period Details */}
                  {expandedPeriods.has(periodData.period) && (
                    <div className="border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                                Date & Time
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                                Wallet ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                                Ref
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-[#800000] uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {periodData.fees.map((fee) => (
                              <tr key={fee._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{fee.date}</div>
                                  <div className="text-sm text-gray-500">{fee.time}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getFeeTypeColor(
                                      fee.feeType
                                    )}`}
                                  >
                                    {getFeeTypeLabel(fee.feeType)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {fee.fromWalletId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {fee.ref || "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-[#800000]">
                                  ${fee.depositAmount.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeeStatisticsPage;

