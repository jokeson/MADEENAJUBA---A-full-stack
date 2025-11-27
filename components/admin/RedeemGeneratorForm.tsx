"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { generateRedeemCode, getAllRedeemCodes, deleteRedeemCodes } from "@/lib/server-actions/admin";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface RedeemCode {
  _id?: string;
  code: string;
  pin: string;
  amount: number;
  createdAt: string;
  used: boolean;
  usedBy?: string;
  usedByWalletId?: string;
  usedAt?: string;
  expiresAt?: string;
}

const RedeemGeneratorForm = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"generate" | "redeemNumbers">("generate");
  const [amount, setAmount] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [generatedCodes, setGeneratedCodes] = useState<RedeemCode[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load existing redeem codes on mount
  useEffect(() => {
    const loadRedeemCodes = async () => {
      try {
        setLoadingCodes(true);
        const codes = await getAllRedeemCodes();
        setRedeemCodes(codes);
      } catch (err) {
        console.error("Error loading redeem codes:", err);
      } finally {
        setLoadingCodes(false);
      }
    };
    loadRedeemCodes();
  }, []);

  const handleGenerateRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("You must be logged in to generate redeem codes");
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0 || quantityNum > 100) {
      setError("Please enter a valid quantity (1-100)");
      return;
    }

    setLoading(true);
    setGeneratedCodes([]);

    try {
      const expiry = expiryDate ? new Date(expiryDate) : undefined;
      const generatedCodesList: RedeemCode[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Generate multiple codes
      for (let i = 0; i < quantityNum; i++) {
        try {
          const result = await generateRedeemCode(amountNum, user.id, expiry);

          if (result.success) {
            const newCode: RedeemCode = {
              code: result.code!,
              pin: result.pin!,
              amount: result.amount!, // Store in cents to match database format
              createdAt: result.createdAt!,
              used: false,
              expiresAt: result.expiresAt,
            };
            generatedCodesList.push(newCode);
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to generate code ${i + 1}:`, result.error);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error generating code ${i + 1}:`, err);
        }
      }

      if (generatedCodesList.length > 0) {
        setGeneratedCodes(generatedCodesList);
        setSuccess(
          `Successfully generated ${successCount} redeem code${successCount > 1 ? "s" : ""}${
            errorCount > 0 ? ` (${errorCount} failed)` : ""
          }`
        );
        setAmount("");
        setQuantity("1");
        setExpiryDate("");

        // Refresh the list of codes
        const codes = await getAllRedeemCodes();
        setRedeemCodes(codes);
        setCurrentPage(1); // Reset to first page after generating new codes

        setTimeout(() => {
          setSuccess("");
          setGeneratedCodes([]);
        }, 30000); // Show for 30 seconds so admin can copy all codes
      } else {
        setError(`Failed to generate any redeem codes. ${errorCount > 0 ? `${errorCount} error(s) occurred.` : ""}`);
      }
    } catch (err) {
      console.error("Error generating redeem codes:", err);
      setError("An error occurred while generating the redeem codes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-[#800000] mb-6">
        Redeem Code Generator
      </h3>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("generate")}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "generate"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-[#800000] hover:text-[#800000] hover:border-gray-300"
              }
            `}
            tabIndex={0}
            aria-label="Switch to Generate Redeem Code tab"
          >
            Generate Redeem Code
          </button>
          <button
            onClick={() => {
              setActiveTab("redeemNumbers");
              setCurrentPage(1); // Reset to first page when switching tabs
              setSelectedCodes(new Set()); // Clear selections when switching tabs
              // Reload codes when switching to Redeem Number tab
              const loadRedeemCodes = async () => {
                try {
                  setLoadingCodes(true);
                  const codes = await getAllRedeemCodes();
                  setRedeemCodes(codes);
                } catch (err) {
                  console.error("Error loading redeem codes:", err);
                } finally {
                  setLoadingCodes(false);
                }
              };
              loadRedeemCodes();
            }}
            className={`
              py-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "redeemNumbers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-[#800000] hover:text-[#800000] hover:border-gray-300"
              }
            `}
            tabIndex={0}
            aria-label="Switch to Redeem Number tab"
          >
            Redeem Number
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "generate" && (
        <>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Generated Codes Display */}
      {generatedCodes.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-[#800000] mb-3">
            {generatedCodes.length === 1 ? "Redeem Code Generated:" : `${generatedCodes.length} Redeem Codes Generated:`}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[#800000] uppercase">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[#800000] uppercase">PIN</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-[#800000] uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generatedCodes.map((code, index) => (
                  <tr key={index} className="hover:bg-blue-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                      {code.code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-bold text-blue-600">
                      {code.pin}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-green-600">
                      ${(code.amount / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#800000] mt-3">
            Save this information. Each code can only be used once.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleGenerateRedeemCode} className="space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-[#800000] mb-1"
          >
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-[#800000]md:text-[#800000] placeholder:text-[#800000] touch-manipulation"
            placeholder="Enter amount"
            required
            disabled={loading}
            autoComplete="off"
            inputMode="decimal"
          />
          <p className="mt-1 text-xs text-[#800000]">
            Enter the amount to be credited when each redeem code is used
          </p>
        </div>

        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-[#800000] mb-1"
          >
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-[#800000]md:text-[#800000] placeholder:text-[#800000] touch-manipulation"
            placeholder="Enter quantity"
            required
            disabled={loading}
            autoComplete="off"
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-[#800000]">
            Number of redeem codes to generate (1-100). Example: Enter 3 to generate 3 codes of the specified amount.
          </p>
        </div>

        <div>
          <label
            htmlFor="expiryDate"
            className="block text-sm font-medium text-[#800000] mb-1"
          >
            Expiration Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-[#800000]">
            Leave empty for codes that never expire
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#800000] text-white py-3 rounded-md font-medium hover:bg-[#900000] transition-colors focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Redeem Code"}
        </button>
      </form>
        </>
      )}

      {activeTab === "redeemNumbers" && (
        <div>
          <h4 className="text-lg font-semibold text-[#800000] mb-4">
            All Redeem Numbers
          </h4>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              {success}
            </div>
          )}

        {loadingCodes ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[#800000]">Loading redeem codes...</p>
          </div>
        ) : redeemCodes.length === 0 ? (
          <div className="text-center py-8 text-[#800000]">
            <p>No redeem codes generated yet.</p>
            <p className="text-sm mt-2">Generate your first redeem code above.</p>
          </div>
        ) : (
          <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-[#800000]">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, redeemCodes.length)} of {redeemCodes.length} redeem codes
            </div>
            {selectedCodes.size > 0 && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                tabIndex={0}
                aria-label={`Delete ${selectedCodes.size} selected redeem code${selectedCodes.size > 1 ? "s" : ""}`}
              >
                Delete Selected ({selectedCodes.size})
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        redeemCodes
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .every((code) => code._id && selectedCodes.has(code._id))
                      }
                      onChange={(e) => {
                        const currentPageCodes = redeemCodes.slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage
                        );
                        if (e.target.checked) {
                          const newSelected = new Set(selectedCodes);
                          currentPageCodes.forEach((code) => {
                            if (code._id) newSelected.add(code._id);
                          });
                          setSelectedCodes(newSelected);
                        } else {
                          const newSelected = new Set(selectedCodes);
                          currentPageCodes.forEach((code) => {
                            if (code._id) newSelected.delete(code._id);
                          });
                          setSelectedCodes(newSelected);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label="Select all codes on this page"
                      tabIndex={0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    PIN
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Used By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redeemCodes
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((code) => {
                  const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                  const status = code.used ? "Used" : isExpired ? "Expired" : "Active";
                  
                  const codeId = code._id || "";
                  const isSelected = selectedCodes.has(codeId);
                  
                  return (
                    <tr key={code._id || code.code} className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSelected = new Set(selectedCodes);
                            if (e.target.checked && codeId) {
                              newSelected.add(codeId);
                            } else {
                              newSelected.delete(codeId);
                            }
                            setSelectedCodes(newSelected);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          aria-label={`Select redeem code ${code.code}`}
                          tabIndex={0}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[#800000]">
                        {code.code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[#800000]">
                        {code.pin}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#800000]">
                        ${(code.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            code.used
                              ? "bg-gray-100 text-[#800000]"
                              : isExpired
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#800000]">
                        {code.expiresAt
                          ? new Date(code.expiresAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#800000]">
                        {code.usedByWalletId || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#800000]">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {Math.ceil(redeemCodes.length / itemsPerPage) > 1 && (
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
                  onClick={() => setCurrentPage(Math.min(Math.ceil(redeemCodes.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil(redeemCodes.length / itemsPerPage)}
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
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, redeemCodes.length)}</span> of{" "}
                    <span className="font-medium">{redeemCodes.length}</span> results
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
                    {Array.from({ length: Math.ceil(redeemCodes.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
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
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(redeemCodes.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(redeemCodes.length / itemsPerPage)}
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

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={async () => {
            if (!user?.id || selectedCodes.size === 0) {
              return;
            }

            setDeleting(true);
            setError("");
            setSuccess("");

            try {
              const codeIds = Array.from(selectedCodes);
              const result = await deleteRedeemCodes(codeIds, user.id);

              if (result.success) {
                setSuccess(result.message || "Redeem codes deleted successfully");
                setSelectedCodes(new Set());
                setDeleteModalOpen(false);

                // Reload codes
                const codes = await getAllRedeemCodes();
                setRedeemCodes(codes);
                setCurrentPage(1);

                setTimeout(() => setSuccess(""), 3000);
              } else {
                setError(result.error || "Failed to delete redeem codes");
                setTimeout(() => setError(""), 5000);
              }
            } catch (err) {
              console.error("Error deleting redeem codes:", err);
              setError("Failed to delete redeem codes");
              setTimeout(() => setError(""), 5000);
            } finally {
              setDeleting(false);
            }
          }}
          title="Delete Redeem Codes"
          message={
            selectedCodes.size === 1
              ? `Are you sure you want to delete this redeem code? This action cannot be undone.`
              : `Are you sure you want to delete ${selectedCodes.size} redeem codes? This action cannot be undone.`
          }
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={deleting}
        />
        </div>
      )}
    </div>
  );
};

export default RedeemGeneratorForm;
