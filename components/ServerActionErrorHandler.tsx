"use client";

import { useEffect } from "react";

/**
 * ServerActionErrorHandler
 * 
 * Handles the "Failed to find Server Action" error that occurs when
 * the client-side code tries to call Server Actions from a previous deployment.
 * 
 * This happens when:
 * - A new deployment occurs on Vercel
 * - The browser still has cached JavaScript from the old deployment
 * - The old client code tries to call Server Actions with IDs from the old build
 * 
 * Solution: Automatically refresh the page when this error is detected
 * to load the new client code that matches the current server build.
 */
const ServerActionErrorHandler = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || "";
      
      // Check if this is a Server Action error
      if (
        errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("failed-to-find-server-action")
      ) {
        console.warn(
          "Server Action mismatch detected. This usually happens after a deployment. Refreshing page..."
        );
        
        // Prevent the error from showing in console
        event.preventDefault();
        
        // Refresh the page to load the new client code
        // Use a small delay to ensure the error is handled
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // Listen for unhandled errors
    window.addEventListener("error", handleError);

    // Also listen for unhandled promise rejections (Server Actions might throw promises)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || "";
      
      if (
        errorMessage.includes("Failed to find Server Action") ||
        errorMessage.includes("failed-to-find-server-action")
      ) {
        console.warn(
          "Server Action mismatch detected in promise rejection. Refreshing page..."
        );
        
        event.preventDefault();
        
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
};

export default ServerActionErrorHandler;
