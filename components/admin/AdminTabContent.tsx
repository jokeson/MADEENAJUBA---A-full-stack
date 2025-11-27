"use client";

/**
 * Admin Tab Content Component
 * 
 * This component renders the content for the currently active admin tab.
 * It conditionally renders the appropriate component based on the active tab ID.
 * 
 * Component Mapping:
 * - statistics → Statistics component (platform metrics)
 * - users → UserTable component (user management)
 * - wallets → WalletTable component (wallet management)
 * - fees → FeeLedger component (fee tracking)
 * - redeem → RedeemGeneratorForm component (code generation)
 * - kyc → KycReviewDrawer component (KYC approval)
 * - control → Control component (system settings)
 * - permission → Permission component (permission management)
 * 
 * @param activeTab - Currently active tab ID that determines which component to render
 */

import { AdminTabId } from "./config/adminTabs";
import UserTable from "./UserTable";
import WalletTable from "./WalletTable";
import FeeLedger from "./FeeLedger";
import RedeemGeneratorForm from "./RedeemGeneratorForm";
import KycReviewDrawer from "./KycReviewDrawer";
import Statistics from "./Statistics";
import Control from "./Control";
import Permission from "./Permission";

interface AdminTabContentProps {
  activeTab: AdminTabId;
  onKycNotificationRefresh?: () => void; // Optional callback to refresh KYC notifications
  onEventNotificationRefresh?: () => void; // Optional callback to refresh event notifications
}

const AdminTabContent = ({ activeTab, onKycNotificationRefresh, onEventNotificationRefresh }: AdminTabContentProps) => {
  /**
   * Renders the appropriate component based on the active tab
   * Each case maps to a specific admin functionality section
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "statistics":
        // Platform statistics and metrics dashboard
        return <Statistics />;

      case "users":
        // User management: view, update roles, delete users
        return <UserTable />;

      case "wallets":
        // Wallet management: view balances, transactions, suspend/terminate
        return <WalletTable />;

      case "fees":
        // Fee ledger: track all system fees (P2P, tickets, invoices, withdrawals)
        return <FeeLedger />;

      case "redeem":
        // Redeem code generator: create deposit codes for wallet top-ups
        return <RedeemGeneratorForm />;

      case "kyc":
        // KYC review: approve/reject wallet applications with ID verification
        return <KycReviewDrawer onNotificationRefresh={onKycNotificationRefresh} />;

      case "control":
        // System control: manage system settings and configurations
        return <Control />;

      case "permission":
        // Permission management: manage user permissions and access control
        return <Permission onNotificationRefresh={onEventNotificationRefresh} />;

      default:
        // Fallback to statistics if unknown tab
        return <Statistics />;
    }
  };

  return (
    <div className="mt-4 sm:mt-6" role="tabpanel">
      {renderTabContent()}
    </div>
  );
};

export default AdminTabContent;

