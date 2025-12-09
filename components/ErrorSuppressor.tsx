"use client";

import { useEffect } from "react";

/**
 * ErrorSuppressor Component
 * 
 * Suppresses harmless browser extension errors that appear in the console.
 * These errors are caused by browser extensions (ad blockers, password managers, etc.)
 * trying to communicate with the page, but the page navigates before they get a response.
 * 
 * This is a common issue and doesn't affect the application functionality.
 */
const ErrorSuppressor = () => {
  useEffect(() => {
    // Suppress browser extension errors
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error to filter out browser extension errors
    console.error = (...args: any[]) => {
      const errorMessage = args.join(" ");
      
      // Filter out common browser extension errors
      if (
        errorMessage.includes("runtime.lastError") ||
        errorMessage.includes("message port closed") ||
        errorMessage.includes("Extension context invalidated") ||
        errorMessage.includes("Receiving end does not exist")
      ) {
        // Silently ignore these errors
        return;
      }
      
      // Log other errors normally
      originalError.apply(console, args);
    };

    // Override console.warn to filter out browser extension warnings
    console.warn = (...args: any[]) => {
      const warningMessage = args.join(" ");
      
      // Filter out common browser extension warnings
      if (
        warningMessage.includes("runtime.lastError") ||
        warningMessage.includes("message port closed") ||
        warningMessage.includes("Extension context invalidated")
      ) {
        // Silently ignore these warnings
        return;
      }
      
      // Log other warnings normally
      originalWarn.apply(console, args);
    };

    // Also handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || "";
      
      // Suppress browser extension errors
      if (
        errorMessage.includes("runtime.lastError") ||
        errorMessage.includes("message port closed") ||
        errorMessage.includes("Extension context invalidated")
      ) {
        event.preventDefault();
        return false;
      }
      
      // Suppress Server Action errors (handled by ServerActionErrorHandler)
      if (
        errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("failed-to-find-server-action")
      ) {
        // Let ServerActionErrorHandler handle this
        return;
      }
    };

    // Also handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || "";
      
      // Suppress browser extension errors
      if (
        errorMessage.includes("runtime.lastError") ||
        errorMessage.includes("message port closed") ||
        errorMessage.includes("Extension context invalidated")
      ) {
        event.preventDefault();
        return false;
      }
      
      // Suppress Server Action errors (handled by ServerActionErrorHandler)
      if (
        errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("failed-to-find-server-action")
      ) {
        // Let ServerActionErrorHandler handle this
        return;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Cleanup function
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
};

export default ErrorSuppressor;

