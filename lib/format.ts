// Formatting utilities

/**
 * Format currency amount with the system currency
 * If currency is not provided, it will default to "SSP"
 * 
 * @param amount - Amount in dollars (not cents)
 * @param currency - Currency code (optional, defaults to system currency or SSP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency?: string): string {
  // If currency is not provided, try to get from system settings
  // For now, default to SSP if not provided
  const currencyCode = currency || "SSP";
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${currencyCode} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Get system currency from settings
 * This is a helper function that can be used in client components
 * 
 * @returns Promise with currency code
 */
export async function getSystemCurrency(): Promise<string> {
  try {
    const { getSystemSettings } = await import("@/lib/server-actions/system-settings");
    const result = await getSystemSettings();
    return result.success && result.settings ? result.settings.currency : "SSP";
  } catch (error) {
    console.error("Error getting system currency:", error);
    return "SSP";
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(d);
}

/**
 * Format date with detailed time information
 * Format: "Jan 15, 2024, 10:30:45 AM"
 * 
 * @param date - Date object or ISO date string
 * @returns Formatted date string with time
 */
export function formatDateDetailed(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format date with time (without seconds)
 * Format: "Jan 15, 2024, 10:30 AM"
 * 
 * @param date - Date object or ISO date string
 * @returns Formatted date string with time (no seconds)
 */
export function formatDateWithTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

