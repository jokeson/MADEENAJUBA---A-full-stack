"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { canHandleFinance } from "@/lib/rbac";
import FinancePayoutModal from "@/components/wallet/FinancePayoutModal";
import Sidebar from "@/components/Sidebar";

const FinancePage = () => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !canHandleFinance(user.role))) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  const handleSignOut = () => {
    signOut();
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

  if (!user || !canHandleFinance(user.role)) {
    return null;
  }

  const handleSuccess = () => {
    // Refresh data or show success message
    console.log("Payout processed successfully");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-[#800000]">
                Finance - Cash Payouts
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[#800000]">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-red-500 bg-white border border-red-500/30 rounded-lg hover:bg-red-50 transition-colors"
                  tabIndex={0}
                  aria-label="Sign out"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-red-500">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-purple-600"
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
                  </div>
                  <h2 className="text-2xl font-bold text-[#800000] mb-2">
                    Process Cash Payouts
                  </h2>
                  <p className="text-[#800000] mb-8">
                    Enter a withdrawal reference number to review and process cash payouts.
                    Verify user identity and confirm the payout.
                  </p>
                </div>

                <button
                  onClick={() => setIsPayModalOpen(true)}
                  className="px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  tabIndex={0}
                  aria-label="Open Pay modal to process cash payout"
                >
                  Pay
                </button>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-[#800000] mb-4">
                  Payout Process
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-[#800000]">
                  <li>Click the "Pay" button above</li>
                  <li>Enter the withdrawal reference number</li>
                  <li>Review user data and valid ID images</li>
                  <li>Verify withdrawal timestamp and transaction status</li>
                  <li>Confirm the payout to process</li>
                </ol>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> A 5% system fee will be deducted from the withdrawal amount
                    and credited to the Admin wallet. The remaining amount will be processed for payout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Finance Payout Modal */}
      {user._id && (
        <FinancePayoutModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={handleSuccess}
          financeUserId={user._id}
          userRole={user.role}
        />
      )}
    </div>
  );
};

export default FinancePage;

