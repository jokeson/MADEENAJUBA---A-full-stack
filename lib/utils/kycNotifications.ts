/**
 * KYC Notification Utilities
 * 
 * This module handles tracking which KYC applications have been viewed by admins.
 * It uses localStorage to persist viewed application IDs across page refreshes.
 * 
 * Features:
 * - Track viewed applications per admin user
 * - Get count of unviewed pending applications
 * - Mark applications as viewed when admin opens them
 * - Clear viewed status when needed
 */

const STORAGE_KEY_PREFIX = "kyc_viewed_applications_";

/**
 * Get the storage key for the current admin user
 * @param userId - Admin user ID
 * @returns Storage key string
 */
const getStorageKey = (userId: string): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
};

/**
 * Get all viewed application IDs for a specific admin user
 * @param userId - Admin user ID
 * @returns Array of viewed application IDs
 */
export const getViewedApplications = (userId: string): string[] => {
  if (typeof window === "undefined") return [];
  
  try {
    const key = getStorageKey(userId);
    const viewed = localStorage.getItem(key);
    return viewed ? JSON.parse(viewed) : [];
  } catch (error) {
    console.error("Error getting viewed applications:", error);
    return [];
  }
};

/**
 * Mark an application as viewed by an admin user
 * @param userId - Admin user ID
 * @param applicationId - KYC application ID to mark as viewed
 */
export const markApplicationAsViewed = (userId: string, applicationId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(userId);
    const viewed = getViewedApplications(userId);
    
    if (!viewed.includes(applicationId)) {
      viewed.push(applicationId);
      localStorage.setItem(key, JSON.stringify(viewed));
    }
  } catch (error) {
    console.error("Error marking application as viewed:", error);
  }
};

/**
 * Get count of unviewed pending applications
 * @param userId - Admin user ID
 * @param pendingApplications - Array of pending KYC applications
 * @returns Number of unviewed pending applications
 */
export const getUnviewedPendingCount = (
  userId: string,
  pendingApplications: Array<{ _id: string }>
): number => {
  if (!userId || !pendingApplications || pendingApplications.length === 0) {
    return 0;
  }
  
  const viewed = getViewedApplications(userId);
  const unviewed = pendingApplications.filter(
    (app) => !viewed.includes(app._id)
  );
  
  return unviewed.length;
};

/**
 * Clear all viewed applications for a user (useful for testing or reset)
 * @param userId - Admin user ID
 */
export const clearViewedApplications = (userId: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing viewed applications:", error);
  }
};

