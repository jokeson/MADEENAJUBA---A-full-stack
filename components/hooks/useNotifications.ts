/**
 * Custom Hook for User Notifications
 * 
 * This hook manages notifications for users including:
 * - Transactions (when user receives money)
 * - New posts (when someone creates a post)
 * - Event approvals (when admin approves user's event)
 * 
 * Features:
 * - Fetches unread notification count
 * - Fetches all notifications
 * - Marks notifications as read
 * - Refreshes periodically
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/server-actions/notifications";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch notifications and unread count
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [notificationsResult, countResult] = await Promise.all([
        getUserNotifications(user.id),
        getUnreadNotificationCount(user.id),
      ]);

      if (notificationsResult.success) {
        setNotifications(notificationsResult.notifications);
      }

      if (countResult.success) {
        setUnreadCount(countResult.count);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;

      try {
        const result = await markNotificationAsRead(notificationId, user.id);
        if (result.success) {
          // Update local state
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId ? { ...notif, read: true } : notif
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [user?.id]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await markAllNotificationsAsRead(user.id);
      if (result.success) {
        // Update local state
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user?.id]);

  /**
   * Effect to load and update notifications
   * Refreshes every 30 seconds to catch new notifications
   */
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Initial load
    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    // Also refresh when window regains focus
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

