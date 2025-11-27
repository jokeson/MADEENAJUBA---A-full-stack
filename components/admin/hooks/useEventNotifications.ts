/**
 * Custom Hook for Event Notifications
 * 
 * This hook manages the notification badge count for pending events that need admin approval.
 * It fetches pending events and returns the count.
 * 
 * Features:
 * - Fetches pending events
 * - Returns count of pending events
 * - Refreshes periodically to catch new events
 */

import { useState, useEffect, useCallback } from "react";
import { getPendingEvents } from "@/lib/server-actions/events";

export const useEventNotifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch and update pending events count
   * Wrapped in useCallback to ensure stable reference
   */
  const updatePendingCount = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPendingEvents();
      if (result.success) {
        setPendingCount(result.events.length);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Error fetching pending events:", error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effect to load and update pending count
   * Refreshes every 30 seconds to catch new events
   */
  useEffect(() => {
    // Initial load
    updatePendingCount();

    // Refresh every 30 seconds to catch new events
    const interval = setInterval(() => {
      updatePendingCount();
    }, 30000); // 30 seconds

    // Also refresh when window regains focus (user comes back to tab)
    const handleFocus = () => {
      updatePendingCount();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [updatePendingCount]);

  return {
    pendingCount,
    loading,
    refresh: updatePendingCount,
  };
};

