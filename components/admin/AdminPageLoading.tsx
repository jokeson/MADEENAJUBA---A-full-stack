"use client";

/**
 * Admin Page Loading Component
 * 
 * This component displays a loading spinner while the admin page is initializing.
 * It is shown while checking user authentication and role permissions.
 * 
 * Features:
 * - Centered loading spinner
 * - Brand color styling
 * - Accessible loading message
 */

const AdminPageLoading = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="text-center">
        {/* Loading Spinner */}
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
          role="status"
          aria-label="Loading"
        />
        {/* Loading Text */}
        <p className="text-[#800000]">Loading...</p>
      </div>
    </div>
  );
};

export default AdminPageLoading;

