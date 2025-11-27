"use client";

import { useEffect, useState } from "react";
import { getSystemSettings } from "@/lib/server-actions/system-settings";

const MaintenanceNotification = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceMode();
    // Check every 30 seconds for maintenance mode updates
    const interval = setInterval(checkMaintenanceMode, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const result = await getSystemSettings();
      if (result.success && result.settings) {
        setMaintenanceMode(result.settings.maintenanceMode);
        setMaintenanceMessage(result.settings.maintenanceMessage);
      }
    } catch (error) {
      console.error("Error checking maintenance mode:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !maintenanceMode) {
    return null;
  }

  return (
    <div className="w-full bg-yellow-500 border-b-2 border-yellow-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-yellow-900 flex-shrink-0"
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
            <p className="text-yellow-900 font-medium text-sm sm:text-base">
              {maintenanceMessage || "The website is currently under maintenance. Please check back later."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceNotification;

