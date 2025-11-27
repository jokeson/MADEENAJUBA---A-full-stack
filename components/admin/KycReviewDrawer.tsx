"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllKycApplications, approveKyc, rejectKyc } from "@/lib/server-actions/admin";
import { markApplicationAsViewed } from "@/lib/utils/kycNotifications";

interface KYCApplication {
  _id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documents: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;
}

interface KycReviewDrawerProps {
  onNotificationRefresh?: () => void; // Optional callback to refresh notification badge
}

const KycReviewDrawer = ({ onNotificationRefresh }: KycReviewDrawerProps) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<KYCApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError("");
        const apps = await getAllKycApplications();
        setApplications(apps);
      } catch (err) {
        console.error("Error loading KYC applications:", err);
        setError("Failed to load KYC applications");
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  const pendingCount = applications.filter((app) => app.status === "pending")
    .length;

  /**
   * Handle Review Click
   * 
   * Opens the review drawer for a specific application and marks it as viewed
   * to remove the notification badge if it was previously unviewed.
   * 
   * @param application - The KYC application to review
   */
  const handleReview = (application: KYCApplication) => {
    setSelectedApp(application);
    setIsDrawerOpen(true);
    
    // Mark application as viewed when admin opens it for review
    // This will hide the notification badge for this application
    if (user?.id && application.status === "pending") {
      markApplicationAsViewed(user.id, application._id);
      // Refresh notification count to update the badge
      if (onNotificationRefresh) {
        onNotificationRefresh();
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedApp || !user?.id) return;

    setProcessing(true);
    try {
      const result = await approveKyc(selectedApp._id, user.id);
      if (result.success) {
        // Reload applications
        const apps = await getAllKycApplications();
        setApplications(apps);
        setIsDrawerOpen(false);
        setSelectedApp(null);
      } else {
        setError(result.error || "Failed to approve KYC application");
      }
    } catch (err) {
      console.error("Error approving KYC:", err);
      setError("Failed to approve KYC application");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = () => {
    setIsRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedApp || !user?.id || !rejectReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const result = await rejectKyc(selectedApp._id, rejectReason, user.id);
      if (result.success) {
        // Reload applications
        const apps = await getAllKycApplications();
        setApplications(apps);
        setIsDrawerOpen(false);
        setIsRejectModalOpen(false);
        setSelectedApp(null);
        setRejectReason("");
      } else {
        setError(result.error || "Failed to reject KYC application");
      }
    } catch (err) {
      console.error("Error rejecting KYC:", err);
      setError("Failed to reject KYC application");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-[#800000]">
              KYC Review Queue
            </h3>
            <p className="text-sm text-[#800000] mt-1">
              Review and approve wallet applications
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {pendingCount} Pending
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[#800000]">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-[#800000]">
            <p className="mb-2">No KYC applications found.</p>
            <p className="text-sm">
              Applications will appear here when users submit their KYC information.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#800000] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#800000]">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="text-sm text-[#800000]">{app.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      {app.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          app.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : app.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#800000]">
                      {new Date(app.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleReview(app)}
                        className="text-blue-600 hover:text-blue-900"
                        tabIndex={0}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {isDrawerOpen && selectedApp && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-xl font-semibold text-[#800000]">
                  Review KYC Application
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-[#800000]/50 hover:text-[#800000]"
                  tabIndex={0}
                  aria-label="Close drawer"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[#800000] mb-2">
                      Personal Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div>
                        <span className="text-sm text-[#800000]">Name: </span>
                        <span className="text-sm font-medium">
                          {selectedApp.firstName} {selectedApp.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-[#800000]">Email: </span>
                        <span className="text-sm font-medium">
                          {selectedApp.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-[#800000]">Phone: </span>
                        <span className="text-sm font-medium">
                          {selectedApp.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-[#800000]">Address: </span>
                        <span className="text-sm font-medium">
                          {selectedApp.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#800000] mb-2">
                      ID Documents
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      {/* Always render ID Front from database if it exists */}
                      {selectedApp.documents && selectedApp.documents.length > 0 ? (
                        <>
                          {(() => {
                            const idFrontDoc = selectedApp.documents.find(d => d.type === "id_front");
                            const idBackDoc = selectedApp.documents.find(d => d.type === "id_back");
                            
                            return (
                              <>
                                {/* ID Front */}
                                <div>
                                  <p className="text-sm font-medium text-[#800000] mb-2">
                                    ID Front
                                  </p>
                                  {idFrontDoc && idFrontDoc.url ? (
                                    idFrontDoc.url.startsWith("blob:") ? (
                                      <div className="w-full max-w-md border border-yellow-300 rounded-lg bg-yellow-50 p-6 flex items-center justify-center">
                                        <div className="text-center">
                                          <svg
                                            className="mx-auto h-12 w-12 text-yellow-500"
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
                                          <p className="mt-2 text-sm font-semibold text-yellow-800">Image Not Available</p>
                                          <p className="mt-1 text-xs text-yellow-700">
                                            This application was submitted with a temporary image URL that has expired.
                                          </p>
                                          <p className="mt-1 text-xs text-yellow-600">
                                            Please ask the user to resubmit their KYC application with new ID images.
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="relative w-full max-w-md border border-gray-300 rounded-lg overflow-hidden bg-white">
                                        <img
                                          src={idFrontDoc.url}
                                          alt="ID Front"
                                          className="w-full h-auto object-contain min-h-[200px]"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            const parent = img.parentElement;
                                            if (parent && !parent.querySelector('.error-placeholder')) {
                                              img.style.display = 'none';
                                              const errorDiv = document.createElement('div');
                                              errorDiv.className = 'error-placeholder w-full h-48 flex items-center justify-center bg-gray-100';
                                              errorDiv.innerHTML = `
                                                <div class="text-center">
                                                  <svg class="mx-auto h-12 w-12 text-[#800000]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                  <p class="mt-2 text-sm text-[#800000]">Failed to load image</p>
                                                </div>
                                              `;
                                              parent.appendChild(errorDiv);
                                            }
                                          }}
                                        />
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full max-w-md border border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-center">
                                      <p className="text-sm text-[#800000]">ID Front not found in database</p>
                                    </div>
                                  )}
                                </div>

                                {/* ID Back */}
                                <div>
                                  <p className="text-sm font-medium text-[#800000] mb-2">
                                    ID Back
                                  </p>
                                  {idBackDoc && idBackDoc.url ? (
                                    idBackDoc.url.startsWith("blob:") ? (
                                      <div className="w-full max-w-md border border-yellow-300 rounded-lg bg-yellow-50 p-6 flex items-center justify-center">
                                        <div className="text-center">
                                          <svg
                                            className="mx-auto h-12 w-12 text-yellow-500"
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
                                          <p className="mt-2 text-sm font-semibold text-yellow-800">Image Not Available</p>
                                          <p className="mt-1 text-xs text-yellow-700">
                                            This application was submitted with a temporary image URL that has expired.
                                          </p>
                                          <p className="mt-1 text-xs text-yellow-600">
                                            Please ask the user to resubmit their KYC application with new ID images.
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="relative w-full max-w-md border border-gray-300 rounded-lg overflow-hidden bg-white">
                                        <img
                                          src={idBackDoc.url}
                                          alt="ID Back"
                                          className="w-full h-auto object-contain min-h-[200px]"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            const parent = img.parentElement;
                                            if (parent && !parent.querySelector('.error-placeholder')) {
                                              img.style.display = 'none';
                                              const errorDiv = document.createElement('div');
                                              errorDiv.className = 'error-placeholder w-full h-48 flex items-center justify-center bg-gray-100';
                                              errorDiv.innerHTML = `
                                                <div class="text-center">
                                                  <svg class="mx-auto h-12 w-12 text-[#800000]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                  <p class="mt-2 text-sm text-[#800000]">Failed to load image</p>
                                                </div>
                                              `;
                                              parent.appendChild(errorDiv);
                                            }
                                          }}
                                        />
                                      </div>
                                    )
                                  ) : (
                                    <div className="w-full max-w-md border border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-center">
                                      <p className="text-sm text-[#800000]">ID Back not found in database</p>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium text-[#800000] mb-2">ID Front</p>
                            <div className="w-full max-w-md border border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-center">
                              <p className="text-sm text-[#800000]">No documents uploaded</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#800000] mb-2">ID Back</p>
                            <div className="w-full max-w-md border border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-center">
                              <p className="text-sm text-[#800000]">No documents uploaded</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedApp.status === "rejected" && selectedApp.rejectionReason && (
                    <div>
                      <h4 className="text-sm font-medium text-[#800000] mb-2">
                        Rejection Reason
                      </h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">{selectedApp.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              {selectedApp.status === "pending" && (
                <div className="border-t p-6 flex gap-3">
                  <button
                    onClick={handleRejectClick}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-[#800000] text-white rounded-md font-medium hover:bg-[#900000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    tabIndex={0}
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-[#800000] text-white rounded-md font-medium hover:bg-[#900000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    tabIndex={0}
                  >
                    {processing ? "Processing..." : "Approve"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setIsRejectModalOpen(false);
              setRejectReason("");
            }}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-[#800000] mb-4">
                Reject KYC Application
              </h3>
              <p className="text-sm text-[#800000] mb-4">
                Please provide a reason for rejecting this application. The user will be notified of this reason.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-4"
                rows={4}
              />
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-[#800000] rounded-md font-medium hover:bg-gray-300 transition-colors"
                  tabIndex={0}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={processing || !rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-[#800000] text-white rounded-md font-medium hover:bg-[#900000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  tabIndex={0}
                >
                  {processing ? "Processing..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KycReviewDrawer;
