/**
 * Custom Hook for KYC Notifications
 * 
 * This hook manages the notification badge count for unviewed KYC applications.
 * It fetches pending applications and tracks which ones have been viewed.
 * 
 * Features:
 * - Fetches pending KYC applications
 * - Calculates unviewed count based on localStorage
 * - Updates count when applications are viewed
 * - Refreshes periodically to catch new applications
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllKycApplications } from "@/lib/server-actions/admin";
import { getUnviewedPendingCount } from "@/lib/utils/kycNotifications";

export const useKycNotifications = () => {
  const { user } = useAuth();
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch and update unviewed count
   * Wrapped in useCallback to ensure stable reference
   */
  const updateUnviewedCount = useCallback(async () => {
    if (!user?.id) {
      setUnviewedCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const applications = await getAllKycApplications();
      const pendingApplications = applications.filter(
        (app) => app.status === "pending"
      );
      const count = getUnviewedPendingCount(user.id, pendingApplications);
      setUnviewedCount(count);
    } catch (error) {
      console.error("Error fetching KYC notifications:", error);
      setUnviewedCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Effect to load and update unviewed count
   * Refreshes every 30 seconds to catch new applications
   */
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    updateUnviewedCount();

    // Refresh every 30 seconds to catch new applications
    const interval = setInterval(() => {
      updateUnviewedCount();
    }, 30000); // 30 seconds

    // Also refresh when window regains focus (user comes back to tab)
    const handleFocus = () => {
      updateUnviewedCount();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, updateUnviewedCount]);

  return {
    unviewedCount,
    loading,
    refresh: updateUnviewedCount,
  };
};

