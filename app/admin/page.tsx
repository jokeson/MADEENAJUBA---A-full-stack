"use client";

/**
 * Admin Dashboard Page
 * 
 * This is the main admin dashboard page that provides comprehensive functionality
 * for managing the MADEENAJUBA platform.
 * 
 * Admin Capabilities:
 * - Statistics: View platform statistics and metrics
 * - Users Management: View and manage all users, update roles, delete users
 * - Wallets Management: View all wallets, transaction logs, balances, suspend/terminate wallets
 * - Fee Ledger: Track all system fees (P2P, tickets, invoices, withdrawals)
 * - Redeem Code Generator: Create deposit codes for wallet top-ups
 * - KYC Review: Approve/reject wallet applications with ID verification
 * - Control: System settings and configurations
 * - Permission: Manage user permissions and access control
 * 
 * Access Control:
 * - Only users with "admin" role can access this page
 * - Non-admin users are automatically redirected to /dashboard
 * - Authentication and authorization checks are performed on page load
 * 
 * Architecture:
 * - This page uses a tab-based navigation system
 * - Each tab renders a separate component for its functionality
 * - Tab configuration is managed in a separate config file
 * - Navigation and content rendering are separated into reusable components
 * 
 * See MADEENAJUBA.md and README.md for detailed admin documentation.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/rbac";
import Sidebar from "@/components/Sidebar";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminTabNavigation from "@/components/admin/AdminTabNavigation";
import AdminTabContent from "@/components/admin/AdminTabContent";
import AdminPageLoading from "@/components/admin/AdminPageLoading";
import { ADMIN_TABS, DEFAULT_TAB, AdminTabId } from "@/components/admin/config/adminTabs";
import { useKycNotifications } from "@/components/admin/hooks/useKycNotifications";
import { useEventNotifications } from "@/components/admin/hooks/useEventNotifications";

const AdminPage = () => {
  // Authentication and user state
  const { user, loading } = useAuth();
  const router = useRouter();

  // Active tab state - determines which admin section is currently displayed
  const [activeTab, setActiveTab] = useState<AdminTabId>(DEFAULT_TAB);

  // KYC Notifications - Track unviewed pending applications
  const { unviewedCount: kycUnviewedCount, refresh: refreshKycNotifications } = useKycNotifications();

  // Event Notifications - Track pending events that need approval
  const { pendingCount: eventPendingCount, refresh: refreshEventNotifications } = useEventNotifications();

  /**
   * Effect to refresh notifications when respective tabs become active
   * This ensures the badge count is updated when admin switches to these tabs
   */
  useEffect(() => {
    if (activeTab === "kyc") {
      refreshKycNotifications();
    } else if (activeTab === "permission") {
      refreshEventNotifications();
    }
  }, [activeTab, refreshKycNotifications, refreshEventNotifications]);

  /**
   * Access Control Effect
   * 
   * This effect runs on component mount and whenever loading/user state changes.
   * It ensures that only authenticated admin users can access this page.
   * 
   * Behavior:
   * - If user is not loading and either no user exists or user is not admin → redirect to /dashboard
   * - This prevents unauthorized access to admin functionality
   */
  useEffect(() => {
    if (!loading && (!user || !isAdmin(user.role))) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  /**
   * Tab Change Handler
   * 
   * Updates the active tab when user clicks on a different tab.
   * This triggers a re-render of the tab content area.
   * 
   * @param tabId - The ID of the tab to switch to
   */
  const handleTabChange = (tabId: AdminTabId) => {
    setActiveTab(tabId);
  };

  /**
   * Loading State
   * 
   * Displays a loading spinner while authentication is being verified.
   * This prevents flash of unauthorized content.
   */
  if (loading) {
    return <AdminPageLoading />;
  }

  /**
   * Authorization Check
   * 
   * If user is not authenticated or not an admin, render nothing.
   * The useEffect will handle the redirect, but we also need to prevent
   * rendering the admin interface to unauthorized users.
   */
  if (!user || !isAdmin(user.role)) {
    return null;
  }

  /**
   * Main Admin Dashboard Layout
   * 
   * Structure:
   * - Sidebar: Navigation sidebar (shared across the app)
   * - Main Content Area:
   *   - Header: Brief description of admin functionality
   *   - Tab Navigation: Horizontal tab bar for switching between admin sections
   *   - Tab Content: Dynamically rendered component based on active tab
   */
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 w-full md:ml-56 lg:ml-56 xl:ml-60">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 py-4 xs:py-5 sm:py-6 md:py-8 lg:py-10 xl:py-12">
          {/* Page Header */}
          <AdminPageHeader />

          {/* Tab Navigation */}
          <AdminTabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tabs={ADMIN_TABS}
            notificationCounts={{
              kyc: kycUnviewedCount > 0 ? kycUnviewedCount : undefined,
              permission: eventPendingCount > 0 ? eventPendingCount : undefined,
            }}
          />

          {/* Tab Content - Renders the appropriate component based on active tab */}
          <AdminTabContent 
            activeTab={activeTab} 
            onKycNotificationRefresh={refreshKycNotifications}
            onEventNotificationRefresh={refreshEventNotifications}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
