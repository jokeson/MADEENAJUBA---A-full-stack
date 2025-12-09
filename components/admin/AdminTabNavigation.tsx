"use client";

/**
 * Admin Tab Navigation Component
 * 
 * This component renders the tab navigation bar for the admin dashboard.
 * It displays all available tabs and allows users to switch between different admin sections.
 * 
 * Features:
 * - Responsive design with horizontal scrolling on mobile
 * - Active tab highlighting
 * - Accessible keyboard navigation
 * - Visual feedback on hover
 * 
 * @param activeTab - Currently active tab ID
 * @param onTabChange - Callback function called when a tab is clicked
 * @param tabs - Array of tab configurations to display
 */

import { AdminTab, AdminTabId } from "./config/adminTabs";

interface AdminTabNavigationProps {
  activeTab: AdminTabId;
  onTabChange: (tabId: AdminTabId) => void;
  tabs: AdminTab[];
  notificationCounts?: Partial<Record<AdminTabId, number>>; // Optional notification counts per tab
}

const AdminTabNavigation = ({
  activeTab,
  onTabChange,
  tabs,
  notificationCounts = {},
}: AdminTabNavigationProps) => {
  /**
   * Handles tab click event
   * Updates the active tab when a tab button is clicked
   */
  const handleTabClick = (tabId: AdminTabId) => {
    onTabChange(tabId);
  };

  /**
   * Handles keyboard navigation for accessibility
   * Allows users to navigate tabs using Enter or Space key
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    tabId: AdminTabId
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  return (
    <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <nav
        className="flex space-x-2 sm:space-x-4 md:space-x-6 min-w-max"
        aria-label="Admin Dashboard Tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`
                flex items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0
                ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-[#800000] hover:text-[#800000] hover:border-gray-300"
                }
              `}
              tabIndex={0}
              aria-label={`Switch to ${tab.label} tab`}
              aria-selected={isActive}
              role="tab"
            >
              {/* Tab Icon */}
              <span className="text-sm sm:text-base relative flex-shrink-0" aria-hidden="true">
                {tab.icon}
                {/* Notification Badge - Red circle showing unviewed items */}
                {notificationCounts[tab.id] && notificationCounts[tab.id]! > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"
                    aria-label={`${notificationCounts[tab.id]} new items`}
                  />
                )}
              </span>
              {/* Tab Label */}
              <span className="flex-shrink-0">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminTabNavigation;

