"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSettings } from "@/lib/server-actions/system-settings";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageToCloudinary } from "@/lib/server-actions/cloudinary";

interface SystemSettings {
  p2pFeePercentage: number;
  ticketFeePercentage: number;
  invoiceFeePercentage: number;
  withdrawalFeePercentage: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxBalanceForDeletion: number;
  currency: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBackgroundImageUrl: string;
}

// List of common currencies
const CURRENCIES = [
  { code: "SSP", name: "South Sudanese Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", name: "South African Rand" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
];

const Control = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<SystemSettings>({
    p2pFeePercentage: 5,
    ticketFeePercentage: 10,
    invoiceFeePercentage: 5,
    withdrawalFeePercentage: 5,
    maintenanceMode: false,
    maintenanceMessage: "The website is currently under maintenance. Please check back later.",
    maxBalanceForDeletion: 0,
    currency: "SSP",
    heroHeadline: "Time is money.\nSave both.",
    heroSubheadline: "Easy-to-use corporate cards, bill payments, accounting, and a whole lot more. All in one place.",
    heroBackgroundImageUrl: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getSystemSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        // Log for debugging
        console.log("Settings loaded from database. Hero image URL:", result.settings.heroBackgroundImageUrl);
      } else {
        setError(result.error || "Failed to load settings");
      }
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const validateImageUrl = (url: string): { valid: boolean; error?: string } => {
    // Allow empty URL (will show placeholder)
    if (!url || url.trim().length === 0) {
      return { valid: true };
    }

    // Check if it's a valid URL format
    try {
      // Allow relative paths (starting with /)
      if (url.startsWith("/")) {
        return { valid: true };
      }

      // Allow data URLs
      if (url.startsWith("data:image/")) {
        return { valid: true };
      }

      // Validate absolute URLs
      const urlObj = new URL(url);
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return { valid: false, error: "Invalid image URL format. Use http://, https://, or a relative path starting with /." };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid image URL format. Please enter a valid URL or file path." };
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError("❌ User not authenticated. Please log in again.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Validate hero background image URL before saving
    const imageValidation = validateImageUrl(settings.heroBackgroundImageUrl);
    if (!imageValidation.valid) {
      setError(`❌ Hero Background Image Error: ${imageValidation.error}`);
      setTimeout(() => setError(""), 7000);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateSystemSettings(user.id, {
        p2pFeePercentage: settings.p2pFeePercentage,
        ticketFeePercentage: settings.ticketFeePercentage,
        invoiceFeePercentage: settings.invoiceFeePercentage,
        withdrawalFeePercentage: settings.withdrawalFeePercentage,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        maxBalanceForDeletion: settings.maxBalanceForDeletion,
        currency: settings.currency,
        heroHeadline: settings.heroHeadline,
        heroSubheadline: settings.heroSubheadline,
        heroBackgroundImageUrl: settings.heroBackgroundImageUrl,
      });

      if (result.success) {
        const savedImageUrl = settings.heroBackgroundImageUrl;
        setSuccess(`✅ Settings saved successfully! Hero image URL saved to database: ${savedImageUrl ? savedImageUrl.substring(0, 60) + '...' : 'No image URL'}. The hero section will update on the homepage.`);
        setTimeout(() => setSuccess(""), 8000);
        // Reload settings to ensure we have the latest data from database
        await loadSettings();
        
        // Log for debugging
        console.log("Settings saved to database. Hero image URL:", savedImageUrl);
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        setError(`❌ Failed to save settings: ${errorMsg}. Please try again or contact support if the problem persists.`);
        setTimeout(() => setError(""), 8000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(`❌ Error saving settings: ${errorMessage}. Please check your connection and try again.`);
      setTimeout(() => setError(""), 8000);
    } finally {
      setSaving(false);
    }
  };

  const handleFeeChange = (field: keyof SystemSettings, value: number) => {
    if (value < 0 || value > 100) {
      return; // Invalid value
    }
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleMaintenanceToggle = () => {
    setSettings((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("❌ No file selected. Please choose an image file to upload.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("❌ Invalid file type. Please select an image file (JPG, PNG, GIF, etc.).");
      setTimeout(() => setError(""), 5000);
      // Reset file input
      e.target.value = "";
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`❌ Image file is too large (${fileSizeMB} MB). Maximum allowed size is 10 MB. Please choose a smaller image.`);
      setTimeout(() => setError(""), 7000);
      // Reset file input
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    setError("");
    setSuccess("");

    try {
      // Convert file to base64 for upload
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          if (!base64Url) {
            reject(new Error("Failed to read image file. The file may be corrupted."));
            return;
          }
          resolve(base64Url);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read image file. Please try selecting the file again."));
        };
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(
        base64Data,
        'madeenajuba/hero',
        `hero_background_${Date.now()}`
      );

      if (!uploadResult.success || !uploadResult.url) {
        const errorMessage = uploadResult.error || "Unknown error occurred";
        setError(`❌ Failed to upload image to Cloudinary: ${errorMessage}. Please check your Cloudinary configuration or try again.`);
        setTimeout(() => setError(""), 8000);
        // Reset file input
        e.target.value = "";
        return;
      }

      // Update settings with new Cloudinary URL from database
      const cloudinaryUrl = uploadResult.url!;
      setSettings((prev) => ({ ...prev, heroBackgroundImageUrl: cloudinaryUrl }));
      setSuccess(`✅ Image uploaded successfully to Cloudinary! URL: ${cloudinaryUrl.substring(0, 50)}... Don't forget to click 'Save Settings' to save it to the database.`);
      setTimeout(() => setSuccess(""), 8000);
      
      // Log for debugging
      console.log("Image uploaded to Cloudinary:", cloudinaryUrl);
      console.log("Image URL will be saved to database when you click 'Save Settings'");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(`❌ Image upload failed: ${errorMessage}. Please try again or contact support if the problem persists.`);
      setTimeout(() => setError(""), 8000);
      // Reset file input
      e.target.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-[#800000]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-[#800000] mb-2">System Control</h3>
        <p className="text-sm text-gray-600">
          Manage system fees and maintenance mode settings
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Currency Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">Currency Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Application Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, currency: e.target.value }))
              }
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000] bg-white"
              aria-label="Select application currency"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              This currency will be used throughout the application for displaying amounts, balances, and transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Fee Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">Fee Settings</h4>
        <div className="space-y-6">
          {/* P2P Fee */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              P2P Transaction Fee (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.p2pFeePercentage}
                onChange={(e) =>
                  handleFeeChange("p2pFeePercentage", parseFloat(e.target.value) || 0)
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
                aria-label="P2P transaction fee percentage"
              />
              <span className="text-sm text-gray-600">
                Current: {settings.p2pFeePercentage}% fee on peer-to-peer transfers
              </span>
            </div>
          </div>

          {/* Ticket Fee */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Ticket Sales Fee (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.ticketFeePercentage}
                onChange={(e) =>
                  handleFeeChange("ticketFeePercentage", parseFloat(e.target.value) || 0)
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
                aria-label="Ticket sales fee percentage"
              />
              <span className="text-sm text-gray-600">
                Current: {settings.ticketFeePercentage}% fee on ticket sales
              </span>
            </div>
          </div>

          {/* Invoice Fee */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Invoice Payment Fee (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.invoiceFeePercentage}
                onChange={(e) =>
                  handleFeeChange("invoiceFeePercentage", parseFloat(e.target.value) || 0)
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
                aria-label="Invoice payment fee percentage"
              />
              <span className="text-sm text-gray-600">
                Current: {settings.invoiceFeePercentage}% fee on invoice payments
              </span>
            </div>
          </div>

          {/* Withdrawal Fee */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Cash Withdrawal Fee (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.withdrawalFeePercentage}
                onChange={(e) =>
                  handleFeeChange("withdrawalFeePercentage", parseFloat(e.target.value) || 0)
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
                aria-label="Cash withdrawal fee percentage"
              />
              <span className="text-sm text-gray-600">
                Current: {settings.withdrawalFeePercentage}% fee on cash withdrawals
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Deletion Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">User Deletion Settings</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Maximum Balance for User Deletion (in dollars)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                step="0.01"
                value={(settings.maxBalanceForDeletion / 100).toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setSettings((prev) => ({ ...prev, maxBalanceForDeletion: Math.round(value * 100) }));
                }}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
                aria-label="Maximum balance for user deletion in dollars"
              />
              <span className="text-sm text-gray-600">
                Users can only be deleted if their wallet balance is ${(settings.maxBalanceForDeletion / 100).toFixed(2)} or less
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Set the maximum wallet balance (in dollars) that allows user account deletion. 
              For example, setting this to $0.00 means users can only be deleted when balance is $0.00 or less.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">Hero Section Settings</h4>
        <div className="space-y-6">
          {/* Hero Headline */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Hero Headline
            </label>
            <textarea
              value={settings.heroHeadline}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, heroHeadline: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
              placeholder="Enter hero headline (use \n for line breaks)..."
              aria-label="Hero headline"
            />
            <p className="mt-1 text-xs text-gray-500">
              Main headline text displayed in the hero section. Use \n for line breaks.
            </p>
          </div>

          {/* Hero Subheadline */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Hero Subheadline
            </label>
            <textarea
              value={settings.heroSubheadline}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, heroSubheadline: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
              placeholder="Enter hero subheadline..."
              aria-label="Hero subheadline"
            />
            <p className="mt-1 text-xs text-gray-500">
              Subheadline text displayed below the main headline.
            </p>
          </div>

          {/* Hero Background Image */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Hero Background Image
            </label>
            <div className="space-y-4">
              {/* Current Image Preview */}
              {settings.heroBackgroundImageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                  {imagePreviewError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-red-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="text-sm font-medium text-red-700">❌ Failed to load image</p>
                        <p className="text-xs text-red-600 mt-1">Please check the image URL is correct</p>
                        <button
                          onClick={() => {
                            setImagePreviewError(false);
                            setSettings((prev) => ({ ...prev, heroBackgroundImageUrl: "" }));
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Clear invalid URL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={settings.heroBackgroundImageUrl}
                      alt="Hero background preview"
                      className="w-full h-full object-cover"
                      key={settings.heroBackgroundImageUrl}
                      onError={() => {
                        setImagePreviewError(true);
                      }}
                      onLoad={() => {
                        setImagePreviewError(false);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Image URL Input */}
              <div>
                <label className="block text-xs font-medium text-[#800000] mb-2">
                  Image URL (from database/Cloudinary)
                </label>
                <input
                  type="text"
                  value={settings.heroBackgroundImageUrl || ""}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, heroBackgroundImageUrl: e.target.value }));
                    setImagePreviewError(false); // Reset error when URL changes
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000] font-mono"
                  placeholder="Enter image URL or upload an image below (Cloudinary URL will appear here after upload)"
                  aria-label="Hero background image URL from database"
                  readOnly={uploadingImage}
                />
                {settings.heroBackgroundImageUrl && (
                  <p className="mt-1 text-xs text-gray-500">
                    Current URL from database: {settings.heroBackgroundImageUrl.length > 80 
                      ? `${settings.heroBackgroundImageUrl.substring(0, 80)}...` 
                      : settings.heroBackgroundImageUrl}
                  </p>
                )}
              </div>

              {/* Upload New Image */}
              <div>
                <label className="block text-xs font-medium text-[#800000] mb-2">
                  Upload New Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Upload hero background image"
                />
                {uploadingImage && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading image to Cloudinary... Please wait.</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Upload a new background image (max 10MB). The image will be uploaded to Cloudinary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-[#800000] mb-4">Maintenance Mode</h4>
        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-[#800000] mb-1">
                Enable Maintenance Mode
              </label>
              <p className="text-sm text-gray-600">
                When enabled, a maintenance notification will be displayed on the home page
              </p>
            </div>
            <button
              onClick={handleMaintenanceToggle}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.maintenanceMode ? "bg-blue-600" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={settings.maintenanceMode}
              aria-label="Toggle maintenance mode"
              tabIndex={0}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block text-sm font-medium text-[#800000] mb-2">
              Maintenance Message
            </label>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, maintenanceMessage: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-[#800000]"
              placeholder="Enter maintenance message..."
              aria-label="Maintenance message"
            />
            <p className="mt-1 text-xs text-gray-500">
              This message will be displayed to users when maintenance mode is enabled
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 bg-[#800000] text-white font-medium rounded-lg hover:bg-[#900000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={0}
          aria-label="Save system settings"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default Control;

