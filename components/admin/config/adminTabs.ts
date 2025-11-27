/**
 * Admin Dashboard Tab Configuration
 * 
 * This file contains the configuration for all admin dashboard tabs.
 * Each tab represents a different section of the admin interface.
 * 
 * Tab Structure:
 * - id: Unique identifier for the tab (used for routing and state management)
 * - label: Display name shown in the tab navigation
 * - icon: Emoji icon displayed next to the label
 */

export type AdminTabId = "statistics" | "users" | "wallets" | "fees" | "redeem" | "kyc" | "control" | "permission";

export interface AdminTab {
  id: AdminTabId;
  label: string;
  icon: string;
  description?: string; // Optional description for accessibility and tooltips
}

/**
 * Array of all available admin tabs
 * Order determines the display order in the navigation
 */
export const ADMIN_TABS: AdminTab[] = [
  {
    id: "statistics",
    label: "Statistics",
    icon: "📊",
    description: "View platform statistics and metrics",
  },
  {
    id: "users",
    label: "Users",
    icon: "👥",
    description: "Manage user accounts and roles",
  },
  {
    id: "wallets",
    label: "Wallets",
    icon: "💳",
    description: "View and manage wallet accounts",
  },
  {
    id: "fees",
    label: "Fee Ledger",
    icon: "💰",
    description: "Track all system fees and revenue",
  },
  {
    id: "redeem",
    label: "Redeem Generator",
    icon: "🎫",
    description: "Generate deposit codes for wallet top-ups",
  },
  {
    id: "kyc",
    label: "KYC Review",
    icon: "📋",
    description: "Review and approve KYC applications",
  },
  {
    id: "control",
    label: "Control",
    icon: "⚙️",
    description: "System settings and controls",
  },
  {
    id: "permission",
    label: "Permission",
    icon: "🔐",
    description: "Manage user permissions and access control",
  },
];

/**
 * Default tab to show when admin page loads
 */
export const DEFAULT_TAB: AdminTabId = "statistics";

