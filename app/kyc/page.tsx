"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { submitKycApplication, getKycStatus } from "@/lib/server-actions/kyc";
import { uploadImageToCloudinary } from "@/lib/server-actions/cloudinary";
import Sidebar from "@/components/Sidebar";

const KycPage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    idFrontUrl: "",
    idBackUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [kycStatus, setKycStatus] = useState<{
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const fetchKycStatus = async () => {
      if (user?.id) {
        const result = await getKycStatus(user.id, user.email);
        if (result.success && result.kyc) {
          setKycStatus({
            status: result.kyc.status,
            rejectionReason: result.kyc.rejectionReason,
          });
        }
      }
    };
    fetchKycStatus();
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setError("");
    setSuccess("Uploading image...");

    try {
      // Convert file to base64 for upload
      const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
          resolve(base64Url);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read image file"));
        };
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(
        base64Data,
        'madeenajuba/kyc',
        `${user?.id || 'user'}_${type}_${Date.now()}`
      );

      if (!uploadResult.success || !uploadResult.url) {
        setError(uploadResult.error || "Failed to upload image. Please try again.");
        setSuccess("");
        return;
      }

      // Store Cloudinary URL instead of base64
      if (type === "front") {
        setFormData((prev) => ({ ...prev, idFrontUrl: uploadResult.url! }));
      } else {
        setFormData((prev) => ({ ...prev, idBackUrl: uploadResult.url! }));
      }
      
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload image. Please try again.");
      setSuccess("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!user?.id) {
      setError("User not authenticated");
      setSubmitting(false);
      return;
    }

    // Validate all fields
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.idFrontUrl || !formData.idBackUrl) {
      setError("All fields are required");
      setSubmitting(false);
      return;
    }

    const result = await submitKycApplication(
      user.id,
      formData.firstName,
      formData.lastName,
      formData.phone,
      formData.address,
      formData.idFrontUrl,
      formData.idBackUrl,
      user.email
    );

    if (result.success) {
      setSuccess(result.message || "KYC application submitted successfully");
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        idFrontUrl: "",
        idBackUrl: "",
      });
      // Refresh KYC status
      const statusResult = await getKycStatus(user.id, user.email);
      if (statusResult.success && statusResult.kyc) {
        setKycStatus({
          status: statusResult.kyc.status,
          rejectionReason: statusResult.kyc.rejectionReason,
        });
      }
    } else {
      setError(result.error || "Failed to submit KYC application");
    }

    setSubmitting(false);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      <div className="flex-1 md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#800000] mb-2">KYC Application</h1>
            <p className="text-[#800000] mb-6">
              Complete your Know Your Customer (KYC) application to activate your wallet
            </p>

            {/* Show status message when application is pending */}
            {kycStatus?.status === "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-2">
                      Important Information
                    </h2>
                    <p className="text-blue-800 text-sm sm:text-base leading-relaxed">
                      Your application will be reviewed by an admin within 24 hours. You will receive a notification once your application is approved or rejected.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show approved message and redirect to wallet */}
            {kycStatus?.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 sm:h-8 sm:w-8 text-green-600"
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
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-2">
                      Application Approved
                    </h2>
                    <p className="text-green-800 text-sm sm:text-base mb-4">
                      Your KYC application has been approved. Your wallet is now active!
                    </p>
                    <button
                      onClick={() => router.push("/wallet")}
                      className="inline-flex items-center gap-2 bg-[#800000] hover:bg-[#900000] text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors"
                      tabIndex={0}
                      aria-label="Go to wallet"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push("/wallet");
                        }
                      }}
                    >
                      Go to Wallet
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show rejection message with reason */}
            {kycStatus?.status === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 sm:p-8 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 sm:h-8 sm:w-8 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-2">
                      Application Rejected
                    </h2>
                    <p className="text-red-800 text-sm sm:text-base mb-2 font-semibold">
                      Rejection Reason:
                    </p>
                    <p className="text-red-700 text-sm sm:text-base mb-4">
                      {kycStatus.rejectionReason || "Your KYC application was rejected. Please review and resubmit."}
                    </p>
                    <p className="text-red-700 text-sm sm:text-base">
                      Please review the reason above and resubmit your application with the necessary corrections.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Only show form if no application exists or application was rejected (allowing resubmission) */}
            {(!kycStatus || kycStatus.status === "rejected") && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[#800000] mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-[#800000]md:text-[#800000] touch-manipulation"
                      required
                      disabled={submitting || kycStatus?.status === "pending"}
                      autoComplete="given-name"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[#800000] mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-[#800000]md:text-[#800000] touch-manipulation"
                      required
                      disabled={submitting || kycStatus?.status === "pending"}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#800000] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-[#800000]md:text-[#800000] touch-manipulation"
                    placeholder="+1234567890"
                    required
                    disabled={loading || kycStatus?.status === "pending"}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[#800000] mb-2">
                    Residential Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base text-[#800000]md:text-[#800000] touch-manipulation"
                    placeholder="Enter your full residential address"
                    required
                    disabled={loading || kycStatus?.status === "pending"}
                    autoComplete="street-address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="idFront" className="block text-sm font-medium text-[#800000] mb-2">
                      ID Front (Photo) *
                    </label>
                    <input
                      type="file"
                      id="idFront"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "front")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                      disabled={submitting || kycStatus?.status === "pending"}
                    />
                    {formData.idFrontUrl && (
                      <p className="mt-2 text-sm text-green-600">✓ Front ID uploaded</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="idBack" className="block text-sm font-medium text-[#800000] mb-2">
                      ID Back (Photo) *
                    </label>
                    <input
                      type="file"
                      id="idBack"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "back")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                      disabled={submitting || kycStatus?.status === "pending"}
                    />
                    {formData.idBackUrl && (
                      <p className="mt-2 text-sm text-green-600">✓ Back ID uploaded</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || kycStatus?.status === "pending"}
                  className="w-full bg-[#800000] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#900000] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : kycStatus?.status === "pending" ? "Application Under Review" : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycPage;

