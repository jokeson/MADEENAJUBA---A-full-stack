"use client";

/**
 * Admin Page Header Component
 * 
 * This component renders the header section of the admin dashboard.
 * It displays a brief description of the admin page functionality.
 * 
 * Features:
 * - Responsive text sizing
 * - Consistent styling with the rest of the admin interface
 */

const AdminPageHeader = () => {
  return (
    <div className="flex-shrink-0">
      <div className="flex-1">
        <p className="text-sm sm:text-base text-[#800000]">
          Manage users, wallets, fees, and KYC applications
        </p>
      </div>
    </div>
  );
};

export default AdminPageHeader;

